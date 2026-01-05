import {
  Question,
  ComparisonQuestion,
  FunctionCode,
  Choice,
  AnswerData,
  RichAnswer,
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

// 新しい形式: 回答データからRichAnswer配列を生成（API送信用）
export function buildRichAnswersFromState(
  questions: Question[],
  answers: Record<string, AnswerData>
): RichAnswer[] {
  const richAnswers: RichAnswer[] = [];

  for (const question of questions) {
    // comparisonタイプの質問のみ処理
    if (question.type !== "comparison") {
      continue;
    }

    const answerData = answers[question.id];
    if (!answerData) {
      continue;
    }

    // Type Guard: この時点でquestionはComparisonQuestionとして扱える
    const comparisonQuestion = question as ComparisonQuestion;

    // 選択された選択肢を取得
    const choice = question.choices.find(
      (c) => c.choiceId === answerData.choiceId
    );

    // choiceかrelatedFunctionCodeが存在しない場合はスキップ
    if (!choice || !choice.relatedFunctionCode) {
      continue;
    }

    richAnswers.push({
      question_id: question.id,
      choice_id: answerData.choiceId,
      function_code: choice.relatedFunctionCode,
      response_time_ms: answerData.responseTimeMs,
    });
  }

  return richAnswers;
}

// 全質問（comparison + diagnostic）の回答をRichAnswer形式に変換
// diagnostic質問の場合は、leftFunctionCodeを使用
export function buildAllRichAnswers(
  questions: Question[],
  answers: Record<string, AnswerData>
): RichAnswer[] {
  const richAnswers: RichAnswer[] = [];

  for (const question of questions) {
    const answerData = answers[question.id];
    if (!answerData) {
      continue;
    }

    const choice = question.choices.find(
      (c) => c.choiceId === answerData.choiceId
    );

    if (!choice || !choice.relatedFunctionCode) {
      continue;
    }

    // diagnostic質問の場合は、leftFunctionCodeを使用
    let functionCode: FunctionCode;
    if (question.type === "diagnostic") {
      functionCode = question.leftFunctionCode;
    } else {
      functionCode = choice.relatedFunctionCode;
    }

    richAnswers.push({
      question_id: question.id,
      choice_id: answerData.choiceId,
      function_code: functionCode,
      response_time_ms: answerData.responseTimeMs,
    });
  }

  return richAnswers;
}
