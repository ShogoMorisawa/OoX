"use client";

import Image from "next/image";

import { ResultViewProps } from "./index";

export default function ResultMobile({
  describeResult,
  onRestart,
}: ResultViewProps) {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 py-12 bg-cover bg-center"
      style={{ backgroundImage: "url('/images/oox_background.png')" }}
    >
      <div className="w-full max-w-3xl flex flex-col items-center gap-10">
        <div className="relative flex items-center justify-center w-72 h-72">
          <div className="absolute inset-0 bg-white/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute inset-[-24px] rounded-full border border-white/20 blur-[1px]" />
          <div className="absolute inset-[-12px] rounded-full border border-white/40 blur-[0.5px]" />
          <div className="absolute inset-0 rounded-full shadow-[0_0_40px_rgba(255,255,255,0.8)]" />

          <div className="relative z-10 w-full h-full rounded-full overflow-hidden">
            <Image
              src="/images/result_creature.png"
              alt="Your Archetype"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold tracking-wide text-sky-900 drop-shadow-sm">
            {describeResult.title}
          </h1>
          <p className="text-sm text-sky-800/70 tracking-widest">
            OoX Psychological Archetype
          </p>
        </div>

        <div className="relative w-full max-w-2xl">
          <Image
            src="/images/oox_quiz_question.png"
            alt="Description Bubble"
            width={800}
            height={400}
            className="w-full h-auto"
          />
          <div className="absolute inset-0 px-8 py-6 flex items-center justify-center text-sky-900 text-sm md:text-base leading-relaxed text-center">
            <p className="whitespace-pre-wrap">{describeResult.description}</p>
          </div>
        </div>

        <button
          onClick={onRestart}
          className="relative w-64 h-14 transition-transform hover:scale-105 active:scale-95"
        >
          <Image
            src="/images/oox_result_button-with-letter.png"
            alt="Go to World"
            fill
            className="object-contain"
          />
        </button>
      </div>
    </div>
  );
}
