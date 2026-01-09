<?php

use App\Jobs\GenerateDescriptionJob;
use App\Services\CalculateService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::get('/hello', function () {
    return response()->json([
        'message' => 'Hello from Lambda!',
        'status' => 'success',
    ]);
});

Route::post('/calculate', function (Request $request, CalculateService $service) {
    // 1. 入力取得
    $answers = $request->json('answers', []);
    $healthScores = $request->json('health_scores', []);

    // 2. 質問定義取得 (Supabaseから取得)
    // 勝敗判定のために「対戦相手(Loser)が誰だったか」を知る必要があるため
    $supabaseUrl = config('services.supabase.url');
    $supabaseKey = config('services.supabase.key');

    try {
        $response = Http::withHeaders([
            'apikey' => $supabaseKey,
            'Authorization' => "Bearer {$supabaseKey}",
            'Content-Type' => 'application/json',
        ])->get("{$supabaseUrl}/rest/v1/questions", [
            'select' => 'id,type,left_function_code,right_function_code',
        ]);

        if ($response->failed()) {
            return response()->json([
                'error' => 'Failed to fetch questions from Supabase',
                'details' => $response->json() ?? $response->body(),
            ], 500);
        }

        $questions = $response->json() ?? [];

        // IDをキーにしたマップ形式に変換
        $questionsMap = [];
        foreach ($questions as $question) {
            $questionsMap[$question['id']] = $question;
        }
    } catch (\Exception $e) {
        return response()->json([
            'error' => 'Error fetching questions',
            'message' => $e->getMessage(),
        ], 500);
    }

    // 3. 計算実行
    // 返り値が ['order' => ..., 'conflicts' => ...] になっています
    $result = $service->calculateBestOrder($answers, $questionsMap);

    // 4. 健全度計算
    $health = $service->calculateHealthStatus($healthScores);

    // 5. 結果返却
    return response()->json([
        'order' => $result['order'], // 最も矛盾の少ない順序 [Ni, Ti, Fe...]
        'conflicts' => $result['conflicts'] ?? [], // 矛盾リスト（確信度が高い順：回答時間が短い順）
        'health' => $health,
    ]);
});

/*
|--------------------------------------------------------------------------
| 1. 解析リクエストAPI（非同期）
|--------------------------------------------------------------------------
| フロントエンドはここを叩くと、すぐに job_id をもらって解放される。
*/
Route::post('/describe', function (Request $request) {
    // バリデーション
    $data = $request->validate([
        'finalOrder' => 'required|array',
        'finalOrder.*' => 'required|string|in:Ni,Ne,Ti,Te,Fi,Fe,Si,Se', // FunctionCode（文字列）のみ許可
        'healthStatus' => 'required|array',
        'healthStatus.*' => 'required|string|in:O,o,x', // O, o, x のみ許可
        'tierMap' => 'required|array',
        'tierMap.*' => 'nullable|string|in:Dominant,High,Middle,Low', // Tier値のみ許可
    ]);

    // ユニークなIDを発行
    $jobId = (string) Str::uuid();

    // GenerateDescriptionJobを実行する前に明示的にキャッシュに登録しておかないと404！
    Cache::put("job_status_{$jobId}", [
        'status' => 'queued',
        'message' => 'Job has been queued.',
        'progress' => 0,
    ], 600);

    // ジョブをキュー（棚）に投入
    // ※第2引数にjobIdを渡して、Jobの中でキャッシュキーとして使う
    //
    // オプション: 必要に応じて以下のメソッドをチェーンできます。現状は即座に実行で問題なし。
    // ->onQueue('high-priority')  // 特定のキューに投入（例: 優先度の高いジョブ用）
    // ->delay(now()->addSeconds(10))  // 10秒後に実行（例: レート制限を避けるため）
    GenerateDescriptionJob::dispatch($data, $jobId);

    // 即座にレスポンスを返す（待ち時間ほぼゼロ）
    return response()->json([
        'message' => 'Accepted',
        'job_id' => $jobId,
    ], 202);
});

/*
|--------------------------------------------------------------------------
| 2. 状況確認API（ポーリング用）
|--------------------------------------------------------------------------
| フロントエンドが「終わった？」と聞きに来る場所。
*/
Route::get('/describe/status/{jobId}', function ($jobId) {
    // 1. 完了/失敗の結果があるか確認
    $resultKey = "job_result_{$jobId}";
    if (Cache::has($resultKey)) {
        return response()->json(Cache::get($resultKey));
    }

    // 2. まだ結果がない場合
    // 処理中ステータスがあるか？（Job内でputしていれば）
    $statusKey = "job_status_{$jobId}";
    if (Cache::has($statusKey)) {
        return response()->json(Cache::get($statusKey));
    }

    // 3. job_status も job_result も存在しない場合（未登録のjobId）
    return response()->json([
        'status' => 'not_found',
        'message' => '指定されたジョブIDが見つかりません。',
    ], 404);
});

Route::post('/results', function (Request $request) {
    // 1. バリデーション（より厳密に）
    $data = $request->validate([
        'answers' => 'required|array',
        'function_order' => 'required|array|size:8',
        'function_order.*' => 'string|in:Ni,Ne,Ti,Te,Fi,Fe,Si,Se',
        'tier_map' => 'required|array',
        'tier_map.*' => 'required|string|in:Dominant,High,Middle,Low',
        'health_status' => 'required|array',
        'health_status.*' => 'required|string|in:O,o,x',
        'dominant_function' => 'required|string|in:Ni,Ne,Ti,Te,Fi,Fe,Si,Se',
        'second_function' => 'required|string|in:Ni,Ne,Ti,Te,Fi,Fe,Si,Se',
        'title' => 'required|string|max:255',
        'description' => 'required|string',
        'icon_url' => 'required|string',
    ]);

    // 2. configから値を取得
    $supabaseUrl = config('services.supabase.url');
    $supabaseKey = config('services.supabase.key');

    // 3. Supabase REST APIに送信
    try {
        $response = Http::withHeaders([
            'apikey' => $supabaseKey,
            'Authorization' => "Bearer {$supabaseKey}",
            'Content-Type' => 'application/json',
            'Prefer' => 'return=minimal',
        ])->post("{$supabaseUrl}/rest/v1/user_results", $data);

        if ($response->failed()) {
            return response()->json([
                'error' => 'Supabase connection error',
                'details' => $response->json() ?? $response->body(),
            ], $response->status());
        }

        return response()->json(['message' => 'Result saved successfully'], 201);

    } catch (\Exception $e) {
        return response()->json(['error' => 'Server error', 'message' => $e->getMessage()], 500);
    }
});
