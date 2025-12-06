"use client";

import { useState } from "react";
import { FunctionCode, Question } from "@/types/oox";

type Props = {
  questions: Question[];
  answers: Record<string, FunctionCode>;
  loading: boolean;
  loadingMessage: string;
  onChange: (id: string, value: FunctionCode) => void;
  onCalculate: () => void;
};

export default function QuizScreen({
  questions,
  answers,
  loading,
  loadingMessage,
  onChange,
  onCalculate,
}: Props) {
  const [index, setIndex] = useState(0);

  const totalQuestions = questions.length;
  const currentQuestion = questions[index];
  const currentAnswer = answers[currentQuestion.id];
  const isLastQuestion = index === totalQuestions - 1;
  const progress = (index + 1) / totalQuestions;

  const handleSelect = (choice: "left" | "right") => {
    if (loading) return;
    const value =
      choice === "left" ? currentQuestion.left : currentQuestion.right;
    onChange(currentQuestion.id, value);
  };
  const handleNext = () => {
    if (loading) return;
    if (!currentAnswer) return;
    if (!isLastQuestion) {
      setIndex(index + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      onCalculate();
    }
  };
  const handlePrev = () => {
    if (loading) return;
    if (index === 0) return;
    setIndex(index - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-sky-50 via-sky-50/60 to-white flex flex-col items-center py-12 px-4 overflow-hidden">
      {/* うっすら浮かぶ背景の粒 */}
      <div className="pointer-events-none absolute inset-0">
        <span className="absolute left-10 top-32 w-4 h-4 rounded-full bg-sky-100 opacity-60 animate-float-slow" />
        <span className="absolute right-16 top-52 w-6 h-6 rounded-full bg-sky-100 opacity-50 animate-float-medium" />
        <span className="absolute left-1/4 bottom-24 w-3 h-3 rounded-full bg-sky-100 opacity-40 animate-float-fast" />
        <span className="absolute right-1/5 bottom-32 w-8 h-8 rounded-full bg-sky-100 opacity-50 animate-float-slow" />
      </div>

      <h1 className="text-3xl font-bold mb-8 text-indigo-700 tracking-tight relative">
        OoX Mirror{" "}
        <span className="text-sm font-normal text-gray-500 ml-2">
          Prototype v0.1
        </span>
      </h1>

      <div className="w-full max-w-3xl bg-white/60 backdrop-blur-md rounded-3xl shadow-[0_18px_40px_rgba(148,163,184,0.25)] p-6 space-y-6 border border-white/60">
        {/* 現在の質問 */}
        <div className="space-y-4 rounded-2xl p-5 bg-white/60 backdrop-blur-sm border border-white/70 shadow-sm">
          <div className="flex items-center justify-between text-xs text-gray-400 font-mono mb-3">
            <span className="uppercase tracking-widest text-gray-500">Question</span>
            <span>
              Q{index + 1} / {totalQuestions}
            </span>
          </div>

          <p className="text-base text-gray-700 font-medium leading-relaxed">
            {currentQuestion.text}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() => handleSelect("left")}
              className={`w-full text-left p-4 rounded-2xl border transition-all 
                ${
                  currentAnswer === currentQuestion.left
                    ? "bg-sky-500 text-white border-sky-400 shadow-lg shadow-sky-200/60"
                    : "bg-sky-100/60 border-sky-100 text-gray-700 hover:-translate-y-0.5 hover:shadow-md"
                }`}
            >
              <span className="block text-sm font-semibold">{currentQuestion.left}</span>
            </button>

            <button
              onClick={() => handleSelect("right")}
              className={`w-full text-left p-4 rounded-2xl border transition-all 
                ${
                  currentAnswer === currentQuestion.right
                    ? "bg-pink-500 text-white border-pink-400 shadow-lg shadow-pink-200/60"
                    : "bg-sky-100/60 border-sky-100 text-gray-700 hover:-translate-y-0.5 hover:shadow-md"
                }`}
            >
              <span className="block text-sm font-semibold">
                {currentQuestion.right}
              </span>
            </button>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={handlePrev}
            disabled={loading}
            className="px-4 py-2 rounded-md text-sm font-bold text-gray-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:text-indigo-600"
          >
            {index > 0 ? "〈 戻る" : ""}
          </button>
          <button
            onClick={handleNext}
            disabled={loading || !currentAnswer}
            className="px-8 py-3 rounded-full text-white font-bold bg-gradient-to-r from-indigo-600 to-purple-600 disabled:opacity-60 shadow-md hover:shadow-lg transition-all"
          >
            {loading
              ? loadingMessage || "分析中..."
              : isLastQuestion
              ? "結果を見る"
              : "次の質問へ"}
          </button>
        </div>
      </div>
    </div>
  );
}
