<?php

namespace Tests\Unit;

use App\Services\CalculateService;
use PHPUnit\Framework\TestCase;

class CalculateServiceTest extends TestCase
{
    protected CalculateService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new CalculateService;
    }

    /**
     * Case 1: 矛盾がない「きれいな序列」のテスト
     */
    public function test_it_calculates_linear_order_correctly()
    {
        // Ni > Ti > Fe (一直線)
        $matches = [
            ['winner' => 'Ni', 'loser' => 'Ti', 'id' => '1'],
            ['winner' => 'Ti', 'loser' => 'Fe', 'id' => '2'],
        ];

        $result = $this->service->getFinalOrder($matches);

        // 期待: ["Ni", "Ti", "Fe"] という文字列の配列
        $this->assertEquals(['Ni', 'Ti', 'Fe'], $result);
    }

    /**
     * Case 2: 「三すくみ（単純なサイクル）」の検出テスト
     */
    public function test_it_detects_simple_cycle_as_block()
    {
        // A > B > C > A (ループ)
        $matches = [
            ['winner' => 'A', 'loser' => 'B', 'id' => '1'],
            ['winner' => 'B', 'loser' => 'C', 'id' => '2'],
            ['winner' => 'C', 'loser' => 'A', 'id' => '3'],
        ];

        $result = $this->service->getFinalOrder($matches);

        // 期待: 全体が1つの配列（ブロック）になる
        // 例: [ ["A", "B", "C"] ]
        // ※内部の順序はアルゴリズム依存なので、要素が含まれているかを確認する

        $this->assertCount(1, $result); // 外側は1要素
        $this->assertIsArray($result[0]); // その中身は配列

        // 中身にA, B, Cがすべて入っているか
        $block = $result[0];
        sort($block); // 並び替えて比較しやすくする
        $this->assertEquals(['A', 'B', 'C'], $block);
    }

    /**
     * Case 3: 複合パターン（今回のMVPで最も重要なケース）
     */
    public function test_it_handles_mixed_graph_with_hierarchy_and_cycle()
    {
        // 構造: Ni(王) -> [Fe, Fi, Te](葛藤) -> Si(部下)
        $matches = [
            // 王からの支配
            ['winner' => 'Ni', 'loser' => 'Fe', 'id' => '1'],

            // 葛藤ブロック (Fe > Fi > Te > Fe)
            ['winner' => 'Fe', 'loser' => 'Fi', 'id' => '2'],
            ['winner' => 'Fi', 'loser' => 'Te', 'id' => '3'],
            ['winner' => 'Te', 'loser' => 'Fe', 'id' => '4'],

            // ブロックからの支配
            ['winner' => 'Te', 'loser' => 'Si', 'id' => '5'],
        ];

        $result = $this->service->getFinalOrder($matches);

        // 期待される構造:
        // 1. "Ni"
        // 2. ["Fe", "Fi", "Te"] (順不同)
        // 3. "Si"

        $this->assertCount(3, $result);

        // 1位は Ni
        $this->assertEquals('Ni', $result[0]);

        // 2位は葛藤ブロック
        $this->assertIsArray($result[1]);
        $block = $result[1];
        sort($block);
        $this->assertEquals(['Fe', 'Fi', 'Te'], $block);

        // 3位は Si
        $this->assertEquals('Si', $result[2]);
    }
}
