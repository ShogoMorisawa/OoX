// components/screens/mobile/HierarchyScreen.tsx
"use client";

import { useMemo, useState } from "react";
import { FunctionCode, CalculateResponse, Tier } from "@/types/oox";

type Props = {
  calculateResult: CalculateResponse;
  tierMap: Partial<Record<FunctionCode, Tier>>;
  loading: boolean;
  loadingMessage: string;
  onUpdateTier: (func: FunctionCode, tier: Tier) => void;
  onConfirmHierarchy: () => void;
};

const TIER_LABELS: Record<string, string> = {
  Dominant: "王",
  High: "騎",
  Middle: "市",
  Low: "迷",
};

export default function MobileHierarchyScreen({
  calculateResult,
  tierMap,
  loading,
  loadingMessage,
  onConfirmHierarchy,
}: Props) {
  // order をフラットにして 8 つの心理機能を取得
  const finalOrder = useMemo(
    () => (calculateResult.order.flat() as FunctionCode[]).slice(0, 8),
    [calculateResult.order]
  );

  // healthStatus を計算（useOoX と同じロジック）
  const healthStatus = useMemo(() => {
    const hs: Record<FunctionCode, "O" | "o" | "x"> = {} as Record<
      FunctionCode,
      "O" | "o" | "x"
    >;
    finalOrder.forEach((func, index) => {
      hs[func] = index % 3 === 0 ? "O" : index % 3 === 1 ? "o" : "x";
    });
    return hs;
  }, [finalOrder]);

  const [selected, setSelected] = useState<FunctionCode | null>(
    finalOrder[0] ?? null
  );

  const selectedTier = selected ? tierMap[selected] : null;
  const selectedTierLabel = selectedTier
    ? TIER_LABELS[selectedTier] ?? selectedTier
    : null;
  const selectedHealth = selected ? healthStatus[selected] : null;

  // 並びは order に合わせる（＝ユーザーが確定した最終順）
  const list = finalOrder;

  return (
    <div className="min-h-screen px-4 py-6">
      {/* 上：階層ラベル（固定表示） */}
      <div className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3">
        <div className="text-sm text-gray-500">階層</div>
        <div className="flex gap-2 text-sm">
          <span className="rounded-full border px-3 py-1">王</span>
          <span className="rounded-full border px-3 py-1">騎</span>
          <span className="rounded-full border px-3 py-1">市</span>
          <span className="rounded-full border px-3 py-1">迷</span>
        </div>
      </div>

      {/* 中：8細胞（縦） */}
      <div className="mt-4 space-y-2">
        {list.map((fn) => {
          const isActive = fn === selected;
          const tier = tierMap[fn];
          const tierLabel = tier ? TIER_LABELS[tier] ?? tier : "";
          const hs = healthStatus[fn];

          return (
            <button
              key={fn}
              type="button"
              onClick={() => setSelected(fn)}
              className={[
                "w-full rounded-xl border px-4 py-4 text-left",
                isActive ? "border-black" : "border-gray-200",
              ].join(" ")}
            >
              <div className="flex items-center justify-between">
                <div className="text-lg font-semibold">{fn}</div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full border px-2 py-1 text-xs">
                    {tierLabel}
                  </span>
                  <span className="rounded-full border px-2 py-1 text-xs">
                    {hs}
                  </span>
                </div>
              </div>

              <div className="mt-1 text-sm text-gray-500">
                タップで説明を表示
              </div>
            </button>
          );
        })}
      </div>

      {/* 下：固定バブル（説明エリア） */}
      <div className="sticky bottom-4 mt-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          {!selected ? (
            <div className="text-sm text-gray-500">
              細胞をタップしてください
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-base font-semibold">{selected}</div>
                <div className="flex gap-2 text-xs">
                  {selectedTierLabel && (
                    <span className="rounded-full border px-2 py-1">
                      {selectedTierLabel}
                    </span>
                  )}
                  {selectedHealth && (
                    <span className="rounded-full border px-2 py-1">
                      {selectedHealth}
                    </span>
                  )}
                </div>
              </div>

              {/* TODO: ここに “機能説明テキスト” を差し込む */}
              <div className="text-sm text-gray-700">
                （ここに説明文。まずは仮でOK）
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={onConfirmHierarchy}
                className="mt-2 w-full rounded-xl border border-black px-4 py-3 text-sm font-semibold disabled:opacity-50"
              >
                {loading ? loadingMessage : "この階層で確定する"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
