"use client";

import Image from "next/image";
import { QuizViewProps } from "./index";

export default function QuizPC(props: QuizViewProps) {
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
  // 進捗率の計算
  const progressPercent = ((index + 1) / totalQuestions) * 100;

  return (
    <div className="min-h-screen w-full relative overflow-hidden font-sans flex flex-col items-center justify-center py-10 bg-slate-50">
      {/* 1. 背景レイヤー */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{ backgroundImage: "url(/images/oox_background.png)" }}
      />
      <div className="absolute inset-0 bg-sky-50/20 pointer-events-none" />

      {/* メインコンテンツエリア (PC用の幅広コンテナ) */}
      <div className="relative z-10 w-full max-w-5xl px-8 flex flex-col gap-8">
        {/* 2. ヘッダーエリア (進捗バー) */}
        <div className="w-full flex flex-col items-center justify-center mb-4">
          <p className="text-sm font-bold tracking-[0.2em] text-slate-500 mb-3 uppercase">
            QUESTION {index + 1} / {totalQuestions}
          </p>
          {/* PC版はバーを長くする */}
          <div className="w-[500px] h-2 bg-white/30 rounded-full overflow-hidden backdrop-blur-sm border border-white/20 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-sky-300 to-sky-400 rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(56,189,248,0.5)]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* 3. メイングリッド (左:キャラ / 右:質問&回答) */}
        <div className="flex flex-row items-start gap-10 min-h-[500px]">
          {/* 左カラム: キャラクターエリア (指示によりコメントアウト中) */}
          <div className="w-48 shrink-0 flex flex-col items-center pt-10 sticky top-10">
            <div className="relative w-40 h-40 animate-[float_4s_ease-in-out_infinite]">
              <Image
                src="/images/hie_cells/king/left_Te.png"
                alt="Character"
                fill
                className="object-contain drop-shadow-2xl"
                priority
              />
            </div>
          </div>

          {/* 右カラム: 会話＆選択肢エリア */}
          <div className="flex-1 flex flex-col gap-8 max-w-3xl">
            {/* 4. 質問エリア (すりガラス吹き出し) */}
            <div className="relative w-full group">
              {/* カード本体 */}
              <div className="relative bg-white/50 backdrop-blur-xl rounded-[2.5rem] p-10 shadow-2xl border border-white/60 text-left min-h-[160px] flex flex-col justify-center transition-transform duration-500 hover:scale-[1.01]">
                {/* 吹き出しのしっぽ (左側に向ける) */}
                <div className="absolute top-12 -left-3 w-8 h-8 bg-white/50 backdrop-blur-xl border-b border-l border-white/60 rotate-45" />

                {/* ラベル */}
                <span className="absolute top-6 left-10 text-[11px] text-slate-400 font-bold tracking-widest uppercase bg-white/60 px-3 py-1 rounded-full shadow-sm">
                  {currentQuestion.type === "comparison"
                    ? "Comparison Scenario"
                    : "Self Diagnosis"}
                </span>

                {/* 質問文 */}
                <h2 className="relative z-10 text-slate-800 text-xl font-medium leading-relaxed tracking-wide mt-6">
                  {currentQuestion.text}
                </h2>
              </div>
            </div>

            {/* ローディング表示 */}
            {loading && (
              <div className="text-center text-sm text-slate-600 font-medium animate-pulse">
                {loadingMessage}
              </div>
            )}

            {/* 5. 回答エリア (縦積みリスト) */}
            <div className="flex flex-col gap-4 w-full">
              {choices.map((c, i) => {
                const isSelected = currentAnswer === c.choiceId;

                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onSelect(c.choiceId)}
                    disabled={loading}
                    className={[
                      "group relative w-full p-6 rounded-[1.5rem] text-left transition-all duration-200",
                      "bg-white/40 backdrop-blur-md border",
                      isSelected
                        ? "bg-sky-50/80 border-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.2)] scale-[1.01]"
                        : "border-white/50 shadow-md hover:bg-white/70 hover:scale-[1.01] hover:shadow-lg hover:border-white/80",
                      loading ? "opacity-60 grayscale" : "",
                    ].join(" ")}
                  >
                    <div className="flex items-center gap-6">
                      {/* A/B マーカー */}
                      <div
                        className={`
                        flex items-center justify-center w-10 h-10 rounded-full shrink-0 font-bold text-lg shadow-sm transition-colors duration-300
                        ${quicksandClassName}
                        ${
                          isSelected
                            ? "bg-sky-500 text-white"
                            : "bg-white/80 text-sky-600 group-hover:bg-sky-100"
                        }
                      `}
                      >
                        {i === 0 ? "A" : "B"}
                      </div>

                      {/* 選択肢テキスト */}
                      <span
                        className={`text-lg font-medium leading-relaxed transition-colors duration-300 ${
                          isSelected
                            ? "text-slate-900"
                            : "text-slate-700 group-hover:text-slate-900"
                        }`}
                      >
                        {c.text}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* 6. ナビゲーション */}
            <div className="flex w-full justify-between items-center pt-4 px-2">
              <button
                type="button"
                onClick={onPrev}
                disabled={index === 0 || loading}
                className="text-slate-500 hover:text-slate-800 disabled:opacity-0 transition-colors font-bold text-sm flex items-center gap-2 px-4 py-2 rounded-full hover:bg-white/20"
              >
                ← Back
              </button>

              {currentAnswer && (
                <button
                  type="button"
                  onClick={onNext}
                  disabled={loading}
                  className="px-10 py-4 rounded-full bg-white text-sky-600 font-bold text-base shadow-xl hover:shadow-2xl hover:-translate-y-1 active:scale-95 transition-all animate-bounce-slow disabled:opacity-60 border border-sky-100"
                >
                  {isLastQuestion ? "View Results" : "Next Question →"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
