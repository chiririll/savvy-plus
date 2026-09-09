<?php

namespace App\Http\Requests\Transaction;

use App\Enums\TransactionType;
use App\Models\Category;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateTransactionRequest extends FormRequest
{
    use NormalizesNullableDate;
    use RejectsFutureConfirmedDate;
    use ValidatesTransactionItems;

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
            'type' => ['sometimes', Rule::enum(TransactionType::class)],
            'account_id' => 'sometimes|exists:accounts,id',
            'to_account_id' => 'nullable|exists:accounts,id|different:account_id',
            'category_id' => 'nullable|exists:categories,id',
            'amount' => 'sometimes|numeric|gt:0',
            'to_amount' => 'nullable|numeric|gt:0',
            'exchange_rate' => 'nullable|numeric|gt:0',
            'description' => 'nullable|string|max:500',
            'date' => 'sometimes|nullable|date',
            'items' => 'nullable|array',
            'items.*.name' => 'required_with:items|string|max:255',
            'items.*.quantity' => $this->itemQuantityRules(),
            'items.*.price_per_unit' => 'required_with:items|numeric|gte:0',
            'tag_ids' => 'nullable|array',
            'tag_ids.*' => 'exists:tags,id',
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator) {
                $this->validateTransferFields($validator);
                $this->validateCategoryType($validator);
                $this->validateItemsTotal($validator);
                $this->validateConfirmedDate($validator);
            },
        ];
    }

    private function validateTransferFields(Validator $validator): void
    {
        $transaction = $this->route('transaction');
        $type = $this->input('type') ?? $transaction->type->value;

        if ($type === TransactionType::Transfer->value) {
            $toAccountId = $this->has('to_account_id')
                ? $this->input('to_account_id')
                : $transaction->to_account_id;

            if (! $toAccountId) {
                $validator->errors()->add('to_account_id', __('messages.validation.transfer_destination'));
            }
        }
    }

    private function validateCategoryType(Validator $validator): void
    {
        $transaction = $this->route('transaction');
        $type = $this->input('type') ?? $transaction->type->value;
        $categoryId = $this->has('category_id')
            ? $this->input('category_id')
            : $transaction->category_id;

        if ($type === TransactionType::Transfer->value && $categoryId) {
            $validator->errors()->add('category_id', __('messages.validation.transfer_no_category'));

            return;
        }

        if ($type !== TransactionType::Transfer->value && $categoryId) {
            $category = Category::find($categoryId);
            if ($category && $category->type !== $type) {
                $validator->errors()->add('category_id', __('messages.validation.category_type_mismatch'));
            }
        }
    }

    private function validateConfirmedDate(Validator $validator): void
    {
        $transaction = $this->route('transaction');

        if ($transaction->isPending() || $transaction->isSkipped()) {
            return;
        }

        $date = $this->exists('date')
            ? $this->input('date')
            : $transaction->date?->toDateString();

        if (! $date) {
            $validator->errors()->add('date', __('messages.transactions.date_required'));

            return;
        }

        $this->rejectFutureConfirmedDate($validator, $date);
    }
}
