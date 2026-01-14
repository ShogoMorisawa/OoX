"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import QuizScreen from "@/components/screens/quiz";
import type { AnswerData, Question } from "@/types/oox";
import { fetchQuestions } from "@/lib/supabase/questions";
import {
  LOADING_MESSAGES,
  ERROR_MESSAGES,
  TEST_MESSAGES,
} from "@/constants/messages";

export default function TestQuizClient() {
  const searchParams = useSearchParams();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, AnswerData>>({});
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  const initialIndex = useMemo(() => {
    const raw = searchParams.get("q");
    if (!raw) return undefined;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return undefined;
    return Math.max(0, Math.floor(parsed) - 1);
  }, [searchParams]);

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setLoadingQuestions(true);
        const data = await fetchQuestions();
        setQuestions(data);
      } catch (error) {
        console.error(ERROR_MESSAGES.FETCH_QUESTIONS_FAILED, error);
      } finally {
        setLoadingQuestions(false);
      }
    };

    loadQuestions();
  }, []);

  const handleChange = (
    id: string,
    choiceId: AnswerData["choiceId"],
    responseTimeMs: number
  ) => {
    setAnswers((prev) => ({
      ...prev,
      [id]: { choiceId, responseTimeMs },
    }));
  };

  const handleCalculate = () => {
    setLoading(true);
    setLoadingMessage(LOADING_MESSAGES.TESTING);
    setTimeout(() => {
      setLoading(false);
      setLoadingMessage("");
      console.log(TEST_MESSAGES.CALCULATE_TRIGGER);
    }, 1000);
  };

  if (loadingQuestions) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-600">
        {LOADING_MESSAGES.DEFAULT}
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="fixed top-4 left-4 z-50 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg border border-slate-200">
        <p className="text-sm text-slate-600 font-medium">
          {TEST_MESSAGES.QUIZ_TEST_MODE}
        </p>
        <p className="text-xs text-slate-500 mt-1">
          {TEST_MESSAGES.QUIZ_TEST_DESCRIPTION}
        </p>
      </div>
      <QuizScreen
        questions={questions}
        answers={answers}
        loading={loading}
        loadingMessage={loadingMessage}
        initialIndex={initialIndex}
        onChange={handleChange}
        onCalculate={handleCalculate}
      />
    </div>
  );
}
