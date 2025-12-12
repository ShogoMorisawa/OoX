"use client";

import { useEffect, useMemo } from "react";
import Image from "next/image";
import { Quicksand } from "next/font/google";
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

const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const SLOT_COUNT = 8;

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

  // 全体の順位構造を8スロットに配置（Hooksは条件分岐の前に配置）
  const slots: (FunctionCode | null)[] = useMemo(() => {
    const arr: (FunctionCode | null)[] = Array(SLOT_COUNT).fill(null);
    let slotIndex = 0;

    for (const element of calculateResult.order) {
      if (slotIndex >= SLOT_COUNT) break;

      if (typeof element === "string") {
        // 確定済みの要素（例: "Ni", "Ti"）
        arr[slotIndex] = element;
        slotIndex++;
      } else if (Array.isArray(element)) {
        // 葛藤ブロック（例: ["Ne", "Si", "Se"]）
        const block = element as FunctionCode[];
        const isCurrentBlock = targetBlock && block === targetBlock;

        if (isCurrentBlock) {
          // 現在解決中のブロック: resolvedBlockの内容を配置
          for (let i = 0; i < block.length && slotIndex < SLOT_COUNT; i++) {
            arr[slotIndex] = resolvedBlock[i] ?? null;
            slotIndex++;
          }
        } else {
          // 未解決のブロック: 空欄のままスロットを進める
          slotIndex += block.length;
        }
      }
    }

    return arr;
  }, [calculateResult.order, targetBlock, resolvedBlock]);

  // 選択可能な残りの関数コード（targetBlockからresolvedBlockを除いたもの）
  const remainingFuncs = useMemo(() => {
    if (!targetBlock) return [];
    return targetBlock.filter((f) => !resolvedBlock.includes(f));
  }, [targetBlock, resolvedBlock]);

  // 各スロットが現在解決中のブロック内かどうかを判定
  const isSlotInCurrentBlock = useMemo(() => {
    const result: boolean[] = Array(SLOT_COUNT).fill(false);
    let currentSlotIndex = 0;

    for (const element of calculateResult.order) {
      if (currentSlotIndex >= SLOT_COUNT) break;

      if (typeof element === "string") {
        currentSlotIndex++;
      } else if (Array.isArray(element)) {
        const block = element as FunctionCode[];
        const isCurrentBlock = targetBlock && block === targetBlock;
        const blockLength = block.length;

        if (isCurrentBlock) {
          for (
            let i = 0;
            i < blockLength && currentSlotIndex + i < SLOT_COUNT;
            i++
          ) {
            result[currentSlotIndex + i] = true;
          }
        }
        currentSlotIndex += blockLength;
      }
    }

    return result;
  }, [calculateResult.order, targetBlock]);

  const allDecided = remainingFuncs.length === 0;

  // もしブロックが見つからなければ次へ進む
  useEffect(() => {
    if (!targetBlock) {
      onDescribe();
    }
  }, [targetBlock, onDescribe]);

  if (!targetBlock) {
    return <div className="p-10 text-white">Loading...</div>;
  }

  return (
    <div className="min-h-screen w-full relative overflow-hidden flex items-center justify-center py-10">
      {/* 背景 */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{ backgroundImage: "url(/images/oox_background.png)" }}
      />
      <div className="absolute inset-0 bg-white/20 pointer-events-none" />

      {/* コンテンツ */}
      <div className="relative z-10 w-full max-w-5xl px-4 md:px-8">
        {/* ヘッダー */}
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
            「自分の中でより強く働いている順」に、左のカードをタップして決めてください。
          </p>
        </div>

        {/* メイン 3 カラムレイアウト */}
        <div className="grid md:grid-cols-[1.25fr_auto_1.4fr] gap-4 md:gap-8 items-center">
          {/* 左：カード（葛藤中の細胞たち） */}
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
                  {/* カード背景 */}
                  <Image
                    src="/images/oox_quiz_choice-lightBlue.png"
                    alt="Function card"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-sky-500/10 mix-blend-overlay" />

                  {/* ラベル */}
                  <div className="relative z-10 h-full flex flex-col justify-center items-center px-4 text-slate-700">
                    <span
                      className={`text-xs md:text-sm font-semibold mb-1 tracking-wide ${quicksand.className}`}
                    >
                      {func}
                    </span>
                    <span className="text-[11px] md:text-xs text-slate-600 opacity-80">
                      タップして順位を決める
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 中央：スロット（1〜8位） */}
          <div className="flex flex-col items-center gap-3">
            <p className="text-xs text-slate-500 mb-1">あなたの中の順位</p>
            <div className="flex flex-col items-center gap-2">
              {slots.map((slot, i) => (
                <div key={i} className="relative w-16 h-16 md:w-18 md:h-18">
                  {/* バブル背景 */}
                  <Image
                    src="/images/oox_resolve_bubble.png"
                    alt={`Rank ${i + 1} slot`}
                    fill
                    className="object-contain opacity-90 drop-shadow-sm"
                  />
                  {/* 順位ラベル */}
                  <div className="absolute -left-7 top-1/2 -translate-y-1/2 text-[11px] text-slate-500 font-mono">
                    {i + 1}
                  </div>
                  {/* 中身 */}
                  {slot ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-semibold text-sky-800">
                        {slot}
                      </span>
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

          {/* 右：ぐるぐるバブル */}
          <div className="flex flex-col items-center gap-4">
            <p className="text-xs md:text-sm text-slate-600 mb-1">
              バブルの中で、まだ順番待ちの細胞たち
            </p>
            <div className="relative w-52 h-52 md:w-64 md:h-64 flex items-center justify-center">
              {/* 大きなバブル */}
              <Image
                src="/images/oox_resolve_bubble.png"
                alt="Conflict bubble"
                fill
                className="object-contain opacity-90 drop-shadow-lg"
              />
              {/* 中のセルたち */}
              {remainingFuncs.length > 0 ? (
                <div className="absolute inset-8 flex items-center justify-center">
                  <div className="relative w-full h-full animate-[spin_16s_linear_infinite]">
                    {remainingFuncs.map((func, idx) => {
                      const angle =
                        (360 / remainingFuncs.length) * idx * (Math.PI / 180);
                      const radius = 40;
                      const x = Math.cos(angle) * radius;
                      const y = Math.sin(angle) * radius;
                      return (
                        <div
                          key={func}
                          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                          style={{
                            transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                          }}
                        >
                          <div className="px-3 py-1 rounded-full bg-white/80 text-[10px] md:text-xs text-sky-700 shadow-sm">
                            {func}
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

        {/* ボタン行 */}
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
