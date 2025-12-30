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
    progress,
    loading,
    loadingMessage,
    quicksandClassName,
    onSelect,
    onNext,
    onPrev,
  } = props;

  const choices = currentQuestion.choices;
  const gridColsClass = choices.length === 3 ? "grid-cols-3" : "grid-cols-2";

  return (
    <div className="min-h-screen w-full relative overflow-hidden font-sans flex items-center justify-center py-10">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{ backgroundImage: "url(/images/oox_background.png)" }}
      />
      <div className="absolute inset-0 bg-white/20 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md px-6 flex flex-col items-center gap-6">
        <div className="w-full relative min-h-[12rem] flex items-center justify-center shrink-0">
          <div className="absolute inset-0 w-full h-full z-0 pointer-events-none drop-shadow-lg">
            <Image
              src="/images/oox_quiz_question.png"
              alt="Question bubble"
              fill
              className="object-fill"
              priority
            />
          </div>

          <div className="relative z-10 p-8 text-center pb-10">
            <p className="text-gray-500 text-xs font-bold tracking-widest mb-3 uppercase">
              Question {index + 1} / {totalQuestions}
            </p>

            <p className="text-[10px] text-gray-400 mb-2 uppercase tracking-widest">
              {currentQuestion.type === "comparison" ? "比較" : "診断"}
            </p>

            <h2 className="text-slate-800 text-lg md:text-xl font-medium leading-relaxed tracking-wide">
              {currentQuestion.text}
            </h2>
          </div>
        </div>

        {loading && (
          <div className="text-xs text-slate-600 font-medium">
            {loadingMessage}
          </div>
        )}

        <div className={`w-full grid ${gridColsClass} gap-4 shrink-0`}>
          {choices.map((c) => {
            const isSelected = currentAnswer === c.choiceId;

            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelect(c.choiceId)}
                disabled={loading}
                className={[
                  "relative group rounded-[2.5rem] flex flex-col items-center justify-center transition-all duration-300",
                  "min-h-[280px] h-[280px] w-full overflow-hidden",
                  isSelected ? "scale-105" : "hover:-translate-y-1",
                  loading ? "opacity-60" : "",
                ].join(" ")}
              >
                <div className="absolute inset-0 w-full h-full z-0 rounded-[2.5rem] overflow-hidden drop-shadow-md">
                  <Image
                    src="/images/oox_quiz_choice-lightBlue.png"
                    alt={`Choice ${c.id} background`}
                    fill
                    className="object-cover"
                  />
                  <div
                    className={[
                      "absolute inset-0 mix-blend-overlay transition-opacity duration-300",
                      isSelected
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-50",
                      "bg-sky-500/20",
                    ].join(" ")}
                  />
                </div>

                <div className="relative z-10 flex flex-col items-center justify-center p-5 w-full h-full">
                  <span
                    className={`text-xl font-bold mb-2 shrink-0 ${quicksandClassName} text-slate-700`}
                  >
                    {c.choiceId}
                  </span>

                  <span className="text-xs md:text-sm font-bold text-center leading-relaxed text-slate-700 whitespace-pre-line break-words px-3 w-full">
                    {c.text}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex w-full justify-between items-center px-2 relative z-20 h-10 shrink-0">
          <button
            type="button"
            onClick={onPrev}
            disabled={index === 0 || loading}
            className="text-sm text-slate-500 hover:text-slate-700 disabled:opacity-0 transition-colors font-medium"
          >
            ← Back
          </button>

          {currentAnswer && (
            <button
              type="button"
              onClick={onNext}
              disabled={loading}
              className="px-6 py-2 rounded-full bg-white text-sky-600 font-bold text-sm shadow-md hover:shadow-lg transition-all animate-bounce-slow disabled:opacity-60"
            >
              {isLastQuestion ? "結果を見る" : "Next →"}
            </button>
          )}
        </div>

        <div className="relative w-full h-40 mt-4 flex justify-center items-end shrink-0">
          <div className="absolute left-4 bottom-8 w-20 h-20 animate-float-medium z-20">
            <Image
              src="/images/oox_start_cell-red.png"
              alt="Red Cell"
              width={100}
              height={100}
              className="object-contain drop-shadow-xl"
            />
          </div>

          <div className="absolute right-4 bottom-12 w-20 h-20 animate-float-fast z-20">
            <Image
              src="/images/oox_start_cell-lightBlue.png"
              alt="Blue Cell"
              width={80}
              height={80}
              className="object-contain drop-shadow-xl"
            />
          </div>

          <div className="relative z-10 w-32 h-40 flex items-end justify-center">
            {/* TODO: 進捗に応じて水が溜まるアニメーション（未実装のためコメントアウト） */}
            {/* <div
              className="absolute bottom-2 w-[80%] bg-sky-300/40 rounded-b-[2rem] overflow-hidden transition-all duration-1000 ease-in-out"
              style={{ height: `${20 + progress * 70}%` }}
            >
              <div className="absolute top-0 left-0 w-[200%] h-4 bg-sky-200/50 animate-wave opacity-70" />
              <div className="w-full h-full bg-gradient-to-t from-sky-400/30 to-sky-100/10" />
            </div> */}
            <div className="absolute inset-0 w-full h-full">
              <Image
                src="/images/oox_start_pod.png"
                alt="Pod"
                fill
                className="object-contain opacity-90"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
