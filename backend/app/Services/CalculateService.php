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
