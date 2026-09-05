<?php

namespace App\Http\Requests\Transaction;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class ConfirmTransactionRequest extends FormRequest
{
    use NormalizesNullableDate;
    use RejectsFutureConfirmedDate;

    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->normalizeNullableDate();
    }

    public function rules(): array
    {
        return [
            'date' => 'nullable|date',
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator) {
                $transaction = $this->route('transaction');
                $date = $this->input('date') ?: $transaction?->date?->toDateString();

                $this->rejectFutureConfirmedDate($validator, $date);
            },
        ];
    }
}
