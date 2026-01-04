import { CalculateResponse, FunctionCode } from "@/types/oox";
import { Match } from "../oox/matches";
import { apiRequest } from "./client";

export async function calculate(
  matches: Match[],
  healthScores: Record<FunctionCode, number>
): Promise<CalculateResponse> {
  return apiRequest<CalculateResponse>("/api/calculate", {
    method: "POST",
    body: {
      matches,
      health_scores: healthScores,
    },
  });
}
