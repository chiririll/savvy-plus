<?php

namespace App\Models;

use App\Enums\DebtType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Account extends Model
{
    protected $fillable = [
        'name',
        'type',
        'currency_id',
        'initial_balance',
        'is_active',
        'sort_order',
        'debt_type',
        'target_amount',
        'due_date',
        'is_paid_off',
        'counterparty',
        'debt_description',
    ];

    protected $casts = [
        'initial_balance' => 'decimal:2',
        'target_amount' => 'decimal:2',
        'is_active' => 'boolean',
        'is_paid_off' => 'boolean',
        'sort_order' => 'integer',
        'debt_type' => DebtType::class,
        'due_date' => 'date',
    ];

    protected static function booted(): void
    {
        static::creating(function (Account $account) {
            if (array_key_exists('sort_order', $account->getAttributes())) {
                return;
            }

            $query = $account->isDebt()
                ? static::query()->debts()
                : static::query()->regularAccounts();

            $account->sort_order = ($query->max('sort_order') ?? -1) + 1;
        });
    }

    public function currency(): BelongsTo
    {
        return $this->belongsTo(Currency::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    // Scopes

    public function scopeOrdered(Builder $query): Builder
    {
        return $query
            ->orderByRaw("CASE WHEN type = 'debt' THEN 1 ELSE 0 END")
            ->orderBy('sort_order')
            ->orderBy('id');
    }

    public function scopeRegularAccounts(Builder $query): Builder
    {
        return $query->whereIn('type', ['bank', 'crypto', 'cash']);
    }

    public function scopeDebts(Builder $query): Builder
    {
        return $query->where('type', 'debt');
    }

    public function scopeActiveDebts(Builder $query): Builder
    {
        return $query->where('type', 'debt')
            ->where('is_active', true)
            ->where('is_paid_off', false);
    }

    public function scopeIOwe(Builder $query): Builder
    {
        return $query->where('type', 'debt')->where('debt_type', 'i_owe');
    }

    public function scopeOwedToMe(Builder $query): Builder
    {
        return $query->where('type', 'debt')->where('debt_type', 'owed_to_me');
    }

    // Helper methods

    public function isDebt(): bool
    {
        return $this->type === 'debt';
    }

    public function isRegularAccount(): bool
    {
        return in_array($this->type, ['bank', 'crypto', 'cash']);
    }

    public function getCurrentBalanceAttribute(): float
    {
        if ($this->isDebt()) {
            return $this->calculateDebtBalance();
        }

        return $this->calculateRegularBalance();
    }

    private function calculateRegularBalance(): float
    {
        $income = $this->transactions()->confirmed()->where('type', 'income')->sum('amount');
        $expense = $this->transactions()->confirmed()->where('type', 'expense')->sum('amount');
        $transferOut = $this->transactions()->confirmed()->where('type', 'transfer')->sum('amount');
        $transferIn = Transaction::confirmed()->where('to_account_id', $this->id)->sum('to_amount');

        // Money in: collected repayment or received loan
        $debtCollectionIn = $this->transactions()
            ->confirmed()
            ->whereIn('type', ['debt_collection', 'debt_borrow'])
            ->sum('amount');

        // Money out: paid own debt or lent money
        $debtPaymentOut = $this->transactions()
            ->confirmed()
            ->whereIn('type', ['debt_payment', 'debt_lend'])
            ->sum('amount');

        return $this->initial_balance
            + $income
            - $expense
            - $transferOut
            + $transferIn
            + $debtCollectionIn
            - $debtPaymentOut;
    }

    private function calculateDebtBalance(): float
    {
        $targetAmount = (float) $this->target_amount;

        $payments = Transaction::confirmed()
            ->where('to_account_id', $this->id)
            ->whereIn('type', ['debt_payment', 'debt_collection'])
            ->sum('to_amount');

        return $targetAmount - $payments;
    }

    public function getRemainingDebtAttribute(): float
    {
        return $this->isDebt() ? $this->current_balance : 0;
    }

    public function getPaymentProgressAttribute(): float
    {
        if (! $this->isDebt() || $this->target_amount <= 0) {
            return 0;
        }

        $paid = $this->target_amount - $this->current_balance;

        return min(100, round(($paid / $this->target_amount) * 100, 2));
    }

    public function checkAndMarkAsPaidOff(): bool
    {
        if (! $this->isDebt()) {
            return false;
        }

        if ($this->current_balance <= 0 && ! $this->is_paid_off) {
            $this->update(['is_paid_off' => true]);

            return true;
        }

        return false;
    }
}
