<?php

namespace App\Http\Requests\Account;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAccountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'type' => ['required', Rule::in(['bank', 'crypto', 'cash'])],
            'currency_id' => 'required_without:currency_code|nullable|exists:currencies,id',
            'currency_code' => 'required_without:currency_id|nullable|string|max:10',
            'initial_balance' => 'sometimes|numeric|min:0',
            'is_active' => 'sometimes|boolean',
        ];
    }
}
