<?php

namespace App\Http\Controllers;

use App\Http\Requests\CalculateRequest;
use App\Services\CalculateService;
use App\Services\SupabaseService;
use Exception;
use Illuminate\Http\JsonResponse;

class CalculateController extends Controller
{
    /**
     * OoX Mirror の「脳」として機能する計算エンドポイント
     *
     * ユーザーの回答データ（28マッチ）を受け取り、グラフベースの推論
     * （ケメニー・ヤング法）を実行して、最も矛盾の少ない順序（序列）と
     * 葛藤ブロックを算出する。
     *
     * 処理フロー:
     * 1. 質問定義をSupabaseから取得（勝敗判定のために「対戦相手」を知る必要があるため）
     * 2. 回答データと質問定義を突き合わせて「対戦データ」に変換
     * 3. 重み付きケメニー・ヤング法で最適解を計算（40,320通りの全順列を評価）
     * 4. 計算結果とユーザー回答の矛盾（葛藤）を検出
     * 5. 健全度スコアから健全度ステータス（O/o/x）を算出
     *
     * fixed_match パラメータ:
     * 葛藤解決時にユーザーが明示的に指定した「勝敗関係」を強制する。
     * 例: {winner: "Ni", loser: "Ti"} を指定すると、Ni が Ti より上位になる。
     *
     * @return JsonResponse 計算結果（order, conflicts, health）
     * @return JsonResponse 500 - 質問データ取得エラー時
     * @return JsonResponse 500 - 計算処理エラー時
     */
    public function __invoke(
        CalculateRequest $request,
        CalculateService $calculateService,
        SupabaseService $supabaseService
    ): JsonResponse {
        // バリデーション済みデータを使用することで、不正なデータを排除済み
        $validated = $request->validated();
        $answers = $validated['answers'];
        $healthScores = $validated['health_scores'];

        // 質問定義をSupabaseから取得
        // 勝敗判定のために「対戦相手（Loser）が誰だったか」を知る必要があるため、
        // 回答データだけでは不十分で、質問マスタが必要
        try {
            $questions = $supabaseService->fetchQuestions();
            // IDをキーにしたマップ形式に変換することで、O(1)で質問データにアクセス可能
            // 配列の線形検索（O(n)）を避けるため
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

        // ケメニー・ヤング法による最適順序の計算
        // fixed_match は葛藤解決時にユーザーが明示的に指定した勝敗関係
        try {
            $fixedMatch = $validated['fixed_match'] ?? null;
            $result = $calculateService->calculateBestOrder($answers, $questionsMap, $fixedMatch);
            $health = $calculateService->calculateHealthStatus($healthScores);

            return response()->json([
                'order' => $result['order'], // 最適化された順序 [Ni, Ti, Fe...] または葛藤ブロック含む
                'conflicts' => $result['conflicts'] ?? [], // 矛盾リスト（確信度が高い順：回答時間が短い順）
                'health' => $health, // 各機能の健全度ステータス {Ni: 'O', Ne: 'o', ...}
            ]);
        } catch (Exception $e) {
            return response()->json([
                'error' => 'Calculation Error',
                'message' => '計算処理中にエラーが発生しました。',
            ], 500);
        }
    }
}
