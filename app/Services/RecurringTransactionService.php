<?php

namespace App\Services;

use App\DTOs\TransactionData;
use App\Enums\RecurringFrequency;
use App\Enums\TransactionStatus;
use App\Models\Account;
use App\Models\RecurringTransaction;
use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class RecurringTransactionService
{
    public function __construct(
        protected TransactionService $transactionService
    ) {}

    public function getAll(): Collection
    {
        return RecurringTransaction::with(['account.currency', 'toAccount.currency', 'category', 'tags'])
            ->orderBy('next_run_date')
            ->get();
    }

    public function findOrFail(int $id): RecurringTransaction
    {
        return RecurringTransaction::with(['account.currency', 'toAccount.currency', 'category', 'tags'])
            ->findOrFail($id);
    }

    public function getUpcoming(int $limit = 5): Collection
    {
        return RecurringTransaction::with(['account.currency', 'category'])
            ->active()
            ->orderBy('next_run_date')
            ->limit($limit)
            ->get();
    }

    public function create(array $data): RecurringTransaction
    {
        return DB::transaction(function () use ($data) {
            $data['next_run_date'] = Carbon::parse($data['start_date'])->toDateString();

            $recurring = RecurringTransaction::create($data);

            if (! empty($data['tag_ids'])) {
                $recurring->tags()->sync($data['tag_ids']);
            }

            $recurring = $recurring->load(['account.currency', 'toAccount.currency', 'category', 'tags']);

            if ($this->isWithinSchedule($recurring)) {
                $this->createPendingOccurrence($recurring);
            }

            return $recurring->fresh(['account.currency', 'toAccount.currency', 'category', 'tags']);
        });
    }

    public function update(RecurringTransaction $recurring, array $data): RecurringTransaction
    {
        return DB::transaction(function () use ($recurring, $data) {
            if (array_key_exists('start_date', $data)
                && Carbon::parse($data['start_date'])->toDateString() !== $recurring->start_date->toDateString()
            ) {
                $data['next_run_date'] = Carbon::parse($data['start_date'])->toDateString();
            }

            $recurring->update($data);

            if (array_key_exists('tag_ids', $data)) {
                $recurring->tags()->sync($data['tag_ids'] ?? []);
            }

            $recurring = $recurring->fresh(['account.currency', 'toAccount.currency', 'category', 'tags']);
            $this->syncOpenPending($recurring);

            return $recurring;
        });
    }

    public function delete(RecurringTransaction $recurring): void
    {
        DB::transaction(function () use ($recurring) {
            $recurring->transactions()->pending()->delete();
            $recurring->delete();
        });
    }

    public function advanceAfterOccurrence(RecurringTransaction $recurring): void
    {
        $next = $this->calculateNextRunDate($recurring);

        $recurring->update([
            'last_run_date' => now()->toDateString(),
            'next_run_date' => $next->toDateString(),
        ]);

        $recurring->refresh();

        if (! $this->isWithinSchedule($recurring) || $recurring->transactions()->pending()->exists()) {
            return;
        }

        $this->createPendingOccurrence($recurring);
    }

    public function createPendingOccurrence(RecurringTransaction $recurring): Transaction
    {
        $toAmount = null;

        if ($recurring->isTransfer() && $recurring->to_amount) {
            $toAmount = (float) $recurring->to_amount;
        } elseif ($recurring->isTransfer()) {
            $toAmount = $this->calculateToAmount($recurring);
        }

        $data = new TransactionData(
            type: $recurring->type,
            accountId: $recurring->account_id,
            amount: (float) $recurring->amount,
            date: $recurring->next_run_date->toDateString(),
            categoryId: $recurring->category_id,
            toAccountId: $recurring->to_account_id,
            toAmount: $toAmount,
            description: $recurring->description,
            tagIds: $recurring->tags()->pluck('tags.id')->toArray(),
            status: TransactionStatus::Pending,
            recurringTransactionId: $recurring->id,
        );

        return $this->transactionService->create($data);
    }

    public function calculateNextRunDate(RecurringTransaction $recurring): Carbon
    {
        $current = $recurring->next_run_date->copy();
        $interval = $recurring->interval;

        return match ($recurring->frequency) {
            RecurringFrequency::Daily => $current->addDays($interval),
            RecurringFrequency::Weekly => $this->calculateNextWeekly($current, $interval, $recurring->day_of_week),
            RecurringFrequency::Monthly => $this->calculateNextMonthly($current, $interval, $recurring->day_of_month),
            RecurringFrequency::Yearly => $current->addYears($interval),
        };
    }

    protected function syncOpenPending(RecurringTransaction $recurring): void
    {
        $pending = $recurring->transactions()->pending()->first();

        if (! $pending) {
            if ($this->isWithinSchedule($recurring)) {
                $this->createPendingOccurrence($recurring);
            }

            return;
        }

        $toAmount = $pending->to_amount;
        if ($recurring->isTransfer()) {
            $toAmount = $recurring->to_amount
                ? (float) $recurring->to_amount
                : $this->calculateToAmount($recurring);
        }

        $pending->update([
            'type' => $recurring->type,
            'account_id' => $recurring->account_id,
            'to_account_id' => $recurring->to_account_id,
            'category_id' => $recurring->category_id,
            'amount' => $recurring->amount,
            'to_amount' => $toAmount,
            'description' => $recurring->description,
            'date' => $recurring->next_run_date->toDateString(),
        ]);

        $pending->tags()->sync($recurring->tags()->pluck('tags.id')->toArray());
    }

    protected function isWithinSchedule(RecurringTransaction $recurring): bool
    {
        if (! $recurring->is_active) {
            return false;
        }

        return ! $recurring->end_date || $recurring->next_run_date->lte($recurring->end_date);
    }

    protected function calculateNextWeekly(Carbon $current, int $interval, ?int $dayOfWeek): Carbon
    {
        $next = $current->addWeeks($interval);

        if ($dayOfWeek !== null && $next->dayOfWeek !== $dayOfWeek) {
            $next = $next->next($dayOfWeek);
        }

        return $next;
    }

    protected function calculateNextMonthly(Carbon $current, int $interval, ?int $dayOfMonth): Carbon
    {
        $next = $current->addMonthsNoOverflow($interval);

        if ($dayOfMonth !== null) {
            $day = min($dayOfMonth, $next->daysInMonth);
            $next = $next->day($day);
        }

        return $next;
    }

    protected function calculateToAmount(RecurringTransaction $recurring): float
    {
        $fromAccount = Account::with('currency')->find($recurring->account_id);
        $toAccount = Account::with('currency')->find($recurring->to_account_id);

        if ($fromAccount->currency_id === $toAccount->currency_id) {
            return (float) $recurring->amount;
        }

        return $fromAccount->currency->convertTo((float) $recurring->amount, $toAccount->currency);
    }
}
