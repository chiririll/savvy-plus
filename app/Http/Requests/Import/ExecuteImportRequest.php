<?php

namespace App\Http\Requests\Import;

use Illuminate\Foundation\Http\FormRequest;

class ExecuteImportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'import_id' => 'required|string|uuid',

            'mapping' => 'required|array',
            'mapping.date' => 'required|integer|min:0',
            'mapping.amount' => 'required|integer|min:0',
            'mapping.description' => 'nullable|integer|min:0',
            'mapping.type' => 'nullable|integer|min:0',
            'mapping.category' => 'nullable|integer|min:0',
            'mapping.tags' => 'nullable|integer|min:0',
            'mapping.currency' => 'nullable|integer|min:0',

            'options' => 'required|array',
            'options.date_format' => 'required|string|in:ISO,DD.MM.YYYY,MM/DD/YYYY,DD/MM/YYYY',
            'options.amount_format' => 'required|string|in:US,EU',
            'options.default_account_id' => 'required|integer|exists:accounts,id',
            'options.default_type' => 'required|string|in:income,expense',
            'options.skip_first_row' => 'sometimes|boolean',
            'options.create_missing_currencies' => 'sometimes|boolean',
            'options.create_missing_tags' => 'sometimes|boolean',
            'options.create_missing_categories' => 'sometimes|boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'import_id.required' => __('messages.import.session_required'),
            'import_id.uuid' => __('messages.import.session_invalid'),
            'mapping.date.required' => __('messages.import.date_mapping_required'),
            'mapping.amount.required' => __('messages.import.amount_mapping_required'),
            'options.default_account_id.required' => __('messages.import.select_account'),
            'options.default_account_id.exists' => __('messages.import.account_missing'),
        ];
    }
}
