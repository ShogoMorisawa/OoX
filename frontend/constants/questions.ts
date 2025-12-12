import { Question, isOrderQuestion, isHealthQuestion } from "@/types/oox";

/**
 * QUESTIONS のデータ不整合をチェック（開発時のみ）
 * - order質問: 各choiceに winner/loser が必須
 * - health質問: 各choiceに effect.health が必須
 */
function validateQuestions(questions: Question[]): void {
  if (process.env.NODE_ENV === "production") return;

  const errors: string[] = [];

  for (const q of questions) {
    if (isOrderQuestion(q)) {
      for (const choice of q.choices) {
        if (!choice.winner || !choice.loser) {
          errors.push(
            `[${q.id}] order質問のchoice "${choice.id}" に winner/loser がありません`
          );
        }
        if (choice.winner && choice.loser && choice.winner === choice.loser) {
          errors.push(
            `[${q.id}] order質問のchoice "${choice.id}" で winner と loser が同じです`
          );
        }
      }
    } else if (isHealthQuestion(q)) {
      for (const choice of q.choices) {
        if (choice.effect?.health === undefined) {
          errors.push(
            `[${q.id}] health質問のchoice "${choice.id}" に effect.health がありません`
          );
        }
      }
    }
  }

  if (errors.length > 0) {
    console.error("QUESTIONS データ不整合:", errors);
    throw new Error(`QUESTIONS データ不整合: ${errors.join(", ")}`);
  }
}

export const QUESTIONS: Question[] = [
  // Order質問の例
  {
    id: "q01",
    kind: "order",
    pair: ["Ni", "Ne"],
    text: "未来の一点の意味を読む vs 可能性を広げ続ける",
    choices: [
      {
        id: "A",
        text: "未来の一点の意味を読む",
        winner: "Ni",
        loser: "Ne",
      },
      {
        id: "B",
        text: "可能性を広げ続ける",
        winner: "Ne",
        loser: "Ni",
      },
    ],
  },
  // Health質問の例（Ni の健全度を測る）
  {
    id: "q02",
    kind: "health",
    target: "Ni",
    text: "Ni（内的直観）の使い方について、どちらに近いですか？",
    choices: [
      {
        id: "A",
        text: "長期的なビジョンを描き、今日やるべきことを見定める",
        effect: { health: 1 }, // 健全寄り
      },
      {
        id: "B",
        text: "どうせ悪いことが起きると悲観的な予言に囚われる",
        effect: { health: 0 }, // 不健全寄り
      },
    ],
  },
  // 以下、追加の質問をここに定義していく
  // {
  //   id: "q03",
  //   kind: "order",
  //   pair: ["Ni", "Ti"],
  //   text: "直感で本質を掴む vs 論理で構造化する",
  //   choices: [
  //     { id: "A", text: "直感で本質を掴む", winner: "Ni", loser: "Ti" },
  //     { id: "B", text: "論理で構造化する", winner: "Ti", loser: "Ni" },
  //   ],
  // },
];

// 開発時にデータ不整合をチェック
validateQuestions(QUESTIONS);
