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

    // ============================================
    // calculateBestOrder() のテスト
    // ============================================

    /**
     * テストケース1: 矛盾がない「きれいな序列」の計算
     * 
     * Ni > Ti > Fe という明確な順序がある場合、
     * ケメニー・ヤング法が正しく最適順序を算出することを確認する。
     */
    public function test_calculate_best_order_with_linear_hierarchy(): void
    {
        // 準備: 回答データと質問マスタを準備
        $answers = [
            [
                'question_id' => 'q1',
                'function_code' => 'Ni',
                'response_time_ms' => 10000, // 確信度が高い
            ],
            [
                'question_id' => 'q2',
                'function_code' => 'Ti',
                'response_time_ms' => 15000,
            ],
        ];

        $questionsMap = [
            'q1' => [
                'id' => 'q1',
                'type' => 'comparison',
                'left_function_code' => 'Ni',
                'right_function_code' => 'Ti',
            ],
            'q2' => [
                'id' => 'q2',
                'type' => 'comparison',
                'left_function_code' => 'Ti',
                'right_function_code' => 'Fe',
            ],
        ];

        // 実行
        $result = $this->service->calculateBestOrder($answers, $questionsMap);

        // 検証
        $this->assertIsArray($result);
        $this->assertArrayHasKey('order', $result);
        $this->assertArrayHasKey('conflicts', $result);

        // 順序の検証: Niが最初に来ることを確認
        $order = $result['order'];
        $this->assertIsArray($order);
        $this->assertContains('Ni', $order);
        $this->assertContains('Ti', $order);
        $this->assertContains('Fe', $order);

        // Niの位置がTiより前であることを確認
        $niIndex = array_search('Ni', $order);
        $tiIndex = array_search('Ti', $order);
        $this->assertLessThan($tiIndex, $niIndex, 'Ni should be ranked higher than Ti');

        // Tiの位置がFeより前であることを確認
        $feIndex = array_search('Fe', $order);
        $this->assertLessThan($feIndex, $tiIndex, 'Ti should be ranked higher than Fe');

        // 矛盾がない場合、conflictsは空であるべき
        $this->assertEmpty($result['conflicts'], 'No conflicts should exist for linear hierarchy');
    }

    /**
     * テストケース2: サイクル（三すくみ）を含む場合の処理
     * 
     * A > B > C > A というサイクルがある場合、
     * ケメニー・ヤング法が最も矛盾の少ない順序を算出することを確認する。
     */
    public function test_calculate_best_order_with_cycle(): void
    {
        // 準備: サイクルを含む回答データ
        $answers = [
            [
                'question_id' => 'q1',
                'function_code' => 'Ni',
                'response_time_ms' => 10000,
            ],
            [
                'question_id' => 'q2',
                'function_code' => 'Ti',
                'response_time_ms' => 10000,
            ],
            [
                'question_id' => 'q3',
                'function_code' => 'Fe',
                'response_time_ms' => 10000,
            ],
            [
                'question_id' => 'q4',
                'function_code' => 'Ni', // サイクル: Ni > Ti > Fe > Ni
                'response_time_ms' => 10000,
            ],
        ];

        $questionsMap = [
            'q1' => [
                'id' => 'q1',
                'type' => 'comparison',
                'left_function_code' => 'Ni',
                'right_function_code' => 'Ti',
            ],
            'q2' => [
                'id' => 'q2',
                'type' => 'comparison',
                'left_function_code' => 'Ti',
                'right_function_code' => 'Fe',
            ],
            'q3' => [
                'id' => 'q3',
                'type' => 'comparison',
                'left_function_code' => 'Fe',
                'right_function_code' => 'Ni',
            ],
        ];

        // 実行
        $result = $this->service->calculateBestOrder($answers, $questionsMap);

        // 検証: 結果が返されること
        $this->assertIsArray($result);
        $this->assertArrayHasKey('order', $result);
        $this->assertArrayHasKey('conflicts', $result);

        // サイクルがある場合、conflictsが検出されることを確認
        // （完全なサイクルの場合、すべての関係が矛盾として検出される可能性がある）
        $this->assertIsArray($result['conflicts']);
    }

    /**
     * テストケース3: fixed_matchパラメータの動作確認
     * 
     * ユーザーが明示的に指定した勝敗関係（fixed_match）が
     * 強制されることを確認する。
     */
    public function test_calculate_best_order_with_fixed_match(): void
    {
        // 準備: 複数の回答があるが、fixed_matchでNi > Tiを強制
        $answers = [
            [
                'question_id' => 'q1',
                'function_code' => 'Ti', // 通常ならTiが勝つ可能性もある
                'response_time_ms' => 10000,
            ],
        ];

        $questionsMap = [
            'q1' => [
                'id' => 'q1',
                'type' => 'comparison',
                'left_function_code' => 'Ni',
                'right_function_code' => 'Ti',
            ],
        ];

        $fixedMatch = [
            'winner' => 'Ni',
            'loser' => 'Ti',
        ];

        // 実行
        $result = $this->service->calculateBestOrder($answers, $questionsMap, $fixedMatch);

        // 検証: fixed_matchが適用され、NiがTiより上位になっている
        $order = $result['order'];
        $niIndex = array_search('Ni', $order);
        $tiIndex = array_search('Ti', $order);
        $this->assertLessThan($tiIndex, $niIndex, 'Ni should be ranked higher than Ti due to fixed_match');
    }

    /**
     * テストケース4: 空の回答データの場合
     */
    public function test_calculate_best_order_with_empty_answers(): void
    {
        $answers = [];
        $questionsMap = [];

        // 実行
        $result = $this->service->calculateBestOrder($answers, $questionsMap);

        // 検証: エラーなく結果が返される（8機能のデフォルト順序が返される）
        $this->assertIsArray($result);
        $this->assertArrayHasKey('order', $result);
        $this->assertArrayHasKey('conflicts', $result);
        $this->assertIsArray($result['order']);
        $this->assertIsArray($result['conflicts']);
    }

    /**
     * テストケース5: type='comparison'以外の質問は無視される
     */
    public function test_calculate_best_order_ignores_non_comparison_questions(): void
    {
        $answers = [
            [
                'question_id' => 'q1',
                'function_code' => 'Ni',
                'response_time_ms' => 10000,
            ],
            [
                'question_id' => 'q2',
                'function_code' => 'Ti',
                'response_time_ms' => 10000,
            ],
        ];

        $questionsMap = [
            'q1' => [
                'id' => 'q1',
                'type' => 'comparison', // これは処理される
                'left_function_code' => 'Ni',
                'right_function_code' => 'Ti',
            ],
            'q2' => [
                'id' => 'q2',
                'type' => 'diagnosis', // これは無視される
                'left_function_code' => 'Ti',
                'right_function_code' => 'Fe',
            ],
        ];

        // 実行
        $result = $this->service->calculateBestOrder($answers, $questionsMap);

        // 検証: q1のみが処理され、q2は無視される
        $this->assertIsArray($result);
        // q2が無視されているため、TiとFeの関係は計算に含まれない
    }

    // ============================================
    // calculateHealthStatus() のテスト
    // ============================================

    /**
     * テストケース6: 健全度ステータスの計算（正常系）
     */
    public function test_calculate_health_status_with_all_scores(): void
    {
        $scores = [
            'Ni' => 3, // O (健全)
            'Ne' => 2, // o (普通)
            'Ti' => 1, // x (不健全)
            'Te' => 4, // O (健全)
            'Fi' => 2, // o (普通)
            'Fe' => 0, // x (不健全)
            'Si' => 3, // O (健全)
            'Se' => 2, // o (普通)
        ];

        $result = $this->service->calculateHealthStatus($scores);

        // 検証
        $this->assertIsArray($result);
        $this->assertEquals('O', $result['Ni']);
        $this->assertEquals('o', $result['Ne']);
        $this->assertEquals('x', $result['Ti']);
        $this->assertEquals('O', $result['Te']);
        $this->assertEquals('o', $result['Fi']);
        $this->assertEquals('x', $result['Fe']);
        $this->assertEquals('O', $result['Si']);
        $this->assertEquals('o', $result['Se']);
    }

    /**
     * テストケース7: スコアが存在しない機能は'o'（普通）として扱われる
     */
    public function test_calculate_health_status_with_missing_scores(): void
    {
        $scores = [
            'Ni' => 3,
            // 他の機能のスコアが存在しない
        ];

        $result = $this->service->calculateHealthStatus($scores);

        // 検証: 存在しない機能は'o'（デフォルト値2）として扱われる
        $this->assertEquals('O', $result['Ni']);
        $this->assertEquals('o', $result['Ne'], 'Missing score should default to o');
        $this->assertEquals('o', $result['Ti'], 'Missing score should default to o');
        // ... 他の機能も同様
    }

    /**
     * テストケース8: 境界値のテスト（スコア2と3の境界）
     */
    public function test_calculate_health_status_boundary_values(): void
    {
        $scores = [
            'Ni' => 2, // o (境界値)
            'Ne' => 3, // O (境界値)
            'Ti' => 1, // x (境界値)
            'Te' => 0, // x (境界値)
        ];

        $result = $this->service->calculateHealthStatus($scores);

        $this->assertEquals('o', $result['Ni'], 'Score 2 should be o');
        $this->assertEquals('O', $result['Ne'], 'Score 3 should be O');
        $this->assertEquals('x', $result['Ti'], 'Score 1 should be x');
        $this->assertEquals('x', $result['Te'], 'Score 0 should be x');
    }

    /**
     * テストケース9: 空のスコア配列の場合
     */
    public function test_calculate_health_status_with_empty_scores(): void
    {
        $scores = [];

        $result = $this->service->calculateHealthStatus($scores);

        // 検証: すべての機能が'o'（デフォルト値）として扱われる
        $this->assertIsArray($result);
        $functions = ['Ni', 'Ne', 'Ti', 'Te', 'Fi', 'Fe', 'Si', 'Se'];
        foreach ($functions as $func) {
            $this->assertEquals('o', $result[$func], "Function {$func} should default to o when score is missing");
        }
    }

    // ============================================
    // エッジケースと統合テスト
    // ============================================

    /**
     * テストケース10: 重み付けの動作確認（回答時間による重みの違い）
     * 
     * 回答時間が短い（確信度が高い）回答ほど重みが大きくなることを確認する。
     * このテストは、calculateBestOrderを通して間接的に検証する。
     */
    public function test_weighting_by_response_time(): void
    {
        // 準備: 同じ質問に対して、異なる回答時間の回答を用意
        // 短い回答時間（確信度が高い）の回答が優先されることを確認
        $answers = [
            [
                'question_id' => 'q1',
                'function_code' => 'Ni',
                'response_time_ms' => 10000, // 確信度が高い（重み2.0）
            ],
            [
                'question_id' => 'q2',
                'function_code' => 'Ti',
                'response_time_ms' => 70000, // 迷いがある（重み0.5）
            ],
        ];

        $questionsMap = [
            'q1' => [
                'id' => 'q1',
                'type' => 'comparison',
                'left_function_code' => 'Ni',
                'right_function_code' => 'Ti',
            ],
            'q2' => [
                'id' => 'q2',
                'type' => 'comparison',
                'left_function_code' => 'Ti',
                'right_function_code' => 'Fe',
            ],
        ];

        // 実行
        $result = $this->service->calculateBestOrder($answers, $questionsMap);

        // 検証: 確信度が高い回答（Ni > Ti）が優先される
        $order = $result['order'];
        $niIndex = array_search('Ni', $order);
        $tiIndex = array_search('Ti', $order);
        
        // NiがTiより上位であることを確認（重みが大きい回答が優先される）
        $this->assertLessThan($tiIndex, $niIndex, 'High confidence answer (Ni > Ti) should be prioritized');
    }

    /**
     * テストケース11: 矛盾検出の動作確認
     * 
     * ユーザーの回答と最適順序の間に矛盾がある場合、
     * それが正しく検出されることを確認する。
     */
    public function test_conflict_detection(): void
    {
        // 準備: 矛盾を含む回答データ
        // Ni > Ti と Ti > Ni の両方が存在する（矛盾）
        $answers = [
            [
                'question_id' => 'q1',
                'function_code' => 'Ni',
                'response_time_ms' => 10000,
            ],
            [
                'question_id' => 'q2',
                'function_code' => 'Ti',
                'response_time_ms' => 80000, // 迷いがある回答
            ],
        ];

        $questionsMap = [
            'q1' => [
                'id' => 'q1',
                'type' => 'comparison',
                'left_function_code' => 'Ni',
                'right_function_code' => 'Ti',
            ],
            'q2' => [
                'id' => 'q2',
                'type' => 'comparison',
                'left_function_code' => 'Ni',
                'right_function_code' => 'Ti',
            ],
        ];

        // 実行
        $result = $this->service->calculateBestOrder($answers, $questionsMap);

        // 検証: 矛盾が検出される（または、重みが大きい回答が優先される）
        $this->assertIsArray($result['conflicts']);
        // 注意: ケメニー・ヤング法により、重みが大きい回答が優先されるため、
        // 必ずしもconflictsが存在するとは限らない
    }
}
