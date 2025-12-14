"use client";

import { useEffect, useMemo, useState } from "react";

import HierarchyMobile from "./HierarchyMobile";
import HierarchyPC from "./HierarchyPC";
import { useIsMobile } from "@/hooks/useIsMobile";
import { OOX_TIER } from "@/constants/tier";
import { CalculateResponse, FunctionCode, Tier } from "@/types/oox";

export type HierarchyViewProps = {
  finalOrder: FunctionCode[];
  healthStatus: Record<FunctionCode, "O" | "o" | "x">;
  tierMap: Partial<Record<FunctionCode, Tier>>;
  selected: FunctionCode | null;
  onSelect: (code: FunctionCode) => void;
  onUpdateTier: (func: FunctionCode, tier: Tier) => void;
  onConfirm: () => void;
  loading: boolean;
  loadingMessage: string;
};

type Props = {
  calculateResult: CalculateResponse;
  tierMap: Partial<Record<FunctionCode, Tier>>;
  loading: boolean;
  loadingMessage: string;
  onUpdateTier: (func: FunctionCode, tier: Tier) => void;
  onConfirmHierarchy: () => void;
};

const indexToTier = (index: number): Tier => {
  if (index < 2) return OOX_TIER.DOMINANT;
  if (index < 4) return OOX_TIER.HIGH;
  if (index < 6) return OOX_TIER.MIDDLE;
  return OOX_TIER.LOW;
};

export default function HierarchyScreenContainer({
  calculateResult,
  tierMap,
  loading,
  loadingMessage,
  onUpdateTier,
  onConfirmHierarchy,
}: Props) {
  const isMobile = useIsMobile();

  const finalOrder = useMemo(
    () => (calculateResult.order.flat() as FunctionCode[]).slice(0, 8),
    [calculateResult.order]
  );

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

  const tierMapWithDefaults = useMemo(() => {
    const map: Partial<Record<FunctionCode, Tier>> = { ...tierMap };
    finalOrder.forEach((func, index) => {
      if (!map[func]) {
        map[func] = indexToTier(index);
      }
    });
    return map;
  }, [tierMap, finalOrder]);

  // Persist default tiers so downstream consumers always have a complete map.
  useEffect(() => {
    finalOrder.forEach((func, index) => {
      if (!tierMap[func]) {
        onUpdateTier(func, indexToTier(index));
      }
    });
  }, [finalOrder, onUpdateTier, tierMap]);

  const [rawSelected, setRawSelected] = useState<FunctionCode | null>(null);
  const selected = useMemo(() => {
    if (!finalOrder.length) return null;
    if (rawSelected && finalOrder.includes(rawSelected)) return rawSelected;
    return finalOrder[0];
  }, [finalOrder, rawSelected]);

  const viewProps: HierarchyViewProps = {
    finalOrder,
    healthStatus,
    tierMap: tierMapWithDefaults,
    selected,
    onSelect: setRawSelected,
    onUpdateTier,
    onConfirm: onConfirmHierarchy,
    loading,
    loadingMessage,
  };

  return isMobile ? (
    <HierarchyMobile {...viewProps} />
  ) : (
    <HierarchyPC {...viewProps} />
  );
}
