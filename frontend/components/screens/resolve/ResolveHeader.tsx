"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { ResolveHeaderProps } from "./types";

export default function ResolveHeader({
  conflictQuestion,
  isDetailOpen,
  onToggleDetail,
}: ResolveHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mb-8 md:mb-12 z-10 text-center"
    >
      <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">
        MEMORY
      </span>
      <h2 className="text-xl md:text-2xl font-bold text-slate-800 mt-2 leading-relaxed">
        そういえば、この質問。
        <br />
        <span className="text-base font-normal text-slate-600">
          回答するのに、いちばん時間を使っていましたね。
        </span>
      </h2>

      {/* 質問要約の表示 */}
      <div className="mt-5 inline-block px-6 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-slate-100 shadow-sm">
        <span className="font-bold text-slate-700 mr-2">Q.</span>
        <span className="text-slate-700 font-medium">
          {conflictQuestion.shortText || "この状況について"}
        </span>
      </div>

      {/* 質問詳細アコーディオン */}
      <div className="relative mt-3">
        <button
          onClick={onToggleDetail}
          className="text-xs text-slate-400 hover:text-slate-600 font-medium flex items-center justify-center gap-1 mx-auto transition-colors"
        >
          {isDetailOpen ? "閉じる" : "どんな質問だったっけ？"}
          <span
            className={`transform transition-transform ${
              isDetailOpen ? "rotate-180" : ""
            }`}
          >
            ▼
          </span>
        </button>

        <AnimatePresence>
          {isDetailOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-white/80 backdrop-blur-md rounded-2xl p-5 mt-3 text-sm text-slate-600 leading-relaxed shadow-inner border border-white/50 text-left max-w-lg mx-auto">
                {conflictQuestion.text}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
