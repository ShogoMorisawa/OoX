// frontend/app/page.tsx
"use client";

import { useState } from "react";

// 心理機能のコード
type FunctionCode = "Ni" | "Ne" | "Ti" | "Te" | "Fi" | "Fe" | "Si" | "Se";
type OrderElement = FunctionCode | FunctionCode[];
type CalculateResponse = {
  order?: OrderElement[];
  graph?: Record<string, FunctionCode[]>;
  sccs?: FunctionCode[][];
};
type Question = {
  id: string;
  left: FunctionCode;
  right: FunctionCode;
  text: string;
};

// 28件のダミーデータ（ここでは簡略化のため8件だけ記載）
const MOCK_MATCHES = [
  { winner: "Ni", loser: "Se", id: "q01" },
  { winner: "Ti", loser: "Fe", id: "q02" },
  { winner: "Fi", loser: "Te", id: "q03" },
  { winner: "Ne", loser: "Si", id: "q04" },
  { winner: "Ni", loser: "Fi", id: "q05" },
  { winner: "Se", loser: "Ti", id: "q06" },
  { winner: "Te", loser: "Ne", id: "q07" },
  { winner: "Fe", loser: "Si", id: "q08" },
  // ... 実際は28件分をここに定義
];

const COMPLEX_MOCK_MATCHES = [
  // 🥇 支配ノード (Ni, Ti)
  { winner: "Ni", loser: "Ti", id: "q01" },
  { winner: "Ni", loser: "Ne", id: "q02" },
  // 🔗 支配ノードからサイクルへ
  { winner: "Ti", loser: "Fe", id: "q03" },
  { winner: "Ti", loser: "Fi", id: "q04" },
  // 🔄 循環 (葛藤ブロック: Fe, Fi, Te)
  { winner: "Fe", loser: "Fi", id: "q05" },
  { winner: "Fi", loser: "Te", id: "q06" },
  { winner: "Te", loser: "Fe", id: "q07" }, // ⬅️ これがサイクルを形成する
  // 🔗 サイクルから従属ノードへ
  { winner: "Fe", loser: "Se", id: "q08" },
  // 🥈 中間ノード (Ne)
  { winner: "Ne", loser: "Se", id: "q09" },
  // 🥉 従属ノード (Si, Se)
  { winner: "Se", loser: "Si", id: "q10" },
  { winner: "Ti", loser: "Si", id: "q11" },
  { winner: "Ni", loser: "Si", id: "q12" },
];

const QUESTIONS: Question[] = [
  // --- Ni ---
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

  // --- Ne ---
  {
    id: "q08",
    left: "Ne",
    right: "Ti",
    text: "発想を広げ続ける vs 論理で絞り込む",
  },
  {
    id: "q09",
    left: "Ne",
    right: "Te",
    text: "アイデアを出し続ける vs 結果を出す",
  },
  {
    id: "q10",
    left: "Ne",
    right: "Fi",
    text: "新しい可能性を試す vs 自分の信念を守る",
  },
  {
    id: "q11",
    left: "Ne",
    right: "Fe",
    text: "自由な発想を優先する vs 場の調和を優先する",
  },
  {
    id: "q12",
    left: "Ne",
    right: "Si",
    text: "未知を試す vs 慣れたやり方を守る",
  },
  {
    id: "q13",
    left: "Ne",
    right: "Se",
    text: "可能性を想像する vs 現実に飛び込む",
  },

  // --- Ti ---
  {
    id: "q14",
    left: "Ti",
    right: "Te",
    text: "自分の論理に納得する vs 社会的に正しい成果を出す",
  },
  {
    id: "q15",
    left: "Ti",
    right: "Fi",
    text: "論理の整合性を取る vs 自分の気持ちを優先する",
  },
  {
    id: "q16",
    left: "Ti",
    right: "Fe",
    text: "正しいかどうかで判断する vs 相手の気持ちを考える",
  },
  {
    id: "q17",
    left: "Ti",
    right: "Si",
    text: "理屈が通るか重視する vs 実績や前例を信じる",
  },
  {
    id: "q18",
    left: "Ti",
    right: "Se",
    text: "中で考え続ける vs 外に出て試す",
  },

  // --- Te ---
  {
    id: "q19",
    left: "Te",
    right: "Fi",
    text: "成果と効率を優先する vs 気持ちと信念を守る",
  },
  {
    id: "q20",
    left: "Te",
    right: "Fe",
    text: "結果で評価する vs 感情で調整する",
  },
  {
    id: "q21",
    left: "Te",
    right: "Si",
    text: "最短ルートで進む vs 安定した方法を選ぶ",
  },
  {
    id: "q22",
    left: "Te",
    right: "Se",
    text: "成果を最優先する vs 体で動いて解決する",
  },

  // --- Fi ---
  {
    id: "q23",
    left: "Fi",
    right: "Fe",
    text: "自分の気持ちを守る vs 相手の気持ちを優先する",
  },
  {
    id: "q24",
    left: "Fi",
    right: "Si",
    text: "今の感情を信じる vs 昔の安心感を信じる",
  },
  {
    id: "q25",
    left: "Fi",
    right: "Se",
    text: "気持ちを大切にする vs まず体を動かす",
  },

  // --- Fe ---
  {
    id: "q26",
    left: "Fe",
    right: "Si",
    text: "場の空気を読む vs いつものやり方を守る",
  },
  {
    id: "q27",
    left: "Fe",
    right: "Se",
    text: "周囲と調和する vs 自分が動いて場を変える",
  },

  // --- Si vs Se ---
  {
    id: "q28",
    left: "Si",
    right: "Se",
    text: "慣れた安心を守る vs 刺激のある今を生きる",
  },
];

