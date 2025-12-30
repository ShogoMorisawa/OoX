import { API_BASE_URL } from "@/constants/api";
import { FunctionCode, Tier } from "@/types/oox";

export type SaveResultRequest = {
  answers: Record<string, "A" | "B">;
  function_order: FunctionCode[];
  tier_map: Record<FunctionCode, Tier>;
  health_status: Record<FunctionCode, "O" | "o" | "x">;
  dominant_function: FunctionCode;
  second_function: FunctionCode;
  title: string;
  description: string;
  icon_url: string;
  browser_id: string; // UUID
  user_id?: string | null; // 現状は未ログインのためnull
  is_public: boolean; // デフォルトtrue
};

export async function saveResult(data: SaveResultRequest): Promise<void> {
  const url = `${API_BASE_URL}/api/results`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "Unknown error");
    throw new Error(
      `Save result API error: ${res.status} ${res.statusText}\n${errorText}`
    );
  }
}
