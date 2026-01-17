"use client";

import Image from "next/image";
import type { WorldUserResult } from "@/types/oox";
import { IMAGE_PATHS, WORLD_MESSAGES } from "@/constants/messages";

type Props = {
  user: WorldUserResult;
  onClose: () => void;
  isMobile?: boolean;
};

export default function UserModal({ user, onClose, isMobile = false }: Props) {
  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-sky-900/30 backdrop-blur-sm transition-all"
      onClick={onClose}
    >
      <div
        className={`bg-white/95 rounded-2xl md:rounded-4xl p-6 md:p-10 max-w-sm md:max-w-lg w-full shadow-2xl animate-in fade-in zoom-in duration-300 relative overflow-hidden ${
          !isMobile ? "md:max-w-lg" : ""
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute -top-10 -right-10 w-32 h-32 md:w-40 md:h-40 bg-sky-100 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 md:w-40 md:h-40 bg-indigo-100 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col items-center text-center space-y-4 md:space-y-5">
          <div className="relative w-20 h-20 md:w-24 md:h-24">
            <div className="absolute inset-0 bg-sky-200/50 rounded-full blur-xl animate-pulse" />
            <Image
              src={user.icon_url || IMAGE_PATHS.DEFAULT_ICON}
              alt="Icon"
              fill
              className="object-contain drop-shadow-lg"
            />
          </div>

          <div>
            <div className="inline-block px-2 py-0.5 md:px-3 md:py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] md:text-xs font-bold tracking-widest mb-2 border border-slate-200">
              {user.dominant_function} × {user.second_function}
            </div>
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-sky-950 leading-tight">
              {user.title}
            </h2>
          </div>

          <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent" />

          <div className="w-full max-h-[40vh] overflow-y-auto px-2">
            <p className="text-xs md:text-sm lg:text-base text-slate-700 leading-relaxed text-left whitespace-pre-wrap font-medium">
              {user.description}
            </p>
          </div>

          <button
            onClick={onClose}
            className="mt-2 px-8 md:px-10 py-2 md:py-3 rounded-full bg-sky-500 text-white shadow-lg shadow-sky-200 hover:bg-sky-600 hover:shadow-sky-300 hover:-translate-y-0.5 transition-all text-xs md:text-sm font-bold"
          >
            {WORLD_MESSAGES.CLOSE}
          </button>
        </div>
      </div>
    </div>
  );
}
