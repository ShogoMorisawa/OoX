import { Suspense } from "react";
import TestQuizClient from "./test-quiz-client";
import { LOADING_MESSAGES } from "@/constants/messages";

export default function TestQuizPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-slate-600">
          {LOADING_MESSAGES.DEFAULT}
        </div>
      }
    >
      <TestQuizClient />
    </Suspense>
  );
}
