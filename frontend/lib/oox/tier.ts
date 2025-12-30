import { OOX_TIER } from "@/constants/tier";
import { FunctionCode, OrderElement, Tier } from "@/types/oox";

/**
 * 型ガード: tierMapが完全かどうかをチェック
 */
function isCompleteTierMap(
  map: Partial<Record<FunctionCode, Tier>>
): map is Record<FunctionCode, Tier> {
  const allFunctions: FunctionCode[] = [
    "Ni",
    "Ne",
    "Ti",
    "Te",
    "Fi",
    "Fe",
    "Si",
    "Se",
  ];
  return allFunctions.every((func) => map[func] !== undefined);
}

/**
 * 型ガード: 配列の要素がすべてFunctionCodeかどうかをチェック
 */
function isFunctionCodeArray(arr: unknown[]): arr is FunctionCode[] {
  const validFunctionCodes: FunctionCode[] = [
    "Ni",
    "Ne",
    "Ti",
    "Te",
    "Fi",
    "Fe",
    "Si",
    "Se",
  ];
  return arr.every(
    (item) =>
      typeof item === "string" &&
      validFunctionCodes.includes(item as FunctionCode)
  );
}

export function buildDefaultTierMap(
  order: OrderElement[]
): Record<FunctionCode, Tier> {
  const flatOrder = order.flat();

  // 実行時チェック: すべての要素がFunctionCodeかどうかを確認
  if (!isFunctionCodeArray(flatOrder)) {
    throw new Error("Order contains invalid function codes");
  }

  const defaultTierMap: Partial<Record<FunctionCode, Tier>> = {};

  flatOrder.forEach((func, index) => {
    if (index < 2) defaultTierMap[func] = OOX_TIER.DOMINANT;
    else if (index < 4) defaultTierMap[func] = OOX_TIER.HIGH;
    else if (index < 6) defaultTierMap[func] = OOX_TIER.MIDDLE;
    else defaultTierMap[func] = OOX_TIER.LOW;
  });

  // 実行時チェック: すべての機能が設定されていることを確認
  if (!isCompleteTierMap(defaultTierMap)) {
    throw new Error("TierMap is incomplete");
  }

  // 型ガードにより、TypeScriptは defaultTierMap が Record<FunctionCode, Tier> であることを理解する
  return defaultTierMap;
}

/**
 * userTierMapとデフォルトのtierMapをマージして完成版を作成
 */
export function mergeTierMap(
  order: OrderElement[],
  userTierMap?: Partial<Record<FunctionCode, Tier>>
): Record<FunctionCode, Tier> {
  const defaultTierMap = buildDefaultTierMap(order);
  const flatOrder = order.flat() as FunctionCode[];

  if (!isFunctionCodeArray(flatOrder)) {
    throw new Error("Order contains invalid function codes");
  }

  const merged: Record<FunctionCode, Tier> = {} as Record<FunctionCode, Tier>;

  flatOrder.forEach((func) => {
    merged[func] = userTierMap?.[func] || defaultTierMap[func];
  });

  // 実行時チェック: すべての機能が設定されていることを確認
  if (!isCompleteTierMap(merged)) {
    throw new Error("TierMap is incomplete after merge");
  }

  return merged;
}
