"use client";

import { useState } from "react";
import Image from "next/image";
import type { WorldUserResult } from "@/types/oox";
import { IMAGE_PATHS, WORLD_MESSAGES } from "@/constants/messages";
import UserModal from "./UserModal";
import LoadingOverlay from "./LoadingOverlay";

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
      style={{ backgroundImage: `url('${IMAGE_PATHS.WORLD_BACKGROUND}')` }}
    >
      <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]" />

      <div className="absolute top-0 left-0 w-full p-4 z-20">
        <h1 className="text-2xl font-light tracking-widest text-sky-900 drop-shadow-sm font-sans mb-2">
          OoX World
        </h1>
        <div className="bg-white/60 px-3 py-1 rounded-full text-xs text-sky-800 backdrop-blur-sm shadow-sm inline-block">
          {users.length} {WORLD_MESSAGES.INHABITANTS}
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
        <UserModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          isMobile={true}
        />
      )}

      {loading && <LoadingOverlay isMobile={true} />}
    </div>
  );
}
