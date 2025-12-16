import { FunctionCode } from "@/types/oox";

type Coordinate = {
  x: number;
  y: number;
};

const createSlots = (
  baseX: number,
  baseY: number,
  count: number,
  stepX: number,
  stepY: number,
  rowCount: number
): Coordinate[] => {
  const slots: Coordinate[] = [];
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / rowCount); // 行番号（縦・斜め方向）
    const col = i % rowCount; // 列番号（横方向）

    // 斜め配置ロジック: 行が進むごとにXも少しずらすと「斜め格子」になる
    const x = baseX + col * stepX + row * (stepX * 0.5);
    const y = baseY + row * stepY;

    slots.push({ x, y });
  }
  return slots;
};

// 背景画像を横4×縦2の8分割に配置
// 上段: Ne, Si, Se, Fi
// 下段: Ni, Ti, Te, Fe
export const WORLD_SLOTS: Record<FunctionCode, Coordinate[]> = {
  // 上段左から1列目（x: 0-25%, y: 0-50%）
  Ne: createSlots(2.5, 5, 20, 4, 3, 5),

  // 上段左から2列目（x: 25-50%, y: 0-50%）
  Si: createSlots(27.5, 5, 20, 4, 3, 5),

  // 上段左から3列目（x: 50-75%, y: 0-50%）
  Se: createSlots(52.5, 5, 20, 4, 3, 5),

  // 上段左から4列目（x: 75-100%, y: 0-50%）
  Fi: createSlots(77.5, 5, 20, 4, 3, 5),

  // 下段左から1列目（x: 0-25%, y: 50-100%）
  Ni: createSlots(2.5, 55, 20, 4, 3, 5),

  // 下段左から2列目（x: 25-50%, y: 50-100%）
  Ti: createSlots(27.5, 55, 20, 4, 3, 5),

  // 下段左から3列目（x: 50-75%, y: 50-100%）
  Te: createSlots(52.5, 55, 20, 4, 3, 5),

  // 下段左から4列目（x: 75-100%, y: 50-100%）
  Fe: createSlots(77.5, 55, 20, 4, 3, 5),
};
