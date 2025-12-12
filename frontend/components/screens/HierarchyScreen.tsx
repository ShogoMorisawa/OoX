// frontend/components/screens/HierarchyScreen.tsx
"use client";

import Image from "next/image";
import { FunctionCode, CalculateResponse } from "@/types/oox";
import { Tier, OOX_TIER } from "@/constants/tier";

type Props = {
  calculateResult: CalculateResponse;
  tierMap: Partial<Record<FunctionCode, Tier>>;
  loading: boolean;
  loadingMessage: string;
  onUpdateTier: (func: FunctionCode, tier: Tier) => void;
  onConfirmHierarchy: () => void;
};

// 各インデックスをどの階層として扱うか（現状は順位ベース）
const indexToTier = (index: number): Tier => {
  if (index < 2) return OOX_TIER.DOMINANT; // 1〜2位
  if (index < 4) return OOX_TIER.HIGH; // 3〜4位
  if (index < 6) return OOX_TIER.MIDDLE; // 5〜6位
  return OOX_TIER.LOW; // 7〜8位
};

// 心理機能ごとの “ざっくり説明”（文言はあとで好きに変えてOK）
const FUNCTION_TEXT: Record<FunctionCode, string> = {
  Ni: "未来の意味や物語を考えるのが得意",
  Ne: "アイデアをどんどん思いつく",
  Ti: "論理でスッキリ整理したい",
  Te: "結果・効率を重視して動く",
  Fi: "自分の本音や大事な気持ちを守りたい",
  Fe: "みんなの気持ちや場の空気を大事にする",
  Si: "なじみのあるやり方・思い出が安心",
  Se: "五感で今この瞬間を楽しみたい",
};

// 真ん中列の着せ替え細胞の画像（上から順）
const CELL_IMAGES = [
  "/images/oox_hie_cell-night-red-left.png",
  "/images/oox_hie_cell-night-lightBlue-right.png",
  "/images/oox_hie_cell-lightBlue-right.png",
  "/images/oox_hie_cell-red-left.png",
  "/images/oox_hie_cell-citi-yellow-left.png",
  "/images/oox_hie_cell-citi-green-right.png",
  "/images/oox_hie_cell-lost-left.png",
  "/images/oox_hie_cell-lost-right.png",
] as const;

const TIER_INFO: { tier: Tier; title: string; subtitle: string }[] = [
  {
    tier: OOX_TIER.DOMINANT,
    title: "王様",
    subtitle: "とてもよく働く\n（いつも一緒にいるクセ）",
  },
  {
    tier: OOX_TIER.HIGH,
    title: "騎士",
    subtitle: "よく働く\n（頼りになる主力メンバー）",
  },
  {
    tier: OOX_TIER.MIDDLE,
    title: "市民",
    subtitle: "ときどき働く\n（必要な時だけ登場）",
  },
  {
    tier: OOX_TIER.LOW,
    title: "迷子",
    subtitle: "あまり働かない\n（今は休憩中…）",
  },
];

