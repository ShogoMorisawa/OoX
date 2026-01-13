"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { FunctionCode } from "@/types/oox";
import { getCellImage } from "@/constants/icons";
import { FUNCTION_TEXT } from "@/constants/cells";

// 後方互換性のため（ResolvePC.tsx, ResolveMobile.tsx で使用）
// 新しい実装では使用されていません
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

interface Props {
  conflictBlock: FunctionCode[]; // [SystemWinner, UserWinner]
  resolvedBlock: FunctionCode[]; // [SelectedWinner] (空なら未選択)
  handleSelectOrder: (func: FunctionCode) => void;
  handleConfirmConflict: () => void;
  loading: boolean;
}

export default function ResolveScreen({
  conflictBlock,
  resolvedBlock,
  handleSelectOrder,
  handleConfirmConflict,
  loading,
}: Props) {
  // conflictBlockが空、または2つ揃っていない場合は表示しない（安全策）
  if (!conflictBlock || conflictBlock.length < 2) {
    return null;
  }

  const systemWinner = conflictBlock[0]; // 左：システムの推奨
  const userWinner = conflictBlock[1]; // 右：ユーザーの選択

  // 選択されているか判定
  const isSystemSelected = resolvedBlock.includes(systemWinner);
  const isUserSelected = resolvedBlock.includes(userWinner);
  const hasSelection = resolvedBlock.length > 0;

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-8 relative">
      {/* --- ヘッダー領域 --- */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10 z-10"
      >
        <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-4">
          おや？ この2つの細胞が
          <br className="md:hidden" />
          譲り合わないようです
        </h2>
        <p className="text-slate-600 text-sm md:text-base leading-relaxed max-w-lg mx-auto">
          回答データの中で、もっとも激しく火花を散らしている場所が見つかりました。
          <br />
          今のあなたの<span className="font-bold text-slate-800">「本音」</span>
          に近いのはどっち？
        </p>
      </motion.div>

      {/* --- 対決リング --- */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 w-full max-w-4xl mb-12 relative z-10">
        {/* 左コーナー：システムの推奨 */}
        <ConflictCard
          functionCode={systemWinner}
          isSelected={isSystemSelected}
          isOtherSelected={isUserSelected}
          label="全体のバランス"
          description="これまでの回答の整合性を取ると、こちらが優先されます"
          onClick={() => handleSelectOrder(systemWinner)}
          colorClass="bg-blue-50 border-blue-200"
          badgeColor="bg-blue-100 text-blue-700"
          loading={loading}
        />

        {/* VS エフェクト */}
        <div className="flex flex-col items-center justify-center shrink-0 py-4 md:py-0 relative">
          <motion.div
            animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-4xl md:text-5xl font-black text-slate-300 italic"
            style={{ textShadow: "0px 2px 4px rgba(0,0,0,0.1)" }}
          >
            VS
          </motion.div>
          {/* 雷アイコン（装飾） */}
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            className="text-yellow-400 text-3xl absolute -mt-8"
          >
            ⚡️
          </motion.div>
        </div>

        {/* 右コーナー：ユーザーの選択 */}
        <ConflictCard
          functionCode={userWinner}
          isSelected={isUserSelected}
          isOtherSelected={isSystemSelected}
          label="あなたの直感"
          description="あの質問で、あなたは迷いながらもこちらを選びました"
          onClick={() => handleSelectOrder(userWinner)}
          colorClass="bg-orange-50 border-orange-200"
          badgeColor="bg-orange-100 text-orange-700"
          loading={loading}
        />
      </div>

      {/* --- アクションエリア --- */}
      <div className="fixed bottom-8 left-0 right-0 px-6 flex justify-center z-20 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-md">
          <button
            onClick={handleConfirmConflict}
            disabled={!hasSelection || loading}
            className={`w-full h-14 text-lg font-bold shadow-xl transition-all duration-300 rounded-full
              ${
                hasSelection
                  ? "bg-slate-900 hover:bg-slate-800 text-white transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
          >
            {loading ? "再計算中..." : "この順序で確定する"}
          </button>
        </div>
      </div>

      {/* 背景装飾（ぼかし） */}
      <div className="fixed inset-0 bg-gradient-to-b from-white to-slate-50 -z-10" />
    </div>
  );
}

// --- サブコンポーネント: 対決カード ---

interface CardProps {
  functionCode: FunctionCode;
  isSelected: boolean;
  isOtherSelected: boolean;
  label: string;
  description: string;
  onClick: () => void;
  colorClass: string;
  badgeColor: string;
  loading: boolean;
}

const ConflictCard: React.FC<CardProps> = ({
  functionCode,
  isSelected,
  isOtherSelected,
  label,
  description,
  onClick,
  colorClass,
  badgeColor,
  loading,
}) => {
  const iconUrl = getCellImage(functionCode);

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      disabled={loading}
      className={`
        relative w-full md:w-80 p-6 rounded-3xl border-2 text-left transition-all duration-300 group
        ${
          isSelected
            ? `${colorClass} ring-4 ring-offset-2 ring-slate-200 shadow-2xl scale-105 z-10`
            : isOtherSelected
            ? "bg-white border-slate-100 opacity-60 grayscale scale-95"
            : "bg-white border-slate-100 hover:border-slate-300 shadow-lg"
        }
        ${loading ? "pointer-events-none" : ""}
      `}
    >
      {/* ラベルバッジ */}
      <div
        className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-4 ${badgeColor}`}
      >
        {label}
      </div>

      {/* アイコンとコード */}
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 rounded-full bg-white shadow-sm p-2 flex items-center justify-center overflow-hidden border border-slate-100">
          {iconUrl ? (
            <Image
              src={iconUrl}
              alt={functionCode}
              width={48}
              height={48}
              className="w-full h-full object-contain"
            />
          ) : (
            <span className="text-3xl">?</span>
          )}
        </div>
        <div>
          <div className="text-3xl font-black text-slate-800">
            {functionCode}
          </div>
          <div className="text-xs text-slate-400 font-bold tracking-wider">
            FUNCTION
          </div>
        </div>
      </div>

      {/* 説明文 */}
      <p className="text-sm text-slate-600 leading-relaxed font-medium">
        {description}
      </p>

      {/* 機能の説明（FUNCTION_TEXTから） */}
      <p className="text-xs text-slate-500 mt-2 italic">
        {FUNCTION_TEXT[functionCode]}
      </p>

      {/* 選択中のチェックマーク */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-3 -right-3 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg"
        >
          ✓
        </motion.div>
      )}
    </motion.button>
  );
};
