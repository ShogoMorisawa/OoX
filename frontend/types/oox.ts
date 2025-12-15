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
  health: Record<FunctionCode, "O" | "o" | "x">;
  healthScore?: Record<FunctionCode, number>; // デバッグ用（将来削除可）
};

export type DescribeResponse = {
  title: string;
  description: string;
};

// 選択肢型
export type Choice = {
  id: string;
  questionId: string;
  choiceId: "A" | "B";
  text: string;
  relatedFunction: FunctionCode;
  healthScore: number;
};

export type Question = {
  id: string;
  questionId: string;
  kind: "order" | "health";
  text: string;
  functionPair?: [FunctionCode, FunctionCode];
  targetFunction?: FunctionCode;
  displayOrder: number;
  choices: Choice[];
};


// Supabaseから取得する生データの型
export type SupabaseChoice = {
  id: string;
  question_id: string;
  choice_id: "A" | "B";
  text: string;
  related_function: FunctionCode;
  health_score: number;
};

// ステップ型（constants/steps.ts の OOX_STEPS から導出）
export type Step = "start" | "quiz" | "resolve" | "hierarchy" | "result";

// 階層型（constants/tier.ts の OOX_TIER から導出）
export type Tier = "Dominant" | "High" | "Middle" | "Low";
