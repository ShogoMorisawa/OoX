<?php

use App\Http\Controllers\CalculateController;
use App\Http\Controllers\DescribeController;
use App\Http\Controllers\ResultController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::get('/hello', function () {
    return response()->json([
        'message' => 'Hello from Lambda!',
        'status' => 'success',
    ]);
});

/*
|--------------------------------------------------------------------------
| 計算API（Logic Engine）
|--------------------------------------------------------------------------
| ユーザーの回答データ（28マッチ）を受け取り、グラフベースの推論
| （ケメニー・ヤング法）を実行して、最も矛盾の少ない順序（序列）と
| 葛藤ブロックを算出する。OoX Mirror の「脳」として機能。
|
| Request Body:
|   - answers: array[{question_id, choice_id, function_code, response_time_ms}]
|   - health_scores: array{FunctionCode: number}
|
| Response:
|   - order: array[FunctionCode] | array[FunctionCode[]] (葛藤ブロック含む)
|   - conflicts: array[{question_id, user_winner, system_order_winner, response_time_ms}]
|   - health: array{FunctionCode: 'O'|'o'|'x'}
*/
Route::post('/calculate', CalculateController::class);

/*
|--------------------------------------------------------------------------
| 解析リクエストAPI（非同期）
|--------------------------------------------------------------------------
| フロントエンドはここを叩くと、すぐに job_id をもらって解放される。
| Geminiによる解析ジョブを非同期で投入し、ポーリングで進捗を確認する。
*/
Route::post('/describe', [DescribeController::class, 'store']);

/*
|--------------------------------------------------------------------------
| 状況確認API（ポーリング用）
|--------------------------------------------------------------------------
| フロントエンドが「終わった？」と聞きに来る場所。
| ジョブの実行状況を確認し、完了/失敗/処理中/キュー待ちの状態を返す。
*/
Route::get('/describe/status/{jobId}', [DescribeController::class, 'show']);

/*
|--------------------------------------------------------------------------
| 診断結果保存API
|--------------------------------------------------------------------------
| フロントエンドから送信された診断結果（順序、階層、健全度、タイトル、説明など）
| をSupabaseの user_results テーブルに保存する。
|
| Request Body:
|   - answers: array[{question_id, choice_id, function_code, response_time_ms}]
|   - function_order: array[FunctionCode] (サイズ8)
|   - tier_map: array{FunctionCode: Tier}
|   - health_status: array{FunctionCode: 'O'|'o'|'x'}
|   - dominant_function: FunctionCode
|   - second_function: FunctionCode
|   - title: string (最大255文字)
|   - description: string
|   - icon_url: string
|   - browser_id: string (UUID)
|   - user_id: string|null (オプション)
|   - is_public: boolean
|
| Response:
|   - 201 Created: 保存成功時
|   - 500 Internal Server Error: Supabase接続エラー時
*/
Route::post('/results', [ResultController::class, 'store']);
