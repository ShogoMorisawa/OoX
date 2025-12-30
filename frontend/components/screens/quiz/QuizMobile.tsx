"use client";

import Image from "next/image";
import { QuizViewProps } from "./index";

export default function QuizMobile(props: QuizViewProps) {
  const {
    index,
    totalQuestions,
    currentQuestion,
    currentAnswer,
    isLastQuestion,
    loading,
    loadingMessage,
    quicksandClassName,
    onSelect,
    onNext,
    onPrev,
  } = props;

  const choices = currentQuestion.choices;
  // 進捗率の計算 (0% -> 100%)
  const progressPercent = ((index + 1) / totalQuestions) * 100;

  return (
    <div className="min-h-screen w-full relative overflow-hidden font-sans flex flex-col items-center py-6">
      {/* 1. 背景レイヤー */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{ backgroundImage: "url(/images/oox_background.png)" }}
      />
      {/* 全体のトーンを整えるフィルター */}
      <div className="absolute inset-0 bg-sky-50/20 pointer-events-none" />

      {/* メインコンテンツコンテナ */}
      <div className="relative z-10 w-full max-w-md px-5 flex flex-col h-full grow">
        {/* 2. ヘッダーエリア (進捗バー) */}
        <div className="w-full flex flex-col items-center mb-4 shrink-0">
          <p className="text-xs font-bold tracking-widest text-slate-500 mb-2 uppercase">
            QUESTION {index + 1} / {totalQuestions}
          </p>
          <div className="w-48 h-1.5 bg-white/30 rounded-full overflow-hidden backdrop-blur-sm border border-white/20">
            <div
              className="h-full bg-gradient-to-r from-sky-300 to-sky-400 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* 3. キャラクターエリア (指示によりコメントアウト中) */}
        <div className="flex justify-center mb-[-12px] z-20 shrink-0 h-20 items-end">
          <div className="relative w-24 h-24 animate-[float_4s_ease-in-out_infinite]">
            <Image
              src="/images/hie_cells/king/left_Te.png"
              alt="Character"
              fill
              className="object-contain drop-shadow-lg"
              priority
            />
          </div>
        </div>

        {/* 4. 質問エリア (すりガラス吹き出し) */}
        <div className="relative w-full mb-6 shrink-0">
          <div className="relative bg-white/50 backdrop-blur-md rounded-[2rem] p-6 shadow-xl border border-white/60 text-center min-h-[140px] flex flex-col items-center justify-center">
            {/* 吹き出しのしっぽ (CSSトリック) */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-white/50 backdrop-blur-md border-t border-l border-white/60 rotate-45" />

            {/* 質問タイプラベル */}
            <span className="absolute top-4 text-[10px] text-slate-400 font-bold tracking-widest uppercase bg-white/40 px-2 py-0.5 rounded-full">
              {currentQuestion.type === "comparison"
                ? "COMPARISON"
                : "DIAGNOSIS"}
            </span>

            {/* 質問本文 */}
            <h2 className="relative z-10 text-slate-800 font-medium leading-relaxed text-sm md:text-base tracking-wide mt-4">
              {currentQuestion.text}
            </h2>
          </div>
        </div>

        {/* ローディング表示 */}
        {loading && (
          <div className="text-center text-xs text-slate-600 font-medium animate-pulse mb-2">
            {loadingMessage}
          </div>
        )}

        {/* 5. 回答エリア (縦積みリスト) */}
        <div className="flex flex-col gap-3 w-full mb-4 grow justify-start">
          {choices.map((c, i) => {
            const isSelected = currentAnswer === c.choiceId;

            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelect(c.choiceId)}
                disabled={loading}
                className={[
                  "group relative w-full p-5 rounded-2xl text-left transition-all duration-200",
                  "bg-white/40 backdrop-blur-md border",
                  // 選択状態のスタイル切り替え
                  isSelected
                    ? "bg-sky-100/60 border-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.3)] scale-[1.02]"
                    : "border-white/50 shadow-sm hover:bg-white/60 hover:scale-[1.01] hover:shadow-md",
                  loading ? "opacity-60" : "",
                ].join(" ")}
              >
                <div className="flex items-center gap-4">
                  {/* A/B ラベル */}
                  <div
                    className={`
                    flex items-center justify-center w-8 h-8 rounded-full shrink-0 font-bold text-sm
                    ${quicksandClassName}
                    ${
                      isSelected
                        ? "bg-sky-500 text-white"
                        : "bg-white/50 text-sky-600"
                    }
                  `}
                  >
                    {i === 0 ? "A" : "B"}
                  </div>

                  {/* 選択肢テキスト */}
                  <span
                    className={`text-sm font-medium leading-relaxed ${
                      isSelected ? "text-slate-900" : "text-slate-700"
                    }`}
                  >
                    {c.text}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* 6. ナビゲーション (下部固定) */}
        <div className="flex w-full justify-between items-center px-2 pb-4 mt-auto shrink-0 z-20">
          <button
            type="button"
            onClick={onPrev}
            disabled={index === 0 || loading}
            className="text-sm text-slate-500 hover:text-slate-700 disabled:opacity-0 transition-colors font-medium px-4 py-2"
          >
            ← Back
          </button>

          {currentAnswer && (
            <button
              type="button"
              onClick={onNext}
              disabled={loading}
              className="px-8 py-3 rounded-full bg-white text-sky-600 font-bold text-sm shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all animate-bounce-slow disabled:opacity-60 border border-sky-100"
            >
              {isLastQuestion ? "結果を見る" : "Next →"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
