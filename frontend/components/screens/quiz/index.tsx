"use client";

import { useState, useLayoutEffect, useRef } from "react";
import { Quicksand } from "next/font/google";

import QuizMobile from "./QuizMobile";
import QuizPC from "./QuizPC";
import { useIsMobile } from "@/hooks/useIsMobile";
import type { Choice, Question, AnswerData } from "@/types/oox";

type AnswerValue = Choice["choiceId"];

type Props = {
  questions: Question[];
  answers: Record<string, AnswerData>;
  loading: boolean;
  loadingMessage: string;
  onChange: (
    questionId: string,
    choiceId: AnswerValue,
    responseTimeMs: number
  ) => void;
  onCalculate: () => void;
};

export type QuizViewProps = {
  index: number;
  totalQuestions: number;
  currentQuestion: Question;
  currentAnswer?: AnswerValue;
  isLastQuestion: boolean;
  progress: number;
  loading: boolean;
  loadingMessage: string;
  quicksandClassName: string;
  onSelect: (choiceId: AnswerValue) => void;
  onNext: () => void;
  onPrev: () => void;
};

const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function QuizContainer({
  questions,
  answers,
  loading,
  loadingMessage,
  onChange,
  onCalculate,
}: Props) {
  const isMobile = useIsMobile();
  const [index, setIndex] = useState(0);
  const questionStartTimeRef = useRef<number | null>(null);

  const totalQuestions = questions.length;
  const currentQuestion = questions[index];

  const isLastQuestion = index === totalQuestions - 1;
  const progress = totalQuestions > 0 ? (index + 1) / totalQuestions : 0;
  const currentAnswer = currentQuestion
    ? answers[currentQuestion.id]?.choiceId
    : undefined;

  // 質問が表示された時点で開始時刻を記録
  // useLayoutEffectを使用して、DOM更新直後に時刻を記録
  useLayoutEffect(() => {
    if (currentQuestion) {
      questionStartTimeRef.current = performance.now();
    }
  }, [currentQuestion]);

  const handleSelect = (choiceId: AnswerValue) => {
    if (loading || !currentQuestion || !questionStartTimeRef.current) return;

    const responseTime = Math.round(
      performance.now() - questionStartTimeRef.current
    );
    onChange(currentQuestion.id, choiceId, responseTime);
  };

  const handleNext = () => {
    if (loading || !currentQuestion) return;
    if (!currentAnswer) return;

    if (!isLastQuestion) {
      setIndex((prev) => Math.min(prev + 1, totalQuestions - 1));
      window.scrollTo({ top: 0, behavior: "smooth" });
      // 次の質問に移るので、開始時刻をリセット（useLayoutEffectで再設定される）
      questionStartTimeRef.current = null;
    } else {
      onCalculate();
    }
  };

  const handlePrev = () => {
    if (loading || index === 0) return;
    setIndex((prev) => Math.max(prev - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!currentQuestion) return null;

  const viewProps: QuizViewProps = {
    index,
    totalQuestions,
    currentQuestion,
    currentAnswer,
    isLastQuestion,
    progress,
    loading,
    loadingMessage,
    quicksandClassName: quicksand.className,
    onSelect: handleSelect,
    onNext: handleNext,
    onPrev: handlePrev,
  };

  return isMobile ? <QuizMobile {...viewProps} /> : <QuizPC {...viewProps} />;
}
