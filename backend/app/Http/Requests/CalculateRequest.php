<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CalculateRequest extends FormRequest
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
            'health_scores' => 'required|array',
            'health_scores.*' => 'nullable|numeric|min:0',
            'fixed_match' => 'nullable|array',
            'fixed_match.winner' => 'nullable|string|in:Ni,Ne,Ti,Te,Fi,Fe,Si,Se',
            'fixed_match.loser' => 'nullable|string|in:Ni,Ne,Ti,Te,Fi,Fe,Si,Se',
        ];
    }
}
