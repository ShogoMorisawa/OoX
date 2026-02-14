---
name: oox-spec-writer
description: OoXアプリのfrontendとbackendを横断分析し、リポジトリ直下のSPEC.mdを新規作成または更新する。Use when the user asks for app specification docs, detailed architecture docs, SPEC.md creation/update, or syncing spec with current code.
---

# oox-spec-writer Skill

OoX の現行実装を根拠に、詳細な `SPEC.md` を作成または更新する。
記述は日本語で行い、推測ではなくコード確認結果のみを書く。

## 実行対象

- 既定の出力先を `SPEC.md` とする
- ユーザーが別パスを指定した場合はそのパスを優先する
- frontend/ backend の両方を必ず対象に含める

## 進め方

1. 対象ファイルを収集する  
`frontend/app` `frontend/components` `frontend/hooks` `frontend/lib` `frontend/constants` `frontend/types` `frontend/package.json`  
`backend/routes` `backend/app/Http` `backend/app/Services` `backend/app/Jobs` `backend/config` `backend/composer.json` `backend/serverless.yml`
2. 既存 SPEC を読む  
既存ファイルがある場合は章構成と記載粒度を確認し、未記載・古い記載を特定する。
3. 差分を抽出する  
画面遷移、API契約、バリデーション、アルゴリズム、非同期ジョブ、外部依存、環境変数を比較する。
4. 章ごとに更新する  
更新ルールは本ファイル内の「更新マッピング」を使う。
5. 体裁を統一する  
本ファイル内の「SPECテンプレート」を使う。テーブル列名、用語、見出し表現を揃える。

## 必須ルール

- 実在しないファイル名・関数名・定数名を書かない
- バージョン番号は `frontend/package.json` と `backend/composer.json` から取る
- API I/O は `backend/app/Http/Requests/*.php` を根拠に書く
- 非同期処理は `DescribeController` と `GenerateDescriptionJob` の両方を参照して書く
- アルゴリズム説明は `CalculateService` 実装に合わせる（全順列評価、重み、葛藤検出）
- インフラ記述は `backend/serverless.yml` を優先し、READMEの文言より実設定を優先する
- 変更がない章は不要に書き換えない

## 推奨コマンド

```bash
rg --files frontend backend
find frontend backend -maxdepth 3 -type d | sort
rg "Route::|class .*Controller|class .*Service|class .*Job" backend
rg "export const|export type|function " frontend
```

## 更新マッピング

| 変更の種類 | 更新する章 |
|------------|------------|
| 画面追加/変更（start, quiz, resolve, hierarchy, result, world） | フロントエンド詳細、データフロー |
| `useOoX` のstate/handler変更 | フロントエンド詳細、データフロー |
| APIクライアント変更（`frontend/lib/api`） | APIリファレンス |
| Route/Controller/Request変更 | バックエンド詳細、APIリファレンス |
| Service/Job変更 | バックエンド詳細、アルゴリズム、非同期・ジョブ制御 |
| `package.json` / `composer.json` 変更 | 技術スタック |
| `serverless.yml` / `config/*.php` 変更 | 設定・環境変数 |
| 型定義（`types/oox.ts`）変更 | データモデル・型 |
| 障害対応の追加 | トラブルシューティング |

## SPECテンプレート

下記を基準に章を作る。実装がない章は省略してよい。

1. 概要
2. 技術スタック
3. システムアーキテクチャ
4. ディレクトリ構成
5. フロントエンド詳細
6. バックエンド詳細
7. API リファレンス
8. データモデル・型
9. アルゴリズム
10. 非同期・ジョブ制御
11. 設定・環境変数
12. 開発・運用ガイド
13. トラブルシューティング
14. 変更履歴（任意）

## 完了チェック

- 章構成の網羅性を「SPECテンプレート」で確認する
- 変更反映漏れを「更新マッピング」で確認する
- 主要API（`/api/calculate` `/api/describe` `/api/describe/status/{jobId}` `/api/results`）の説明が最新であることを確認する
