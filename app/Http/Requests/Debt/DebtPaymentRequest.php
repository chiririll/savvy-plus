<?php

namespace App\Http\Requests\Debt;

use App\Models\Account;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class DebtPaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'account_id' => 'required|exists:accounts,id',
            'amount' => 'required|numeric|gt:0',
            'date' => 'required|date|before_or_equal:today',
            'description' => 'nullable|string|max:500',
        ];
    }

    public function messages(): array
    {
        return [
            'date.before_or_equal' => __('messages.transactions.date_cannot_be_future'),
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator) {
                $this->validateAccountIsNotDebt($validator);
                $this->validateNotOverpaying($validator);
            },
        ];
    }

    private function validateAccountIsNotDebt(Validator $validator): void
    {
        $account = Account::find($this->input('account_id'));
        if ($account && $account->isDebt()) {
            $validator->errors()->add('account_id', __('messages.validation.cannot_use_debt_account'));
        }
    }

    private function validateNotOverpaying(Validator $validator): void
    {
        $debt = $this->route('debt');

        if (! $debt || ! $debt->isDebt()) {
            return;
        }

        $amount = (float) $this->input('amount');
        $remainingDebt = $debt->current_balance;

        if ($amount > $remainingDebt) {
            $validator->errors()->add(
                'amount',
                __('messages.validation.payment_exceeds_remaining', ['amount' => $amount, 'remaining' => $remainingDebt])
            );
        }
    }
}
