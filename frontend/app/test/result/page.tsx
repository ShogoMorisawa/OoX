"use client";

import ResultContainer from "@/components/screens/result";
import { CalculateResponse, DescribeResponse } from "@/types/oox";

// モックデータ: 結果画面のスタイル確認用
const MOCK_CALCULATE_RESULT: CalculateResponse = {
  order: ["Ni", "Te", "Fi", "Se", "Ti", "Ne", "Fe", "Si"],
  conflicts: [],
  health: {
    Ni: "O",
    Ne: "o",
    Ti: "O",
    Te: "O",
    Fi: "o",
    Fe: "x",
    Si: "x",
    Se: "o",
  },
};

const MOCK_DESCRIBE_RESULT: DescribeResponse = {
  title: "未来を紡ぐ直感の探求者",
  description: `あなたは、未来への洞察と論理的な思考を武器に、世界を理解し、変革していくタイプです。

主導機能であるNi（内的直感）が、あなたの思考の中心にあります。これは、パターンを見出し、未来の可能性を直感的に把握する力です。あなたは、表面的な情報の奥にある本質的な意味や、時間を超えた物語の流れを感じ取ることができます。

第二機能のTe（外的思考）は、あなたの行動を支えます。効率性と結果を重視し、目標達成のために論理的に行動を組み立てます。この組み合わせにより、あなたは「未来を見据えながら、今この瞬間を戦略的に動かす」ことができるのです。

第三機能のFi（内的感情）は、あなたの価値観の核です。自分自身の本音や、本当に大切にしたい気持ちを守るために働きます。時には、論理的な判断よりも、自分の内なる声に従うことが、あなたにとって最も重要な選択となるでしょう。

あなたの精神構造は、直感と論理、そして内なる価値観が調和した、独特の世界観を形成しています。未来への洞察力と、それを実現するための戦略性、そして自分自身の価値観を大切にする姿勢が、あなたの強みです。`,
};

export default function TestResultPage() {
  const handleGoToWorld = () => {
    console.log("世界画面へ移動（テスト用）");
    // 実際のナビゲーションは実装しない
  };

  return (
    <div className="min-h-screen">
      <div className="fixed top-4 left-4 z-50 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg border border-slate-200">
        <p className="text-sm text-slate-600 font-medium">
          🧪 結果画面テストモード
        </p>
        <p className="text-xs text-slate-500 mt-1">
          スタイル確認用のモックデータで表示中
        </p>
      </div>
      <ResultContainer
        calculateResult={MOCK_CALCULATE_RESULT}
        describeResult={MOCK_DESCRIBE_RESULT}
        onGoToWorld={handleGoToWorld}
      />
    </div>
  );
}
