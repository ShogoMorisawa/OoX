"use client";

import { useState } from "react";
import { CELL_COLORS } from "@/constants/cells";

type Props = {
  onStart: () => void;
};

export default function StartScreen({ onStart }: Props) {
  const [cells] = useState<string[]>(() => {
    const shuffledCellColors = [...Object.values(CELL_COLORS)];
    for (let i = shuffledCellColors.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledCellColors[i], shuffledCellColors[j]] = [
        shuffledCellColors[j],
        shuffledCellColors[i],
      ];
    }
    return shuffledCellColors.slice(0, 2);
  });

  if (cells.length === 0) return null;

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white overflow-hidden relative">
      {/* 背景の装飾（気泡） */}
      <div className="absolute top-20 left-10 w-4 h-4 bg-blue-200 rounded-full opacity-50 animate-float-fast"></div>
      <div className="absolute bottom-40 right-20 w-8 h-8 bg-blue-100 rounded-full opacity-60 animate-float-slow"></div>

      {/* タイトル */}
      <h1 className="text-5xl font-light tracking-widest text-gray-800 mb-10 z-10 font-sans">
        OoX
      </h1>

      {/* 培養ポッド (Glassmorphism) */}
      <div className="relative w-64 h-80 rounded-[3rem] border border-white/60 bg-white/30 backdrop-blur-md shadow-xl flex items-center justify-center mb-12 overflow-hidden ring-1 ring-blue-100">
        {/* ポッド内の液体感 */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-blue-50/50 pointer-events-none"></div>

        {/* 細胞1 (左上) */}
        <div
          className={`absolute w-16 h-16 rounded-full ${cells[0]} opacity-80 shadow-lg blur-[1px] animate-float-medium top-20 left-12 mix-blend-multiply`}
        >
          {/* 目のパーツ (あえてシンプルに) */}
          <div className="absolute top-4 left-4 w-2 h-2 bg-white rounded-full opacity-80"></div>
          <div className="absolute top-4 right-4 w-2 h-2 bg-white rounded-full opacity-80"></div>
        </div>

        {/* 細胞2 (右下) */}
        <div
          className={`absolute w-14 h-14 rounded-full ${cells[1]} opacity-80 shadow-lg blur-[1px] animate-float-slow bottom-24 right-14 mix-blend-multiply`}
        >
          <div className="absolute top-3 left-3 w-1.5 h-1.5 bg-white rounded-full opacity-80"></div>
          <div className="absolute top-3 right-3 w-1.5 h-1.5 bg-white rounded-full opacity-80"></div>
        </div>

        {/* 光の反射 */}
        <div className="absolute top-4 left-4 w-56 h-72 rounded-[2.5rem] border-t border-l border-white/80 opacity-50 pointer-events-none"></div>
      </div>

      {/* メッセージ */}
      <p className="text-gray-500 text-sm mb-8 tracking-wide font-medium">
        質問に答えてあなたのキャラを生み出そう！
      </p>

      {/* STARTボタン */}
      <button
        onClick={onStart}
        className="px-12 py-4 rounded-full bg-blue-400 text-white font-bold text-lg shadow-lg shadow-blue-200 hover:bg-blue-500 hover:scale-105 transition-all active:scale-95"
      >
        START
      </button>
    </div>
  );
}
