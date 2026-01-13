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

  // conflictBlockが空、または2つ揃っていない場合は表示しない（安全策）
  if (!conflictBlock || conflictBlock.length < 2 || !conflictQuestion) {
    return null;
  }

  const systemWinner = conflictBlock[0]; // 左：システムの推奨
  const userWinner = conflictBlock[1]; // 右：ユーザーの選択

  const systemChoice = conflictQuestion.choices.find(
    (choice) => choice.relatedFunctionCode === systemWinner
  );
  const userChoice = conflictQuestion.choices.find(
    (choice) => choice.relatedFunctionCode === userWinner
  );

  // 選択されているか判定
  const isSystemSelected = resolvedBlock.includes(systemWinner);
  const isUserSelected = resolvedBlock.includes(userWinner);
  const hasSelection = resolvedBlock.length > 0;

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] px-4 py-6 md:py-10 relative">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl mb-8 md:mb-12 z-10"
      >
        <div className="text-center mb-6">
          <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">
            Recall Your Conflict
          </span>
          <h2 className="text-xl md:text-3xl font-bold text-slate-800 mt-2 leading-snug">
            Q. {conflictQuestion.shortText || "この状況について"}
          </h2>
        </div>

        <div className="relative">
          <button
            onClick={() => setIsDetailOpen((prev) => !prev)}
            className="w-full text-center text-xs text-sky-600 hover:text-sky-700 font-medium flex items-center justify-center gap-1 transition-colors"
          >
            {isDetailOpen ? "質問文を閉じる" : "質問の全文を確認する"}
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
                <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 mt-3 text-sm text-slate-600 leading-relaxed shadow-inner border border-white/50 text-left">
                  {conflictQuestion.text}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <div className="flex flex-col md:flex-row items-stretch justify-center gap-4 md:gap-8 w-full max-w-5xl mb-24 relative z-10">
        <ConflictCard
          type="system"
          functionCode={systemWinner}
          title={systemChoice?.shortText || systemChoice?.text || "こちらの選択肢"}
          description={systemChoice?.text || ""}
          isSelected={isSystemSelected}
          isOtherSelected={isUserSelected}
          onClick={() => handleSelectOrder(systemWinner)}
          loading={loading}
        />

        <div className="flex flex-col items-center justify-center shrink-0 py-2 md:py-0 relative z-20">
          <div className="text-4xl md:text-5xl font-black text-slate-200 italic drop-shadow-sm">
            VS
          </div>
        </div>

        <ConflictCard
          type="user"
          functionCode={userWinner}
          title={userChoice?.shortText || userChoice?.text || "こちらの選択肢"}
          description={userChoice?.text || ""}
          isSelected={isUserSelected}
          isOtherSelected={isSystemSelected}
          onClick={() => handleSelectOrder(userWinner)}
          loading={loading}
        />
      </div>

      <div className="fixed bottom-8 left-0 right-0 px-6 flex justify-center z-30 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-md shadow-2xl rounded-full">
          <button
            onClick={handleConfirmConflict}
            disabled={!hasSelection || loading}
            className={`w-full h-14 text-lg font-bold transition-all duration-300 rounded-full flex items-center justify-center gap-2 ${
              hasSelection
                ? "bg-slate-900 hover:bg-slate-800 text-white transform hover:scale-105"
                : "bg-white text-slate-300 border border-slate-200 cursor-not-allowed"
            }`}
          >
            {loading ? (
              <>
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                再計算中...
              </>
            ) : (
              "これが私の真実"
            )}
          </button>
        </div>
      </div>

      <div className="fixed inset-0 bg-gradient-to-b from-sky-50/50 to-white -z-10" />
    </div>
  );
}

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
  const badgeText = isSystem ? "論理的な整合性" : "あなたの過去の選択";
  const badgeColor = isSystem
    ? "bg-blue-100 text-blue-700 border-blue-200"
    : "bg-orange-100 text-orange-700 border-orange-200";
  const activeClass = isSystem
    ? "bg-blue-50/80 border-blue-300 ring-4 ring-blue-100"
    : "bg-orange-50/80 border-orange-300 ring-4 ring-orange-100";

  return (
    <motion.button
      onClick={onClick}
      disabled={loading}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      className={`
        relative flex-1 w-full md:w-[26rem] p-6 md:p-8 rounded-[2rem] text-left transition-all duration-300 group
        border-2 flex flex-col h-full
        ${
          isSelected
            ? `${activeClass} shadow-xl z-10 scale-[1.02]`
            : isOtherSelected
            ? "bg-white/40 border-slate-100 opacity-50 grayscale blur-[1px] scale-95"
            : "bg-white border-slate-100 hover:border-slate-300 shadow-lg hover:shadow-xl"
        }
      `}
    >
      <div
        className={`self-start px-3 py-1.5 rounded-full text-[10px] font-bold border mb-4 tracking-wide ${badgeColor}`}
      >
        {badgeText}
      </div>

      <h3
        className={`text-lg md:text-xl font-bold mb-3 leading-snug ${
          isSelected ? "text-slate-900" : "text-slate-700"
        }`}
      >
        {title}
      </h3>

      <div className="flex-1 min-h-[4rem]">
        <p
          className={`text-sm leading-relaxed ${
            isSelected ? "text-slate-700" : "text-slate-500"
          }`}
        >
          {description}
        </p>
      </div>

      <div className="w-full h-px bg-slate-200/60 my-5" />

      <div className="flex items-center gap-3 opacity-90">
        <div className="w-10 h-10 rounded-full bg-white shadow-sm border border-slate-100 p-1.5 flex-shrink-0">
          {iconUrl && (
            <Image
              src={iconUrl}
              alt={functionCode}
              width={32}
              height={32}
              className="object-contain"
            />
          )}
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Base Function
          </span>
          <span className="text-sm font-black text-slate-600 font-mono">
            {functionCode}
          </span>
        </div>
      </div>

      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-3 -right-3 w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white"
        >
          ✓
        </motion.div>
      )}
    </motion.button>
  );
};
