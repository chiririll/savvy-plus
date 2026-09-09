<?php

namespace App\Http\Requests\Transaction;

use App\Enums\TransactionType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreTransactionRequest extends FormRequest
{
    use NormalizesNullableDate;
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
            'type' => ['required', Rule::enum(TransactionType::class)],
            'account_id' => 'required|exists:accounts,id',
            'to_account_id' => 'nullable|exists:accounts,id|different:account_id',
            'category_id' => 'nullable|exists:categories,id',
            'amount' => 'required|numeric|gt:0',
            'to_amount' => 'nullable|numeric|gt:0',
            'exchange_rate' => 'nullable|numeric|gt:0',
            'description' => 'nullable|string|max:500',
            'date' => 'nullable|date',
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
            },
        ];
    }

    private function validateTransferFields(Validator $validator): void
    {
        $type = $this->input('type');

        if ($type === TransactionType::Transfer->value) {
            if (! $this->input('to_account_id')) {
                $validator->errors()->add('to_account_id', __('messages.validation.transfer_destination'));
            }
        }
    }

    private function validateCategoryType(Validator $validator): void
    {
        $type = $this->input('type');
        $categoryId = $this->input('category_id');

        if ($type === TransactionType::Transfer->value && $categoryId) {
            $validator->errors()->add('category_id', __('messages.validation.transfer_no_category'));

            return;
        }

        if ($type !== TransactionType::Transfer->value && $categoryId) {
            $category = \App\Models\Category::find($categoryId);
            if ($category && $category->type !== $type) {
                $validator->errors()->add('category_id', __('messages.validation.category_type_mismatch'));
            }
        }
    }
}
