<?php

namespace App\Builders;

use App\DTOs\TransactionFilterData;
use App\Enums\TransactionStatus;
use App\Models\Transaction;
use Illuminate\Database\Eloquent\Builder;

class TransactionQueryBuilder
{
    private Builder $query;

    public function __construct()
    {
        $this->query = Transaction::query();
    }

    public static function make(): self
    {
        return new self;
    }

    public function withRelations(): self
    {
        $this->query->with(['account.currency', 'toAccount.currency', 'category', 'items', 'tags']);

        return $this;
    }

    public function withItemsCount(): self
    {
        $this->query->withCount('items');

        return $this;
    }

    public function applyFilters(TransactionFilterData $filters): self
    {
        if ($filters->type) {
            $this->query->where('type', $filters->type);
        }

        if ($filters->accountId) {
            $this->query->where(function ($q) use ($filters) {
                $q->where('account_id', $filters->accountId)
                    ->orWhere('to_account_id', $filters->accountId);
            });
        }

        if ($filters->categoryId) {
            $this->query->where('category_id', $filters->categoryId);
        }

        if (! empty($filters->categoryIds)) {
            $this->query->whereIn('category_id', $filters->categoryIds);
        }

        if (! empty($filters->tagIds)) {
            $this->query->whereHas('tags', function ($q) use ($filters) {
                $q->whereIn('tags.id', $filters->tagIds);
            });
        }

        if ($filters->startDate || $filters->endDate) {
            $this->query->where(function ($q) use ($filters) {
                $q->where(function ($dated) use ($filters) {
                    if ($filters->startDate) {
                        $dated->where('date', '>=', $filters->startDate);
                    }

                    if ($filters->endDate) {
                        $dated->where('date', '<=', $filters->endDate);
                    }
                });

                if ($filters->status === TransactionStatus::Pending) {
                    $q->orWhereNull('date');
                }
            });
        }

        if ($filters->minAmount) {
            $this->query->where('amount', '>=', $filters->minAmount);
        }

        if ($filters->maxAmount) {
            $this->query->where('amount', '<=', $filters->maxAmount);
        }

        if ($filters->search) {
            $this->query->where('description', 'like', "%{$filters->search}%");
        }

        if ($filters->status === TransactionStatus::Pending) {
            $this->query->pending();
        } elseif ($filters->status === TransactionStatus::Confirmed) {
            $this->query->confirmed();
        } elseif ($filters->status === TransactionStatus::Skipped) {
            $this->query->skipped();
        } else {
            $this->query->whereIn('status', [
                TransactionStatus::Confirmed,
                TransactionStatus::Skipped,
            ]);
        }

        return $this;
    }

    public function applySorting(TransactionFilterData $filters): self
    {
        if ($filters->sortBy === 'amount') {
            // Sort by amount converted to base currency
            $this->query
                ->join('accounts', 'transactions.account_id', '=', 'accounts.id')
                ->join('currencies', 'accounts.currency_id', '=', 'currencies.id')
                ->orderByRaw('transactions.amount * currencies.rate '.($filters->sortDirection === 'asc' ? 'ASC' : 'DESC'))
                ->select('transactions.*');
        } elseif ($filters->sortBy === 'date') {
            $this->query
                ->orderByRaw('CASE WHEN date IS NULL THEN 1 ELSE 0 END')
                ->orderBy('date', $filters->sortDirection);
        } else {
            $this->query->orderBy($filters->sortBy, $filters->sortDirection);
        }

        return $this;
    }

    public function paginate(int $perPage)
    {
        return $this->query->paginate($perPage);
    }

    public function get()
    {
        return $this->query->get();
    }

    public function getQuery(): Builder
    {
        return $this->query;
    }
}
