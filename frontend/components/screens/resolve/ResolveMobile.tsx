"use client";

import Image from "next/image";

import { ResolveViewProps } from "./index";
import { FUNCTION_TEXT } from "@/constants/cells";

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
    <div className="min-h-screen w-full relative overflow-hidden flex items-center justify-center py-10">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{ backgroundImage: "url(/images/oox_background.png)" }}
      />
      <div className="absolute inset-0 bg-white/20 pointer-events-none" />

      <div className="relative z-10 w-full max-w-5xl px-4 md:px-8">
        <div className="text-center mb-8">
          <p className="text-xs font-semibold tracking-[0.25em] text-sky-500 uppercase mb-2">
            Resolve Conflict
          </p>
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-800 mb-3">
            どの細胞が、あなたの中で<strong>いちばん強い？</strong>
          </h1>
          <p className="text-sm md:text-base text-slate-600 leading-relaxed">
            同じくらい大事そうに見える細胞たちです。
            <br className="hidden md:block" />
            「自分の中でより強く働いている順」に、下のカードをタップして決めてください。
          </p>
        </div>

        <div className="grid md:grid-cols-[1.25fr_auto_1.4fr] gap-4 md:gap-8 items-center">
          <div className="flex flex-col gap-3">
            <p className="text-xs md:text-sm font-medium text-slate-600 mb-1">
              迷っている細胞たち
              <span className="ml-1 text-[11px] text-slate-400">
                （上から順番に選んでね）
              </span>
            </p>

            {remainingFuncs.length === 0 && (
              <p className="text-xs md:text-sm text-sky-700 bg-white/60 rounded-2xl px-4 py-3 shadow-sm">
                このブロックの順位はすべて決まりました！
              </p>
            )}

            <div className="flex flex-col gap-3">
              {remainingFuncs.map((func) => (
                <button
                  key={func}
                  onClick={() => onSelectOrder(func)}
                  className={`
                    relative w-full aspect-[3.8/1.3] rounded-[1.8rem] overflow-hidden shadow-md
                    transition-all duration-300 hover:-translate-y-1 hover:shadow-lg
                    active:scale-95
                  `}
                >
                  <Image
                    src="/images/oox_quiz_choice-lightBlue.png"
                    alt="Function card"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-sky-500/10 mix-blend-overlay" />

                  <div className="relative z-10 h-full flex flex-col justify-center items-center px-4 text-slate-700">
                    <span
                      className={`text-xs md:text-sm font-semibold mb-1 tracking-wide ${quicksandClassName}`}
                    >
                      {FUNCTION_TEXT[func]}
                    </span>
                    <span className="text-[11px] md:text-xs text-slate-600 opacity-80">
                      タップして順位を決める
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center gap-3">
            <p className="text-xs text-slate-500 mb-1">あなたの中の順位</p>
            <div className="flex flex-col items-center gap-2">
              {slots.map((slot, i) => (
                <div key={i} className="relative w-16 h-16 md:w-18 md:h-18">
                  <Image
                    src="/images/oox_resolve_bubble.png"
                    alt={`Rank ${i + 1} slot`}
                    fill
                    className="object-contain opacity-90 drop-shadow-sm"
                  />
                  <div className="absolute -left-7 top-1/2 -translate-y-1/2 text-[11px] text-slate-500 font-mono">
                    {i + 1}
                  </div>
                  {slot ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center px-1 gap-1">
                      <div className="relative w-8 h-8">
                        <Image
                          src="/images/oox_start_cell-lightBlue.png"
                          alt="Cell"
                          fill
                          className="object-contain"
                        />
                      </div>
                    </div>
                  ) : isSlotInCurrentBlock[i] ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[10px] text-slate-400">tap…</span>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center gap-4">
            <p className="text-xs md:text-sm text-slate-600 mb-1">
              バブルの中で、まだ順番待ちの細胞たち
            </p>
            <div className="relative w-52 h-52 md:w-64 md:h-64 flex items-center justify-center">
              <Image
                src="/images/oox_resolve_bubble.png"
                alt="Conflict bubble"
                fill
                className="object-contain opacity-90 drop-shadow-lg"
              />
              {remainingFuncs.length > 0 ? (
                <div className="absolute inset-8 flex items-center justify-center">
                  <div className="relative w-full h-full animate-[spin_16s_linear_infinite]">
                    {remainingFuncs.map((func, idx) => {
                      const angle =
                        (360 / remainingFuncs.length) * idx * (Math.PI / 180);
                      const radius = 40;
                      const x =
                        Math.round(Math.cos(angle) * radius * 100) / 100;
                      const y =
                        Math.round(Math.sin(angle) * radius * 100) / 100;
                      return (
                        <div
                          key={func}
                          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1"
                          style={{
                            transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                          }}
                        >
                          <div className="relative w-10 h-10">
                            <Image
                              src="/images/oox_start_cell-lightBlue.png"
                              alt="Cell"
                              fill
                              className="object-contain"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-xs md:text-sm text-sky-700 text-center px-4">
                    すべての細胞の順番が
                    <br />
                    決まりました！
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col md:flex-row gap-3 md:gap-4 justify-end">
          <button
            onClick={onReset}
            className="w-full md:w-40 py-2.5 rounded-full border border-sky-200 bg-white/70 text-slate-600 text-sm font-medium shadow-sm hover:bg-white hover:border-sky-300 transition-all"
          >
            やり直す
          </button>
          <button
            onClick={onConfirm}
            disabled={!allDecided}
            className={`w-full md:w-44 py-2.5 rounded-full text-sm font-semibold shadow-md transition-all
              ${
                allDecided
                  ? "bg-gradient-to-r from-sky-500 to-cyan-400 text-white hover:shadow-lg hover:from-sky-500 hover:to-cyan-500"
                  : "bg-slate-300/70 text-slate-500 cursor-not-allowed"
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
