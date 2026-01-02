import {
  Question,
  ComparisonQuestion,
  FunctionCode,
  Choice,
} from "@/types/oox";

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
    // comparisonタイプの質問のみ処理
    if (question.type !== "comparison") {
      continue;
    }

    // Type Guard: この時点でquestionはComparisonQuestionとして扱える
    const comparisonQuestion = question as ComparisonQuestion;

    // currentChoiceを取得。
    const choiceId = answers[question.id];
    const currentChoice = question.choices.find(
      (choice) => choice.choiceId === choiceId
    );

    // currentChoiceかrelatedFunctionCodeが存在しない場合はスキップ。
    if (!currentChoice || !currentChoice.relatedFunctionCode) {
      continue;
    }

    // winnerとloserを取得。
    const winner = currentChoice.relatedFunctionCode;
    const loser =
      comparisonQuestion.leftFunctionCode === winner
        ? comparisonQuestion.rightFunctionCode
        : comparisonQuestion.leftFunctionCode;

    matches.push({
      id: question.id,
      winner,
      loser,
    });
  }

  return matches;
}
