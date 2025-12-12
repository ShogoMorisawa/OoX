"use client";

import StartScreen from "@/components/screens/mobile/StartScreen";
import QuizScreen from "@/components/screens/mobile/QuizScreen";
import ResolveScreen from "@/components/screens/mobile/ResolveScreen";
import ResultScreen from "@/components/screens/mobile/ResultScreen";
import MobileHierarchyScreen from "@/components/screens/mobile/HierarchyScreen";
import { OOX_STEPS } from "@/constants/steps";
import { QUESTIONS } from "@/constants/questions";
import type { FunctionCode } from "@/types/oox";
import { useOoX } from "@/hooks/useOoX";

type Props = {
  oox: ReturnType<typeof useOoX>;
};

export default function MobileScreens({ oox }: Props) {
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

  if (step === OOX_STEPS.START) return <StartScreen onStart={handleStart} />;

  if (step === OOX_STEPS.QUIZ)
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

  if (step === OOX_STEPS.RESOLVE && calculateResult)
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

  if (step === OOX_STEPS.HIERARCHY && calculateResult)
    return (
      <MobileHierarchyScreen
        calculateResult={calculateResult}
        tierMap={tierMap}
        loading={loading}
        loadingMessage={loadingMessage}
        onUpdateTier={handleUpdateTier}
        onConfirmHierarchy={handleConfirmHierarchy}
      />
    );

  if (step === OOX_STEPS.RESULT && describeResult && calculateResult)
    return (
      <ResultScreen
        calculateResult={calculateResult}
        describeResult={describeResult}
        onRestart={handleRestart}
      />
    );

  return null;
}
