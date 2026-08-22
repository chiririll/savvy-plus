<?php

namespace App\Http\Requests\Import;

use Illuminate\Foundation\Http\FormRequest;

class ParseCsvRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'upload_id' => ['required', 'string', 'uuid', 'exists:uploads,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'upload_id.required' => __('messages.validation.upload_required'),
            'upload_id.exists' => __('messages.validation.upload_not_found'),
        ];
    }
}
