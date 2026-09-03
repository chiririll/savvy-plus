<?php

namespace App\Http\Requests\Account;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAccountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'sometimes|string|max:255',
            'type' => ['sometimes', Rule::in(['bank', 'crypto', 'cash'])],
            'currency_id' => 'sometimes|nullable|exists:currencies,id',
            'currency_code' => 'sometimes|nullable|string|max:10',
            'initial_balance' => 'sometimes|numeric|min:0',
            'is_active' => 'sometimes|boolean',
        ];
    }
}
