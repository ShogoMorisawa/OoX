"use client";

import { useState } from "react";
import ResolveScreen from "@/components/screens/resolve";
import { CalculateResponse, FunctionCode } from "@/types/oox";

// モックデータ: 葛藤解決画面のスタイル確認用
// 新しい仕様では conflicts 配列を使用
const MOCK_CALCULATE_RESULT: CalculateResponse = {
  order: ["Ni", "Te", "Fi", "Se", "Ti", "Ne", "Fe", "Si"],
  conflicts: [
    {
      question_id: "test-1",
      user_winner: "Fi", // ユーザーが選んだ機能
      system_order_winner: "Se", // システムの順序では上位になっている機能
      response_time_ms: 45000, // 回答時間（長い = 迷った）
    },
  ],
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

export default function TestResolvePage() {
  const [resolvedBlock, setResolvedBlock] = useState<FunctionCode[]>([]);
  const [loading, setLoading] = useState(false);

  // 新しい仕様: conflictBlock は [system_order_winner, user_winner] の形式
  const conflictBlock: FunctionCode[] =
    MOCK_CALCULATE_RESULT.conflicts.length > 0
      ? [
          MOCK_CALCULATE_RESULT.conflicts[0].system_order_winner,
          MOCK_CALCULATE_RESULT.conflicts[0].user_winner,
        ]
      : [];

  const handleSelectOrder = (func: FunctionCode) => {
    // Resolve画面では1つだけ選択する想定
    if (resolvedBlock.includes(func)) {
      // 既に選択されている場合は解除
      setResolvedBlock([]);
    } else {
      // 新しく選択（既存の選択を上書き）
      setResolvedBlock([func]);
    }
  };

  const handleConfirmConflict = () => {
    console.log("決定ボタンがクリックされました（テスト用）");
    console.log("選択された勝者:", resolvedBlock[0]);
    setLoading(true);
    // テスト用のローディングシミュレーション
    setTimeout(() => {
      setLoading(false);
      console.log("再計算完了（テスト用）");
    }, 2000);
  };

  return (
    <div className="min-h-screen">
      <div className="fixed top-4 left-4 z-50 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg border border-slate-200">
        <p className="text-sm text-slate-600 font-medium">
          🧪 葛藤解決画面テストモード
        </p>
        <p className="text-xs text-slate-500 mt-1">
          スタイル確認用のモックデータで表示中
        </p>
        {resolvedBlock.length > 0 && (
          <p className="text-xs text-slate-500 mt-1">
            選択済み: {resolvedBlock[0]}
          </p>
        )}
      </div>
      <ResolveScreen
        conflictBlock={conflictBlock}
        resolvedBlock={resolvedBlock}
        handleSelectOrder={handleSelectOrder}
        handleConfirmConflict={handleConfirmConflict}
        loading={loading}
      />
    </div>
  );
}
