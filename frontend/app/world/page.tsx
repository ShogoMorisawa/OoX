"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useIsMobile } from "@/hooks/useIsMobile";
import WorldPC from "@/components/screens/world/WorldPC";
import WorldMobile from "@/components/screens/world/WorldMobile";
import LoadingOverlay from "@/components/screens/world/LoadingOverlay";
import type { WorldUserResult } from "@/types/oox";

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
      <div className="relative w-full h-screen">
        <LoadingOverlay isMobile={isMobile} />
      </div>
    );
  }

  return (
    <>
      {isMobile ? (
        <WorldMobile users={users} loading={loading} />
      ) : (
        <WorldPC users={users} loading={loading} />
      )}
    </>
  );
}
