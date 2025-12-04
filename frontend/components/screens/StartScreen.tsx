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
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-b from-sky-50 via-sky-50/60 to-sky-100 relative overflow-hidden">
      {/* 背景の薄い気泡たち */}
      <div className="pointer-events-none absolute inset-0">
        <span className="absolute left-10 top-32 w-4 h-4 rounded-full bg-sky-100 opacity-70 animate-float-slow" />
        <span className="absolute right-16 top-52 w-6 h-6 rounded-full bg-sky-100 opacity-60 animate-float-medium" />
        <span className="absolute left-1/4 bottom-24 w-3 h-3 rounded-full bg-sky-100 opacity-50 animate-float-fast" />
        <span className="absolute right-1/5 bottom-32 w-8 h-8 rounded-full bg-sky-100 opacity-60 animate-float-slow" />
      </div>

      {/* タイトル */}
      <h1 className="relative text-6xl md:text-7xl font-light tracking-[0.3em] text-slate-800 mb-10">
        OoX
      </h1>

      {/* ポッド全体 */}
      <div className="relative mb-12">
        {/* ぼんやりした外側の光輪 */}
        <div className="absolute -inset-6 rounded-[3rem] bg-sky-200/40 blur-2xl" />

        {/* ガラスカプセル本体 */}
        <div className="relative w-72 h-96 md:w-80 md:h-[420px] rounded-[3rem] bg-white/40 border border-white/60 shadow-xl shadow-sky-200/80 backdrop-blur-2 overflow-hidden flex items-center justify-center">
          {/* 内側のグラデーション（液体っぽさ） */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-sky-50/80 to-sky-100/70" />

          {/* 反射ハイライト */}
          <div className="absolute -left-6 top-3 w-40 h-72 rounded-full bg-white/50 blur-xl opacity-80 rotate-[-18deg]" />
          <div className="absolute right-0 bottom-6 w-32 h-32 rounded-full bg-white/30 blur-2xl opacity-70" />

          {/* ポッド内の小さな気泡 */}
          <div className="absolute inset-0 pointer-events-none">
            <span className="absolute left-16 top-24 w-2 h-2 rounded-full bg-white/70 opacity-70 animate-float-slow" />
            <span className="absolute right-16 top-40 w-3 h-3 rounded-full bg-white/70 opacity-60 animate-float-medium" />
            <span className="absolute left-24 bottom-24 w-2 h-2 rounded-full bg-white/70 opacity-60 animate-float-fast" />
          </div>

          {/* 細胞1 */}
          <div
            className={`relative z-10 w-20 h-20 rounded-full ${cells[0]} shadow-lg shadow-sky-200/70 animate-float-medium flex items-center justify-center`}
          >
            <div className="relative w-12 h-7 flex justify-between">
              <span className="w-4 h-4 rounded-full bg-white shadow-sm">
                <span className="block w-2.5 h-2.5 mt-1 ml-1 rounded-full bg-slate-900" />
              </span>
              <span className="w-4 h-4 rounded-full bg-white shadow-sm">
                <span className="block w-2.5 h-2.5 mt-1 ml-1 rounded-full bg-slate-900" />
              </span>
            </div>
          </div>

          {/* 細胞2 */}
          <div
            className={`absolute bottom-16 right-16 w-18 h-18 rounded-full ${cells[1]} shadow-lg shadow-sky-200/70 animate-float-slow flex items-center justify-center`}
          >
            <div className="relative w-11 h-6 flex justify-between">
              <span className="w-3.5 h-3.5 rounded-full bg-white shadow-sm">
                <span className="block w-2 h-2 mt-[3px] ml-[3px] rounded-full bg-slate-900" />
              </span>
              <span className="w-3.5 h-3.5 rounded-full bg-white shadow-sm">
                <span className="block w-2 h-2 mt-[3px] ml-[3px] rounded-full bg-slate-900" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 説明文 */}
      <p className="relative text-slate-500 text-sm md:text-base mb-8 tracking-wide">
        質問に答えてあなたのキャラを生み出そう！
      </p>

      {/* START */}
      <button
        onClick={onStart}
        className="relative px-16 py-4 rounded-full bg-sky-400 text-white font-semibold text-lg shadow-lg shadow-sky-300/70 hover:bg-sky-500 hover:shadow-sky-400/60 hover:-translate-y-0.5 transition-all active:translate-y-0"
      >
        START
      </button>
    </div>
  );
}
