"use client";

import Image from "next/image";
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
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-b from-sky-50 via-sky-100/50 to-sky-200/30 relative overflow-hidden">
      {/* 1. 背景の装飾（CSSで作る薄い光の玉） */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-10 top-32 w-32 h-32 rounded-full bg-sky-200 mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
        <div className="absolute right-10 bottom-32 w-32 h-32 rounded-full bg-pink-200 mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
      </div>

      {/* 2. タイトル */}
      <h1 className="relative z-10 text-6xl md:text-7xl font-light tracking-[0.2em] text-slate-700 mb-6 drop-shadow-sm">
        OoX
      </h1>

      {/* 3. メインビジュアル（カプセルと細胞） */}
      <div className="relative z-10 mb-10 w-[300px] h-[380px] flex items-center justify-center">
        {/* レイヤーA: カプセルの背後の光（ぼんやり光らせる） */}
        <div className="absolute inset-8 bg-sky-300/20 rounded-[4rem] blur-2xl" />

        {/* レイヤーB: 中身の細胞たち（画像をアニメーションさせる） */}
        <div className="absolute inset-0 z-20 overflow-hidden rounded-[3.5rem]">
          <div className="relative w-full h-full">
            {/* 赤い細胞 */}
            <div className="absolute top-[25%] left-[20%] w-24 h-24 animate-float-medium">
              <Image
                src="/images/oox_start_cell-red.png"
                alt="Red Cell"
                width={120}
                height={120}
                className="object-contain drop-shadow-md"
              />
            </div>

            {/* 青い細胞 */}
            <div className="absolute bottom-[25%] right-[15%] w-20 h-20 animate-float-slow">
              <Image
                src="/images/oox_start_cell-lightBlue.png"
                alt="Blue Cell"
                width={100}
                height={100}
                className="object-contain drop-shadow-md"
              />
            </div>
          </div>
        </div>

        {/* レイヤーC: カプセル本体（ガラス） */}
        {/* pointer-events-none にすることで、上の画像があってもクリックを邪魔しないようにする */}
        <div className="relative z-10 w-full h-full pointer-events-none">
          <Image
            src="/images/oox_start_pod.png"
            alt="Glass Pod"
            fill
            className="object-contain" // アスペクト比を維持して枠に収める
            priority // 最初に読み込む
          />
        </div>
      </div>

      {/* 4. 説明文とボタン */}
      <p className="relative z-10 text-slate-500 text-sm md:text-base mb-8 tracking-wide font-medium">
        質問に答えてあなたのキャラを生み出そう！
      </p>

      <button
        onClick={onStart}
        className="relative z-10 px-16 py-4 rounded-full bg-sky-400 text-white font-bold text-lg shadow-lg shadow-sky-300/50 hover:bg-sky-500 hover:shadow-sky-400/60 hover:-translate-y-0.5 transition-all active:translate-y-0"
      >
        START
      </button>
    </div>
  );
}
