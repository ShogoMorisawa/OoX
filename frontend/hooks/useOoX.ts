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
  SupabaseChoice,
} from "@/types/oox";

import { OOX_STEPS } from "@/constants/steps";
import { OOX_TIER } from "@/constants/tier";
import { API_BASE_URL, POLL_INTERVAL } from "@/constants/api";

type ChoiceId = Choice["id"]; // "A" | "B"

type Match = {
  id: string;
  winner: FunctionCode;
  loser: FunctionCode;
};

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

          // kindでソート: "order"を先に、"health"を後に。同じkind内ではdisplayOrderでソート
          const sortedQuestions = formattedQuestions.sort((a, b) => {
            if (a.kind !== b.kind) {
              // "order"を先に、"health"を後に
              if (a.kind === "order") return -1;
              if (b.kind === "order") return 1;
            }
            // 同じkind内ではdisplayOrderでソート
            return a.displayOrder - b.displayOrder;
          });

          setQuestions(sortedQuestions);
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

    const orderQuestions = questions.filter((q) => q.kind === "order");
    const unanswered = orderQuestions.filter((q) => !answers[q.id]);

    if (unanswered.length > 0) {
      alert(`未回答の質問があります（${unanswered.length}問）`);
      setLoading(false);
      return;
    }

    const matches = buildMatchesFromAnswers();

    const healthScores: Record<FunctionCode, number> = {
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
      // kindが'health'の質問のみ対象
      if (q.kind !== "health" || !q.targetFunction) continue;

      const a = answers[q.id];
      if (!a) continue;

      const choice = q.choices.find((c) => c.id === a);
      if (choice) {
        healthScores[q.targetFunction] += choice.healthScore;
      }
    }

    const url = `${API_BASE_URL}/api/calculate`;
    const requestBody = {
      matches,
      health_scores: healthScores,
    };

    try {
      console.log("Calculate API Request:", { url, body: requestBody });

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
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
        const defaultTierMap: Partial<Record<FunctionCode, Tier>> = {};
        const flatOrder = data.order.flat() as FunctionCode[];

        flatOrder.forEach((func, index) => {
          if (index < 2) defaultTierMap[func] = OOX_TIER.DOMINANT;
          else if (index < 4) defaultTierMap[func] = OOX_TIER.HIGH;
          else if (index < 6) defaultTierMap[func] = OOX_TIER.MIDDLE;
          else defaultTierMap[func] = OOX_TIER.LOW;
        });
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
    // healthFromCalc が必ずある前提（APIから返ってくる）
    const healthStatus = healthFromCalc || {};

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
      console.log("Describe API Request (Async Start):", {
        url,
        body: requestBody,
      });

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => "Unknown error");
        throw new Error(
          `Describe API error: ${res.status} ${res.statusText}\n${errorText}`
        );
      }

      const { job_id: jobId } = await res.json();
      if (!jobId) throw new Error("ジョブIDの取得に失敗しました");

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
        icon_url: "/images/oox_start_cell-red.png", // アイコンロジックがあればここで分岐
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
      const url = `${API_BASE_URL}/api/describe/status/${jobId}`;
      const res = await fetch(url, {
        headers: {
          Accept: "application/json",
        },
      });
      if (!res.ok) {
        if (res.status === 404) throw new Error("ジョブが見つかりません");
        throw new Error(`Status check failed: ${res.status}`);
      }
      const data = await res.json();
      console.log(`Job Status: ${data.status}`);

      if (data.status === "completed") {
        const resultData = data.data as DescribeResponse;

        setDescribeResult(resultData);
        setStep(OOX_STEPS.RESULT);
        setLoading(false);

        if (calculateResult) {
          await saveToSupabase(calculateResult, resultData, tierMap);
        }
      } else if (data.status === "failed") {
        throw new Error(data.error || "分析に失敗しました");
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
