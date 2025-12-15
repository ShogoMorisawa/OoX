import { useMemo, useState, useEffect } from "react";
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
  SupabaseChoice,
} from "@/types/oox";

import { OOX_STEPS } from "@/constants/steps";
import { OOX_TIER } from "@/constants/tier";
import { API_BASE_URL } from "@/constants/api";

type ChoiceId = Choice["id"]; // "A" | "B"

type Match = {
  id: string;
  winner: FunctionCode;
  loser: FunctionCode;
};

// ... (findChoice, toHealthStatus 関数は変更なし)
function findChoice(
  questions: Question[],
  questionId: string,
  choiceId: ChoiceId
): Choice | undefined {
  const q = questions.find((q) => q.id === questionId);
  return q?.choices.find((c) => c.id === choiceId);
}

function toHealthStatus(sum: number, count: number): "O" | "o" | "x" {
  if (count <= 0) return "o";
  const ratio = sum / count;
  if (ratio >= 0.67) return "O";
  if (ratio >= 0.34) return "o";
  return "x";
}

export const useOoX = () => {
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

  // --- Effect: Supabaseから質問を取得 ---
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoadingQuestions(true);

        const { data, error } = await supabase
          .from("questions")
          .select(
            `
            *,
            choices (*)
          `
          )
          .order("display_order", { ascending: true });

        if (error) throw error;

        if (data) {
          const formattedQuestions: Question[] = data.map((q) => ({
            id: q.question_id,
            questionId: q.question_id,
            kind: q.kind,
            text: q.text,
            functionPair: q.function_pair,
            targetFunction: q.target_function,
            displayOrder: q.display_order,
            choices: (q.choices as SupabaseChoice[])
              .sort((a, b) => a.choice_id.localeCompare(b.choice_id))
              .map((c) => ({
                id: c.choice_id,
                choiceId: c.choice_id,
                questionId: q.question_id,
                text: c.text,
                relatedFunction: c.related_function,
                healthScore: c.health_score ?? 0,
              })),
          }));

          setQuestions(formattedQuestions);
        }
      } catch (e) {
        console.error("質問データの取得に失敗:", e);
        alert("質問データの読み込みに失敗しました。");
      } finally {
        setLoadingQuestions(false);
      }
    };

    fetchQuestions();
  }, []);

  // --- Derived: HealthStatus計算 ---
  const quizHealthStatus = useMemo(() => {
    const sums: Record<FunctionCode, number> = {
      Ni: 0,
      Ne: 0,
      Ti: 0,
      Te: 0,
      Fi: 0,
      Fe: 0,
      Si: 0,
      Se: 0,
    };
    const counts: Record<FunctionCode, number> = {
      Ni: 0,
      Ne: 0,
      Ti: 0,
      Te: 0,
      Fi: 0,
      Fe: 0,
      Si: 0,
      Se: 0,
    };

    for (const q of questions) {
      // ★修正: isHealthQuestion関数を使わず kind で判定
      if (q.kind !== "health") continue;

      if (!q.targetFunction) continue;

      const a = answers[q.id];
      if (!a) continue;

      const choice = q.choices.find((c) => c.id === a);
      if (choice) {
        sums[q.targetFunction] += choice.healthScore;
        counts[q.targetFunction] += 1;
      }
    }

    const healthStatus: Record<FunctionCode, "O" | "o" | "x"> = {
      Ni: toHealthStatus(sums.Ni, counts.Ni),
      Ne: toHealthStatus(sums.Ne, counts.Ne),
      Ti: toHealthStatus(sums.Ti, counts.Ti),
      Te: toHealthStatus(sums.Te, counts.Te),
      Fi: toHealthStatus(sums.Fi, counts.Fi),
      Fe: toHealthStatus(sums.Fe, counts.Fe),
      Si: toHealthStatus(sums.Si, counts.Si),
      Se: toHealthStatus(sums.Se, counts.Se),
    };

    return healthStatus;
  }, [answers, questions]);

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
        setStep(OOX_STEPS.HIERARCHY);
      }
    }
  };

  const buildMatchesFromAnswers = (): Match[] => {
    const matches: Match[] = [];

    for (const q of questions) {
      // ★修正: isOrderQuestion関数を使わず kind で判定
      if (q.kind !== "order") continue;

      const choiceId = answers[q.id];
      if (!choiceId) continue;

      const choice = q.choices.find((c) => c.id === choiceId);

      if (choice && choice.relatedFunction && q.functionPair) {
        const winner = choice.relatedFunction;
        const loser = q.functionPair.find((f) => f !== winner);

        if (loser) {
          matches.push({
            id: q.id,
            winner: winner,
            loser: loser,
          });
        }
      }
    }

    return matches;
  };

  const handleCalculate = async () => {
    setLoading(true);
    setLoadingMessage("思考回路を解析中...");
    setCalculateResult(null);
    setResolvedBlock([]);

    // ★修正: isOrderQuestion関数を使わず filter 内で直接判定
    const orderQuestions = questions.filter((q) => q.kind === "order");
    const unanswered = orderQuestions.filter((q) => !answers[q.id]);

    if (unanswered.length > 0) {
      alert(`未回答の質問があります（${unanswered.length}問）`);
      setLoading(false);
      return;
    }

    const matches = buildMatchesFromAnswers();
    const url = `${API_BASE_URL}/api/calculate`;
    const requestBody = { matches };

    try {
      console.log("Calculate API Request:", { url, body: requestBody });

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => "Unknown error");
        throw new Error(
          `Calc API error: ${res.status} ${res.statusText}\n${errorText}`
        );
      }

      const data: CalculateResponse = await res.json();
      setCalculateResult(data);

      const conflictIndex = data.order.findIndex((el) => Array.isArray(el));
      const hasConflict = conflictIndex !== -1;

      if (hasConflict) {
        const block = data.order[conflictIndex] as FunctionCode[];
        setConflictBlock(block);
        setStep(OOX_STEPS.RESOLVE);
        setLoading(false);
      } else {
        await handleDescribe(data.order, tierMap, data.health);
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
    await handleDescribe(
      calculateResult.order,
      tierMap,
      calculateResult.health
    );
  };

  const handleDescribe = async (
    rawOrder: OrderElement[],
    userTierMap?: Partial<Record<FunctionCode, Tier>>,
    healthFromCalc?: Record<FunctionCode, "O" | "o" | "x">
  ) => {
    setLoading(true);
    setLoadingMessage("Geminiがあなたの魂を言語化しています...");

    const finalOrder = rawOrder.flat() as FunctionCode[];
    const healthStatus = healthFromCalc ?? quizHealthStatus;

    const tierMapForApi: Partial<Record<FunctionCode, Tier>> = {};
    finalOrder.forEach((func, index) => {
      if (userTierMap && userTierMap[func]) {
        tierMapForApi[func] = userTierMap[func];
      } else {
        if (index < 2) tierMapForApi[func] = OOX_TIER.DOMINANT;
        else if (index < 4) tierMapForApi[func] = OOX_TIER.HIGH;
        else if (index < 6) tierMapForApi[func] = OOX_TIER.MIDDLE;
        else tierMapForApi[func] = OOX_TIER.LOW;
      }
    });

    const url = `${API_BASE_URL}/api/describe`;
    const requestBody = { finalOrder, healthStatus, tierMap: tierMapForApi };

    try {
      console.log("Describe API Request:", { url, body: requestBody });

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => "Unknown error");
        throw new Error(
          `Describe API error: ${res.status} ${res.statusText}\n${errorText}`
        );
      }

      const data: DescribeResponse = await res.json();
      setDescribeResult(data);
      setStep(OOX_STEPS.RESULT);
    } catch (e) {
      console.error("Describe API Error:", e);
      alert("分析エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const handleRestart = () => {
    setStep(OOX_STEPS.START);
    setAnswers({});
    setCalculateResult(null);
    setTierMap({});
    setDescribeResult(null);
    setConflictBlock([]);
    setResolvedBlock([]);
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
    handleRestart,
  };
};
