"use client";

import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

import { HierarchyViewProps } from "./index";
import { OOX_TIER } from "@/constants/tier";
import { FUNCTION_TEXT } from "@/constants/cells";
import { Tier } from "@/types/oox";

const TIER_INFO: { tier: Tier; title: string; subtitle: string }[] = [
  {
    tier: OOX_TIER.DOMINANT,
    title: "王様",
    subtitle: "とてもよく働く\n（いつも一緒にいるクセ）",
  },
  {
    tier: OOX_TIER.HIGH,
    title: "騎士",
    subtitle: "よく働く\n（頼りになる主力メンバー）",
  },
  {
    tier: OOX_TIER.MIDDLE,
    title: "市民",
    subtitle: "ときどき働く\n（必要な時だけ登場）",
  },
  {
    tier: OOX_TIER.LOW,
    title: "迷子",
    subtitle: "あまり働かない\n（今は休憩中…）",
  },
];

// 画像パス定義
const CELL_IMAGES = {
  [OOX_TIER.DOMINANT]: [
    "/images/oox_hie_cell-king-red-left.png",
    "/images/oox_hie_cell-king-lightBlue-right.png",
  ],
  [OOX_TIER.HIGH]: [
    "/images/oox_hie_cell-knight-red-left.png",
    "/images/oox_hie_cell-knight-lightBlue-right.png",
  ],
  [OOX_TIER.MIDDLE]: [
    "/images/oox_hie_cell-citizen-yellow-left.png",
    "/images/oox_hie_cell-citizen-green-right.png",
  ],
  [OOX_TIER.LOW]: [
    "/images/oox_hie_cell-lost-left.png",
    "/images/oox_hie_cell-lost-right.png",
  ],
};

const getCellImage = (tier: Tier, isEven: boolean): string => {
  const images = CELL_IMAGES[tier] || CELL_IMAGES[OOX_TIER.LOW];
  return isEven ? images[0] : images[1];
};

// PC版のレイアウト設定
const CELL_HEIGHT = 90; // 細胞1つ分の高さ(px)
const BORDER_GAP = 130; // PC版の隙間
const CONTAINER_PADDING_TOP = 40; // 上部の余白

