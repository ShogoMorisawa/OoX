"use client";

import { useState } from "react";
import Image from "next/image";
import type { WorldUserResult } from "@/types/oox";

type Props = {
  users?: WorldUserResult[];
  loading?: boolean;
};

export default function WorldMobile({ users = [], loading = false }: Props) {
  const [selectedUser, setSelectedUser] = useState<WorldUserResult | null>(
    null
  );

  return (
    <div
      className="relative w-full min-h-screen overflow-hidden bg-cover bg-center"
      style={{ backgroundImage: "url('/images/oox_world_background.png')" }}
    >
      <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]" />

      <div className="absolute top-0 left-0 w-full p-4 z-20">
        <h1 className="text-2xl font-light tracking-widest text-sky-900 drop-shadow-sm font-sans mb-2">
          OoX World
        </h1>
        <div className="bg-white/60 px-3 py-1 rounded-full text-xs text-sky-800 backdrop-blur-sm shadow-sm inline-block">
          {users.length} Inhabitants
        </div>
      </div>

      {/* モバイル向け: ユーザー一覧をグリッド形式で表示 */}
      <div className="absolute inset-0 z-10 pt-24 pb-20 px-4 overflow-y-auto">
        <div className="grid grid-cols-3 gap-3">
          {users.map((user) => (
            <button
              key={user.id}
              onClick={() => setSelectedUser(user)}
              className="relative w-full aspect-square rounded-full border-2 border-white/60 bg-white/40 backdrop-blur-sm shadow-md flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
            >
              {user.icon_url ? (
                <div className="relative w-full h-full p-2">
                  <Image
                    src={user.icon_url}
                    alt={user.dominant_function}
                    fill
                    className="object-contain drop-shadow-sm"
                  />
                </div>
              ) : (
                <span className="text-[10px] font-bold text-slate-700 opacity-70">
                  {user.dominant_function}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {selectedUser && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-sky-900/30 backdrop-blur-sm transition-all"
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="bg-white/95 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-300 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-sky-100 rounded-full blur-3xl" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-100 rounded-full blur-3xl" />

            <div className="relative z-10 flex flex-col items-center text-center space-y-4">
              <div className="relative w-20 h-20">
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
                <div className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold tracking-widest mb-2 border border-slate-200">
                  {selectedUser.dominant_function} ×{" "}
                  {selectedUser.second_function}
                </div>
                <h2 className="text-xl font-bold text-sky-950 leading-tight">
                  {selectedUser.title}
                </h2>
              </div>

              <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent" />

              <div className="w-full max-h-[40vh] overflow-y-auto px-2">
                <p className="text-xs text-slate-700 leading-relaxed text-left whitespace-pre-wrap font-medium">
                  {selectedUser.description}
                </p>
              </div>

              <button
                onClick={() => setSelectedUser(null)}
                className="mt-2 px-8 py-2 rounded-full bg-sky-500 text-white shadow-lg shadow-sky-200 hover:bg-sky-600 hover:shadow-sky-300 transition-all text-xs font-bold"
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
            <p className="text-sky-800 font-bold tracking-widest text-xs">
              LOADING WORLD...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

