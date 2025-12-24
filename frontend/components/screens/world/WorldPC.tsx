"use client";

import { useMemo, useState } from "react";
import Image from "next/image";

import type { FunctionCode, WorldUserResult } from "@/types/oox";

const FUNC_COLORS: Record<FunctionCode, string> = {
  Ni: "border-indigo-500 bg-indigo-50",
  Se: "border-yellow-400 bg-yellow-50",
  Ti: "border-slate-400 bg-slate-50",
  Te: "border-red-500 bg-red-50",
  Fi: "border-pink-400 bg-pink-50",
  Fe: "border-cyan-400 bg-cyan-50",
  Si: "border-amber-600 bg-amber-50",
  Ne: "border-green-500 bg-green-50",
};

type Props = {
  users?: WorldUserResult[];
  loading?: boolean;
};

const BIOME_ZONES: Record<
  FunctionCode,
  { xMin: number; xMax: number; yMin: number; yMax: number }
> = {
  // 上段
  Ne: { xMin: 5, xMax: 25, yMin: 5, yMax: 40 },
  Si: { xMin: 30, xMax: 50, yMin: 10, yMax: 45 },
  Se: { xMin: 55, xMax: 75, yMin: 5, yMax: 40 },
  Fi: { xMin: 80, xMax: 95, yMin: 10, yMax: 50 },
  // 下段
  Ni: { xMin: 5, xMax: 25, yMin: 55, yMax: 90 },
  Ti: { xMin: 30, xMax: 50, yMin: 55, yMax: 85 },
  Te: { xMin: 55, xMax: 75, yMin: 55, yMax: 90 },
  Fe: { xMin: 80, xMax: 95, yMin: 55, yMax: 85 },
};

// ユーザーIDから決定論的な疑似乱数を生成（0-1の範囲）
function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // 32bit整数に変換
  }
  // 0-1の範囲に正規化
  return Math.abs(hash) / 2147483647;
}

export default function WorldPC({ users = [], loading = false }: Props) {
  const [selectedUser, setSelectedUser] = useState<WorldUserResult | null>(
    null
  );

  const placedUsers = useMemo(() => {
    if (!users.length) return [];

    const grouped: Record<FunctionCode, WorldUserResult[]> = {
      Ni: [],
      Ne: [],
      Ti: [],
      Te: [],
      Fi: [],
      Fe: [],
      Si: [],
      Se: [],
    };

    const sorted = [...users].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    sorted.forEach((user) => {
      if (grouped[user.second_function]) {
        grouped[user.second_function].push(user);
      }
    });

    const result: (WorldUserResult & {
      x: number;
      y: number;
      animationDelay: string;
    })[] = [];

    sorted.forEach((user) => {
      const zone = BIOME_ZONES[user.second_function] ?? {
        xMin: 45,
        xMax: 55,
        yMin: 45,
        yMax: 55,
      };

      // ユーザーIDから決定論的な疑似乱数を生成
      const randomX = seededRandom(user.id);
      const randomY = seededRandom(user.id + "_y");
      const randomDelay = seededRandom(user.id + "_delay");

      const x = zone.xMin + randomX * Math.max(zone.xMax - zone.xMin, 1);
      const y = zone.yMin + randomY * Math.max(zone.yMax - zone.yMin, 1);

      result.push({
        ...user,
        x,
        y,
        animationDelay: `${randomDelay * 5}s`,
      });
    });

    return result;
  }, [users]);

  return (
    <div
      className="relative w-full h-screen overflow-hidden bg-cover bg-center"
      style={{ backgroundImage: "url('/images/oox_world_background.png')" }}
    >
      <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]" />

      <div className="absolute top-0 left-0 w-full p-6 z-20 flex justify-between items-start">
        <h1 className="text-4xl font-light tracking-widest text-sky-900 drop-shadow-sm font-sans">
          OoX World
        </h1>
        <div className="bg-white/60 px-4 py-2 rounded-full text-sm text-sky-800 backdrop-blur-sm shadow-sm">
          {users.length} Inhabitants
        </div>
      </div>

      <div className="absolute inset-0 z-10 pointer-events-none">
        {placedUsers.map((user) => {
          const colorClass =
            FUNC_COLORS[user.dominant_function] || "border-gray-400 bg-white";

          return (
            <button
              key={user.id}
              onClick={() => setSelectedUser(user)}
              className={`absolute w-16 h-16 md:w-20 md:h-20 rounded-full border-[4px] shadow-md
                flex items-center justify-center transition-all duration-500 ease-out
                hover:scale-125 hover:z-50 hover:shadow-xl active:scale-95
                animate-float-slow pointer-events-auto ${colorClass}`}
              style={{
                left: `${user.x}%`,
                top: `${user.y}%`,
                animationDelay: user.animationDelay,
                cursor: "pointer",
              }}
            >
              {user.icon_url ? (
                <div className="relative w-full h-full p-1">
                  <Image
                    src={user.icon_url}
                    alt={user.dominant_function}
                    fill
                    className="object-contain drop-shadow-sm"
                  />
                </div>
              ) : (
                <span className="text-xs font-bold text-slate-700 opacity-70">
                  {user.dominant_function}
                </span>
              )}

              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 opacity-0 hover:opacity-100 transition-opacity bg-white/80 px-2 py-0.5 rounded text-[10px] whitespace-nowrap text-sky-900 font-bold pointer-events-none">
                {user.title.slice(0, 10)}...
              </div>
            </button>
          );
        })}
      </div>

      {selectedUser && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-sky-900/30 backdrop-blur-sm transition-all"
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="bg-white/95 rounded-4xl p-6 md:p-10 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in duration-300 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-sky-100 rounded-full blur-3xl" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-100 rounded-full blur-3xl" />

            <div className="relative z-10 flex flex-col items-center text-center space-y-5">
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 bg-sky-200/50 rounded-full blur-xl animate-pulse" />
                <Image
                  src={
                    selectedUser.icon_url || "/images/oox_start_cell-red.png"
                  }
                  alt="Icon"
                  fill
                  className="object-contain drop-shadow-lg"
                />
              </div>

              <div>
                <div className="inline-block px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold tracking-widest mb-2 border border-slate-200">
                  {selectedUser.dominant_function} ×{" "}
                  {selectedUser.second_function}
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-sky-950 leading-tight">
                  {selectedUser.title}
                </h2>
              </div>

              <div className="w-full h-px bg-linear-to-r from-transparent via-slate-300 to-transparent" />

              <div className="w-full max-h-[40vh] overflow-y-auto px-2">
                <p className="text-sm md:text-base text-slate-700 leading-relaxed text-left whitespace-pre-wrap font-medium">
                  {selectedUser.description}
                </p>
              </div>

              <button
                onClick={() => setSelectedUser(null)}
                className="mt-2 px-10 py-3 rounded-full bg-sky-500 text-white shadow-lg shadow-sky-200 hover:bg-sky-600 hover:shadow-sky-300 hover:-translate-y-0.5 transition-all text-sm font-bold"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-sky-200 border-t-sky-500 rounded-full animate-spin" />
            <p className="text-sky-800 font-bold tracking-widest text-sm">
              LOADING WORLD...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
