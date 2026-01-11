<?php

namespace App\Services;

use Exception;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SupabaseService
{
    public string $url;

    public string $key;

    public function __construct()
    {
        $this->url = config('services.supabase.url');
        $this->key = config('services.supabase.key');

        if (empty($this->url) || empty($this->key)) {
            throw new Exception('Supabase configuration is missing. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY in your .env file.');
        }
    }

    /**
     * 共通のHTTPクライアントを取得
     */
    protected function client()
    {
        return Http::withHeaders([
            'apikey' => $this->key,
            'Authorization' => "Bearer {$this->key}",
            'Content-Type' => 'application/json',
        ]);
    }

    /**
     * 質問データを取得
     */
    public function fetchQuestions(array $select = [
        'id', 'type', 'left_function_code', 'right_function_code',
    ]): array
    {
        try {
            $response = $this->client()->get("{$this->url}/rest/v1/questions", [
                'select' => implode(',', $select),
            ]);

            if ($response->failed()) {
                Log::error('Supabase fetch questions failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                throw new Exception('Failed to fetch questions from Supabase');
            }

            $data = $response->json();

            return is_array($data) ? $data : [];
        } catch (Exception $e) {
            Log::error('Supabase connection error: '.$e->getMessage());
            throw $e;
        }
    }

    /**
     * 診断結果を保存する
     */
    public function saveResult(array $data): void
    {
        try {
            $response = $this->client()
                ->withHeaders(['Prefer' => 'return=minimal'])
                ->post("{$this->url}/rest/v1/user_results", $data);

            if ($response->failed()) {
                Log::error('Supabase save result failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                throw new Exception('Failed to save result to Supabase');
            }

        } catch (Exception $e) {
            Log::error('Supabase save error: '.$e->getMessage());
            throw $e;
        }
    }
}
