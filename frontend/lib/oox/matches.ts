import { Question, FunctionCode, Choice } from "@/types/oox";

type ChoiceId = Choice["choiceId"];

export type Match = {
  id: string;
  winner: FunctionCode;
  loser: FunctionCode;
};

// 問題と回答を受け取って、matchオブジェクトの配列matchesを返す。
// この配列は、calculateService.php内でグラフを構築するために使用される。
export function buildMatchesFromAnswers(
  questions: Question[],
  answers: Record<string, ChoiceId>
): Match[] {
  // matchesの初期化。空の配列を作成。
  const matches: Match[] = [];

  for (const question of questions) {
    // currentChoiceを取得。
    const choiceId = answers[question.id];
    const currentChoice = question.choices.find(
      (choice) => choice.id === choiceId
    );

    // currentChoiceかrelatedFunctionかfunctionPairが存在しない場合はスキップ。
    if (
      !currentChoice ||
      !currentChoice.relatedFunction ||
      !question.functionPair
    ) {
      continue;
    }

    // winnerとloserを取得。
    const winner = currentChoice.relatedFunction;
    const [func1, func2] = question.functionPair;
    const loser = func1 === winner ? func2 : func1;

    matches.push({
      id: question.id,
      winner,
      loser,
    });
  }

  return matches;
}
