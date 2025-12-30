import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

import {
  FunctionCode,
  OrderElement,
  CalculateResponse,
  DescribeResponse,
  Step,
  Tier,
  Question,
  Choice,
} from "@/types/oox";

import { OOX_STEPS } from "@/constants/steps";
import { OOX_TIER } from "@/constants/tier";
import { getIcon } from "@/constants/icons";
import { POLL_INTERVAL } from "@/constants/api";

import { buildMatchesFromAnswers } from "@/lib/oox/matches";
import { buildHealthScores } from "@/lib/oox/health";
import { buildDefaultTierMap, isCompleteTierMap } from "@/lib/oox/tier";
import { calculate } from "@/lib/api/calculate";
import { checkJobStatus, startDescribeJob } from "@/lib/api/describe";
import { fetchQuestions } from "@/lib/supabase/questions";

type ChoiceId = Choice["choiceId"]; // "A" | "B"

export const useOoX = () => {
  const router = useRouter();

  // --- State ---
  const [step, setStep] = useState<Step>(OOX_STEPS.START);
  const [answers, setAnswers] = useState<Record<string, ChoiceId>>({});

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);

  const [calculateResult, setCalculateResult] =
    useState<CalculateResponse | null>(null);
  const [tierMap, setTierMap] = useState<Partial<Record<FunctionCode, Tier>>>(
    {}
  );
  const [describeResult, setDescribeResult] = useState<DescribeResponse | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [conflictBlock, setConflictBlock] = useState<FunctionCode[]>([]);
  const [resolvedBlock, setResolvedBlock] = useState<FunctionCode[]>([]);
  const [finalOrder, setFinalOrder] = useState<FunctionCode[]>([]);

  // --- Effect: Supabaseから質問を取得 ---
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setLoadingQuestions(true);
        const questions = await fetchQuestions();
        setQuestions(questions);
      } catch (e) {
        console.error("質問データの取得に失敗:", e);
        alert("質問データの読み込みに失敗しました。");
      } finally {
        setLoadingQuestions(false);
      }
    };

    loadQuestions();
  }, []);

  // --- Handlers ---
  const handleStart = () => {
    setStep(OOX_STEPS.QUIZ);
  };

  const handleChange = (id: string, choiceId: ChoiceId) => {
    setAnswers((prev) => ({ ...prev, [id]: choiceId }));
  };

  const handleSelectOrder = (func: FunctionCode) => {
    if (resolvedBlock.includes(func)) return;
    setResolvedBlock([...resolvedBlock, func]);
  };

  const handleResetConflict = () => {
    setResolvedBlock([]);
  };

  const handleConfirmConflict = async () => {
    if (!calculateResult) return;

    const newOrder = [...calculateResult.order];
    const conflictIndex = newOrder.findIndex((el) => Array.isArray(el));

    if (conflictIndex !== -1) {
      newOrder.splice(conflictIndex, 1, ...resolvedBlock);

      setCalculateResult({ ...calculateResult, order: newOrder });
      setResolvedBlock([]);

      const nextConflictIndex = newOrder.findIndex((el) => Array.isArray(el));
      if (nextConflictIndex !== -1) {
        const block = newOrder[nextConflictIndex] as FunctionCode[];
        setConflictBlock(block);
      } else {
        // すべての葛藤が解決された場合、finalOrderを確定
        const flattenedOrder = newOrder.flat() as FunctionCode[];
        setFinalOrder(flattenedOrder);

        setStep(OOX_STEPS.HIERARCHY);
      }
    }
  };

  const handleCalculate = async () => {
    setLoading(true);
    setLoadingMessage("思考回路を解析中...");
    setCalculateResult(null);
    setResolvedBlock([]);

    const orderQuestions = questions.filter((q) => q.kind === "order");
    const healthQuestions = questions.filter((q) => q.kind === "health");
    const unanswered = orderQuestions.filter((q) => !answers[q.id]);

    if (unanswered.length > 0) {
      alert(`未回答の質問があります（${unanswered.length}問）`);
      setLoading(false);
      return;
    }

    const matches = buildMatchesFromAnswers(orderQuestions, answers);
    const healthScores = buildHealthScores(healthQuestions, answers);

    try {
      const data = await calculate(matches, healthScores);
      setCalculateResult(data);

      const conflictIndex = data.order.findIndex((el: OrderElement) =>
        Array.isArray(el)
      );
      const hasConflict = conflictIndex !== -1;

      if (hasConflict) {
        const block = data.order[conflictIndex] as FunctionCode[];

        setConflictBlock(block);
        setStep(OOX_STEPS.RESOLVE);
        setLoading(false);
      } else {
        // 葛藤がない場合、finalOrderを確定
        const flattenedOrder = data.order.flat() as FunctionCode[];
        setFinalOrder(flattenedOrder);

        const defaultTierMap = buildDefaultTierMap(data.order);
        setTierMap(defaultTierMap);
        setStep(OOX_STEPS.HIERARCHY);
        setLoading(false);
      }
    } catch (e) {
      console.error("Calculate API Error:", e);
      alert("計算エラーが発生しました");
      setLoading(false);
    }
  };

  const handleUpdateTier = (func: FunctionCode, tier: Tier) => {
    setTierMap((prev) => ({ ...prev, [func]: tier }));
  };

  const handleConfirmHierarchy = async () => {
    if (!calculateResult) return;

    // 実行前チェック: tierMapが完全かどうかを確認
    if (!isCompleteTierMap(tierMap)) {
      throw new Error("TierMap is incomplete");
    }

    // finalOrderはstateとして保存済みなのでそのまま使用
    // healthStatusはcalculateResult.healthをそのまま使用
    await handleDescribe(finalOrder, tierMap, calculateResult.health);
  };

  const handleDescribe = async (
    finalOrder: FunctionCode[],
    tierMap: Record<FunctionCode, Tier>,
    healthStatus: Record<FunctionCode, "O" | "o" | "x">
  ) => {
    setLoading(true);
    setLoadingMessage("Geminiがあなたの魂を言語化しています...");

    try {
      const jobId = await startDescribeJob(finalOrder, healthStatus, tierMap);
      checkPollJobStatus(jobId);
    } catch (e) {
      console.error("Describe API Error:", e);
      alert("分析エラーが発生しました");
      setLoading(false);
    }
  };

  const saveToSupabase = async (
    calcRes: CalculateResponse,
    descRes: DescribeResponse,
    currentTierMap: Partial<Record<FunctionCode, Tier>>
  ) => {
    try {
      const finalOrder = calcRes.order.flat() as FunctionCode[];
      const dominant = finalOrder[0];
      const second = finalOrder[1];

      // TierMapの補完（Stateが空の場合のデフォルト値適用）
      const finalTierMap: Record<string, Tier> = {};
      finalOrder.forEach((func, index) => {
        if (currentTierMap[func]) {
          finalTierMap[func] = currentTierMap[func]!;
        } else {
          if (index < 2) finalTierMap[func] = OOX_TIER.DOMINANT;
          else if (index < 4) finalTierMap[func] = OOX_TIER.HIGH;
          else if (index < 6) finalTierMap[func] = OOX_TIER.MIDDLE;
          else finalTierMap[func] = OOX_TIER.LOW;
        }
      });

      // アイコンURLを取得
      const iconUrl = getIcon(dominant, second);

      // DBへ保存
      const { error } = await supabase.from("user_results").insert({
        answers: answers,
        function_order: finalOrder,
        tier_map: finalTierMap,
        health_status: calcRes.health,
        dominant_function: dominant,
        second_function: second,
        title: descRes.title,
        description: descRes.description,
        icon_url: iconUrl,
      });

      if (error) throw error;
      console.log("Result saved to Supabase successfully!");
    } catch (e) {
      console.error("Auto Save Error:", e);
      // 自動保存失敗時はアラートを出さず、ログだけ残すか、サイレントに再試行するなどがスマート
    }
  };

  const checkPollJobStatus = async (jobId: string) => {
    try {
      const data = await checkJobStatus(jobId);

      if (data.status === "completed") {
        setDescribeResult(data.data);
        setStep(OOX_STEPS.RESULT);
        setLoading(false);

        if (calculateResult) {
          await saveToSupabase(calculateResult, data.data, tierMap);
        }
      } else if (data.status === "failed") {
        throw new Error(data.error);
      } else {
        setTimeout(() => checkPollJobStatus(jobId), POLL_INTERVAL);
      }
    } catch (e) {
      console.error("Polling Error:", e);
      const errorMessage =
        e instanceof Error ? e.message : "分析中にエラーが発生しました";
      alert(errorMessage);
      setLoading(false);
    }
  };

  const handleGoToWorld = () => {
    router.push("/world");
  };

  const handleRestart = () => {
    setStep(OOX_STEPS.START);
    setAnswers({});
    setCalculateResult(null);
    setTierMap({});
    setDescribeResult(null);
    setConflictBlock([]);
    setResolvedBlock([]);
    setFinalOrder([]);
  };

  return {
    step,
    answers,
    calculateResult,
    describeResult,
    loading: loading || loadingQuestions,
    loadingMessage: loadingQuestions
      ? "質問データを読み込み中..."
      : loadingMessage,
    questions,
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
    handleGoToWorld,
    handleRestart,
  };
};
