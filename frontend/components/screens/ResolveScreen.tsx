"use client";

import { useEffect } from "react";
import { FunctionCode, CalculateResponse } from "@/types/oox";

type Props = {
  calculateResult: CalculateResponse;
  conflictBlock: FunctionCode[];
  resolvedBlock: FunctionCode[];
  onSelectOrder: (func: FunctionCode) => void;
  onReset: () => void;
  onConfirm: () => void;
  onDescribe: () => void;
};

export default function ResolveScreen({
  calculateResult,
  conflictBlock,
  resolvedBlock,
  onSelectOrder,
  onReset,
  onConfirm,
  onDescribe,
}: Props) {
  const targetBlock =
    conflictBlock.length > 0
      ? conflictBlock
      : (calculateResult.order.find((el) => Array.isArray(el)) as
          | FunctionCode[]
          | undefined);

  // もしブロックが見つからなければ次へ進む
  useEffect(() => {
    if (!targetBlock) {
      onDescribe();
    }
  }, [targetBlock, onDescribe]);

  if (!targetBlock) {
    return <div className="p-10 text-white">Loading...</div>;
  }

  const remainingFuncs = targetBlock.filter((f) => !resolvedBlock.includes(f));

  return (
    <div className="min-h-screen bg-gray-800 text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-lg w-full bg-gray-700 rounded-2xl p-8 shadow-2xl">
        <h2 className="text-2xl font-bold mb-2 text-yellow-400">⚡ 葛藤検出</h2>
        <p className="text-gray-300 mb-6">
          論理では順位をつけられませんでした。
          <br />
          あなたの感覚で、強いと思う順に選んでください。
        </p>

        {/* 1. 順位決定エリア */}
        <div className="space-y-2 mb-8 min-h-[150px]">
          {targetBlock.map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 p-3 bg-gray-800 rounded-lg border border-gray-600"
            >
              <span className="text-gray-500 font-mono w-6 text-right">
                {i + 1}.
              </span>
              {resolvedBlock[i] ? (
                <span className="text-xl font-bold text-blue-300 animate-pulse">
                  {resolvedBlock[i]}
                </span>
              ) : (
                <span className="text-gray-600 text-sm">
                  （下から選んでください）
                </span>
              )}
            </div>
          ))}
        </div>

        {/* 2. 選択肢ボタンエリア */}
        <div className="flex flex-wrap gap-3 justify-center mb-8">
          {remainingFuncs.map((func) => (
            <button
              key={func}
              onClick={() => onSelectOrder(func)}
              className="px-6 py-3 bg-white text-gray-900 rounded-full font-bold text-lg shadow-lg hover:bg-yellow-300 hover:scale-105 transition-all"
            >
              {func}
            </button>
          ))}
          {remainingFuncs.length === 0 && (
            <p className="text-green-400 font-bold">
              全ての順位が決まりました！
            </p>
          )}
        </div>

        {/* 3. アクションボタン */}
        <div className="flex gap-4">
          <button
            onClick={onReset}
            className="flex-1 py-3 rounded-xl border border-gray-500 text-gray-400 hover:bg-gray-600"
          >
            やり直す
          </button>
          <button
            onClick={onConfirm}
            disabled={remainingFuncs.length > 0}
            className={`flex-1 py-3 rounded-xl font-bold text-lg transition-all
              ${
                remainingFuncs.length > 0
                  ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/30"
              }
            `}
          >
            決定して次へ
          </button>
        </div>
      </div>
    </div>
  );
}
