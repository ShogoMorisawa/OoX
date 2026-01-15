"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import type { FunctionCode, Question } from "@/types/oox";
import { getCellImage } from "@/constants/icons";

interface Props {
  conflictBlock: FunctionCode[]; // [SystemWinner, UserWinner]
  resolvedBlock: FunctionCode[]; // [SelectedWinner] (空なら未選択)
  handleSelectOrder: (func: FunctionCode) => void;
  handleConfirmConflict: () => void;
  loading: boolean;
  conflictQuestion?: Question;
}

export default function ResolveScreen({
  conflictBlock,
  resolvedBlock,
  handleSelectOrder,
  handleConfirmConflict,
  loading,
  conflictQuestion,
}: Props) {
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // 安全策：データが足りない場合は何も表示しない
  if (!conflictBlock || conflictBlock.length < 2 || !conflictQuestion) {
    return null;
  }

  const systemWinner = conflictBlock[0]; // 左：システムの推奨
  const userWinner = conflictBlock[1]; // 右：ユーザーの選択

  // 機能コードに対応する選択肢データを取得
  const systemChoice = conflictQuestion.choices.find(
    (choice) => choice.relatedFunctionCode === systemWinner
  );
  const userChoice = conflictQuestion.choices.find(
    (choice) => choice.relatedFunctionCode === userWinner
  );

  const systemTitle =
    systemChoice?.shortText ||
    (systemChoice?.text ? `${systemChoice.text.slice(0, 15)}...` : "");
  const userTitle =
    userChoice?.shortText ||
    (userChoice?.text ? `${userChoice.text.slice(0, 15)}...` : "");

  const isSystemSelected = resolvedBlock.includes(systemWinner);
  const isUserSelected = resolvedBlock.includes(userWinner);
  const hasSelection = resolvedBlock.length > 0;

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] px-4 py-6 md:py-10 relative">
      {/* --- 1. ヘッダー領域 --- */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl mb-8 md:mb-12 z-10 text-center"
      >
        <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">
          MEMORY
        </span>
        <h2 className="text-xl md:text-2xl font-bold text-slate-800 mt-2 leading-relaxed">
          そういえば、この質問。
          <br />
          <span className="text-base font-normal text-slate-600">
            回答するのに、いちばん時間を使っていましたね。
          </span>
        </h2>

        {/* 質問要約の表示 */}
        <div className="mt-5 inline-block px-6 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-slate-100 shadow-sm">
          <span className="font-bold text-slate-700 mr-2">Q.</span>
          <span className="text-slate-700 font-medium">
            {conflictQuestion.shortText || "この状況について"}
          </span>
        </div>

        {/* 質問詳細アコーディオン */}
        <div className="relative mt-3">
          <button
            onClick={() => setIsDetailOpen((prev) => !prev)}
            className="text-xs text-slate-400 hover:text-slate-600 font-medium flex items-center justify-center gap-1 mx-auto transition-colors"
          >
            {isDetailOpen ? "閉じる" : "どんな質問だったっけ？"}
            <span
              className={`transform transition-transform ${
                isDetailOpen ? "rotate-180" : ""
              }`}
            >
              ▼
            </span>
          </button>

          <AnimatePresence>
            {isDetailOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-white/80 backdrop-blur-md rounded-2xl p-5 mt-3 text-sm text-slate-600 leading-relaxed shadow-inner border border-white/50 text-left max-w-lg mx-auto">
                  {conflictQuestion.text}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* --- 2. 対決カード領域 --- */}
      <div className="flex flex-col md:flex-row items-stretch justify-center gap-6 md:gap-10 w-full max-w-6xl mb-24 relative z-10">
        <ConflictCard
          type="system"
          functionCode={systemWinner}
          title={systemTitle}
          description={systemChoice?.text || ""}
          isSelected={isSystemSelected}
          isOtherSelected={isUserSelected}
          onClick={() => handleSelectOrder(systemWinner)}
          loading={loading}
        />

        <div className="flex flex-col items-center justify-center shrink-0 py-2 md:py-0 relative z-20">
          <div className="text-4xl md:text-5xl font-black text-slate-300 italic drop-shadow-sm select-none">
            VS
          </div>
        </div>

        <ConflictCard
          type="user"
          functionCode={userWinner}
          title={userTitle}
          description={userChoice?.text || ""}
          isSelected={isUserSelected}
          isOtherSelected={isSystemSelected}
          onClick={() => handleSelectOrder(userWinner)}
          loading={loading}
        />
      </div>

      <div className="fixed bottom-8 left-0 right-0 px-6 flex justify-center z-30 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-sm md:max-w-md shadow-2xl rounded-full">
          <button
            onClick={handleConfirmConflict}
            disabled={!hasSelection || loading}
            className={`w-full h-14 text-lg font-bold transition-all duration-300 rounded-full flex items-center justify-center gap-2
              ${
                hasSelection
                  ? "bg-slate-800 hover:bg-slate-700 text-white transform hover:scale-105 hover:shadow-lg"
                  : "bg-white text-slate-300 border border-slate-200 cursor-not-allowed"
              }`}
          >
            {loading ? (
              <>
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>再計算中...</span>
              </>
            ) : (
              "今の私は、こっち。"
            )}
          </button>
        </div>
      </div>

      {/* 背景装飾 */}
      <div className="fixed inset-0 bg-gradient-to-b from-sky-50/50 to-white -z-10" />
    </div>
  );
}

