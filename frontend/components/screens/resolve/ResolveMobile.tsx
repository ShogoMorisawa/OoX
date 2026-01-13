"use client";

import Image from "next/image";

import { FUNCTION_TEXT } from "@/constants/cells";
import { getCellImage } from "@/constants/icons";
import type { FunctionCode } from "@/types/oox";

type ResolveViewProps = {
  remainingFuncs: FunctionCode[];
  slots: (FunctionCode | null)[];
  isSlotInCurrentBlock: boolean[];
  allDecided: boolean;
  onSelectOrder: (func: FunctionCode) => void;
  onReset: () => void;
  onConfirm: () => void;
  quicksandClassName: string;
};

export default function ResolveMobile({
  remainingFuncs,
  slots,
  isSlotInCurrentBlock,
  allDecided,
  onSelectOrder,
  onReset,
  onConfirm,
  quicksandClassName,
}: ResolveViewProps) {
  return (
    <div className="min-h-screen w-full relative overflow-hidden flex flex-col items-center py-6 px-4 md:py-10">
      {/* --- Background Layers --- */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{ backgroundImage: "url(/images/oox_background.png)" }}
      />
      <div className="absolute inset-0 bg-white/30 pointer-events-none" />

      {/* --- Main Content Container --- */}
      <div className="relative z-10 w-full max-w-lg flex flex-col h-full">
        {/* 1. Header Area */}
        <div className="text-center mb-6 md:mb-8 shrink-0">
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 mb-2 leading-snug">
            どの細胞が、
            <br className="block xs:hidden" />
            あなたの中で<strong>いちばん強い？</strong>
          </h1>
          <p className="text-xs md:text-sm text-slate-600 leading-relaxed opacity-90">
            「自分の中でより強く働いている順」に、
            <br />
            下のカードをタップして決めてください。
          </p>
        </div>

        {/* 2. Game Area (Grid) */}
        <div className="relative w-full flex-1">
          {/* Interactive Grid (2 Columns: Cards | Slots) */}
          <div className="relative z-10 grid grid-cols-[1fr_auto] gap-3 items-center min-h-[300px]">
            {/* Left Column: Choices (Cards) */}
            <div className="flex flex-col gap-3">
              <p className="text-xs font-bold text-slate-500 pl-1">
                選ぶ細胞
                <span className="ml-2 font-normal text-[10px] text-slate-400">
                  (当てはまる順に選んでね)
                </span>
              </p>

              {remainingFuncs.length === 0 && (
                <div className="text-sm text-sky-700 bg-white/80 backdrop-blur-sm rounded-xl px-4 py-4 shadow-sm border border-sky-100 text-center">
                  <p className="font-bold mb-1">決定済み！</p>
                  <p className="text-xs opacity-80">下のボタンで次へ</p>
                </div>
              )}

              <div className="flex flex-col gap-2.5">
                {remainingFuncs.map((func) => (
                  <button
                    key={func}
                    onClick={() => onSelectOrder(func)}
                    className="group relative w-full h-[3.8rem] md:h-16 rounded-2xl overflow-hidden shadow-sm border border-white/50
                               transition-all duration-200 active:scale-95 active:shadow-inner"
                  >
                    <Image
                      src="/images/oox_quiz_choice-lightBlue.png"
                      alt="bg"
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-white/20 group-hover:bg-white/0 transition-colors" />

                    <div className="relative z-10 h-full flex items-center justify-between px-5">
                      <span
                        className={`text-sm md:text-base font-bold text-slate-700 tracking-wide ${quicksandClassName}`}
                      >
                        {FUNCTION_TEXT[func]}
                      </span>
                      <span className="text-[10px] text-sky-600/70 bg-white/50 px-2 py-0.5 rounded-full">
                        Tap
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column: Slots (Ranks) */}
            <div className="flex flex-col items-center gap-2 pt-6">
              <p className="text-[10px] text-slate-500 mb-1">順位</p>
              <div className="flex flex-col gap-2 bg-white/30 p-2 rounded-[2rem]">
                {slots.map((slot, i) => (
                  <div
                    key={i}
                    className="relative w-14 h-14 md:w-16 md:h-16 shrink-0"
                  >
                    <Image
                      src="/images/oox_resolve_bubble.png"
                      alt={`Rank ${i + 1}`}
                      fill
                      className="object-contain opacity-90"
                    />
                    {/* Rank Number Badge */}
                    <div className="absolute -left-1 top-0 bg-sky-100 text-sky-600 text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border border-white shadow-sm z-20">
                      {i + 1}
                    </div>

                    {/* Content inside Slot */}
                    <div className="absolute inset-0 flex items-center justify-center p-1 z-10">
                      {slot ? (
                        <div className="relative w-8 h-8 animate-[popIn_0.3s_ease-out]">
                          <Image
                            src={getCellImage(slot)}
                            alt="Cell"
                            fill
                            className="object-contain"
                          />
                        </div>
                      ) : isSlotInCurrentBlock[i] ? (
                        <div className="w-2 h-2 bg-sky-400/30 rounded-full animate-pulse" />
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 3. Footer Actions */}
        <div className="mt-8 flex gap-3 shrink-0 pb-4">
          <button
            onClick={onReset}
            className="flex-1 py-3 rounded-full border border-sky-200 bg-white/60 text-slate-600 text-sm font-bold shadow-sm active:bg-slate-100 transition-colors"
          >
            リセット
          </button>
          <button
            onClick={onConfirm}
            disabled={!allDecided}
            className={`flex-[2] py-3 rounded-full text-sm font-bold shadow-md transition-all
              ${
                allDecided
                  ? "bg-gradient-to-r from-sky-500 to-cyan-400 text-white shadow-sky-200 hover:shadow-lg active:scale-95"
                  : "bg-slate-300 text-slate-500 cursor-not-allowed opacity-70"
              }
            `}
          >
            決定する
          </button>
        </div>
      </div>
    </div>
  );
}
