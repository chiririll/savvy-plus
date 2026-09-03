<?php

namespace App\Http\Requests\Account;

use Illuminate\Foundation\Http\FormRequest;

class ReorderAccountsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'distinct', 'exists:accounts,id'],
        ];
    }
};
