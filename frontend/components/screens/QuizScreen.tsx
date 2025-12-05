"use client";

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
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">
      <h1 className="text-3xl font-bold mb-8 text-indigo-700 tracking-tight">
        OoX Mirror{" "}
        <span className="text-sm font-normal text-gray-500 ml-2">
          Prototype v0.1
        </span>
      </h1>

      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl p-6 space-y-6">
        {/* 質問リスト */}
        <div className="space-y-4 max-h-[60vh] overflow-y-auto border border-gray-100 rounded-xl p-4 bg-gray-50/50">
          {questions.map((q, index) => (
            <div
              key={q.id}
              className="bg-white p-4 rounded-lg shadow-sm border border-gray-100"
            >
              <p className="text-xs text-gray-400 mb-2 font-mono">
                Q{index + 1}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-gray-600 font-medium flex-1 text-center sm:text-left">
                  {q.text}
                </p>

                <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                  <button
                    onClick={() => onChange(q.id, q.left)}
                    className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
                      answers[q.id] === q.left
                        ? "bg-indigo-600 text-white shadow-md"
                        : "text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    {q.left}
                  </button>
                  <button
                    onClick={() => onChange(q.id, q.right)}
                    className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
                      answers[q.id] === q.right
                        ? "bg-pink-500 text-white shadow-md"
                        : "text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    {q.right}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* アクションボタン */}
        <button
          onClick={onCalculate}
          disabled={loading}
          className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg transition-all transform hover:scale-[1.01] active:scale-95
            ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            }
          `}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-5 w-5 text-white"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              {loadingMessage}
            </span>
          ) : (
            "分析を開始する"
          )}
        </button>
      </div>
    </div>
  );
}
