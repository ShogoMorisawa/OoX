"use client";

export const HEADER_COPY = {
  label: "MEMORY",
  summaryFallback: "この状況について",
  toggleOpen: "閉じる",
  toggleClosed: "どんな質問だったっけ？",
};

export const HEADER_VARIANTS = [
  {
    title: "そういえば、この質問。",
    subtitle: "回答するのに、いちばん時間を使っていましたね。",
  },
  {
    title: "もうひとつ、迷った質問がありました。",
    subtitle: "感覚に近いほうを、もう一度教えてください。",
  },
];

export const BADGE_TEXT = {
  system: "これまでの回答と、つじつまが合うのは",
  user: "でもあの時、あなたが選んだのは",
};

export const BADGE_COLOR = {
  system: "bg-blue-50 text-blue-600 border-blue-100",
  user: "bg-orange-50 text-orange-600 border-orange-100",
};

export const ACTIVE_CLASS = {
  system: "bg-blue-50/90 border-blue-300 ring-4 ring-blue-100",
  user: "bg-orange-50/90 border-orange-300 ring-4 ring-orange-100",
};

export const CTA_LABEL = {
  default: "今の私は、こっち。",
  loading: "再計算中...",
};
