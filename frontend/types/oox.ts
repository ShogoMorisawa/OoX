// OoX アプリケーション共通型定義

export type FunctionCode =
  | "Ni"
  | "Ne"
  | "Ti"
  | "Te"
  | "Fi"
  | "Fe"
  | "Si"
  | "Se";
export type OrderElement = FunctionCode | FunctionCode[];

// バックエンドからのレスポンス型
export type CalculateResponse = {
  order: OrderElement[];
};

export type DescribeResponse = {
  title: string;
  description: string;
};

// 質問データ型
export type Question = {
  id: string;
  left: FunctionCode;
  right: FunctionCode;
  text: string;
};

// ステップ型（constants/steps.ts の OOX_STEPS から導出）
export type Step = "start" | "quiz" | "resolve" | "hierarchy" | "result";

// 階層型（constants/tier.ts の OOX_TIER から導出）
export type Tier = "Dominant" | "High" | "Middle" | "Low";
