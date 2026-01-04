import { FunctionCode, Tier } from "@/types/oox";
import { apiRequest } from "./client";

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
  return apiRequest<void>("/api/results", {
    method: "POST",
    body: data,
  });
}
