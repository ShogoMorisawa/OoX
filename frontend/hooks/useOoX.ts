import { useMemo, useState } from "react";

import {
  FunctionCode,
  OrderElement,
  CalculateResponse,
  DescribeResponse,
  Step,
  Tier,
  Question,
  Choice,
  isOrderQuestion,
  isHealthQuestion,
} from "@/types/oox";

import { OOX_STEPS } from "@/constants/steps";
import { OOX_TIER } from "@/constants/tier";
import { QUESTIONS } from "@/constants/questions";
import { API_BASE_URL } from "@/constants/api";

type ChoiceId = Choice["id"]; // "A" | "B" | "C"

type Match = {
  id: string;
  winner: FunctionCode;
  loser: FunctionCode;
};

function findChoice(
  question: Question,
  choiceId: ChoiceId
): Choice | undefined {
  return question.choices.find((c) => c.id === choiceId);
}

/**
 * health質問の 0/1 を集計して O/o/x に落とす
 * - ratio >= 0.67 -> "O"
 * - ratio >= 0.34 -> "o"
 * - else -> "x"
 */
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

  // answers は「質問id -> 選んだ選択肢id」
  const [answers, setAnswers] = useState<Record<string, ChoiceId>>({});

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

  // --- Derived (optional) ---
  // healthStatus を Quiz回答から作る（Describeで使う）
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

    for (const q of QUESTIONS) {
      if (!isHealthQuestion(q)) continue;

      const a = answers[q.id];
      if (!a) continue;

      const choice = findChoice(q, a);
      const v = choice?.effect?.health;
      if (v === 0 || v === 1) {
        sums[q.target] += v;
        counts[q.target] += 1;
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
  }, [answers]);

  // --- Handlers ---
  const handleStart = () => {
    setStep(OOX_STEPS.QUIZ);
  };

  // Quiz: 回答を変更（questionId -> choiceId）
  const handleChange = (id: string, choiceId: ChoiceId) => {
    setAnswers((prev) => ({ ...prev, [id]: choiceId }));
  };

  // Resolve: クリックで順序確定（葛藤ブロック内）
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

  // ✅ Quiz回答から matches を生成（order質問のみ）
  const buildMatchesFromAnswers = (): Match[] => {
    const matches: Match[] = [];

    for (const q of QUESTIONS) {
      if (!isOrderQuestion(q)) continue;

      const choiceId = answers[q.id];
      if (!choiceId) continue; // 未回答は飛ばす（本番はバリデーションしてもOK）

      const choice = findChoice(q, choiceId);
      if (!choice?.winner || !choice?.loser) {
        // order質問なのに winner/loser が無いのはデータ不整合
        continue;
      }

      matches.push({
        id: q.id,
        winner: choice.winner,
        loser: choice.loser,
      });
    }

    return matches;
  };

  const handleCalculate = async () => {
    setLoading(true);
    setLoadingMessage("思考回路を解析中...");
    setCalculateResult(null);
    setResolvedBlock([]);

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

      // conflict check
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
      const errorMessage =
        e instanceof Error
          ? `計算エラーが発生しました: ${e.message}`
          : "計算エラーが発生しました";
      alert(errorMessage);
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

  const handleRestart = () => {
    setStep(OOX_STEPS.START);
    setAnswers({});
    setCalculateResult(null);
    setTierMap({});
    setDescribeResult(null);
    setConflictBlock([]);
    setResolvedBlock([]);
  };

  // ✅ Describe: healthStatus は calculateResult.health を優先して使う
  // （今後、healthをサーバーで出す/クライアントで出す、どっちでも対応できる形）
  const handleDescribe = async (
    rawOrder: OrderElement[],
    userTierMap?: Partial<Record<FunctionCode, Tier>>,
    healthFromCalc?: Record<FunctionCode, "O" | "o" | "x">
  ) => {
    setLoading(true);
    setLoadingMessage("Geminiがあなたの魂を言語化しています...");

    const finalOrder = rawOrder.flat() as FunctionCode[];

    // healthStatus: サーバーの結果があればそれ、無ければQuiz集計を使う
    const healthStatus = healthFromCalc ?? quizHealthStatus;

    // tierMap: ユーザー指定があればそれ、無ければ順位から自動割り当て
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
      const errorMessage =
        e instanceof Error
          ? `分析エラーが発生しました: ${e.message}`
          : "分析エラーが発生しました";
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
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
  };
};
