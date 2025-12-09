import { useState } from "react";

import {
  FunctionCode,
  OrderElement,
  CalculateResponse,
  DescribeResponse,
  Question,
} from "@/types/oox";
import { OOX_STEPS, Step } from "@/constants/steps";

export const useOoX = () => {
  // --- State ---
  const [step, setStep] = useState<Step>(OOX_STEPS.START); // 画面切り替え用

  const [answers, setAnswers] = useState<Record<string, FunctionCode>>({});

  const [calculateResult, setCalculateResult] =
    useState<CalculateResponse | null>(null);
  const [describeResult, setDescribeResult] = useState<DescribeResponse | null>(
    null
  );

  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [conflictBlock, setConflictBlock] = useState<FunctionCode[]>([]);
  const [resolvedBlock, setResolvedBlock] = useState<FunctionCode[]>([]);

  return {
    step,
    answers,
    calculateResult,
    describeResult,
    loading,
    loadingMessage,
    conflictBlock,
    resolvedBlock,
    setStep,
    setAnswers,
    setCalculateResult,
    setDescribeResult,
    setLoading,
    setLoadingMessage,
    setConflictBlock,
    setResolvedBlock,
  };
};
