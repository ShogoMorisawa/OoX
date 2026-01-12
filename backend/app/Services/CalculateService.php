<?php

namespace App\Services;

class CalculateService
{
    /**
     * 【Core Logic】重み付きケメニー・ヤング法による最適順序の算出
     *
     * 回答リストと質問データから、数学的に最も矛盾の少ない「最高の順序」を算出する。
     * 8機能の全順列（40,320通り）を総当たりし、ユーザーの回答と最も整合する並びを探す。
     *
     * 処理の流れ:
     * 1. 回答データを「対戦データ（Winner vs Loser）」に変換
     * 2. 重み付きケメニー・ヤング法で最適解を計算（回答時間が短いほど重みが大きい）
     * 3. 計算結果とユーザー回答の矛盾（葛藤）を検出
     *
     * fixed_match の役割:
     * 葛藤解決時にユーザーが明示的に指定した勝敗関係を強制する。
     * 例: {winner: "Ni", loser: "Ti"} を指定すると、Ni が Ti より上位になる順列のみを評価する。
     *
     * @param  array  $answersList  フロントから来る [{question_id, function_code, response_time_ms}, ...]
     * @param  array  $questionsMap  DBから取得した質問マスタ (IDキー) - O(1)アクセスのためマップ形式
     * @param  array|null  $fixedMatch  葛藤解決時の固定勝敗関係 {winner: string, loser: string}
     * @return array ['order' => array, 'conflicts' => array] 最適化された順序と矛盾リスト
     */
    public function calculateBestOrder(
        array $answersList,
        array $questionsMap,
        ?array $fixedMatch = null): array
    {
        // 1. 回答を「対戦データ (Winner vs Loser)」に変換
        $matches = $this->convertAnswersToMatches($answersList, $questionsMap);

        // 2. 重み付きケメニー・ヤング法で最適解を計算
        $bestOrder = $this->runKemenyYoung($matches, $fixedMatch);

        // 3.計算結果と回答の矛盾（葛藤）を検出する
        $conflicts = $this->detectConflicts($bestOrder, $matches);

        return [
            'order' => $bestOrder,
            'conflicts' => $conflicts,
        ];
    }

