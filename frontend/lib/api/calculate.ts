import { CalculateResponse, FunctionCode, RichAnswer, FixedMatch } from "@/types/oox";
import { apiRequest } from "./client";

export async function calculate(
  answers: RichAnswer[],
  healthScores: Record<FunctionCode, number>,
  fixedMatch?: FixedMatch
): Promise<CalculateResponse> {
  return apiRequest<CalculateResponse>("/api/calculate", {
    method: "POST",
    body: {
      answers,
      health_scores: healthScores,
      ...(fixedMatch && { fixed_match: fixedMatch }),
    },
  });
}
