// frontend/app/page.tsx
"use client";

import { useState } from "react";

import StartScreen from "@/components/screens/StartScreen";
import QuizScreen from "@/components/screens/QuizScreen";
import ResolveScreen from "@/components/screens/ResolveScreen";
import ResultScreen from "@/components/screens/ResultScreen";
import {
  FunctionCode,
  OrderElement,
  CalculateResponse,
  DescribeResponse,
  Question,
} from "@/types/oox";

// --- ステップ定数 ---
export const OOX_STEPS = {
  START: "start",
  QUIZ: "quiz",
  RESOLVE: "resolve",
  RESULT: "result",
} as const;

type Step = (typeof OOX_STEPS)[keyof typeof OOX_STEPS];

// --- 定数データ (簡略化のため一部のみ表示、実際は28問) ---
const QUESTIONS: Question[] = [
  {
    id: "q01",
    left: "Ni",
    right: "Ne",
    text: "未来の一点の意味を読む vs 可能性を広げ続ける",
  },
  {
    id: "q02",
    left: "Ni",
    right: "Ti",
    text: "直感で本質を掴む vs 論理で構造化する",
  },
  {
    id: "q03",
    left: "Ni",
    right: "Te",
    text: "意味のある未来を描く vs 今すぐ成果を出す",
  },
  {
    id: "q04",
    left: "Ni",
    right: "Fi",
    text: "未来の物語を優先する vs 今の気持ちを守る",
  },
  {
    id: "q05",
    left: "Ni",
    right: "Fe",
    text: "自分の確信を貫く vs 場の空気を読む",
  },
  {
    id: "q06",
    left: "Ni",
    right: "Si",
    text: "これから起こることを重視する vs 過去の実績を信じる",
  },
  {
    id: "q07",
    left: "Ni",
    right: "Se",
    text: "未来を考え込む vs 今すぐ行動する",
  },
  // ... (本来はここに残り21問が必要)
  // 動作確認用に少し混ぜておく
  { id: "q08", left: "Fe", right: "Ti", text: "みんなの和 vs 正しい理屈" },
  { id: "q09", left: "Se", right: "Si", text: "今の刺激 vs 過去の安定" },
];

const BASE_URL = "https://6cs4ipgnf9.execute-api.ap-northeast-1.amazonaws.com"; // ★あなたのURL

export default function Home() {
  // --- State ---
  const [step, setStep] = useState<Step>(OOX_STEPS.START); // 画面切り替え用

  const [answers, setAnswers] = useState<Record<string, FunctionCode>>(() => {
    const initial: Record<string, FunctionCode> = {};
    for (const q of QUESTIONS) initial[q.id] = q.left;
    return initial;
  });

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

  const handleChange = (id: string, value: FunctionCode) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  // Step 1: 序列を計算する (/api/calculate)
  const handleCalculate = async () => {
    setLoading(true);
    setLoadingMessage("思考回路を解析中...");
    setCalculateResult(null);
    setResolvedBlock([]);

    // const matches = QUESTIONS.map((q) => ({
    //   id: q.id,
    //   winner: answers[q.id],
    //   loser: answers[q.id] === q.left ? q.right : q.left,
    // }));

    const matches = [
      { winner: "Ni", loser: "Ti", id: "q01" },
      { winner: "Ni", loser: "Ne", id: "q02" },
      { winner: "Ti", loser: "Fe", id: "q03" },
      { winner: "Ti", loser: "Fi", id: "q04" },
      // 🌀 ここで矛盾ループ (Fe > Fi > Te > Fe)
      { winner: "Fe", loser: "Fi", id: "q05" },
      { winner: "Fi", loser: "Te", id: "q06" },
      { winner: "Te", loser: "Fe", id: "q07" },
      // その他
      { winner: "Fe", loser: "Se", id: "q08" },
      { winner: "Se", loser: "Si", id: "q10" },
    ];

    try {
      const res = await fetch(`${BASE_URL}/api/calculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matches }),
      });
      if (!res.ok) throw new Error(`Calc API error: ${res.status}`);

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
      console.error(e);
      alert("計算エラーが発生しました");
      setLoading(false);
    }
  };

  // 選択肢をクリックしたときの処理
  const handleSelectOrder = (func: FunctionCode) => {
    if (resolvedBlock.includes(func)) return;
    setResolvedBlock([...resolvedBlock, func]);
  };

  // リセットボタン（間違えたとき用）
  const handleResetConflict = () => {
    setResolvedBlock([]);
  };

  // 決定して次へ進む処理
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

  // Step 2: Geminiに分析してもらう (/api/describe)
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

    try {
      const res = await fetch(`${BASE_URL}/api/describe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ finalOrder, healthStatus, tierMap }),
      });
      if (!res.ok) throw new Error(`Describe API error: ${res.status}`);

      const data: DescribeResponse = await res.json();
      setDescribeResult(data);
      setStep(OOX_STEPS.RESULT); // 結果画面へ移動
    } catch (e) {
      console.error(e);
      alert("分析エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  // --- UI Render ---

  // スタート画面
  if (step === OOX_STEPS.START) {
    return <StartScreen onStart={handleStart} />;
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

  // 結果画面
  if (step === OOX_STEPS.RESULT && describeResult && calculateResult) {
    return (
      <ResultScreen
        calculateResult={calculateResult}
        describeResult={describeResult}
        onRestart={() => setStep(OOX_STEPS.QUIZ)}
      />
    );
  }

  // Quiz画面
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
