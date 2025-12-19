<?php

namespace App\Jobs;

use App\Services\DescribeService;
use Exception;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class GenerateDescriptionJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 600;

    public $tries = 3;

    public function __construct(
        protected array $data,
        protected string $jobId
    ) {}

    /**
     * Execute the job.
     */
    public function handle(DescribeService $describeService): void
    {
        Cache::put("job_status_{$this->jobId}", [
            'status' => 'processing',
        ], $this->timeout);

        try {
            Log::info("Job {$this->jobId}: Gemini生成開始");

            $result = $describeService->generateDescription(
                $this->data['finalOrder'],
                $this->data['healthStatus'],
                $this->data['tierMap']
            );

            // 結果をキャッシュに保存（1時間有効）
            Cache::put("job_result_{$this->jobId}", [
                'status' => 'completed',
                'data' => $result,
            ], 3600);

            Log::info("Job {$this->jobId}: Gemini生成成功");
        } catch (Exception $e) {
            Log::error("Job {$this->jobId}: 失敗 - ".$e->getMessage());

            $errorMessage = '生成に失敗しました。もう一度お試しください。';

            // 失敗を記録
            Cache::put("job_result_{$this->jobId}", [
                'status' => 'failed',
                'error' => $errorMessage,
            ], 3600);

            throw $e;
        }
    }
}