const BASE_URL = "https://6cs4ipgnf9.execute-api.ap-northeast-1.amazonaws.com";

export default function Home() {
  // 回答状態：key が question.id, value が選ばれた機能
  const [answers, setAnswers] = useState<Record<string, FunctionCode>>(() => {
    // デフォルトで「左」にチェックを入れる
    const initial: Record<string, FunctionCode> = {};
    for (const q of QUESTIONS) {
      initial[q.id] = q.left;
    }
    return initial;
  });

  const [result, setResult] = useState<CalculateResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (id: string, value: FunctionCode) => {
    setAnswers((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleCalculate = async () => {
    setLoading(true);
    setResult(null);

    // answers から matches を組み立てる
    const matches = QUESTIONS.map((q) => {
      const winner = answers[q.id]; // 選ばれた方
      const loser = winner === q.left ? q.right : q.left;
      return {
        id: q.id,
        winner,
        loser,
      };
    });

    try {
      const res = await fetch(`${BASE_URL}/api/calculate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ matches }),
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const data: CalculateResponse = await res.json();
      setResult(data);
    } catch (e) {
      console.error(e);
      alert("APIとの通信でエラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12">
      <h1 className="text-3xl font-bold mb-6 text-indigo-600">
        OoX Mirror - Step 1: 28問トーナメント
      </h1>

      <div className="w-full max-w-3xl bg-white rounded-2xl shadow p-6 space-y-6">
        {/* 質問一覧 */}
        <div className="space-y-4 max-h-[420px] overflow-y-auto border rounded-lg p-4">
          {QUESTIONS.map((q, index) => (
            <div key={q.id} className="border-b pb-3 last:border-b-0 last:pb-0">
              <p className="text-sm text-gray-500 mb-1">
                Q{index + 1}. {q.text}
              </p>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={q.id}
                    value={q.left}
                    checked={answers[q.id] === q.left}
                    onChange={() => handleChange(q.id, q.left)}
                  />
                  <span className="px-2 py-1 rounded bg-indigo-50 text-sm font-semibold">
                    {q.left}
                  </span>
                </label>

                <span className="text-gray-400 text-xs">vs</span>

                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={q.id}
                    value={q.right}
                    checked={answers[q.id] === q.right}
                    onChange={() => handleChange(q.id, q.right)}
                  />
                  <span className="px-2 py-1 rounded bg-pink-50 text-sm font-semibold">
                    {q.right}
                  </span>
                </label>
              </div>
            </div>
          ))}
        </div>

        {/* ボタン */}
        <button
          onClick={handleCalculate}
          disabled={loading}
          className={`w-full py-3 rounded-xl text-white font-bold text-lg transition-all ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-linear-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
          }`}
        >
          {loading ? "計算中..." : "序列を計算する"}
        </button>

        {/* 結果表示 */}
        {result && result.order && (
          <div className="border-t pt-4">
            <h2 className="text-xl font-semibold mb-3">結果序列</h2>
            <ol className="space-y-2">
              {result.order.map((element, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-6 text-right font-mono text-gray-500">
                    {i + 1}.
                  </span>
                  {Array.isArray(element) ? (
                    <div className="bg-yellow-100 border-l-4 border-yellow-500 rounded px-2 py-1 text-sm">
                      <p className="text-yellow-800 font-bold text-xs mb-1">
                        葛藤ブロック（要・手動決定）
                      </p>
                      <div className="flex gap-1 flex-wrap">
                        {element.map((f) => (
                          <span
                            key={f}
                            className="px-2 py-0.5 bg-yellow-400 text-white rounded-full text-xs font-semibold"
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <span className="px-3 py-1 bg-green-500 text-white rounded text-sm font-semibold">
                      {element}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