export default function HierarchyPC({
  finalOrder,
  borders,
  tierMap,
  onBorderChange,
  onConfirm,
  loading,
  loadingMessage,
}: HierarchyViewProps) {
  // 座標計算ロジック（Mobileと同じ考え方）
  const getCellTop = (index: number) => {
    const bordersBefore = borders.filter((b) => b <= index).length;
    return (
      CONTAINER_PADDING_TOP + index * CELL_HEIGHT + bordersBefore * BORDER_GAP
    );
  };

  const getBorderTop = (borderVal: number, borderIndex: number) => {
    const basePos = borderVal * CELL_HEIGHT;
    const gapsBefore = borderIndex * BORDER_GAP;
    return CONTAINER_PADDING_TOP + basePos + gapsBefore + BORDER_GAP / 2;
  };

  const handleMove = (
    index: 0 | 1 | 2,
    currentPos: number,
    direction: "up" | "down"
  ) => {
    const newPos = direction === "up" ? currentPos - 1 : currentPos + 1;
    onBorderChange(index, newPos);
  };

  const totalHeight =
    finalOrder.length * CELL_HEIGHT + borders.length * BORDER_GAP + 200;

  return (
    <div className="min-h-screen md:h-screen flex flex-col justify-between px-4 py-6 md:px-6 md:py-8 bg-[url('/images/oox_background.png')] bg-cover bg-center overflow-hidden">
      <div className="max-w-6xl w-full mx-auto flex flex-col h-full">
        {/* タイトル & ガイド */}
        <div className="text-center space-y-2 mb-2 shrink-0 z-20">
          <h1 className="text-2xl font-bold text-sky-900">
            精神構造の役割決定
          </h1>
          <p className="text-sm text-sky-900/70">
            ▲▼ボタンで境界線を移動させてください。細胞の間隔は自動で調整されます。
          </p>
        </div>

        {/* メインエリア (3カラム構成) */}
        <div className="grid grid-cols-12 gap-8 items-start flex-1 min-h-0 relative">
          {/* 左カラム: 装飾（空きスペース or 将来的な情報） */}
          <div className="col-span-2 hidden lg:block"></div>

          {/* 中央カラム: インタラクティブエリア (細胞 + 波線) */}
          <div className="col-span-12 md:col-span-8 lg:col-span-6 flex justify-center h-full overflow-y-auto overflow-x-hidden pt-4 pb-20 custom-scrollbar">
            <div
              className="relative w-full max-w-[400px]"
              style={{ height: `${totalHeight}px` }}
            >
              {/* --- 細胞リスト --- */}
              {finalOrder.map((func, index) => {
                const tier = tierMap[func] ?? OOX_TIER.LOW;
                const isEven = index % 2 === 0; // 0, 2, 4... (左寄り)
                const imgSrc = getCellImage(tier, isEven);
                const topY = getCellTop(index);

                return (
                  <motion.div
                    key={func}
                    layout
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="absolute w-full flex justify-center items-center pointer-events-none" // pointer-events-noneでドラッグの邪魔をしない
                    style={{ top: topY, height: CELL_HEIGHT }}
                  >
                    {/* 細胞本体 */}
                    <div className="relative w-full flex items-center justify-center">
                      {/* 吹き出し (説明) */}
                      <div
                        className={`absolute top-0 w-36 opacity-0 md:opacity-100 transition-opacity duration-500
                           ${
                             isEven
                               ? "right-[65%] text-right"
                               : "left-[65%] text-left"
                           }
                         `}
                      >
                        <div className="relative">
                          <Image
                            src="/images/oox_quiz_question.png"
                            alt="bubble"
                            width={140}
                            height={80}
                            className={`object-contain opacity-60 ${
                              isEven ? "" : "-scale-x-100"
                            }`}
                          />
                          <div className="absolute inset-0 flex flex-col justify-center px-4 pt-1">
                            <span className="text-[10px] text-sky-800 font-bold">
                              {func}
                            </span>
                            <span className="text-[9px] text-sky-700 leading-tight">
                              {FUNCTION_TEXT[func]}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 画像 (AnimatePresenceで切り替えアニメ) */}
                      <div
                        className={`relative w-20 h-20 md:w-24 md:h-24 z-10 drop-shadow-lg transform ${
                          isEven ? "-translate-x-8" : "translate-x-8"
                        }`}
                      >
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={tier}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{
                              type: "spring",
                              stiffness: 300,
                              damping: 20,
                            }}
                            className="w-full h-full relative"
                          >
                            <Image
                              src={imgSrc}
                              alt={`${func} cell`}
                              fill
                              className="object-contain"
                            />
                          </motion.div>
                        </AnimatePresence>
                        {/* ラベル */}
                        <div className="absolute -bottom-2 inset-x-0 flex justify-center">
                          <span className="bg-white/90 px-2 py-0.5 rounded-full text-[10px] font-bold text-sky-800 shadow-sm border border-sky-100">
                            {index + 1}位
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {/* --- 境界線 --- */}
              {borders.map((borderPos, i) => {
                const topY = getBorderTop(borderPos, i);

                // Tier情報と色
                const tierTitles = ["王様", "騎士", "市民"];
                const colorClass =
                  i === 0
                    ? "text-yellow-600 bg-yellow-50 border-yellow-200"
                    : i === 1
                    ? "text-sky-600 bg-sky-50 border-sky-200"
                    : "text-green-600 bg-green-50 border-green-200";

                const canMoveUp =
                  i === 0 ? borderPos > 1 : borderPos > borders[i - 1] + 1;
                const canMoveDown =
                  i === 2 ? borderPos < 7 : borderPos < borders[i + 1] - 1;

                return (
                  <motion.div
                    key={`border-${i}`}
                    layout
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    style={{ top: topY }}
                    className="absolute left-0 w-full h-0 z-30 flex items-center justify-center"
                  >
                    <div className="relative w-[120%] h-16 pointer-events-none -mt-8">
                      <Image
                        src="/images/oox_hie_border.png"
                        alt="border"
                        fill
                        className="object-fill opacity-80"
                      />
                    </div>

                    {/* コントローラー */}
                    <div className="absolute right-0 md:-right-16 flex flex-col md:flex-row items-center gap-2">
                      <div
                        className={`px-3 py-1 rounded-full border shadow-sm backdrop-blur-sm ${colorClass}`}
                      >
                        <span className="text-xs font-bold">
                          {tierTitles[i]}境界
                        </span>
                      </div>
                      <div className="flex gap-1 bg-white rounded-full shadow-md p-1 border border-slate-100">
                        <button
                          onClick={() =>
                            handleMove(i as 0 | 1 | 2, borderPos, "up")
                          }
                          disabled={!canMoveUp}
                          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 disabled:opacity-30 transition-colors"
                        >
                          ▲
                        </button>
                        <button
                          onClick={() =>
                            handleMove(i as 0 | 1 | 2, borderPos, "down")
                          }
                          disabled={!canMoveDown}
                          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 disabled:opacity-30 transition-colors"
                        >
                          ▼
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* 右カラム: 凡例（説明） */}
          <div className="hidden md:flex col-span-4 lg:col-span-4 flex-col justify-center gap-4 h-full pb-20 opacity-80 pointer-events-none">
            {TIER_INFO.map((info) => (
              <div
                key={info.tier}
                className="relative w-full max-w-[200px] aspect-[2/1] mx-auto"
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-white/40 rounded-2xl border border-white/50 backdrop-blur-sm shadow-sm">
                  <p className="text-lg font-bold text-sky-900 mb-1">
                    {info.title}
                  </p>
                  <p className="text-xs text-sky-800 leading-tight">
                    {info.subtitle}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* フッター */}
        <div className="fixed bottom-8 left-0 w-full pointer-events-none z-50">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`
                pointer-events-auto px-12 py-4 rounded-full text-lg font-bold shadow-xl transition-all
                ${
                  loading
                    ? "bg-slate-300 text-white cursor-not-allowed"
                    : "bg-gradient-to-r from-sky-500 to-cyan-400 text-white hover:scale-105 active:scale-95"
                }
              `}
            >
              {loading ? loadingMessage : "決定する"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
