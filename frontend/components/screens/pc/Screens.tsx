"use client";

import StartScreen from "@/components/screens/start";
import QuizScreen from "@/components/screens/quiz";
import ResolveScreen from "@/components/screens/pc/ResolveScreen";
import HierarchyScreen from "@/components/screens/hierarchy";
import ResultScreen from "@/components/screens/pc/ResultScreen";
import { useOoX } from "@/hooks/useOoX";
import { FunctionCode } from "@/types/oox";
import { OOX_STEPS } from "@/constants/steps";
import { QUESTIONS } from "@/constants/questions";

type Props = {
  oox: ReturnType<typeof useOoX>;
};

export default function PcScreens({ oox }: Props) {
  const {
    step,
    answers,
    calculateResult,
    describeResult,
    loading,
    loadingMessage,
    conflictBlock,
    resolvedBlock,
    tierMap,
    handleStart,
    handleChange,
    handleSelectOrder,
    handleResetConflict,
    handleConfirmConflict,
    handleCalculate,
    handleUpdateTier,
    handleConfirmHierarchy,
    handleDescribe,
    handleRestart,
  } = oox;

  // --- UI Render ---
  // スタート画面
  if (step === OOX_STEPS.START) {
    return <StartScreen onStart={handleStart} />;
  }

  // Quiz画面
  if (step === OOX_STEPS.QUIZ) {
    return (
      <QuizScreen
        questions={QUESTIONS}
        answers={answers}
        loading={loading}
        loadingMessage={loadingMessage}
        onChange={handleChange}
        onCalculate={handleCalculate}
      />
    );
  }

  // 葛藤解決画面 (Resolve Phase)
  if (step === OOX_STEPS.RESOLVE && calculateResult) {
    return (
      <ResolveScreen
        calculateResult={calculateResult}
        conflictBlock={conflictBlock}
        resolvedBlock={resolvedBlock}
        onSelectOrder={handleSelectOrder}
        onReset={handleResetConflict}
        onConfirm={handleConfirmConflict}
        onDescribe={() =>
          handleDescribe(calculateResult.order as FunctionCode[])
        }
      />
    );
  }

  // 階層決定画面
  if (step === OOX_STEPS.HIERARCHY && calculateResult) {
    return (
      <HierarchyScreen
        calculateResult={calculateResult}
        tierMap={tierMap}
        loading={loading}
        loadingMessage={loadingMessage}
        onUpdateTier={handleUpdateTier}
        onConfirmHierarchy={handleConfirmHierarchy}
      />
    );
  }

  // 結果画面
  if (step === OOX_STEPS.RESULT && describeResult && calculateResult) {
    return (
      <ResultScreen
        calculateResult={calculateResult}
        describeResult={describeResult}
        onRestart={handleRestart}
      />
    );
  }
}
