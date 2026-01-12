<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SaveResultRequest extends FormRequest
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
            'answers' => 'required|array',
            'answers.*.question_id' => 'required|string',
            'answers.*.choice_id' => 'required|string|in:A,B',
            'answers.*.function_code' => 'required|string|in:Ni,Ne,Ti,Te,Fi,Fe,Si,Se',
            'answers.*.response_time_ms' => 'required|integer|min:0',
            'function_order' => 'required|array|size:8',
            'function_order.*' => 'required|string|in:Ni,Ne,Ti,Te,Fi,Fe,Si,Se',
            'tier_map' => 'required|array',
            'tier_map.*' => 'required|string|in:Dominant,High,Middle,Low',
            'health_status' => 'required|array',
            'health_status.*' => 'required|string|in:O,o,x',
            'dominant_function' => 'required|string|in:Ni,Ne,Ti,Te,Fi,Fe,Si,Se',
            'second_function' => 'required|string|in:Ni,Ne,Ti,Te,Fi,Fe,Si,Se',
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'icon_url' => 'required|string',
            'browser_id' => 'required|string|uuid',
            'user_id' => 'nullable|string',
            'is_public' => 'required|boolean',
        ];
    }
}
