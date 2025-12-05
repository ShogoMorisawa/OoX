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
