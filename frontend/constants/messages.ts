/**
 * UIメッセージ定数
 * アプリケーション全体で使用されるメッセージを一元管理
 */

export const LOADING_MESSAGES = {
  DEFAULT: "Loading...",
  CALCULATING: "思考回路を解析中...",
  TESTING: "テスト中...",
} as const;

export const ERROR_MESSAGES = {
  FETCH_QUESTIONS_FAILED: "質問データの取得に失敗:",
  LOAD_QUESTIONS_FAILED: "質問データの読み込みに失敗しました。",
  CALCULATE_ERROR: "計算エラーが発生しました",
  DESCRIBE_ERROR: "説明の生成に失敗しました",
  SAVE_RESULT_ERROR: "結果の保存に失敗しました",
} as const;

export const TEST_MESSAGES = {
  QUIZ_TEST_MODE: "🧪 Quiz画面テストモード",
  QUIZ_TEST_DESCRIPTION: "?q=1 のように指定して任意の質問から開始できます",
  CALCULATE_TRIGGER: "テスト用: 計算トリガー",
} as const;
