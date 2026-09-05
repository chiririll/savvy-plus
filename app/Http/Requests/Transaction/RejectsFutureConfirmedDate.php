<?php

namespace App\Http\Requests\Transaction;

use App\Support\TransactionDates;
use Illuminate\Validation\Validator;

trait RejectsFutureConfirmedDate
{
    protected function rejectFutureConfirmedDate(Validator $validator, ?string $date, string $attribute = 'date'): void
    {
        if (TransactionDates::isFuture($date)) {
            $validator->errors()->add($attribute, __('messages.transactions.date_cannot_be_future'));
        }
    }
}
