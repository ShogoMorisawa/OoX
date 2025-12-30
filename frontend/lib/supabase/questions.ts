import { Question, SupabaseQuestion } from "@/types/oox";
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

  const formattedQuestions: Question[] = data.map(
    (q: SupabaseQuestion): Question => ({
      id: q.question_id,
      questionId: q.question_id,
      kind: q.kind,
      text: q.text,
      functionPair: q.function_pair,
      targetFunction: q.target_function,
      displayOrder: q.display_order,
      choices: q.choices
        .sort((a, b) => a.choice_id.localeCompare(b.choice_id))
        .map((c) => ({
          id: c.choice_id,
          choiceId: c.choice_id,
          questionId: q.question_id,
          text: c.text,
          relatedFunction: c.related_function,
          healthScore: c.health_score ?? 0,
        })),
    })
  );

  // kindでソート: "order"を先に、"health"を後に。同じkind内ではdisplayOrderでソート
  return formattedQuestions.sort((a, b) => {
    if (a.kind !== b.kind) {
      // "order"を先に、"health"を後に
      if (a.kind === "order") return -1;
      if (b.kind === "order") return 1;
    }
    // 同じkind内ではdisplayOrderでソート
    return a.displayOrder - b.displayOrder;
  });
}
