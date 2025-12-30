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

// 選択肢の型
export interface Choice {
  id: string;
  questionId: string;
  choiceId: "A" | "B"; // DBのlabelカラムをchoiceIdとして扱う
  text: string;
  relatedFunctionCode: FunctionCode; // related_function -> related_function_code
  scoreValue: number; // health_score -> score_value (0 or 1)
}

// 共通の質問プロパティ
interface BaseQuestion {
  id: string;
  code?: string; // Q-01, H-01など
  text: string;
  displayOrder: number;
  choices: Choice[];
}

// 比較（序列）用の質問型
export interface ComparisonQuestion extends BaseQuestion {
  type: "comparison"; // kind: 'order' -> type: 'comparison'
  leftFunctionCode: FunctionCode;
  rightFunctionCode: FunctionCode; // 比較対象が必須
}

// 診断（健全度）用の質問型
export interface DiagnosticQuestion extends BaseQuestion {
  type: "diagnostic"; // kind: 'health' -> type: 'diagnostic'
  leftFunctionCode: FunctionCode; // 対象機能
  rightFunctionCode?: never; // 診断質問には存在しない
}

// 統合された質問型（Discriminated Union）
export type Question = ComparisonQuestion | DiagnosticQuestion;

// Supabaseから返ってくる生の型（スネークケース）
export interface SupabaseQuestion {
  id: string;
  code: string | null;
  type: "comparison" | "diagnostic";
  text: string;
  left_function_code: FunctionCode;
  right_function_code: FunctionCode | null;
  display_order: number;
  choices: SupabaseChoice[]; // JOINされた結果
}

export interface SupabaseChoice {
  id: string;
  question_id: string;
  label: "A" | "B"; // DBのカラム名
  text: string;
  related_function_code: FunctionCode;
  score_value: number;
}

// ステップ型（constants/steps.ts の OOX_STEPS から導出）
export type Step =
  | "start"
  | "quiz"
  | "resolve"
  | "hierarchy"
  | "result"
  | "world";

// 階層型（constants/tier.ts の OOX_TIER から導出）
export type Tier = "Dominant" | "High" | "Middle" | "Low";

export type WorldUserResult = {
  id: string;
  created_at: string;

  // 表示用
  title: string;
  description: string;
  icon_url: string;

  // 配置・アイコン決定用
  dominant_function: FunctionCode; // アイコン種別
  second_function: FunctionCode; // エリア決定用

  // 生データ（詳細表示したい場合などに使用）
  answers?: Record<string, string>;
  function_order?: FunctionCode[];
  tier_map?: Record<FunctionCode, Tier>;
  health_status?: Record<FunctionCode, "O" | "o" | "x">;
};
