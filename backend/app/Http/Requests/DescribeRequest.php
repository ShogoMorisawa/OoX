<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DescribeRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'finalOrder' => 'required|array',
            'finalOrder.*' => 'required|string|in:Ni,Ne,Ti,Te,Fi,Fe,Si,Se',
            'healthStatus' => 'required|array',
            'healthStatus.*' => 'required|string|in:O,o,x',
            'tierMap' => 'required|array',
            'tierMap.*' => 'nullable|string|in:Dominant,High,Middle,Low',
        ];
    }
}
