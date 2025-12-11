import { useState } from "react";

import {
  FunctionCode,
  OrderElement,
  CalculateResponse,
  DescribeResponse,
  // Question, // 開発用でコメントアウト中
} from "@/types/oox";
import { OOX_STEPS, Step } from "@/constants/steps";
// import { QUESTIONS } from "@/constants/questions"; // 開発用でコメントアウト中
import { API_BASE_URL } from "@/constants/api";

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

  // --- Handlers ---
  // スタートボタンを押した時の処理
  const handleStart = () => {
    setStep(OOX_STEPS.QUIZ);
  };

  // 回答を変更したときの処理
  const handleChange = (id: string, value: FunctionCode) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  // 選択肢をクリックしたときの処理
  const handleSelectOrder = (func: FunctionCode) => {
    if (resolvedBlock.includes(func)) return;
    setResolvedBlock([...resolvedBlock, func]);
  };

  // 葛藤解決画面でリセットボタンを押したときの処理
  const handleResetConflict = () => {
    setResolvedBlock([]);
  };

  // 葛藤解決画面で決定ボタンを押したときの処理
  const handleConfirmConflict = async () => {
    if (!calculateResult) return;

    // 今の order をコピー
    const newOrder = [...calculateResult.order];

    // 現在の葛藤箇所に resolvedBlock を埋め込む
    const conflictIndex = newOrder.findIndex((el) => Array.isArray(el));

    if (conflictIndex !== -1) {
      newOrder.splice(conflictIndex, 1, ...resolvedBlock);

      // 状態更新
      setCalculateResult({ ...calculateResult, order: newOrder });
      setResolvedBlock([]);

      // 次の葛藤を探す
      const nextConflictIndex = newOrder.findIndex((el) => Array.isArray(el));
      if (nextConflictIndex !== -1) {
        const block = newOrder[nextConflictIndex] as FunctionCode[];
        setConflictBlock(block);
      } else {
        // 全て解決したら Describe へ
        await handleDescribe(newOrder as FunctionCode[]);
      }
    }
  };

  // 序列を計算する (/api/calculate)
  const handleCalculate = async () => {
    setLoading(true);
    setLoadingMessage("思考回路を解析中...");
    setCalculateResult(null);
    setResolvedBlock([]);

    // 開発用: 固定値で葛藤を発生させる
    // 構造: Ni(王) -> [Fe, Fi, Te](葛藤ブロック) -> [Ti, Ne, Si](葛藤ブロック) -> Se
    // Ni から両ブロックへ支配エッジを張り、Fe→Ti でブロック間の順序を固定、Ti→Se で Se を最後に
    const matches = [
      // Ni から各ブロックへ
      { id: "dev1", winner: "Ni", loser: "Fe" },
      { id: "dev2", winner: "Ni", loser: "Fi" },
      { id: "dev3", winner: "Ni", loser: "Te" },
      { id: "dev4", winner: "Ni", loser: "Ti" },
      { id: "dev5", winner: "Ni", loser: "Ne" },
      { id: "dev6", winner: "Ni", loser: "Si" },

      // 葛藤ブロック (Fe > Fi > Te > Fe)
      { id: "dev7", winner: "Fe", loser: "Fi" },
      { id: "dev8", winner: "Fi", loser: "Te" },
      { id: "dev9", winner: "Te", loser: "Fe" },

      // ブロック間の順序を固定 (Fe -> Ti)
      { id: "dev10", winner: "Fe", loser: "Ti" },

      // 葛藤ブロック (Ti > Ne > Si > Ti)
      { id: "dev11", winner: "Ti", loser: "Ne" },
      { id: "dev12", winner: "Ne", loser: "Si" },
      { id: "dev13", winner: "Si", loser: "Ti" },

      // 最後に Se をぶら下げる
      { id: "dev14", winner: "Ti", loser: "Se" },
    ];

    // 元の実装（コメントアウト）
    // const matches = QUESTIONS.map((q: Question) => ({
    //   id: q.id,
    //   winner: answers[q.id],
    //   loser: answers[q.id] === q.left ? q.right : q.left,
    // }));

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

      // 葛藤ブロック（配列）があるか探す
      const conflictIndex = data.order.findIndex((el) => Array.isArray(el));
      const hasConflict = conflictIndex !== -1;

      if (hasConflict) {
        const block = data.order[conflictIndex] as FunctionCode[];
        setConflictBlock(block);
        setStep(OOX_STEPS.RESOLVE); // 解決画面へ
        setLoading(false); // 一旦ロード解除
      } else {
        // 葛藤がなければそのまま分析へ
        await handleDescribe(data.order as FunctionCode[]);
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

  // 再スタート処理
  const handleRestart = () => {
    setStep(OOX_STEPS.QUIZ);
    // 必要なら answers などをリセットする処理もここに追加
    setAnswers({});
    setCalculateResult(null);
    setDescribeResult(null);
    setConflictBlock([]);
    setResolvedBlock([]);
  };

  // Geminiに分析してもらう (/api/describe)
  const handleDescribe = async (rawOrder: OrderElement[]) => {
    setLoading(true);
    setLoadingMessage("Geminiがあなたの魂を言語化しています...");

    // 1. データを整形
    const finalOrder = rawOrder.flat() as FunctionCode[];

    // 2. 健全度と階層を自動生成 (MVP用: 仮データ)
    // 本当はユーザーが回答したり設定したりする
    const healthStatus: Record<string, string> = {};
    const tierMap: Record<string, string> = {};

    finalOrder.forEach((func, index) => {
      // 健全度をランダムっぽく設定
      healthStatus[func] = index % 3 === 0 ? "O" : index % 3 === 1 ? "o" : "x";

      // 階層を順位に基づいて自動割り当て
      if (index < 2) tierMap[func] = "Dominant"; // 1-2位
      else if (index < 4) tierMap[func] = "High"; // 3-4位
      else if (index < 6) tierMap[func] = "Middle"; // 5-6位
      else tierMap[func] = "Low"; // 7-8位
    });

    const url = `${API_BASE_URL}/api/describe`;
    const requestBody = { finalOrder, healthStatus, tierMap };

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
      setStep(OOX_STEPS.RESULT); // 結果画面へ移動
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
    handleStart,
    handleChange,
    handleSelectOrder,
    handleResetConflict,
    handleConfirmConflict,
    handleCalculate,
    handleDescribe,
    handleRestart,
  };
};
