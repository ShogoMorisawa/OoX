import { Question } from "@/types/oox";

export const QUESTIONS: Question[] = [
  {
    id: "q01",
    left: "Ni",
    right: "Ne",
    text: "未来の一点の意味を読む vs 可能性を広げ続ける",
  },
  {
    id: "q02",
    left: "Ni",
    right: "Ti",
    text: "直感で本質を掴む vs 論理で構造化する",
  },
  {
    id: "q03",
    left: "Ni",
    right: "Te",
    text: "意味のある未来を描く vs 今すぐ成果を出す",
  },
  {
    id: "q04",
    left: "Ni",
    right: "Fi",
    text: "未来の物語を優先する vs 今の気持ちを守る",
  },
  {
    id: "q05",
    left: "Ni",
    right: "Fe",
    text: "自分の確信を貫く vs 場の空気を読む",
  },
  {
    id: "q06",
    left: "Ni",
    right: "Si",
    text: "これから起こることを重視する vs 過去の実績を信じる",
  },
  {
    id: "q07",
    left: "Ni",
    right: "Se",
    text: "未来を考え込む vs 今すぐ行動する",
  },
  // ... (本来はここに残り21問が必要)
  // 動作確認用に少し混ぜておく
  { id: "q08", left: "Fe", right: "Ti", text: "みんなの和 vs 正しい理屈" },
  { id: "q09", left: "Se", right: "Si", text: "今の刺激 vs 過去の安定" },
];