// --- サブコンポーネント: 対決カード ---

interface CardProps {
  type: "system" | "user";
  functionCode: FunctionCode;
  title: string;
  description: string;
  isSelected: boolean;
  isOtherSelected: boolean;
  onClick: () => void;
  loading: boolean;
}

const ConflictCard: React.FC<CardProps> = ({
  type,
  functionCode,
  title,
  description,
  isSelected,
  isOtherSelected,
  onClick,
  loading,
}) => {
  const iconUrl = getCellImage(functionCode);
  const isSystem = type === "system";

  // 文言の定義
  const badgeText = isSystem
    ? "これまでの回答と、つじつまが合うのは"
    : "でもあの時、あなたが選んだのは";

  // 色定義：システム(青系) / ユーザー(オレンジ系)
  const badgeColor = isSystem
    ? "bg-blue-50 text-blue-600 border-blue-100"
    : "bg-orange-50 text-orange-600 border-orange-100";
  const activeClass = isSystem
    ? "bg-blue-50/90 border-blue-300 ring-4 ring-blue-100"
    : "bg-orange-50/90 border-orange-300 ring-4 ring-orange-100";

  return (
    <motion.button
      onClick={onClick}
      disabled={loading}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      className={`
        relative flex-1 w-full md:w-[24rem] p-6 rounded-[2.5rem] text-center transition-all duration-300 group
        border-2 flex flex-col items-center h-full overflow-hidden
        ${
          isSelected
            ? `${activeClass} shadow-xl z-10 scale-[1.02]`
            : isOtherSelected
            ? "bg-white/40 border-slate-100 opacity-50 grayscale blur-[1px] scale-95"
            : "bg-white border-slate-100 hover:border-slate-300 shadow-lg hover:shadow-xl"
        }
      `}
    >
      {/* 1. アイコン（メインビジュアル） */}
      {/* 枠から解放して大きく表示 */}
      <div className="relative w-28 h-28 mb-3 filter drop-shadow-sm transition-transform duration-300 group-hover:scale-110">
        {iconUrl && (
          <Image
            src={iconUrl}
            alt={functionCode}
            fill
            className={`object-contain ${isSystem ? "scale-x-[-1]" : ""}`}
          />
        )}
      </div>

      {/* 2. ラベルバッジ（文脈） */}
      <div
        className={`px-3 py-1 rounded-full text-[10px] md:text-xs font-bold border mb-4 tracking-wide ${badgeColor}`}
      >
        {badgeText}
      </div>

      {/* 3. 吹き出し風エリア（タイトル＋本文） */}
      <div className="w-full bg-white/60 rounded-2xl p-5 border border-white/50 shadow-inner text-left relative flex-1 flex flex-col">
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white/60 border-t border-l border-white/50 transform rotate-45" />

        <h3
          className={`text-lg md:text-xl font-bold mb-2 leading-snug ${
            isSelected ? "text-slate-900" : "text-slate-700"
          }`}
        >
          {title}
        </h3>

        <div className="w-full h-px bg-slate-400/10 my-2" />

        <p
          className={`text-sm leading-relaxed ${
            isSelected ? "text-slate-700" : "text-slate-500"
          }`}
        >
          {description}
        </p>
      </div>

      {/* 選択中のチェックマーク */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-4 right-4 w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white"
        >
          ✓
        </motion.div>
      )}
    </motion.button>
  );
};
