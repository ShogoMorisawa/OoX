<?php

namespace App\Services;

class CalculateService
{
    protected array $ids = [];

    protected array $low = [];

    protected array $onStack = [];

    protected array $stack = [];

    protected int $timer = 0;

    protected array $sccs = [];

    // Topological sort helpers for SCC DAG
    protected array $visited = [];

    protected array $orderList = [];

    public function buildGraph(array $matches): array
    {
        $graph = [];
        foreach ($matches as $match) {
            $winner = $match['winner'];
            $loser = $match['loser'];

            if (! isset($graph[$winner])) {
                $graph[$winner] = [];
            }
            if (! isset($graph[$loser])) {
                $graph[$loser] = [];
            }

            if (! in_array($loser, $graph[$winner], true)) {
                $graph[$winner][] = $loser;
            }
        }

        return $graph;
    }

    public function findSCCs(array $graph): array
    {
        $this->ids = [];
        $this->low = [];
        $this->onStack = [];
        $this->stack = [];
        $this->sccs = [];
        $this->timer = 0;

        foreach (array_keys($graph) as $node) {
            if (! isset($this->ids[$node])) {
                $this->dfsTarjan($node, $graph);
            }
        }

        return $this->sccs;
    }

    public function getFinalOrder(array $matches): array
    {
        $graph = $this->buildGraph($matches);
        $sccs = $this->findSCCs($graph);

        $nodeToScc = $this->mapNodesToSccs($sccs);
        $sccGraph = $this->buildSccDag($graph, $sccs, $nodeToScc);
        $orderSccIds = $this->topologicalSortScc($sccGraph);

        // SCC ID の順番をそのままノード列に変換
        $order = array_map(fn ($id) => $sccs[$id], $orderSccIds);

        // 要素が1つなら配列ではなく文字列に戻す
        return array_map(fn ($x) => count($x) === 1 ? $x[0] : $x, $order);
    }

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
        // ここが「8すくみ」を解く魔法の部分です
        return $this->runKemenyYoung($matches);
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

    protected function dfsTarjan(string $at, array $graph): void
    {
        // 初回訪問で id/low を同じ値にセットし、スタックに積む
        $this->ids[$at] = $this->low[$at] = $this->timer++;
        $this->stack[] = $at;
        $this->onStack[$at] = true;

        foreach ($graph[$at] as $to) {
            if (! isset($this->ids[$to])) {
                $this->dfsTarjan($to, $graph);
                // 子が見つけた「より古い」ノード情報で low を更新
                $this->low[$at] = min($this->low[$at], $this->low[$to]);
            } elseif (! empty($this->onStack[$to])) {
                // スタック上への戻り辺があれば ids で low を更新
                $this->low[$at] = min($this->low[$at], $this->ids[$to]);
            }
        }

        if ($this->ids[$at] === $this->low[$at]) {
            // 自分が強連結成分の根なら、根に戻るまでスタックを取り出す
            $scc = [];
            while (true) {
                $node = array_pop($this->stack);
                $this->onStack[$node] = false;
                $scc[] = $node;

                if ($node === $at) {
                    break;
                }
            }
            $this->sccs[] = $scc;
        }
    }

    protected function mapNodesToSccs(array $sccs): array
    {
        $map = [];
        foreach ($sccs as $index => $scc) {
            foreach ($scc as $node) {
                $map[$node] = $index;
            }
        }

        return $map;
    }

    protected function buildSccDag(array $graph, array $sccs, array $nodeToScc): array
    {
        $sccGraph = [];
        $count = count($sccs);

        // SCC ノードを初期化
        for ($i = 0; $i < $count; $i++) {
            $sccGraph[$i] = [];
        }

        foreach ($graph as $u => $adj) {
            $uScc = $nodeToScc[$u];

            foreach ($adj as $v) {
                $vScc = $nodeToScc[$v];

                if ($uScc !== $vScc && ! in_array($vScc, $sccGraph[$uScc])) {
                    $sccGraph[$uScc][] = $vScc;
                }
            }
        }

        return $sccGraph;
    }

    protected function dfsSortScc(int $at, array $sccGraph): void
    {
        $this->visited[$at] = true;
        foreach ($sccGraph[$at] as $to) {
            if (! isset($this->visited[$to])) {
                $this->dfsSortScc($to, $sccGraph);
            }
        }
        $this->orderList[] = $at;
    }

    protected function topologicalSortScc(array $sccGraph): array
    {
        $this->visited = [];
        $this->orderList = [];

        foreach (array_keys($sccGraph) as $sccId) {
            if (! isset($this->visited[$sccId])) {
                $this->dfsSortScc($sccId, $sccGraph);
            }
        }

        return array_reverse($this->orderList);
    }
}
