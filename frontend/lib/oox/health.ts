import { Question, Choice, FunctionCode } from "@/types/oox";

type ChoiceId = Choice["choiceId"];

export function buildHealthScores(
  questions: Question[],
  answers: Record<string, ChoiceId>
): Record<FunctionCode, number> {
  const healthScores: Record<FunctionCode, number> = {
    Ni: 0,
    Ne: 0,
    Ti: 0,
    Te: 0,
    Fi: 0,
    Fe: 0,
    Si: 0,
    Se: 0,
  };
  for (const q of questions) {
    // targetFunctionが存在しない場合はスキップ。
    if (!q.targetFunction) continue;

    const choiceId = answers[q.id];
    // 回答がない場合はスキップ。
    if (!choiceId) continue;

    const choice = q.choices.find((c) => c.id === choiceId);
    if (choice) {
      healthScores[q.targetFunction] += choice.healthScore;
    }
  }
  return healthScores;
}
