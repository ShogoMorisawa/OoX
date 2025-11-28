<?php

namespace App\Services;

use Exception;
use Gemini\Laravel\Facades\Gemini;
use Illuminate\Support\Facades\Log;

class DescribeService
{
    /**
     * Geminiに最終データに基づく分析と描写を生成させる。
     */
    public function generateDescription(array $finalOrder, array $healthStatus, array $tierMap): array
    {
        $prompt = $this->buildGeminiPrompt($finalOrder, $healthStatus, $tierMap);

        try {
            $result = Gemini::generativeModel(model: 'models/gemini-pro-latest')
                ->generateContent($prompt);
            $fullText = $result->text();

            return $this->parseGeminiOutput($fullText);
        } catch (Exception $e) {
            Log::error('Gemini API Error: '.$e->getMessage());

            return [
                'title' => 'Error Debug',
                'description' => $e->getMessage(),
            ];
        }
    }

    private function buildGeminiPrompt(array $finalOrder, array $healthStatus, array $tierMap): string
    {
        $orderStr = json_encode($finalOrder, JSON_UNESCAPED_UNICODE);
        $healthStr = json_encode($healthStatus, JSON_UNESCAPED_UNICODE);
        $tierStr = json_encode($tierMap, JSON_UNESCAPED_UNICODE);

        return <<<EOT
            あなたは「性格分析の専門家」であり、同時に「詩的な語り部」です。
            以下のユーザーの心理機能（Cognitive Functions）の分析結果を元に、
            このユーザーの人物像を表す「タイトル」と「解説文」を作成してください。

            ## 分析データ
            - **機能の序列**: {$orderStr}
            - **健全度**: {$healthStr} (O=健全, o=普通, x=不健全)
            - **階層**: {$tierStr} (Dominant=王, High=側近, Middle=市民, Low=追放者)

            ## 出力ルール
            - 出力は以下のMarkdown形式のみ。余計な挨拶は不要。
            - タイトルは20文字以内のキャッチーなもの。
            - 解説は300文字程度。ユーザーに語りかけるような温かい口調で。
            - 階層（王や追放者など）や健全度のメタファーを使って、その人の内面葛藤や強みを表現すること。

            # タイトル
            (ここにタイトル)

            # 解説
            (ここに解説文)
        EOT;
    }

    private function parseGeminiOutput(string $fullText): array
    {
        // Markdown形式からタイトルと解説を抽出
        $title = '';
        $description = '';

        // タイトルを抽出（# タイトル の次の行）
        if (preg_match('/#\s*タイトル\s*\n(.*?)(?:\n|$)/', $fullText, $titleMatches)) {
            $title = trim($titleMatches[1]);
        }

        // 解説を抽出（# 解説 の次の行から最後まで）
        if (preg_match('/#\s*解説\s*\n(.*?)$/s', $fullText, $descMatches)) {
            $description = trim($descMatches[1]);
        }

        // 抽出に失敗した場合は全文を使用
        if (empty($title) || empty($description)) {
            $lines = explode("\n", trim($fullText));
            $title = $lines[0] ?? '分析結果';
            $description = implode("\n", array_slice($lines, 1));
        }

        return [
            'title' => $title ?: '分析結果',
            'description' => $description ?: '解析文を生成しました。',
        ];
    }
}
