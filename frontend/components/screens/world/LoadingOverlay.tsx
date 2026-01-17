"use client";

import { WORLD_MESSAGES } from "@/constants/messages";

type Props = {
  isMobile?: boolean;
};

export default function LoadingOverlay({ isMobile = false }: Props) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-sky-200 border-t-sky-500 rounded-full animate-spin" />
        <p className="text-sky-800 font-bold tracking-widest text-xs md:text-sm">
          {WORLD_MESSAGES.LOADING}
        </p>
      </div>
    </div>
  );
}
