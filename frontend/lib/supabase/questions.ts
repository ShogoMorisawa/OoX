import {
  Question,
  ComparisonQuestion,
  DiagnosticQuestion,
  SupabaseQuestion,
} from "@/types/oox";
import { supabase } from "@/lib/supabaseClient";

export async function fetchQuestions(): Promise<Question[]> {
  const { data, error } = await supabase
    .from("questions")
    .select(
      `
      *,
      choices (*)
    `
    )
    .order("display_order", { ascending: true });

  if (error) throw error;

  if (!data) return [];

  // データをフロントエンド用に整形
  const formattedQuestions: Question[] = data.map((q: SupabaseQuestion) => {
    // 共通部分
    const base = {
      id: q.id,
      code: q.code ?? undefined,
      text: q.text,
      displayOrder: q.display_order,
      choices: q.choices
        .sort((a, b) => a.label.localeCompare(b.label)) // A, B順にソート
        .map((c) => ({
          id: c.id,
          questionId: c.question_id,
          choiceId: c.label, // DBのlabelをchoiceIdとして扱う
          text: c.text,
          relatedFunctionCode: c.related_function_code,
          scoreValue: c.score_value ?? 0,
        })),
    };

    // 型による分岐（Type Guardに対応させる）
    if (q.type === "comparison") {
      if (!q.right_function_code) {
        throw new Error(
          `Comparison question ${q.id} must have right_function_code`
        );
      }
      return {
        ...base,
        type: "comparison",
        leftFunctionCode: q.left_function_code,
        rightFunctionCode: q.right_function_code, // DB制約でNot Null
      } as ComparisonQuestion;
    } else {
      return {
        ...base,
        type: "diagnostic",
        leftFunctionCode: q.left_function_code,
        // rightFunctionCodeは不要
      } as DiagnosticQuestion;
    }
  });

  // typeでソート: comparison -> diagnostic の順
  return formattedQuestions.sort((a, b) => {
    if (a.type !== b.type) {
      // "comparison"を先に、"diagnostic"を後に
      return a.type === "comparison" ? -1 : 1;
    }
    // 同じtype内ではdisplayOrderでソート
    return a.displayOrder - b.displayOrder;
  });
}
