"use client";

import React, { useState } from "react";
import type { FunctionCode, Question } from "@/types/oox";
import ConflictCard from "./ConflictCard";
import ResolveHeader from "./ResolveHeader";
import type { ResolveScreenProps, ResolveViewProps } from "./types";

export default function ResolveScreen({
  conflictBlock,
  resolvedBlock,
  handleSelectOrder,
  handleConfirmConflict,
  loading,
  conflictQuestion,
}: ResolveScreenProps) {
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
    <ResolveView
      systemWinner={systemWinner}
      userWinner={userWinner}
      systemTitle={systemTitle}
      userTitle={userTitle}
      systemDescription={systemChoice?.text || ""}
      userDescription={userChoice?.text || ""}
      isSystemSelected={isSystemSelected}
      isUserSelected={isUserSelected}
      hasSelection={hasSelection}
      loading={loading}
      conflictQuestion={conflictQuestion}
      isDetailOpen={isDetailOpen}
      onToggleDetail={() => setIsDetailOpen((prev) => !prev)}
      onSelectSystem={() => handleSelectOrder(systemWinner)}
      onSelectUser={() => handleSelectOrder(userWinner)}
      onConfirm={handleConfirmConflict}
    />
  );
}

function ResolveView({
  systemWinner,
  userWinner,
  systemTitle,
  userTitle,
  systemDescription,
  userDescription,
  isSystemSelected,
  isUserSelected,
  hasSelection,
  loading,
  conflictQuestion,
  isDetailOpen,
  onToggleDetail,
  onSelectSystem,
  onSelectUser,
  onConfirm,
}: ResolveViewProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] px-4 py-6 md:py-10 relative">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{ backgroundImage: "url(/images/oox_background.png)" }}
      />
      <div className="absolute inset-0 bg-white/20 pointer-events-none" />
      {/* --- 1. ヘッダー領域 --- */}
      <ResolveHeader
        conflictQuestion={conflictQuestion}
        isDetailOpen={isDetailOpen}
        onToggleDetail={onToggleDetail}
      />

      {/* --- 2. 対決カード領域 --- */}
      <div className="flex flex-col md:flex-row items-stretch justify-center gap-6 md:gap-10 w-full max-w-6xl mb-24 relative z-10">
        <ConflictCard
          type="system"
          functionCode={systemWinner}
          title={systemTitle}
          description={systemDescription}
          isSelected={isSystemSelected}
          isOtherSelected={isUserSelected}
          onClick={onSelectSystem}
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
          description={userDescription}
          isSelected={isUserSelected}
          isOtherSelected={isSystemSelected}
          onClick={onSelectUser}
          loading={loading}
        />
      </div>

      <div className="fixed bottom-8 left-0 right-0 px-6 flex justify-center z-30 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-sm md:max-w-md shadow-2xl rounded-full">
          <button
            onClick={onConfirm}
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
