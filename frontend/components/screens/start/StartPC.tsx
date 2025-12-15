"use client";

import Image from "next/image";

import { StartViewProps } from "./index";

export default function StartPC({ onStart, titleClassName }: StartViewProps) {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url(/images/oox_background.png)" }}
      />
      <div className="absolute inset-0 bg-white/20" />

      <div className="relative z-10 mb-6 flex flex-col items-center">
        <h1
          className={`
            ${titleClassName} 
            text-7xl md:text-8xl 
            font-light 
            tracking-[0.2em] 
            text-transparent bg-clip-text bg-gradient-to-br from-slate-600 via-slate-500 to-sky-400
            drop-shadow-lg
            animate-float-slow
          `}
        >
          OoX
        </h1>
        <div className="w-16 h-1 bg-gradient-to-r from-transparent via-sky-300 to-transparent opacity-50 blur-[1px] rounded-full mt-2 animate-pulse" />
      </div>

      <div className="relative z-10 mb-10 w-[300px] h-[380px] flex items-center justify-center">
        <div className="absolute inset-8 bg-sky-300/20 rounded-[4rem] blur-2xl" />
        <div className="absolute inset-0 z-20 overflow-hidden rounded-[3.5rem]">
          <div className="relative w-full h-full">
            <div className="absolute top-[25%] left-[20%] w-24 h-24 animate-float-medium">
              <Image
                src="/images/oox_start_cell-red.png"
                alt="Red Cell"
                width={120}
                height={120}
                className="object-contain drop-shadow-md"
              />
            </div>
            <div className="absolute bottom-[25%] right-[15%] w-20 h-20 animate-float-slow">
              <Image
                src="/images/oox_start_cell-lightBlue.png"
                alt="Blue Cell"
                width={100}
                height={100}
                className="object-contain drop-shadow-md"
              />
            </div>
          </div>
        </div>
        <div className="relative z-10 w-full h-full pointer-events-none">
          <Image
            src="/images/oox_start_pod.png"
            alt="Glass Pod"
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>

      <p className="relative z-10 text-slate-500 text-sm md:text-base mb-8 tracking-wide font-medium">
        質問に答えてあなたのキャラを生み出そう！
      </p>

      <button
        onClick={onStart}
        className="relative z-10 px-16 py-4 rounded-full bg-sky-400 text-white font-bold text-lg shadow-lg shadow-sky-300/50 hover:bg-sky-500 hover:shadow-sky-400/60 hover:-translate-y-0.5 transition-all active:translate-y-0"
      >
        START
      </button>
    </div>
  );
}
