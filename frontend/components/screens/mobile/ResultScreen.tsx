"use client";

import { CalculateResponse, DescribeResponse } from "@/types/oox";

type Props = {
  calculateResult: CalculateResponse;
  describeResult: DescribeResponse;
  onRestart: () => void;
};

export default function ResultScreen({
  calculateResult,
  describeResult,
  onRestart,
}: Props) {
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
            <p className="whitespace-pre-wrap">{describeResult.description}</p>
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
            onClick={onRestart}
            className="w-full py-4 rounded-xl font-bold text-lg bg-white text-gray-900 hover:bg-gray-200 transition-all"
          >
            もう一度鏡を覗く
          </button>
        </div>
      </div>
    </div>
  );
}
