import { Suspense } from "react";
import TestQuizClient from "./test-quiz-client";

export default function TestQuizPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-slate-600">
          Loading...
        </div>
      }
    >
      <TestQuizClient />
    </Suspense>
  );
}
