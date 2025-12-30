"use client";

import { useState } from "react";
import ResolveContainer from "@/components/screens/resolve";
import { CalculateResponse, FunctionCode } from "@/types/oox";

// モックデータ: 葛藤解決画面のスタイル確認用
// 3つの機能が葛藤ブロック（配列）になっている
const MOCK_CALCULATE_RESULT: CalculateResponse = {
  order: [
    "Ni",
    "Te",
    ["Fi", "Se", "Ti"], // 葛藤ブロック（3つの機能が同じ強さ）
    "Ne",
    "Fe",
    "Si",
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

  // 葛藤ブロックを抽出（最初の配列要素）
  const conflictBlock: FunctionCode[] =
    (MOCK_CALCULATE_RESULT.order.find((el) =>
      Array.isArray(el)
    ) as FunctionCode[]) || [];

  const handleSelectOrder = (func: FunctionCode) => {
    if (resolvedBlock.includes(func)) return;
    setResolvedBlock([...resolvedBlock, func]);
  };

  const handleReset = () => {
    setResolvedBlock([]);
  };

  const handleConfirm = () => {
    console.log("決定ボタンがクリックされました（テスト用）");
    console.log("解決された順序:", resolvedBlock);
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
            選択済み: {resolvedBlock.join(", ")}
          </p>
        )}
      </div>
      <ResolveContainer
        calculateResult={MOCK_CALCULATE_RESULT}
        conflictBlock={conflictBlock}
        resolvedBlock={resolvedBlock}
        onSelectOrder={handleSelectOrder}
        onReset={handleReset}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
