<?php

namespace App\Http\Requests\Debt;

use App\Enums\DebtType;
use App\Models\Account;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreDebtRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $origin = $this->input('origin', 'new');

        if ($origin === 'new') {
            $this->merge([
                'origin' => 'new',
                'currency_id' => null,
            ]);
        } else {
            $this->merge([
                'origin' => 'existing',
                'account_id' => null,
                'date' => null,
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'origin' => ['required', Rule::in(['new', 'existing'])],
            'name' => 'required|string|max:255',
            'debt_type' => ['required', Rule::enum(DebtType::class)],
            'amount' => 'required|numeric|gt:0',
            'account_id' => 'required_if:origin,new|nullable|exists:accounts,id',
            'date' => 'required_if:origin,new|nullable|date',
            'currency_id' => 'required_if:origin,existing|nullable|exists:currencies,id',
            'due_date' => 'nullable|date',
            'counterparty' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:1000',
        ];
    }

    public function messages(): array
    {
        return [
            'amount.gt' => __('messages.validation.debt_amount_gt'),
            'account_id.required_if' => __('messages.validation.account_required'),
            'date.required_if' => __('messages.validation.date_required'),
            'currency_id.required_if' => __('messages.validation.currency_required'),
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator) {
                if ($this->input('origin') !== 'new') {
                    return;
                }

                $account = Account::find($this->input('account_id'));
                if (! $account) {
                    return;
                }

                if ($account->isDebt()) {
                    $validator->errors()->add('account_id', __('messages.validation.cannot_use_debt_account'));

                    return;
                }

                if ($this->input('debt_type') === DebtType::OwedToMe->value
                    && $account->current_balance < (float) $this->input('amount')) {
                    $validator->errors()->add(
                        'amount',
                        __('messages.validation.insufficient_funds', [
                            'available' => number_format($account->current_balance, 2),
                        ])
                    );
                }
            },
        ];
    }
}
