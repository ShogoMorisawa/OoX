// frontend/app/page.tsx
"use client";

import { useState } from "react";

// --- 型定義 ---
type FunctionCode = "Ni" | "Ne" | "Ti" | "Te" | "Fi" | "Fe" | "Si" | "Se";
type OrderElement = FunctionCode | FunctionCode[];

// バックエンドからのレスポンス型
type CalculateResponse = {
  order: OrderElement[];
};

type DescribeResponse = {
  title: string;
  description: string;
};

// 質問データ型
type Question = {
  id: string;
  left: FunctionCode;
  right: FunctionCode;
  text: string;
};

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
  const [step, setStep] = useState<"quiz" | "result">("quiz"); // 画面切り替え用

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

  // --- Handlers ---

  const handleChange = (id: string, value: FunctionCode) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  // Step 1: 序列を計算する (/api/calculate)
  const handleCalculate = async () => {
    setLoading(true);
    setLoadingMessage("思考回路を解析中...");
    setCalculateResult(null);

    const matches = QUESTIONS.map((q) => ({
      id: q.id,
      winner: answers[q.id],
      loser: answers[q.id] === q.left ? q.right : q.left,
    }));

    try {
      const res = await fetch(`${BASE_URL}/api/calculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matches }),
      });
      if (!res.ok) throw new Error(`Calc API error: ${res.status}`);

      const data: CalculateResponse = await res.json();
      setCalculateResult(data);

      // 計算が終わったら、すぐにGemini分析へ進む (MVPショートカット)
      await handleDescribe(data.order);
    } catch (e) {
      console.error(e);
      alert("計算エラーが発生しました");
      setLoading(false);
    }
  };

  // Step 2: Geminiに分析してもらう (/api/describe)
  const handleDescribe = async (rawOrder: OrderElement[]) => {
    setLoadingMessage("Geminiがあなたの魂を言語化しています...");

    // 1. データを整形 (MVP用: 葛藤ブロックを強制的に平坦化)
    // 本当はここでユーザーに順位を決めさせるUIが入る
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
      setStep("result"); // 結果画面へ移動
    } catch (e) {
      console.error(e);
      alert("分析エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  // --- UI Render ---

  if (step === "result" && describeResult && calculateResult) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6 font-sans">
        <div className="max-w-2xl w-full bg-gray-800 rounded-3xl shadow-2xl overflow-hidden border border-gray-700">
          {/* ヘッダー画像エリア (仮) */}
          <div className="h-32 bg-gradient-to-r from-indigo-900 to-purple-900 flex items-center justify-center">
            <h1 className="text-3xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-pink-200">
              OoX MIRROR
            </h1>
          </div>

          <div className="p-8 space-y-8">
            {/* タイトル表示 */}
            <div className="text-center">
              <p className="text-gray-400 text-sm mb-2 uppercase tracking-widest">
                Archetype
              </p>
              <h2 className="text-4xl font-extrabold text-white mb-4">
                {describeResult.title}
              </h2>
              <div className="w-16 h-1 bg-blue-500 mx-auto rounded-full"></div>
            </div>

            {/* 解説文表示 */}
            <div className="prose prose-invert prose-lg mx-auto leading-relaxed text-gray-300">
              <p className="whitespace-pre-wrap">
                {describeResult.description}
              </p>
            </div>

            {/* 序列の可視化 */}
            <div className="bg-gray-900 rounded-xl p-6 mt-6">
              <h3 className="text-sm font-bold text-gray-500 mb-4 uppercase">
                Logic Structure
              </h3>
              <div className="flex flex-wrap gap-2 justify-center">
                {calculateResult.order.map((el, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div
                      className={`
                      w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm mb-1
                      ${
                        i < 2
                          ? "bg-yellow-500 text-black shadow-lg shadow-yellow-500/50"
                          : i < 4
                          ? "bg-blue-600 text-white"
                          : i < 6
                          ? "bg-gray-600 text-gray-200"
                          : "bg-gray-800 text-gray-500 border border-gray-700"
                      }
                    `}
                    >
                      {Array.isArray(el) ? "?" : el}
                    </div>
                    <span className="text-xs text-gray-500">{i + 1}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setStep("quiz")}
              className="w-full py-4 rounded-xl font-bold text-lg bg-white text-gray-900 hover:bg-gray-200 transition-all"
            >
              もう一度鏡を覗く
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Quiz画面
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">
      <h1 className="text-3xl font-bold mb-8 text-indigo-700 tracking-tight">
        OoX Mirror{" "}
        <span className="text-sm font-normal text-gray-500 ml-2">
          Prototype v0.1
        </span>
      </h1>

      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl p-6 space-y-6">
        {/* 質問リスト */}
        <div className="space-y-4 max-h-[60vh] overflow-y-auto border border-gray-100 rounded-xl p-4 bg-gray-50/50">
          {QUESTIONS.map((q, index) => (
            <div
              key={q.id}
              className="bg-white p-4 rounded-lg shadow-sm border border-gray-100"
            >
              <p className="text-xs text-gray-400 mb-2 font-mono">
                Q{index + 1}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-gray-600 font-medium flex-1 text-center sm:text-left">
                  {q.text}
                </p>

                <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                  <button
                    onClick={() => handleChange(q.id, q.left)}
                    className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
                      answers[q.id] === q.left
                        ? "bg-indigo-600 text-white shadow-md"
                        : "text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    {q.left}
                  </button>
                  <button
                    onClick={() => handleChange(q.id, q.right)}
                    className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
                      answers[q.id] === q.right
                        ? "bg-pink-500 text-white shadow-md"
                        : "text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    {q.right}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* アクションボタン */}
        <button
          onClick={handleCalculate}
          disabled={loading}
          className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg transition-all transform hover:scale-[1.01] active:scale-95
            ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            }
          `}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-5 w-5 text-white"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              {loadingMessage}
            </span>
          ) : (
            "分析を開始する"
          )}
        </button>
      </div>
    </div>
  );
}
