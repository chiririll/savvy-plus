<?php

namespace App\Http\Requests\Transaction;

use Illuminate\Foundation\Http\FormRequest;

class ConfirmTransactionRequest extends FormRequest
{
    use NormalizesNullableDate;

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
}
