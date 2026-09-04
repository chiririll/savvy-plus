<?php

namespace App\Services;

use App\Builders\TransactionQueryBuilder;
use App\DTOs\TransactionData;
use App\DTOs\TransactionFilterData;
use App\Enums\TransactionStatus;
use App\Enums\TransactionType;
use App\Enums\TriggerType;
use App\Models\Account;
use App\Models\Transaction;
use App\Models\TransactionItem;
use DomainException;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class TransactionService
{
    public function __construct(
        private AutomationService $automationService
    ) {}

    public function getFiltered(TransactionFilterData $filters): LengthAwarePaginator
    {
        return TransactionQueryBuilder::make()
            ->withRelations()
            ->withItemsCount()
            ->applyFilters($filters)
            ->applySorting($filters)
            ->paginate($filters->perPage);
    }

    public function findOrFail(int $id): Transaction
    {
        return Transaction::with(['account.currency', 'toAccount.currency', 'category', 'items', 'tags'])
            ->findOrFail($id);
    }

    public function create(TransactionData $data): Transaction
    {
        $transaction = DB::transaction(function () use ($data) {
            $transactionData = $this->prepareTransactionData($data);
            $transaction = Transaction::create($transactionData);

            if ($data->hasItems()) {
                $this->createItems($transaction, $data->items);
            }

            if ($data->tagIds !== null) {
                $transaction->tags()->sync($data->tagIds);
            }

            return $transaction->load(['account.currency', 'toAccount.currency', 'category', 'items', 'tags']);
        });

        if ($transaction->status === TransactionStatus::Confirmed) {
            $this->automationService->process(TriggerType::OnTransactionCreate, $transaction);
        }

        return $transaction->fresh(['account.currency', 'toAccount.currency', 'category', 'items', 'tags']);
    }

    public function update(Transaction $transaction, TransactionData $data): Transaction
    {
        $kind = $transaction->kind();
        if (! $kind->canEdit()) {
            throw new DomainException($kind->cannotEditMessage());
        }

        $transaction = DB::transaction(function () use ($transaction, $data) {
            $transactionData = $this->prepareTransactionData($data, $transaction);
            $transaction->update($transactionData);

            if ($data->items !== null) {
                $transaction->items()->delete();

                if ($data->hasItems()) {
                    $this->createItems($transaction, $data->items);
                }
            }

            if ($data->tagIds !== null) {
                $transaction->tags()->sync($data->tagIds);
            }

            return $transaction->load(['account.currency', 'toAccount.currency', 'category', 'items', 'tags']);
        });

        if ($transaction->status === TransactionStatus::Confirmed) {
            $this->automationService->process(TriggerType::OnTransactionUpdate, $transaction);
        }

        return $transaction->fresh(['account.currency', 'toAccount.currency', 'category', 'items', 'tags']);
    }

    public function delete(Transaction $transaction): void
    {
        $kind = $transaction->kind();
        if (! $kind->canDelete()) {
            throw new DomainException($kind->cannotDeleteMessage());
        }

        DB::transaction(function () use ($transaction) {
            $transaction->items()->delete();
            $transaction->delete();
        });
    }

    public function confirm(Transaction $transaction): Transaction
    {
        $kind = $transaction->kind();
        if (! $kind->canConfirm()) {
            throw new DomainException($kind->cannotConfirmMessage());
        }

        $this->assertSufficientFunds($transaction);

        $transaction = DB::transaction(function () use ($transaction) {
            $transaction->update(['status' => TransactionStatus::Confirmed]);

            if ($transaction->recurring_transaction_id) {
                app(RecurringTransactionService::class)->advanceAfterOccurrence(
                    $transaction->recurringTransaction
                );
            }

            return $transaction->fresh(['account.currency', 'toAccount.currency', 'category', 'items', 'tags']);
        });

        $this->automationService->process(TriggerType::OnTransactionCreate, $transaction);

        return $transaction->fresh(['account.currency', 'toAccount.currency', 'category', 'items', 'tags']);
    }

    public function skip(Transaction $transaction): Transaction
    {
        $kind = $transaction->kind();
        if (! $kind->canSkip()) {
            throw new DomainException($kind->cannotSkipMessage());
        }

        return DB::transaction(function () use ($transaction) {
            $transaction->update(['status' => TransactionStatus::Skipped]);

            app(RecurringTransactionService::class)->advanceAfterOccurrence(
                $transaction->recurringTransaction
            );

            return $transaction->fresh(['account.currency', 'toAccount.currency', 'category', 'items', 'tags']);
        });
    }

    public function duplicate(Transaction $transaction): Transaction
    {
        $kind = $transaction->kind();
        if (! $kind->canDuplicate()) {
            throw new DomainException($kind->cannotDuplicateMessage());
        }

        return DB::transaction(function () use ($transaction, $kind) {
            $newTransaction = $transaction->replicate(['created_at', 'updated_at']);
            $newTransaction->recurring_transaction_id = null;

            if (! $kind->keepsPendingOnDuplicate()) {
                $newTransaction->date = now()->toDateString();
                $newTransaction->status = TransactionStatus::Confirmed;
            }

            $newTransaction->save();

            foreach ($transaction->items as $item) {
                $newItem = $item->replicate(['created_at', 'updated_at']);
                $newItem->transaction_id = $newTransaction->id;
                $newItem->save();
            }

            $newTransaction->tags()->sync($transaction->tags->pluck('id'));

            return $newTransaction->load(['account.currency', 'toAccount.currency', 'category', 'items', 'tags']);
        });
    }

    public function getSummary(TransactionFilterData $filters): array
    {
        $summaryFilters = new TransactionFilterData(
            type: $filters->type,
            accountId: $filters->accountId,
            categoryId: $filters->categoryId,
            categoryIds: $filters->categoryIds,
            tagIds: $filters->tagIds,
            startDate: $filters->startDate,
            endDate: $filters->endDate,
            minAmount: $filters->minAmount,
            maxAmount: $filters->maxAmount,
            search: $filters->search,
            sortBy: $filters->sortBy,
            sortDirection: $filters->sortDirection,
            perPage: $filters->perPage,
            status: TransactionStatus::Confirmed,
        );

        $transactions = TransactionQueryBuilder::make()
            ->applyFilters($summaryFilters)
            ->getQuery()
            ->with('account.currency')
            ->get();

        $baseCurrency = \App\Models\Currency::getBase();

        $income = 0.0;
        $expense = 0.0;

        foreach ($transactions as $transaction) {
            if ($transaction->type->isDebtOperation()) {
                continue;
            }

            $currency = $transaction->account->currency;
            $amountInBase = $currency->convertToBase((float) $transaction->amount);

            if ($transaction->type === TransactionType::Income) {
                $income += $amountInBase;
            } elseif ($transaction->type === TransactionType::Expense) {
                $expense += $amountInBase;
            }
        }

        return [
            'income' => round($income, 2),
            'expense' => round($expense, 2),
            'balance' => round($income - $expense, 2),
            'transactions_count' => $transactions->count(),
            'currency' => $baseCurrency?->code,
        ];
    }

    public function resolveStatusForDate(string $date): TransactionStatus
    {
        return $date > now()->toDateString()
            ? TransactionStatus::Pending
            : TransactionStatus::Confirmed;
    }

    private function prepareTransactionData(TransactionData $data, ?Transaction $existing = null): array
    {
        $prepared = [
            'type' => $data->type,
            'account_id' => $data->accountId,
            'category_id' => $data->categoryId,
            'amount' => $data->amount,
            'description' => $data->description,
            'date' => $data->date,
        ];

        if ($existing === null) {
            $prepared['status'] = $data->status ?? $this->resolveStatusForDate($data->date);
            $prepared['recurring_transaction_id'] = $data->recurringTransactionId;
        }

        if ($data->type->isTransfer()) {
            $prepared['to_account_id'] = $data->toAccountId;
            $prepared['to_amount'] = $data->toAmount ?? $this->calculateToAmount($data);
            $prepared['exchange_rate'] = $data->exchangeRate ?? $this->calculateExchangeRate(
                $data->amount,
                $prepared['to_amount']
            );
            $prepared['category_id'] = null;
        }

        return $prepared;
    }

    private function assertSufficientFunds(Transaction $transaction): void
    {
        if (! in_array($transaction->type, [TransactionType::Expense, TransactionType::Transfer], true)) {
            return;
        }

        $account = $transaction->account;
        if ($account && $account->current_balance < (float) $transaction->amount) {
            throw new DomainException(__('messages.validation.insufficient_funds', [
                'available' => number_format($account->current_balance, 2),
            ]));
        }
    }

    private function calculateToAmount(TransactionData $data): float
    {
        $fromAccount = Account::with('currency')->find($data->accountId);
        $toAccount = Account::with('currency')->find($data->toAccountId);

        if ($fromAccount->currency_id === $toAccount->currency_id) {
            return $data->amount;
        }

        return $fromAccount->currency->convertTo($data->amount, $toAccount->currency);
    }

    private function calculateExchangeRate(float $amount, float $toAmount): ?float
    {
        if ($amount > 0) {
            return round($toAmount / $amount, 6);
        }

        return null;
    }

    private function createItems(Transaction $transaction, array $items): void
    {
        foreach ($items as $item) {
            TransactionItem::create([
                'transaction_id' => $transaction->id,
                'name' => $item['name'],
                'quantity' => (int) $item['quantity'],
                'price_per_unit' => $item['price_per_unit'],
                'total_price' => (int) $item['quantity'] * $item['price_per_unit'],
            ]);
        }
    }
}
