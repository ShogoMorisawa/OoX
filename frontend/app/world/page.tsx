"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useIsMobile } from "@/hooks/useIsMobile";
import WorldPC from "@/components/screens/world/WorldPC";
import WorldMobile from "@/components/screens/world/WorldMobile";
import type { WorldUserResult } from "@/types/oox";
import Link from "next/link";

export default function WorldPage() {
  const isMobile = useIsMobile();
  const [users, setUsers] = useState<WorldUserResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // 最新の100件などを取得（必要に応じて制限）
        const { data, error } = await supabase
          .from("user_results")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100);

        if (error) throw error;

        if (data) {
          // 型安全のためにキャストまたは変換
          setUsers(data as unknown as WorldUserResult[]);
        }
      } catch (e) {
        console.error("Fetch users error:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 text-sky-800">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-sky-200 border-t-sky-500 rounded-full animate-spin" />
          <p className="text-sky-800 font-bold tracking-widest text-sm">
            LOADING WORLD...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 簡易ナビゲーション */}
      <div className="fixed top-4 right-4 z-50">
        <Link
          href="/"
          className="bg-white/80 backdrop-blur px-4 py-2 rounded-full shadow text-sm font-bold text-slate-600 hover:bg-white transition-colors"
        >
          TOP
        </Link>
      </div>

      {isMobile ? (
        <WorldMobile users={users} loading={loading} />
      ) : (
        <WorldPC users={users} loading={loading} />
      )}
    </>
  );
}
