import { FunctionCode } from "@/types/oox";
import { Match } from "../oox/matches";
import { API_BASE_URL } from "@/constants/api";

export async function calculate(
  matches: Match[],
  healthScores: Record<FunctionCode, number>
) {
  const url = `${API_BASE_URL}/api/calculate`;
  const requestBody = {
    matches,
    health_scores: healthScores,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(
      `Calc API error: ${res.status} ${res.statusText}\n${errorText}`
    );
  }

  return await res.json();
}
