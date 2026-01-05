import { CalculateResponse, FunctionCode, RichAnswer } from "@/types/oox";
import { apiRequest } from "./client";

export async function calculate(
  answers: RichAnswer[],
  healthScores: Record<FunctionCode, number>
): Promise<CalculateResponse> {
  return apiRequest<CalculateResponse>("/api/calculate", {
    method: "POST",
    body: {
      answers,
      health_scores: healthScores,
    },
  });
}
