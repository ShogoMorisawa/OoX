<?php

namespace App\Http\Controllers;

use App\Http\Requests\CalculateRequest;
use App\Services\CalculateService;
use App\Services\SupabaseService;
use Exception;
use Illuminate\Http\JsonResponse;

class CalculateController extends Controller
{
    public function __invoke(
        CalculateRequest $request,
        CalculateService $calculateService,
        SupabaseService $supabaseService
    ): JsonResponse {
        // 1. 入力取得（バリデーション済みデータを使用）
        $validated = $request->validated();
        $answers = $validated['answers'];
        $healthScores = $validated['health_scores'];

        // 2. 質問定義取得（Supabaseから取得）
        try {
            $questions = $supabaseService->fetchQuestions();
            // IDをキーにしたマップ形式に変換
            $questionsMap = [];
            foreach ($questions as $question) {
                $questionsMap[$question['id']] = $question;
            }
        } catch (Exception $e) {
            return response()->json([
                'error' => 'Data Fetch Error',
                'message' => '質問データの取得に失敗しました。',
            ], 500);
        }

        // 3. 計算実行
        try {
            $result = $calculateService->calculateBestOrder($answers, $questionsMap);
            $health = $calculateService->calculateHealthStatus($healthScores);

            return response()->json([
                'order' => $result['order'],
                'conflicts' => $result['conflicts'] ?? [],
                'health' => $health,
            ]);
        } catch (Exception $e) {
            return response()->json([
                'error' => 'Calculation Error',
                'message' => '計算処理中にエラーが発生しました。',
            ], 500);
        }
    }
}
