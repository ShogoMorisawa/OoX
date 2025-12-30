"use client";

import { useEffect, useMemo } from "react";
import { Quicksand } from "next/font/google";

import ResolveMobile from "./ResolveMobile";
import ResolvePC from "./ResolvePC";
import { useIsMobile } from "@/hooks/useIsMobile";
import { CalculateResponse, FunctionCode } from "@/types/oox";

type Props = {
  calculateResult: CalculateResponse;
  conflictBlock: FunctionCode[];
  resolvedBlock: FunctionCode[];
  onSelectOrder: (func: FunctionCode) => void;
  onReset: () => void;
  onConfirm: () => void;
};

export type ResolveViewProps = {
  remainingFuncs: FunctionCode[];
  slots: (FunctionCode | null)[];
  isSlotInCurrentBlock: boolean[];
  allDecided: boolean;
  onSelectOrder: (func: FunctionCode) => void;
  onReset: () => void;
  onConfirm: () => void;
  quicksandClassName: string;
};

const SLOT_COUNT = 8;

const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function ResolveContainer({
  calculateResult,
  conflictBlock,
  resolvedBlock,
  onSelectOrder,
  onReset,
  onConfirm,
}: Props) {
  const isMobile = useIsMobile();

  const targetBlock =
    conflictBlock.length > 0
      ? conflictBlock
      : (calculateResult.order.find((el) => Array.isArray(el)) as
          | FunctionCode[]
          | undefined);

  const slots: (FunctionCode | null)[] = useMemo(() => {
    const arr: (FunctionCode | null)[] = Array(SLOT_COUNT).fill(null);
    let slotIndex = 0;

    for (const element of calculateResult.order) {
      if (slotIndex >= SLOT_COUNT) break;

      if (typeof element === "string") {
        arr[slotIndex] = element;
        slotIndex++;
      } else if (Array.isArray(element)) {
        const block = element as FunctionCode[];
        const isCurrentBlock = targetBlock && block === targetBlock;

        if (isCurrentBlock) {
          for (let i = 0; i < block.length && slotIndex < SLOT_COUNT; i++) {
            arr[slotIndex] = resolvedBlock[i] ?? null;
            slotIndex++;
          }
        } else {
          slotIndex += block.length;
        }
      }
    }

    return arr;
  }, [calculateResult.order, targetBlock, resolvedBlock]);

  const remainingFuncs = useMemo(() => {
    if (!targetBlock) return [];
    return targetBlock.filter((f) => !resolvedBlock.includes(f));
  }, [targetBlock, resolvedBlock]);

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

  if (!targetBlock) {
    return <div className="p-10 text-white">Loading...</div>;
  }

  const viewProps: ResolveViewProps = {
    remainingFuncs,
    slots,
    isSlotInCurrentBlock,
    allDecided,
    onSelectOrder,
    onReset,
    onConfirm,
    quicksandClassName: quicksand.className,
  };

  return isMobile ? (
    <ResolveMobile {...viewProps} />
  ) : (
    <ResolvePC {...viewProps} />
  );
}
