<?php

namespace App\Http\Controllers;

use App\Http\Requests\DescribeRequest;
use App\Jobs\GenerateDescriptionJob;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class DescribeController extends Controller
{
    /**
     * Geminiによる解析ジョブを非同期で投入する
     *
     * フロントエンドは即座に job_id を受け取り、ポーリングで進捗を確認する。
     * ジョブ実行前にキャッシュに登録することで、ポーリング開始直後の404エラーを防ぐ。
     * キャッシュ有効期限（600秒）は GenerateDescriptionJob のタイムアウトと同期している。
     *
     * @return JsonResponse 202 Accepted - ジョブがキューに投入されたことを示す
     */
    public function store(DescribeRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $jobId = (string) Str::uuid();

        // ジョブ実行前にキャッシュに登録することで、ポーリング開始直後の404を防ぐ
        // 有効期限600秒は GenerateDescriptionJob のタイムアウト（10分）と同期
        Cache::put("job_status_{$jobId}", [
            'status' => 'queued',
            'message' => 'Job has been queued.',
            'progress' => 0,
        ], 600);

        GenerateDescriptionJob::dispatch($validated, $jobId);

        // 202 Accepted: リクエストは受理されたが、処理は非同期で実行される
        return response()->json([
            'message' => 'Accepted',
            'job_id' => $jobId,
        ], 202);
    }

    /**
     * ジョブの実行状況をポーリングで確認する
     *
     * 2段階のキャッシュキーを確認する：
     * 1. job_result_{jobId}: 完了/失敗時の最終結果（優先的に確認）
     * 2. job_status_{jobId}: 処理中のステータス（キュー待ち、実行中など）
     *
     * この順序で確認することで、完了済みのジョブを効率的に返せる。
     *
     * @param  string  $jobId  ジョブの一意な識別子（UUID）
     * @return JsonResponse ジョブの状態（completed/failed/processing/queued/not_found）
     */
    public function show(string $jobId): JsonResponse
    {
        // 完了/失敗の結果があれば優先的に返す（最終状態）
        $resultKey = "job_result_{$jobId}";
        if (Cache::has($resultKey)) {
            return response()->json(Cache::get($resultKey));
        }

        // まだ結果がない場合、処理中ステータスを確認
        $statusKey = "job_status_{$jobId}";
        if (Cache::has($statusKey)) {
            return response()->json(Cache::get($statusKey));
        }

        // どちらも存在しない場合、無効な jobId として404を返す
        return response()->json([
            'status' => 'not_found',
            'message' => '指定されたジョブIDが見つかりません。',
        ], 404);
    }
}