    /**
     * 回答データを「対戦データ（Winner vs Loser）」に変換する
     *
     * フロントエンドから送られてくる回答データ（選択した機能コード）と
     * 質問定義（left_function_code, right_function_code）を突き合わせて、
     * 「どの機能がどの機能に勝ったか」という対戦データに変換する。
     *
     * 処理の流れ:
     * 1. 質問定義が存在し、かつ type='comparison' の場合のみ処理
     * 2. 選択された機能コードが left なら、winner=left, loser=right
     * 3. 選択された機能コードが right なら、winner=right, loser=left
     * 4. 回答時間も保存（重み計算に使用）
     *
     * @param  array  $answersList  回答データ配列
     * @param  array  $questionsMap  質問マスタ（IDキー） - O(1)アクセスのためマップ形式
     * @return array 対戦データ配列 [{winner, loser, time, question_id}, ...]
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
     * 【重み付きケメニー・ヤング法】全順列の総当たり評価
     *
     * 8機能の全順列（40,320通り）を総当たりし、ユーザーの回答と最も整合する並びを探す。
     * Heap's Algorithm で全順列を生成し、各順列に対してスコアを計算する。
     *
     * スコア計算の仕組み:
     * - 各対戦データについて、順列内で winner が loser より上位（indexが小さい）ならスコア加算
     * - 回答時間が短い（確信がある）ほど重みが大きい（calculateWeight で重み付け）
     * - 最高スコアの順列が最適解となる
     *
     * fixed_match の処理:
     * 指定された勝敗関係に矛盾する順列は評価をスキップする。
     * これにより、ユーザーが明示的に指定した勝敗関係を強制できる。
     *
     * パフォーマンス:
     * 40,320通りの全順列を評価するため、計算量は O(n! * m) となる
     * （n=機能数8, m=対戦データ数）。8機能の場合は実用的な速度で動作する。
     *
     * @param  array  $matches  対戦データ配列 [{winner, loser, time, question_id}, ...]
     * @param  array|null  $fixedMatch  固定勝敗関係 {winner: string, loser: string}
     * @return array 最適化された順序配列 [Ni, Ti, Fe, ...]
     */
    protected function runKemenyYoung(
        array $matches,
        ?array $fixedMatch = null
    ): array {
        $functions = ['Ni', 'Ne', 'Ti', 'Te', 'Fi', 'Fe', 'Si', 'Se'];

        // 全順列を生成
        $permutations = $this->getPermutations($functions);

        $bestOrder = [];
        $maxScore = -1.0;

        foreach ($permutations as $order) {
            $score = 0.0;
            // 高速化のため、機能名 => 順位(0-7) のマップを作成
            // array_flip により、順列内での各機能の位置を O(1) で取得可能
            $orderMap = array_flip($order);

            if ($fixedMatch) {
                $fWinner = $fixedMatch['winner'];
                $fLoser = $fixedMatch['loser'];
                // 修正後のマッチが矛盾している場合はスキップ
                // 矛盾 = winnerがloserより下位（indexが大きい）になっている場合
                if (
                    isset($orderMap[$fWinner], $orderMap[$fLoser])
                    && $orderMap[$fWinner] > $orderMap[$fLoser]
                ) {
                    continue;
                }
            }

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
     * 回答時間から重みを算出する
     *
     * ユーザーの回答時間に基づいて、その回答の「確信度」を重みとして表現する。
     * 回答時間が短いほど確信度が高く、長いほど迷いがあると判断する。
     *
     * 重み付けの意図:
     * - 直感的な回答（20秒以内）: 重み2.0 - ユーザーの本質的な判断を重視
     * - 通常の判断（60秒以内）: 重み1.0 - 標準的な重み
     * - 迷いのある回答（60秒超）: 重み0.5 - 矛盾した場合に切り捨てられやすい
     *
     * この重み付けにより、確信度の高い回答を優先し、
     * 迷いのある回答で発生した矛盾は許容される傾向になる。
     *
     * @param  int  $timeMs  回答時間（ミリ秒）
     * @return float 重み（0.5, 1.0, 2.0 のいずれか）
     */
    protected function calculateWeight(int $timeMs): float
    {
        // 20秒以内 = 直感的な確信 (重み2倍)
        if ($timeMs <= 20000) {
            return 2.0;
        }
        // 60秒以内 = 通常の判断 (標準)
        elseif ($timeMs <= 60000) {
            return 1.0;
        }
        // 60秒以上 = 迷いあり (重み半減)
        // 迷って出した答えは、矛盾した時に切り捨てられやすくなる
        else {
            return 0.5;
        }
    }

    /**
     * Heap's Algorithm による全順列生成
     *
     * 8機能の全順列（40,320通り）を生成する。
     * Heap's Algorithm は再帰的に全順列を生成する効率的なアルゴリズム。
     *
     * アルゴリズムの特徴:
     * - 時間計算量: O(n!) - 全順列を生成するため最適
     * - 空間計算量: O(n) - 再帰スタックの深さ
     * - 各順列は元の配列を変更せず、完全なコピーとして保存される
     *
     * @param  array  $elements  順列を生成する要素配列（例: ['Ni', 'Ne', ...]）
     * @return array 全順列の配列 [[順列1], [順列2], ...]
     */
    protected function getPermutations(array $elements): array
    {
        $result = [];
        // 元の配列を変更しないように完全なコピーを作成
        // スプレッド演算子により、参照ではなく値でコピーされる
        $elementsCopy = [...$elements];
        $this->heapsAlgorithm(count($elementsCopy), $elementsCopy, $result);

        return $result;
    }

    /**
     * Heap's Algorithm の再帰実装
     *
     * 再帰的に全順列を生成する。k個の要素の順列を生成する際、
     * (k-1)個の要素の順列を生成し、最後の要素を各位置に配置する。
     *
     * 偶数/奇数の分岐:
     * - kが偶数の場合: 要素[i]と要素[k-1]を交換
     * - kが奇数の場合: 要素[0]と要素[k-1]を交換
     * この分岐により、重複なく全順列を生成できる。
     *
     * @param  int  $k  現在処理中の要素数
     * @param  array  &$elements  要素配列（参照渡し、再帰的に変更される）
     * @param  array  &$result  結果配列（参照渡し、順列が追加される）
     */
    protected function heapsAlgorithm(int $k, array &$elements, array &$result): void
    {
        if ($k === 1) {
            // 配列のコピーを保存（参照ではなく値で）
            // PHP 7.4以降のスプレッド演算子を使用して、完全なコピーを作成
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
     * 最適順序とユーザー回答の矛盾（葛藤）を検出する
     *
     * ケメニー・ヤング法で算出された最適順序と、ユーザーが実際に答えた内容を比較し、
     * 矛盾している対戦データを検出する。
     *
     * 矛盾の定義:
     * ユーザーが「AがBより上位」と答えたのに、システムの最適順序では
     * 「BがAより上位」になっている場合。これは、ユーザーの回答が
     * 全体の整合性を保つために「切り捨てられた」ことを意味する。
     *
     * ソート順序の意図:
     * 回答時間が長い順（迷いに迷った順）にソートすることで、
     * ユーザーに「ここで迷いましたよね？」と問いかけるための
     * 葛藤ブロックを特定しやすくする。
     *
     * @param  array  $bestOrder  最適化された順序配列 [Ni, Ti, Fe, ...]
     * @param  array  $matches  対戦データ配列 [{winner, loser, time, question_id}, ...]
     * @return array 矛盾リスト [{question_id, user_winner, system_order_winner, response_time_ms}, ...]
     *               回答時間が長い順（迷いが大きい順）にソート済み
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

        // 回答時間が長い順（迷いに迷った順）にソート
        // ユーザーに「ここで迷いましたよね？」と問いかけるために、迷いが大きい順に並べる
        // これにより、葛藤解決画面で最も迷った質問を最初に提示できる
        usort($conflicts, function ($a, $b) {
            return $b['response_time_ms'] <=> $a['response_time_ms'];
        });

        return $conflicts;
    }

    /**
     * 健全度スコアから健全度ステータス（O/o/x）を算出する
     *
     * 診断質問で取得した数値スコアを、3段階の健全度ステータスに変換する。
     * このステータスは、Geminiによる描写生成時に使用される。
     *
     * ステータスの意味:
     * - 'O' (健全): スコア3以上 - 調子が良い/強みとして機能している
     * - 'o' (普通): スコア2 - 標準的な状態
     * - 'x' (不健全): スコア1以下 - 葛藤/不健全な状態、疲れている時に顔を出す
     *
     * デフォルト値:
     * スコアが存在しない機能は 'o'（普通）として扱う。
     * これにより、診断質問に回答しなかった機能も安全に処理できる。
     *
     * @param  array  $scores  健全度スコア配列 {FunctionCode: number}
     * @return array 健全度ステータス配列 {FunctionCode: 'O'|'o'|'x'}
     */
    public function calculateHealthStatus(array $scores): array
    {
        $status = [];
        $functions = ['Ni', 'Ne', 'Ti', 'Te', 'Fi', 'Fe', 'Si', 'Se'];
        foreach ($functions as $func) {
            // スコアが存在しない場合は2（普通）として扱う
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
