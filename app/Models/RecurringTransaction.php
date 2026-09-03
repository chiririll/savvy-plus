<?php

namespace App\Models;

use App\Enums\RecurringFrequency;
use App\Enums\TransactionStatus;
use App\Enums\TransactionType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class RecurringTransaction extends Model
{
    protected $fillable = [
        'type',
        'account_id',
        'to_account_id',
        'category_id',
        'amount',
        'to_amount',
        'description',
        'frequency',
        'interval',
        'day_of_week',
        'day_of_month',
        'start_date',
        'end_date',
        'next_run_date',
        'last_run_date',
        'is_active',
    ];

    protected $casts = [
        'type' => TransactionType::class,
        'frequency' => RecurringFrequency::class,
        'amount' => 'decimal:2',
        'to_amount' => 'decimal:2',
        'interval' => 'integer',
        'day_of_week' => 'integer',
        'day_of_month' => 'integer',
        'start_date' => 'date',
        'end_date' => 'date',
        'next_run_date' => 'date',
        'last_run_date' => 'date',
        'is_active' => 'boolean',
    ];

    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    public function toAccount(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'to_account_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class, 'recurring_transaction_tag');
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    public function pendingTransaction(): HasOne
    {
        return $this->hasOne(Transaction::class)->where('status', TransactionStatus::Pending);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function isTransfer(): bool
    {
        return $this->type === TransactionType::Transfer;
    }
}
