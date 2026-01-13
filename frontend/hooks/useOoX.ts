import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  FunctionCode,
  CalculateResponse,
  DescribeResponse,
  Step,
  Tier,
  Question,
  Choice,
  AnswerData,
  Conflict,
  FixedMatch,
} from "@/types/oox";

import { OOX_STEPS } from "@/constants/steps";
import { OOX_TIER } from "@/constants/tier";
import { getIcon } from "@/constants/icons";
import { POLL_INTERVAL } from "@/constants/api";

import {
  buildRichAnswersFromState,
  buildAllRichAnswers,
} from "@/lib/oox/matches";
import { buildHealthScores } from "@/lib/oox/health";
import { buildDefaultTierMap, isCompleteTierMap } from "@/lib/oox/tier";
import { calculate } from "@/lib/api/calculate";
import { checkJobStatus, startDescribeJob } from "@/lib/api/describe";
import { saveResult } from "@/lib/api/results";
import { fetchQuestions } from "@/lib/supabase/questions";
import { getOrCreateBrowserId } from "@/utils/browserId";

type ChoiceId = Choice["choiceId"]; // "A" | "B"

export const useOoX = () => {
  const router = useRouter();

  // --- State ---
  const [step, setStep] = useState<Step>(OOX_STEPS.START);
  const [answers, setAnswers] = useState<Record<string, AnswerData>>({});

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
  const [currentConflict, setCurrentConflict] = useState<Conflict | null>(null);
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
        toast.error("質問データの読み込みに失敗しました。");
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

  const handleChange = (
    id: string,
    choiceId: ChoiceId,
    responseTimeMs: number
  ) => {
    setAnswers((prev) => ({
      ...prev,
      [id]: { choiceId, responseTimeMs },
    }));
  };

  const handleSelectOrder = (func: FunctionCode) => {
    // Resolve画面では1つだけ選択する想定（配列ではなく単一の値として扱う）
    if (resolvedBlock.includes(func)) {
      // 既に選択されている場合は解除
      setResolvedBlock([]);
    } else {
      // 新しく選択（既存の選択を上書き）
      setResolvedBlock([func]);
    }
  };

  const handleResetConflict = () => {
    setResolvedBlock([]);
  };

  const handleConfirmConflict = async () => {
    // UIで選択された勝者（resolvedBlock[0]に入っているはず）を取得
    // ※ UI側で「選択」ボタンを押すと handleSelectOrder が呼ばれ、resolvedBlock に1つだけ入る想定
    if (!calculateResult || resolvedBlock.length === 0 || !currentConflict)
      return;

    const selectedWinner = resolvedBlock[0];

    // 勝者じゃない方が敗者
    const loser =
      selectedWinner === currentConflict.user_winner
        ? currentConflict.system_order_winner
        : currentConflict.user_winner;

    // ★固定ルールを作成
    const fixedMatch: FixedMatch = {
      winner: selectedWinner,
      loser: loser,
    };

    setLoading(true);
    setLoadingMessage("再計算中...");

    // answers State は変わっていないので、そこから再構築するのが安全
    const orderQuestions = questions.filter((q) => q.type === "comparison");
    const healthQuestions = questions.filter((q) => q.type === "diagnostic");
    const richAnswers = buildRichAnswersFromState(orderQuestions, answers);
    const healthScores = buildHealthScores(healthQuestions, answers);

    try {
      // ★API再計算実行（固定ルール付き）
      const data = await calculate(richAnswers, healthScores, fixedMatch);
      setCalculateResult(data);

      // 再度チェック: まだ別の矛盾が残っているか？
      if (data.conflicts && data.conflicts.length > 0) {
        const nextConflict = data.conflicts[0];
        setCurrentConflict(nextConflict);
        setConflictBlock([
          nextConflict.system_order_winner,
          nextConflict.user_winner,
        ]);
        setResolvedBlock([]); // 選択解除

        // ステップは RESOLVE のまま維持
        setLoading(false);
      } else {
        // 全て解決！
        setFinalOrder(data.order);
        const defaultTierMap = buildDefaultTierMap(data.order);
        setTierMap(defaultTierMap);
        setStep(OOX_STEPS.HIERARCHY);
        setLoading(false);
      }
    } catch (e) {
      console.error("Re-calculation Error:", e);
      toast.error("再計算に失敗しました");
      setLoading(false);
    }
  };

  const handleCalculate = async () => {
    setLoading(true);
    setLoadingMessage("思考回路を解析中...");
    setCalculateResult(null);
    setResolvedBlock([]);
    setCurrentConflict(null); // リセット

    const orderQuestions = questions.filter((q) => q.type === "comparison");
    const healthQuestions = questions.filter((q) => q.type === "diagnostic");
    const unanswered = orderQuestions.filter((q) => !answers[q.id]);

    if (unanswered.length > 0) {
      toast.warning(`未回答の質問があります（${unanswered.length}問）`);
      setLoading(false);
      return;
    }

    const richAnswers = buildRichAnswersFromState(orderQuestions, answers);
    const healthScores = buildHealthScores(healthQuestions, answers);

    try {
      const data = await calculate(richAnswers, healthScores);
      setCalculateResult(data);

      // ★変更: conflicts配列をチェック
      if (data.conflicts && data.conflicts.length > 0) {
        // 最も深刻な矛盾（先頭）を取り出す
        const conflict = data.conflicts[0];
        setCurrentConflict(conflict);

        // UIに渡すための「対立している2つの機能」をセット
        // 順番はUIの表示に合わせて調整（例: 左=System, 右=User）
        setConflictBlock([conflict.system_order_winner, conflict.user_winner]);

        setStep(OOX_STEPS.RESOLVE);
        setLoading(false);
      } else {
        // 矛盾なし → そのまま完了
        setFinalOrder(data.order);
        const defaultTierMap = buildDefaultTierMap(data.order);
        setTierMap(defaultTierMap);
        setStep(OOX_STEPS.HIERARCHY);
        setLoading(false);
      }
    } catch (e) {
      console.error("Calculate API Error:", e);
      toast.error("計算エラーが発生しました");
      setLoading(false);
    }
  };

  const handleUpdateTier = (func: FunctionCode, tier: Tier) => {
    setTierMap((prev) => ({ ...prev, [func]: tier }));
  };

  const handleConfirmHierarchy = async (
    completeTierMap?: Record<FunctionCode, Tier>
  ) => {
    if (!calculateResult) return;

    // completeTierMapが渡されている場合はそれを使用、なければstateのtierMapを使用
    const finalTierMap = completeTierMap || tierMap;

    // 実行前チェック: tierMapが完全かどうかを確認
    if (!isCompleteTierMap(finalTierMap)) {
      throw new Error("TierMap is incomplete");
    }

    // finalOrderはstateとして保存済みなのでそのまま使用
    // healthStatusはcalculateResult.healthをそのまま使用
    await handleDescribe(finalOrder, finalTierMap, calculateResult.health);
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
      toast.error("分析エラーが発生しました");
      setLoading(false);
    }
  };

  const saveToSupabase = async (
    calcRes: CalculateResponse,
    descRes: DescribeResponse,
    currentTierMap: Partial<Record<FunctionCode, Tier>>
  ) => {
    try {
      // order は既に FunctionCode[] なので .flat() は不要
      const finalOrder = calcRes.order;
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

      // ブラウザIDを取得（なければ新規生成）
      const browserId = getOrCreateBrowserId();

      // 全質問の回答をRichAnswer形式に変換
      const allRichAnswers = buildAllRichAnswers(questions, answers);

      // DBへ保存
      await saveResult({
        answers: allRichAnswers,
        function_order: finalOrder,
        tier_map: finalTierMap,
        health_status: calcRes.health,
        dominant_function: dominant,
        second_function: second,
        title: descRes.title,
        description: descRes.description,
        icon_url: iconUrl,
        browser_id: browserId,
        user_id: null, // 現状は未ログイン
        is_public: true, // デフォルトで公開
      });

      console.log("Result saved to Supabase successfully!");
      toast.success("結果を保存しました");
    } catch (e) {
      console.error("Save Result Error:", e);
      toast.error("結果の保存に失敗しました");
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
      toast.error(errorMessage);
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
    setCurrentConflict(null);
    setConflictBlock([]);
    setResolvedBlock([]);
    setFinalOrder([]);
  };

  const conflictQuestion = currentConflict
    ? questions.find((q) => q.id === currentConflict.question_id)
    : undefined;

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
    conflictQuestion,
    currentConflict,
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
