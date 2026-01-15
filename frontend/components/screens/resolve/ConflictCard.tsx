"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { FunctionCode } from "@/types/oox";
import { getCellImage } from "@/constants/icons";

interface CardProps {
  type: "system" | "user";
  functionCode: FunctionCode;
  title: string;
  description: string;
  isSelected: boolean;
  isOtherSelected: boolean;
  onClick: () => void;
  loading: boolean;
}

export default function ConflictCard({
  type,
  functionCode,
  title,
  description,
  isSelected,
  isOtherSelected,
  onClick,
  loading,
}: CardProps) {
  const iconUrl = getCellImage(functionCode);
  const isSystem = type === "system";

  // 文言の定義
  const badgeText = isSystem
    ? "これまでの回答と、つじつまが合うのは"
    : "でもあの時、あなたが選んだのは";

  // 色定義：システム(青系) / ユーザー(オレンジ系)
  const badgeColor = isSystem
    ? "bg-blue-50 text-blue-600 border-blue-100"
    : "bg-orange-50 text-orange-600 border-orange-100";
  const activeClass = isSystem
    ? "bg-blue-50/90 border-blue-300 ring-4 ring-blue-100"
    : "bg-orange-50/90 border-orange-300 ring-4 ring-orange-100";

  return (
    <motion.button
      onClick={onClick}
      disabled={loading}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      className={`
        relative flex-1 w-full md:w-[24rem] p-6 rounded-[2.5rem] text-center transition-all duration-300 group
        border-2 flex flex-col items-center h-full overflow-hidden
        ${
          isSelected
            ? `${activeClass} shadow-xl z-10 scale-[1.02]`
            : isOtherSelected
            ? "bg-white/40 border-slate-100 opacity-50 grayscale blur-[1px] scale-95"
            : "bg-white border-slate-100 hover:border-slate-300 shadow-lg hover:shadow-xl"
        }
      `}
    >
      {/* 1. アイコン（メインビジュアル） */}
      {/* 枠から解放して大きく表示 */}
      <div className="relative w-28 h-28 mb-3 filter drop-shadow-sm transition-transform duration-300 group-hover:scale-110">
        {iconUrl && (
          <Image
            src={iconUrl}
            alt={functionCode}
            fill
            className={`object-contain ${isSystem ? "scale-x-[-1]" : ""}`}
          />
        )}
      </div>

      {/* 2. ラベルバッジ（文脈） */}
      <div
        className={`px-3 py-1 rounded-full text-[10px] md:text-xs font-bold border mb-4 tracking-wide ${badgeColor}`}
      >
        {badgeText}
      </div>

      {/* 3. 吹き出し風エリア（タイトル＋本文） */}
      <div className="w-full bg-white/60 rounded-2xl p-5 border border-white/50 shadow-inner text-left relative flex-1 flex flex-col">
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white/60 border-t border-l border-white/50 transform rotate-45" />

        <h3
          className={`text-lg md:text-xl font-bold mb-2 leading-snug ${
            isSelected ? "text-slate-900" : "text-slate-700"
          }`}
        >
          {title}
        </h3>

        <div className="w-full h-px bg-slate-400/10 my-2" />

        <p
          className={`text-sm leading-relaxed ${
            isSelected ? "text-slate-700" : "text-slate-500"
          }`}
        >
          {description}
        </p>
      </div>

      {/* 選択中のチェックマーク */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-4 right-4 w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white"
        >
          ✓
        </motion.div>
      )}
    </motion.button>
  );
}
