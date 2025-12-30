/**
 * ブラウザID管理ユーティリティ
 * ローカルストレージにブラウザIDを保存し、永続化する
 */

const STORAGE_KEY = "oox_browser_id";

/**
 * UUID v4を生成する
 */
function generateUUID(): string {
  // crypto.randomUUID()が利用可能な場合はそれを使用
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // フォールバック: UUID v4形式の文字列を生成
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * ローカルストレージからブラウザIDを取得する
 * 存在しない場合は新規生成して保存してから返す
 */
export function getOrCreateBrowserId(): string {
  // ブラウザ環境でない場合はエラー
  if (typeof window === "undefined") {
    throw new Error("getOrCreateBrowserId can only be called in browser environment");
  }

  // ローカルストレージから取得を試みる
  const stored = localStorage.getItem(STORAGE_KEY);

  if (stored) {
    // 既存のIDを返す
    return stored;
  }

  // 新規生成
  const newId = generateUUID();

  // ローカルストレージに保存
  try {
    localStorage.setItem(STORAGE_KEY, newId);
  } catch (e) {
    console.error("Failed to save browser ID to localStorage:", e);
    // ストレージに保存できなくてもIDは返す（セッション中は有効）
  }

  return newId;
}

