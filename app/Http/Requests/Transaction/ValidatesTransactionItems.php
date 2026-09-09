<?php

namespace App\Http\Requests\Transaction;

use App\Models\Account;
use App\Support\TransactionItems;
use Illuminate\Validation\Validator;

trait ValidatesTransactionItems
{
    protected function itemQuantityRules(): string
    {
        return 'required_with:items|numeric|gt:0|decimal:0,3';
    }

    protected function validateItemsTotal(Validator $validator): void
    {
        $items = $this->input('items', []);

        if (empty($items)) {
            return;
        }

        $accountId = $this->input('account_id') ?? $this->route('transaction')?->account_id;
        $account = $accountId ? Account::with('currency')->find($accountId) : null;
        $decimals = $account?->currency?->decimals ?? 2;
        $itemsTotal = TransactionItems::total($items, $decimals);
        $amount = (float) ($this->input('amount') ?? $this->route('transaction')?->amount ?? 0);
        $tolerance = 1 / (10 ** (max($decimals, 0) + 3));

        if (abs($itemsTotal - $amount) > $tolerance) {
            $validator->errors()->add('items', __('messages.validation.items_total', [
                'items' => $itemsTotal,
                'amount' => $amount,
            ]));
        }
    }
}
