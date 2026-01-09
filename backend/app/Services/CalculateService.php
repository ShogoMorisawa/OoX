<?php

namespace App\Services;

class CalculateService
{
    /**
     * 【Core Logic】
     * 回答リストと質問データから、数学的に最も矛盾の少ない「最高の順序」を算出する
     *
     * @param  array  $answersList  フロントから来る [{question_id, function_code, response_time_ms}, ...]
     * @param  array  $questionsMap  DBから取得した質問マスタ (IDキー)
     * @return array 最適化された順序配列 [Ni, Ti, Fe, ...]
     */
    public function calculateBestOrder(array $answersList, array $questionsMap): array
    {
        // 1. 回答を「対戦データ (Winner vs Loser)」に変換
        $matches = $this->convertAnswersToMatches($answersList, $questionsMap);

        // 2. 重み付きケメニー・ヤング法で最適解を計算
        $bestOrder = $this->runKemenyYoung($matches);

        // 3.計算結果と回答の矛盾（葛藤）を検出する
        $conflicts = $this->detectConflicts($bestOrder, $matches);

        return [
            'order' => $bestOrder,
            'conflicts' => $conflicts,
        ];
    }

    /**
     * フロントの回答データとDBの質問定義を突き合わせ、勝敗データを作る
     */
    protected function convertAnswersToMatches(array $answersList, array $questionsMap): array
    {
        $matches = [];

        foreach ($answersList as $ans) {
            $qId = $ans['question_id'] ?? null;
            $selectedFunc = $ans['function_code'] ?? null; // フロントが送ってくれる勝った機能
            $time = $ans['response_time_ms'] ?? 0;

            // 質問定義が存在しない、または比較質問でない場合はスキップ
            if (! isset($questionsMap[$qId])) {
                continue;
            }
            $question = $questionsMap[$qId];

            // type check (questionテーブルのカラム名に合わせて調整してください)
            // 'comparison' 以外の質問（診断用など）は順序計算には使わない
            if (($question['type'] ?? '') !== 'comparison') {
                continue;
            }

            $left = $question['left_function_code'];
            $right = $question['right_function_code'];

            // 勝者と敗者を特定
            // フロントが送ってきた function_code が Left なら、敗者は Right
            if ($selectedFunc === $left) {
                $winner = $left;
                $loser = $right;
            } else {
                $winner = $right;
                $loser = $left;
            }

            $matches[] = [
                'winner' => $winner,
                'loser' => $loser,
                'time' => $time,
                'question_id' => $qId,
            ];
        }

        return $matches;
    }

    /**
     * 【重み付きケメニー・ヤング法】
     * 8機能の全順列(40,320通り)を総当たりし、ユーザーの回答と最も整合する並びを探す
     */
    protected function runKemenyYoung(array $matches): array
    {
        $functions = ['Ni', 'Ne', 'Ti', 'Te', 'Fi', 'Fe', 'Si', 'Se'];

        // 全順列を生成
        $permutations = $this->getPermutations($functions);

        $bestOrder = [];
        $maxScore = -1.0;

        foreach ($permutations as $order) {
            $score = 0.0;
            // 高速化のため、機能名 => 順位(0-7) のマップを作成
            $orderMap = array_flip($order);

            foreach ($matches as $match) {
                $winner = $match['winner'];
                $loser = $match['loser'];
                $time = $match['time'];

                // この順列案($order)において、WinnerがLoserより上位（indexが小さい）か？
                if (isset($orderMap[$winner], $orderMap[$loser]) && $orderMap[$winner] < $orderMap[$loser]) {
                    // 整合している場合、スコアを加算
                    // 回答時間が短い（確信がある）ほど、重みを大きくする
                    $score += $this->calculateWeight($time);
                }
            }

            // 最高スコアを更新
            if ($score > $maxScore) {
                $maxScore = $score;
                $bestOrder = $order;
            }
        }

        return $bestOrder;
    }

    /**
     * 回答時間(ms)から重みを算出する
     */
    protected function calculateWeight(int $timeMs): float
    {
        // 1.5秒以内 = 直感的な確信 (重み2倍)
        if ($timeMs <= 1500) {
            return 2.0;
        }
        // 5秒以内 = 通常の判断 (標準)
        elseif ($timeMs <= 5000) {
            return 1.0;
        }
        // 5秒以上 = 迷いあり (重み半減)
        // 迷って出した答えは、矛盾した時に切り捨てられやすくなる
        else {
            return 0.5;
        }
    }

    /**
     * Heap's Algorithmによる全順列生成
     */
    protected function getPermutations(array $elements): array
    {
        $result = [];
        // 元の配列を変更しないように完全なコピーを作成
        $elementsCopy = [...$elements];
        $this->heapsAlgorithm(count($elementsCopy), $elementsCopy, $result);

        return $result;
    }

    protected function heapsAlgorithm(int $k, array &$elements, array &$result): void
    {
        if ($k === 1) {
            // 配列のコピーを保存（参照ではなく値で）
            // PHP 7.4以降のスプレッド演算子を使用
            $result[] = [...$elements];
        } else {
            for ($i = 0; $i < $k; $i++) {
                $this->heapsAlgorithm($k - 1, $elements, $result);
                if ($k % 2 === 0) {
                    $temp = $elements[$i];
                    $elements[$i] = $elements[$k - 1];
                    $elements[$k - 1] = $temp;
                } else {
                    $temp = $elements[0];
                    $elements[0] = $elements[$k - 1];
                    $elements[$k - 1] = $temp;
                }
            }
        }
    }

    /**
     * 最適化された順序とユーザーの回答を比較し、矛盾（葛藤）を検出する
     * 矛盾 = ユーザーが「AがBより上位」と答えたのに、システムの順序では「BがAより上位」になっている場合
     */
    protected function detectConflicts(array $bestOrder, array $matches): array
    {
        $conflicts = [];
        $orderMap = array_flip($bestOrder);

        foreach ($matches as $match) {
            $userWinner = $match['winner'];
            $userLoser = $match['loser'];
            $time = $match['time'];
            $questionId = $match['question_id'] ?? null;

            // 矛盾の判定: ユーザーが選んだ勝者が、システムの順序では敗者（下位）になっている
            // $orderMap[$userWinner] > $orderMap[$userLoser] の場合が矛盾
            if (isset($orderMap[$userWinner], $orderMap[$userLoser])
                && $orderMap[$userWinner] > $orderMap[$userLoser]) {
                $conflicts[] = [
                    'question_id' => $questionId,
                    'user_winner' => $userWinner, // ユーザーが選んだ機能
                    'system_order_winner' => $userLoser, // システムの順序では上位になっている機能
                    'response_time_ms' => $time,
                ];
            }
        }

        // 回答時間が短い順（確信度が高い順）にソート
        // 確信度が高い回答で矛盾が発生している場合、より注意が必要
        usort($conflicts, function ($a, $b) {
            return $a['response_time_ms'] <=> $b['response_time_ms'];
        });

        return $conflicts;
    }

    public function calculateHealthStatus(array $scores): array
    {
        $status = [];
        $functions = ['Ni', 'Ne', 'Ti', 'Te', 'Fi', 'Fe', 'Si', 'Se'];
        foreach ($functions as $func) {
            // スコアが存在しない場合は2
            $score = $scores[$func] ?? 2;
            if ($score >= 3) {
                $status[$func] = 'O';
            } elseif ($score === 2) {
                $status[$func] = 'o';
            } else {
                $status[$func] = 'x';
            }
        }

        return $status;
    }
}
