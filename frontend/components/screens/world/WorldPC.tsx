"use client";

import { useMemo, useState } from "react";
import Image from "next/image";

import type { FunctionCode, WorldUserResult } from "@/types/oox";
import { IMAGE_PATHS, WORLD_MESSAGES } from "@/constants/messages";
import UserModal from "./UserModal";
import LoadingOverlay from "./LoadingOverlay";

type Props = {
  users?: WorldUserResult[];
  loading?: boolean;
};

const BIOME_ZONES: Record<
  FunctionCode,
  { xMin: number; xMax: number; yMin: number; yMax: number }
> = {
  // 上段
  Ne: { xMin: 5, xMax: 27, yMin: 10, yMax: 50 },
  Si: { xMin: 28, xMax: 50, yMin: 10, yMax: 50 },
  Se: { xMin: 51, xMax: 72, yMin: 10, yMax: 50 },
  Fi: { xMin: 73, xMax: 95, yMin: 10, yMax: 50 },
  // 下段
  Ni: { xMin: 5, xMax: 27, yMin: 50, yMax: 90 },
  Ti: { xMin: 28, xMax: 50, yMin: 50, yMax: 90 },
  Te: { xMin: 51, xMax: 72, yMin: 50, yMax: 90 },
  Fe: { xMin: 73, xMax: 95, yMin: 50, yMax: 90 },
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
      style={{ backgroundImage: `url('${IMAGE_PATHS.WORLD_BACKGROUND}')` }}
    >
      <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]" />

      <div className="absolute top-0 left-0 w-full p-6 z-20 flex justify-between items-start">
        <h1 className="text-4xl font-light tracking-widest text-sky-900 drop-shadow-sm font-sans">
          OoX World
        </h1>
        <div className="bg-white/60 px-4 py-2 rounded-full text-sm text-sky-800 backdrop-blur-sm shadow-sm">
          {users.length} {WORLD_MESSAGES.INHABITANTS}
        </div>
      </div>

      <div className="absolute inset-0 z-10 pointer-events-none">
        {placedUsers.map((user) => {
          return (
            <button
              key={user.id}
              onClick={() => setSelectedUser(user)}
              className={`absolute w-16 h-16 md:w-20 md:h-20 rounded-full  shadow-md
                flex items-center justify-center transition-all duration-500 ease-out
                hover:scale-125 hover:z-50 hover:shadow-xl active:scale-95
                animate-float-slow pointer-events-auto`}
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
        <UserModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          isMobile={false}
        />
      )}

      {loading && <LoadingOverlay isMobile={false} />}
    </div>
  );
}