export default function HierarchyScreen({
  calculateResult,
  tierMap,
  loading,
  loadingMessage,
  onUpdateTier,
  onConfirmHierarchy,
}: Props) {
  // order をフラットにして 8 つの心理機能を取得
  const finalOrder = (calculateResult.order.flat() as FunctionCode[]).slice(
    0,
    8
  );

  // 初期表示用に、tierMap にまだ値がないところは index ベースで自動設定
  finalOrder.forEach((func, index) => {
    if (!tierMap[func]) {
      onUpdateTier(func, indexToTier(index));
    }
  });

  return (
    <div className="h-screen flex flex-col justify-between px-6 py-6 md:py-8 bg-[url('/images/oox_background.png')] bg-cover bg-center">
      <div className="max-w-5xl w-full mx-auto flex flex-col h-full">
        {/* タイトル */}
        <div className="text-center space-y-2 mb-4 shrink-0">
          <p className="text-xs md:text-sm text-sky-900/60">
            上から 1〜8 位の順番は、さっきの質問で決まった「よく使う順」。
            <br className="hidden md:block" />
            線で区切られた 4 つのゾーンが、それぞれ 王様 / 騎士 / 市民 / 迷子
            を表しています。
          </p>
        </div>

        <div className="grid grid-cols-12 gap-4 md:gap-6 items-stretch flex-1 min-h-0 overflow-hidden">
          {/* 中央：境界線 + 着せ替え細胞 + 吹き出し */}
          <div className="col-span-8 flex justify-center">
            <div className="relative w-[280px] md:w-[340px] h-full">
              {/* 上から8つの細胞をジグザグに配置 + 吹き出し */}
              <div className="absolute inset-0">
                {finalOrder.map((func, index) => {
                  const imgSrc = CELL_IMAGES[index] ?? CELL_IMAGES[0];
                  const tier = tierMap[func] ?? indexToTier(index);
                  const tierLabel =
                    TIER_INFO.find((t) => t.tier === tier)?.title ?? "";
                  // ジグザグ配置：偶数番目は左寄り、奇数番目は右寄り
                  const isEven = index % 2 === 0;
                  // 各要素の縦位置を計算（親要素の高さを8等分）
                  const topPercent = (index * 100) / 8 + 2; // 2%は上端の余白
                  const translateX = isEven
                    ? "-translate-x-6 md:-translate-x-7"
                    : "translate-x-6 md:translate-x-7";

                  return (
                    <div
                      key={func}
                      className={`absolute left-1/2 -translate-x-1/2 flex items-center gap-2 ${translateX}`}
                      style={{ top: `${topPercent}%` }}
                    >
                      {/* 左側に寄っている細胞（偶数番目）の場合、吹き出しを右側に */}
                      {isEven && (
                        <div className="relative w-[130px] md:w-[160px] aspect-[3/2] -order-1 shrink-0">
                          <Image
                            src="/images/oox_quiz_question.png"
                            alt="説明吹き出し"
                            fill
                            className="object-contain"
                          />
                          <div className="absolute inset-0 flex flex-col items-center justify-center px-3 text-[9px] md:text-[10px] text-sky-900 text-center leading-tight">
                            <p className="font-bold mb-0.5">{func}</p>
                            <p className="whitespace-pre-line">
                              {FUNCTION_TEXT[func]}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* 細胞 */}
                      <div className="flex flex-col items-center gap-0.5 shrink-0">
                        <div className="relative w-[75px] md:w-[90px] aspect-square">
                          <Image
                            src={imgSrc}
                            alt={`${func} cell`}
                            fill
                            className="object-contain drop-shadow-md"
                          />
                        </div>
                        <p className="text-[10px] md:text-[11px] text-sky-900/80 font-semibold">
                          {index + 1} 位・{tierLabel}
                        </p>
                      </div>

                      {/* 右側に寄っている細胞（奇数番目）の場合、吹き出しを左側に */}
                      {!isEven && (
                        <div className="relative w-[130px] md:w-[160px] aspect-[3/2] shrink-0">
                          <Image
                            src="/images/oox_quiz_question.png"
                            alt="説明吹き出し"
                            fill
                            className="object-contain"
                          />
                          <div className="absolute inset-0 flex flex-col items-center justify-center px-3 text-[9px] md:text-[10px] text-sky-900 text-center leading-tight">
                            <p className="font-bold mb-0.5">{func}</p>
                            <p className="whitespace-pre-line">
                              {FUNCTION_TEXT[func]}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 右：階層ラベル（王様 / 騎士 / 市民 / 迷子） */}
          <div className="col-span-4 flex flex-col justify-between items-center h-full">
            {TIER_INFO.map((info) => (
              <div
                key={info.tier}
                className="relative w-full max-w-[190px] flex-1 min-h-0 flex items-center justify-center"
              >
                <div className="relative w-full h-full max-h-full">
                  <Image
                    src="/images/oox_resolve_bubble.png"
                    alt={info.title}
                    fill
                    className="object-contain"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center text-sky-900">
                    <p className="text-base md:text-lg font-bold mb-1">
                      {info.title}
                    </p>
                    <p className="text-[10px] md:text-xs whitespace-pre-line leading-tight">
                      {info.subtitle}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 下部ボタン */}
        <div className="mt-6 md:mt-8 flex flex-col items-center gap-3 shrink-0">
          <button
            onClick={onConfirmHierarchy}
            disabled={loading}
            className={`px-8 py-3 rounded-full text-sm md:text-base font-bold shadow-lg shadow-sky-300/40
              transition-all hover:scale-[1.02] active:scale-95
              ${
                loading
                  ? "bg-sky-300/60 text-white cursor-not-allowed"
                  : "bg-gradient-to-r from-sky-400 to-cyan-400 text-white hover:from-sky-500 hover:to-cyan-500"
              }`}
          >
            {loading
              ? loadingMessage || "分析中..."
              : "この階層でストーリーを読む"}
          </button>
        </div>
      </div>
    </div>
  );
}
