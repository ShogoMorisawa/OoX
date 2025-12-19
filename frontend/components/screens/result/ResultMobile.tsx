"use client";

import Image from "next/image";

import { ResultViewProps } from "./index";

export default function ResultPC({
  describeResult,
  onGoToWorld,
}: ResultViewProps) {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 py-12 bg-cover bg-center"
      style={{ backgroundImage: "url('/images/oox_background.png')" }}
    >
      {/* アイコン */}
      <div className="w-full max-w-3xl flex flex-col items-center gap-10">
        <div className="relative flex items-center justify-center w-72 h-72">
          <div className="absolute inset-0 bg-white/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute inset-[-24px] rounded-full border border-white/20 blur-[1px]" />
          <div className="absolute inset-[-12px] rounded-full border border-white/40 blur-[0.5px]" />
          <div className="absolute inset-0 rounded-full shadow-[0_0_40px_rgba(255,255,255,0.8)]" />

          <div className="relative z-10 w-full h-full rounded-full overflow-hidden">
            <Image
              src="/images/oox_start_cell-red.png"
              alt="Your Archetype"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* タイトル */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold tracking-wide text-sky-900 drop-shadow-sm">
            {describeResult.title}
          </h1>
        </div>

        {/* 説明（長文対応：中だけスクロール） */}
        <div className="w-full max-w-2xl">
          <div className="relative rounded-[28px] border border-white/40 bg-white/35 backdrop-blur-xl shadow-[0_18px_60px_rgba(60,140,180,0.25)] overflow-hidden">
            {/* 内側のハイライト（泡っぽい艶） */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -top-10 -left-10 w-56 h-56 rounded-full bg-white/35 blur-2xl" />
              <div className="absolute top-6 left-6 w-20 h-20 rounded-full bg-white/25 blur-xl" />
              <div className="absolute bottom-0 right-0 w-64 h-40 rounded-full bg-sky-200/20 blur-2xl" />
              <div className="absolute inset-0 rounded-[28px] ring-1 ring-white/25" />
            </div>

            {/* スクロール領域 */}
            <div
              className="relative z-10 px-8 py-7 text-sky-900 text-sm md:text-base leading-relaxed text-left max-h-[38vh] md:max-h-[34vh] overflow-y-auto"
              style={{
                WebkitMaskImage:
                  "linear-gradient(to bottom, black 88%, transparent 100%)",
                maskImage:
                  "linear-gradient(to bottom, black 88%, transparent 100%)",
              }}
            >
              <p className="whitespace-pre-wrap">
                {describeResult.description}
              </p>
            </div>

            {/* 下部フェードを補強（見た目用） */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-b from-transparent to-white/35" />
          </div>
        </div>

        {/* ボタン */}
        <button
          onClick={onGoToWorld}
          className="relative w-64 h-14 transition-transform hover:scale-105 active:scale-95"
        >
          <Image
            src="/images/oox_result_button-with-letter.png"
            alt="Go to World"
            fill
            sizes="256px"
            className="object-contain"
          />
        </button>
      </div>
    </div>
  );
}
