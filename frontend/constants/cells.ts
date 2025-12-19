import { FunctionCode } from "@/types/oox";

export const CELL_COLORS = {
  Ni: "bg-indigo-600",
  Ne: "bg-yellow-400",
  Ti: "bg-slate-400",
  Te: "bg-red-600",
  Fi: "bg-pink-500",
  Fe: "bg-cyan-400",
  Si: "bg-amber-700",
  Se: "bg-green-600",
};

export const FUNCTION_TEXT: Record<FunctionCode, string> = {
  Ni: "未来の意味や物語を考えるのが得意",
  Ne: "アイデアをどんどん思いつく",
  Ti: "論理でスッキリ整理したい",
  Te: "結果・効率を重視して動く",
  Fi: "自分の本音や大事な気持ちを守りたい",
  Fe: "みんなの気持ちや場の空気を大事にする",
  Si: "なじみのあるやり方・思い出が安心",
  Se: "五感で今この瞬間を楽しみたい",
};
