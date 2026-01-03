"use client";

import { useMemo, useState } from "react";

import HierarchyMobile from "./HierarchyMobile";
import HierarchyPC from "./HierarchyPC";
import { useIsMobile } from "@/hooks/useIsMobile";
import { OOX_TIER } from "@/constants/tier";
import { CalculateResponse, FunctionCode, Tier } from "@/types/oox";

// Borderの初期位置 (インデックス)
// 2 = 2位と3位の間, 4 = 4位と5位の間, 6 = 6位と7位の間
const DEFAULT_BORDERS = [2, 4, 6];

export type HierarchyViewProps = {
  finalOrder: FunctionCode[];
  healthStatus: Record<FunctionCode, "O" | "o" | "x">;
  borders: number[]; // [王の終わり, 騎士の終わり, 市民の終わり]
  tierMap: Record<FunctionCode, Tier>; // 表示用に計算されたマップ
  onBorderChange: (borderIndex: 0 | 1 | 2, newPosition: number) => void;
  onConfirm: () => void;
  loading: boolean;
  loadingMessage: string;
};

type Props = {
  calculateResult: CalculateResponse;
  tierMap: Partial<Record<FunctionCode, Tier>>; // 親から来るが、今回は内部State優先
  loading: boolean;
  loadingMessage: string;
  onUpdateTier: (func: FunctionCode, tier: Tier) => void; // 互換性のため残す
  onConfirmHierarchy: (completeTierMap?: Record<FunctionCode, Tier>) => void;
};

export default function HierarchyScreenContainer({
  calculateResult,
  loading,
  loadingMessage,
  onUpdateTier,
  onConfirmHierarchy,
}: Props) {
  const isMobile = useIsMobile();

  // 1. 序列の確定
  const finalOrder = useMemo(
    () => (calculateResult.order.flat() as FunctionCode[]).slice(0, 8),
    [calculateResult.order]
  );

  // 2. 健全度 (表示用)
  const healthStatus = useMemo(() => {
    // calculateResult.health を使用
    return calculateResult.health;
  }, [calculateResult.health]);

  // 3. 境界線の位置管理 [Border1, Border2, Border3]
  // 値は「何番目の細胞の後ろにあるか」 (例: 2なら 0,1番目が上のエリア)
  const [borders, setBorders] = useState<number[]>(DEFAULT_BORDERS);

  // 4. borders から tierMap を動的に生成
  const currentTierMap = useMemo(() => {
    const map: Record<FunctionCode, Tier> = {} as Record<FunctionCode, Tier>;

    finalOrder.forEach((func, index) => {
      // index が border[0] (王ライン) より小さいなら王様
      if (index < borders[0]) {
        map[func] = OOX_TIER.DOMINANT;
      }
      // border[0] <= index < border[1] なら騎士
      else if (index < borders[1]) {
        map[func] = OOX_TIER.HIGH;
      }
      // border[1] <= index < border[2] なら市民
      else if (index < borders[2]) {
        map[func] = OOX_TIER.MIDDLE;
      }
      // それ以外は迷子
      else {
        map[func] = OOX_TIER.LOW;
      }
    });
    return map;
  }, [finalOrder, borders]);

  // 5. 境界線を動かすロジック
  const handleBorderChange = (borderIndex: 0 | 1 | 2, newPosition: number) => {
    // ローディング中は境界線の変更を禁止
    if (loading) return;

    setBorders((prev) => {
      const next = [...prev];
      // 制約: 線同士は追い越せない & 範囲外に行かない
      // newPosition は 「何個目のセルの後か」 (1〜7)

      if (borderIndex === 0) {
        // 王ライン: 最小1, 最大 = 騎士ライン - 1
        const max = next[1] - 1;
        next[0] = Math.max(1, Math.min(newPosition, max));
      } else if (borderIndex === 1) {
        // 騎士ライン: 最小 = 王ライン + 1, 最大 = 市民ライン - 1
        const min = next[0] + 1;
        const max = next[2] - 1;
        next[1] = Math.max(min, Math.min(newPosition, max));
      } else {
        // 市民ライン: 最小 = 騎士ライン + 1, 最大 = 7
        const min = next[1] + 1;
        next[2] = Math.max(min, Math.min(newPosition, 7));
      }

      return next;
    });
  };

  // 決定時の処理
  const handleConfirm = () => {
    // 親コンポーネント（フック）の状態も同期させておく
    Object.entries(currentTierMap).forEach(([func, tier]) => {
      onUpdateTier(func as FunctionCode, tier);
    });
    // currentTierMapを直接渡す（状態更新の非同期性を回避）
    onConfirmHierarchy(currentTierMap);
  };

  const viewProps: HierarchyViewProps = {
    finalOrder,
    healthStatus,
    borders,
    tierMap: currentTierMap,
    onBorderChange: handleBorderChange,
    onConfirm: handleConfirm,
    loading,
    loadingMessage,
  };

  return isMobile ? (
    <HierarchyMobile {...viewProps} />
  ) : (
    <HierarchyPC {...viewProps} />
  );
}
