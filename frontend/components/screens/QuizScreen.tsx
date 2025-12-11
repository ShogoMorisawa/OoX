"use client";

import { useState } from "react";
import Image from "next/image";
import { Quicksand } from "next/font/google";
import { FunctionCode, Question } from "@/types/oox";
import { CELL_COLORS } from "@/constants/cells";

type Props = {
  questions: Question[];
  answers: Record<string, FunctionCode>;
  loading: boolean;
  loadingMessage: string;
  onChange: (id: string, value: FunctionCode) => void;
  onCalculate: () => void;
};

const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

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
  const isLastQuestion = index === totalQuestions - 1;
  const progress = (index + 1) / totalQuestions;
  const currentAnswer = answers[currentQuestion.id];

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
    <div className="min-h-screen w-full relative overflow-hidden font-sans">
      {/* 背景画像 */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url(/images/oox_background.png)" }}
      />

      {/* 背景オーバーレイ（テキストの可読性を保つため） */}
      <div className="absolute inset-0 bg-white/20" />

      {/* --- メインコンテンツ --- */}
      <div className="relative z-10 flex flex-col items-center pt-8 pb-32 px-6 max-w-md mx-auto h-full min-h-screen justify-between">
        {/* 1. 質問バブル（上部） -> 画像に変更 */}
        <div className="w-full animate-float-slow relative min-h-[12rem] flex items-center justify-center">
          {/* ▼ 背景画像 (oox_quiz_question.png) */}
          <div className="absolute inset-0 w-full h-full z-0 pointer-events-none drop-shadow-lg">
            <Image
              src="/images/oox_quiz_question.png"
              alt="Question bubble"
              fill
              className="object-fill" // テキスト量に合わせて枠を引き伸ばす
              priority
            />
          </div>

          {/* ▼ テキストコンテンツ (画像の上に重ねる) */}
          <div className="relative z-10 p-8 text-center pb-10">
            <p className="text-gray-500 text-xs font-bold tracking-widest mb-3 uppercase">
              Question {index + 1}
            </p>
            <h2 className="text-slate-800 text-lg md:text-xl font-medium leading-relaxed tracking-wide">
              {currentQuestion.text}
            </h2>
          </div>
        </div>

        {/* 2. 回答ボタンエリア（中部） -> 画像に変更 */}
        <div className="w-full grid grid-cols-2 gap-4 mt-8">
          {/* 左の選択肢 (A) */}
          <button
            onClick={() => handleSelect("left")}
            className={`
              relative group aspect-square rounded-[2.5rem] flex flex-col items-center justify-center transition-all duration-300
              ${
                currentAnswer === currentQuestion.left
                  ? "scale-105"
                  : "hover:-translate-y-1"
              }
            `}
          >
            {/* ▼ 背景画像 (oox_quiz_choice-lightBlue.png) */}
            <div className="absolute inset-0 w-full h-full z-0 rounded-[2.5rem] overflow-hidden drop-shadow-md">
              <Image
                src="/images/oox_quiz_choice-lightBlue.png"
                alt="Choice A background"
                fill
                className="object-cover"
              />
              {/* 選択時の色付きオーバーレイ（水色） */}
              <div
                className={`absolute inset-0 bg-sky-500/20 mix-blend-overlay transition-opacity duration-300 ${
                  currentAnswer === currentQuestion.left
                    ? "opacity-100"
                    : "opacity-0 group-hover:opacity-50"
                }`}
              />
            </div>

            {/* ▼ テキストコンテンツ */}
            <div className="relative z-10 flex flex-col items-center p-4">
              <span
                className={`text-xl font-bold mb-2 ${quicksand.className} text-slate-700`}
              >
                A
              </span>
              <span className="text-sm font-bold text-center leading-tight text-slate-700">
                {currentQuestion.left}
              </span>
            </div>
          </button>

          {/* 右の選択肢 (B) */}
          <button
            onClick={() => handleSelect("right")}
            className={`
              relative group aspect-square rounded-[2.5rem] flex flex-col items-center justify-center transition-all duration-300
              ${
                currentAnswer === currentQuestion.right
                  ? "scale-105"
                  : "hover:-translate-y-1"
              }
            `}
          >
            {/* ▼ 背景画像 (oox_quiz_choice-lightBlue.png) */}
            <div className="absolute inset-0 w-full h-full z-0 rounded-[2.5rem] overflow-hidden drop-shadow-md">
              <Image
                src="/images/oox_quiz_choice-lightBlue.png" // とりあえず両方同じ水色の画像
                alt="Choice B background"
                fill
                className="object-cover"
              />
              {/* 選択時の色付きオーバーレイ（ピンク） */}
              <div
                className={`absolute inset-0 bg-pink-500/20 mix-blend-overlay transition-opacity duration-300 ${
                  currentAnswer === currentQuestion.right
                    ? "opacity-100"
                    : "opacity-0 group-hover:opacity-50"
                }`}
              />
            </div>

            {/* ▼ テキストコンテンツ */}
            <div className="relative z-10 flex flex-col items-center p-4">
              <span
                className={`text-xl font-bold mb-2 ${quicksand.className} text-slate-700`}
              >
                B
              </span>
              <span className="text-sm font-bold text-center leading-tight text-slate-700">
                {currentQuestion.right}
              </span>
            </div>
          </button>
        </div>

        {/* ナビゲーションボタン (変更なし) */}
        <div className="flex w-full justify-between items-center mt-6 px-2 relative z-20">
          <button
            onClick={handlePrev}
            disabled={index === 0 || loading}
            className="text-sm text-slate-500 hover:text-slate-700 disabled:opacity-0 transition-colors font-medium"
          >
            ← Back
          </button>

          {currentAnswer && (
            <button
              onClick={handleNext}
              disabled={loading}
              className="px-6 py-2 rounded-full bg-white text-sky-600 font-bold text-sm shadow-md hover:shadow-lg transition-all animate-bounce-slow"
            >
              {isLastQuestion ? "結果を見る" : "Next →"}
            </button>
          )}
        </div>
      </div>

      {/* --- 3. 下部のシーン（ポッドと細胞） (変更なし) --- */}
      <div className="absolute bottom-0 left-0 w-full h-48 flex justify-center items-end pb-4 pointer-events-none z-0">
        {/* ... (細胞とポッドのコードは以前と同じ) ... */}
        {/* 左の細胞（赤） */}
        <div className="absolute left-[10%] bottom-16 w-20 h-20 animate-float-medium z-20">
          <Image
            src="/images/oox_start_cell-red.png"
            alt="Red Cell"
            width={100}
            height={100}
            className="object-contain drop-shadow-xl"
          />
        </div>
        {/* 右の細胞（青） */}
        <div className="absolute right-[10%] bottom-24 w-20 h-20 animate-float-fast z-20">
          <Image
            src="/images/oox_start_cell-lightBlue.png"
            alt="Blue Cell"
            width={80}
            height={80}
            className="object-contain drop-shadow-xl"
          />
        </div>
        {/* 中央のポッド（水位計） */}
        <div className="relative z-10 w-32 h-40 flex items-end justify-center">
          <div
            className="absolute bottom-2 w-[80%] bg-sky-300/40 rounded-b-[2rem] overflow-hidden transition-all duration-1000 ease-in-out"
            style={{ height: `${20 + progress * 70}%` }}
          >
            <div className="absolute top-0 left-0 w-[200%] h-4 bg-sky-200/50 animate-wave opacity-70" />
            <div className="w-full h-full bg-gradient-to-t from-sky-400/30 to-sky-100/10" />
          </div>
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
  );
}
