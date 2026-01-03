"use client";

import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { HierarchyViewProps } from "./index";
import { OOX_TIER } from "@/constants/tier";
import { FUNCTION_TEXT } from "@/constants/cells";
import { getHierarchyCellImage } from "@/constants/icons";

// レイアウト定数
const CELL_HEIGHT = 100; // 細胞の高さ領域
const BORDER_GAP = 140; // ボーダーのために空ける隙間の大きさ（広めに！）
const HEADER_OFFSET = 160; // 開始位置

export default function HierarchyMobile({
  finalOrder,
  borders,
  tierMap,
  onBorderChange,
  onConfirm,
  loading,
  loadingMessage,
}: HierarchyViewProps) {
  // ■ 細胞のY座標を計算する関数
  // ロジック: 基本位置 + (自分の前にボーダーが何本あるか × 隙間サイズ)
  const getCellTop = (index: number) => {
    // 自分のindexより「小さい値のボーダー」の数を数える
    // 例: borders=[2,4,6]。index=1なら0個。index=2なら1個(border=2が前にある)。
    const bordersBefore = borders.filter((b) => b <= index).length;
    return HEADER_OFFSET + index * CELL_HEIGHT + bordersBefore * BORDER_GAP;
  };

  // ■ ボーダーのY座標を計算する関数
  // ロジック: 基準となる細胞の下 + (自分より上のボーダー分の隙間) + センタリング調整
  const getBorderTop = (borderVal: number, borderIndex: number) => {
    // borderVal は「このindexの細胞の後ろ」という意味
    // 例: borderVal=2 なら、index=1(2番目)の細胞の直後。

    // 基本位置： (borderVal個分の細胞高さ)
    const basePos = borderVal * CELL_HEIGHT;

    // 累積ギャップ： (自分より上のボーダー数 × 隙間)
    // ※自分自身(borderIndex)の分はまだ隙間の中なのでカウントしないが、
    //   配置位置としては「前のボーダーたちの隙間」を足す必要がある。
    const gapsBefore = borderIndex * BORDER_GAP;

    // 隙間の中央に配置するための調整
    // gapの開始位置から、gapの半分くらいの位置に。
    const centerOffset = BORDER_GAP / 2;

    return HEADER_OFFSET + basePos + gapsBefore + centerOffset;
  };

  // ボタン操作用ハンドラ
  const handleMove = (
    index: 0 | 1 | 2,
    currentPos: number,
    direction: "up" | "down"
  ) => {
    const newPos = direction === "up" ? currentPos - 1 : currentPos + 1;
    // index.tsx 側のバリデーションロジックが優秀なので、
    // ここでは単純に投げるだけでOK（無効な位置ならStateが更新されないだけ）
    onBorderChange(index, newPos);
  };

  // 全体の高さを計算（細胞分 + ボーダー隙間分）
  const totalHeight =
    finalOrder.length * CELL_HEIGHT +
    borders.length * BORDER_GAP +
    HEADER_OFFSET +
    100;

  return (
    <div className="min-h-screen w-full relative bg-[#E0F7FA] overflow-x-hidden select-none pb-40">
      {/* 背景 */}
      <div
        className="fixed inset-0 z-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage: "url('/images/oox_background.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      {/* ヘッダーエリア */}
      <div className="relative z-10 pt-8 pb-4 text-center px-4">
        <h1 className="text-sky-900 font-bold text-xl mb-1 drop-shadow-sm">
          深層心理の編成
        </h1>
        <p className="text-sky-700 text-xs font-medium">
          矢印ボタンで境界線を動かして役割を決めてください。
          <br />
          線が入る場所は自動で広がります。
        </p>
      </div>

      {/* メインエリア */}
      <div
        className="relative w-full max-w-md mx-auto"
        style={{
          height: `${totalHeight}px`,
        }}
      >
        {/* --- 細胞たち (Cells) --- */}
        {finalOrder.map((func, index) => {
          const tier = tierMap[func] ?? OOX_TIER.LOW;
          // 左か右か (ジグザグ配置)
          const isLeft = index % 2 === 0;
          // 画像のパス
          const imgSrc = getHierarchyCellImage(tier, func, isLeft);
          const topY = getCellTop(index); // 計算した座標を使用

          return (
            <motion.div
              key={func}
              layout // 座標が変わったらスムーズにアニメーション移動！
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute w-full flex justify-center items-center"
              style={{
                top: topY,
                height: CELL_HEIGHT,
              }}
            >
              {/* 細胞コンテナ: 左右にオフセットさせる */}
              <div
                className={`relative w-28 h-28 flex flex-col items-center justify-center
                  ${isLeft ? "-translate-x-12" : "translate-x-12"}
                `}
              >
                {/* 階層変化時のポップアニメーション */}
                <AnimatePresence mode="popLayout">
                  <motion.div
                    key={`${func}-${tier}`} // Tierが変わると再描画＝アニメ発火
                    initial={{ scale: 0.8, opacity: 0.5 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className="absolute inset-0"
                  >
                    <Image
                      src={imgSrc}
                      alt={`${func} cell`}
                      fill
                      className="object-contain drop-shadow-xl"
                      priority={index < 4}
                    />
                  </motion.div>
                </AnimatePresence>

                {/* 機能名バッジ */}
                <div
                  className={`
                    absolute bottom-2 px-3 py-1 rounded-full text-[9px] font-semibold shadow-md z-10
                    bg-white/90 text-slate-700 border border-slate-100 text-center max-w-[120px]
                  `}
                >
                  {FUNCTION_TEXT[func]}
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* --- 境界線 (Borders) --- */}
        {borders.map((borderPos, i) => {
          const topY = getBorderTop(borderPos, i); // 計算した座標を使用

          // ラベル等の定義
          let label = "",
            colorClass = "";
          const borderImage = "oox_hie_border.png";
          if (i === 0) {
            label = "王様";
            colorClass = "bg-yellow-50 text-yellow-700 border-yellow-200";
          } else if (i === 1) {
            label = "騎士";
            colorClass = "bg-sky-50 text-sky-700 border-sky-200";
          } else {
            label = "市民";
            colorClass = "bg-green-50 text-green-700 border-green-200";
          }

          // 移動可否判定 (UIの無効化用)
          // index.tsxのロジックと同じ計算をしてボタンをdisabledにする
          const canMoveUp =
            i === 0 ? borderPos > 1 : borderPos > borders[i - 1] + 1;
          const canMoveDown =
            i === 2 ? borderPos < 7 : borderPos < borders[i + 1] - 1;

          return (
            <motion.div
              key={`border-${i}`}
              layout // 位置変更時にスムーズに動く
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              style={{ top: topY }}
              className="absolute left-0 w-full h-0 z-40 flex items-center justify-center"
            >
              {/* 線画像 (少し上にずらしてGapの中央に合わせる) */}
              <div className="relative w-full h-16 pointer-events-none -mt-8">
                <Image
                  src={`/images/${borderImage}`}
                  alt="border"
                  fill
                  className="object-fill opacity-90 scale-x-110 drop-shadow-md"
                />
              </div>

              {/* コントローラー */}
              <div className="absolute -top-7 flex items-center gap-3">
                <button
                  onClick={() => handleMove(i as 0 | 1 | 2, borderPos, "up")}
                  disabled={loading || !canMoveUp}
                  className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg border-2 transition-all bg-white ${
                    loading || !canMoveUp
                      ? "opacity-30 cursor-not-allowed"
                      : "active:scale-90"
                  }`}
                >
                  <span className="text-slate-500 font-bold text-lg">▲</span>
                </button>

                <div
                  className={`px-4 py-1.5 rounded-2xl shadow-lg border-2 backdrop-blur-sm flex flex-col items-center leading-none ${colorClass}`}
                >
                  <span className="text-xs font-bold">{label}</span>
                  <span className="text-[9px] opacity-80 mt-0.5">Border</span>
                </div>

                <button
                  onClick={() => handleMove(i as 0 | 1 | 2, borderPos, "down")}
                  disabled={loading || !canMoveDown}
                  className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg border-2 transition-all bg-white ${
                    loading || !canMoveDown
                      ? "opacity-30 cursor-not-allowed"
                      : "active:scale-90"
                  }`}
                >
                  <span className="text-slate-500 font-bold text-lg">▼</span>
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 決定ボタン */}
      <div className="fixed bottom-0 left-0 w-full p-6 bg-gradient-to-t from-white via-white/90 to-transparent z-50">
        <button
          onClick={onConfirm}
          disabled={loading}
          className={`
            w-full py-4 rounded-full text-lg font-bold shadow-xl transition-all
            ${
              loading
                ? "bg-slate-300 text-white"
                : "bg-gradient-to-r from-sky-400 to-cyan-400 text-white active:scale-95"
            }
          `}
        >
          {loading ? loadingMessage : "決定する"}
        </button>
      </div>
    </div>
  );
}
