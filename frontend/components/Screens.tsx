"use client";

import { useOoX } from "@/hooks/useOoX";
import StartScreen from "@/components/screens/start";
import QuizScreen from "@/components/screens/quiz";
import ResolveScreen from "@/components/screens/resolve";
import HierarchyScreen from "@/components/screens/hierarchy";
import ResultScreen from "@/components/screens/result";
import { OOX_STEPS } from "@/constants/steps";
import type { FunctionCode } from "@/types/oox";

export default function Screens() {
  const oox = useOoX();

  const {
    step,
    questions,
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

  if (step === OOX_STEPS.START) {
    return <StartScreen onStart={handleStart} />;
  }

  if (step === OOX_STEPS.QUIZ) {
    return (
      <QuizScreen
        questions={questions}
        answers={answers}
        loading={loading}
        loadingMessage={loadingMessage}
        onChange={handleChange}
        onCalculate={handleCalculate}
      />
    );
  }

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

  if (step === OOX_STEPS.RESULT && describeResult && calculateResult) {
    return (
      <ResultScreen
        calculateResult={calculateResult}
        describeResult={describeResult}
        onRestart={handleRestart}
      />
    );
  }

  return null;
}
