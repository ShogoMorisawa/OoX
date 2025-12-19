"use client";

import { useState } from "react";
import HierarchyScreenContainer from "@/components/screens/hierarchy";
import { CalculateResponse } from "@/types/oox";

// モックデータ: 階層画面のスタイル確認用
const MOCK_CALCULATE_RESULT: CalculateResponse = {
  order: ["Ni", "Te", "Fi", "Se", "Ti", "Ne", "Fe", "Si"],
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

export default function TestHierarchyPage() {
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  // ダミーハンドラー（実際の処理はしない）
  const handleUpdateTier = () => {
    // テスト用なので何もしない
  };

  const handleConfirmHierarchy = () => {
    console.log("決定ボタンがクリックされました（テスト用）");
    setLoading(true);
    setLoadingMessage("テスト中...");
    setTimeout(() => {
      setLoading(false);
      setLoadingMessage("");
    }, 2000);
  };

  return (
    <div className="min-h-screen">
      <div className="fixed top-4 left-4 z-50 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg border border-slate-200">
        <p className="text-sm text-slate-600 font-medium">
          🧪 階層画面テストモード
        </p>
        <p className="text-xs text-slate-500 mt-1">
          スタイル確認用のモックデータで表示中
        </p>
      </div>
      <HierarchyScreenContainer
        calculateResult={MOCK_CALCULATE_RESULT}
        tierMap={{}}
        loading={loading}
        loadingMessage={loadingMessage}
        onUpdateTier={handleUpdateTier}
        onConfirmHierarchy={handleConfirmHierarchy}
      />
    </div>
  );
}
