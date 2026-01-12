<?php

namespace App\Http\Controllers;

use App\Http\Requests\SaveResultRequest;
use App\Services\SupabaseService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class ResultController extends Controller
{
    /**
     * 診断結果をSupabaseに保存する
     *
     * フロントエンドから送信された診断結果（順序、階層、健全度、タイトル、説明など）
     * をSupabaseの user_results テーブルに保存する。
     * SupabaseService が内部でエラーハンドリングとログ記録を行うため、
     * コントローラーでは例外をキャッチして適切なHTTPレスポンスに変換する。
     *
     * @return JsonResponse 201 Created - 保存成功時
     * @return JsonResponse 500 Internal Server Error - Supabase接続エラー時
     */
    public function store(
        SaveResultRequest $request,
        SupabaseService $supabaseService
    ): JsonResponse {
        $validated = $request->validated();

        try {
            $supabaseService->saveResult($validated);

            return response()->json([
                'message' => 'Result saved successfully',
            ], 201);
        } catch (Exception $e) {
            // 内部エラーの詳細はログに記録し、クライアントには汎用的なメッセージを返す
            Log::error('Result save failed in controller', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'error' => 'Server error',
                'message' => '結果の保存に失敗しました。もう一度お試しください。',
            ], 500);
        }
    }
}
