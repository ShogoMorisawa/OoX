# アプリ仕様書（OoX）

OoX の現行実装（frontend + backend）を基準にした開発者向け仕様書。
対象リポジトリ: `/Users/shogomorisawa/dev/personal/projects/oox`

---

## 目次

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
14. 変更履歴

---

## 1. 概要

| 項目 | 内容 |
|------|------|
| 用途 | 8心理機能（Ni/Ne/Ti/Te/Fi/Fe/Si/Se）の比較回答と診断回答を元に、順序・健全度・階層を算出し、最終結果を生成する性格診断アプリ |
| 主なフロー | `start -> quiz -> (conflictsあり: resolve) -> hierarchy -> result -> world` |
| フロントの責務 | 質問取得、回答収集、API呼び出し、葛藤解決UI、階層調整UI、結果表示、World表示 |
| バックの責務 | 順序計算（Kemeny-Young総当たり）、葛藤検出、健全度計算、Gemini文章生成ジョブ、結果保存API |
| 外部連携 | Supabase（questions/user_results）、Gemini API、AWS Lambda（Bref） |

---

## 2. 技術スタック

### 2.1 Frontend

| 区分 | 技術 | バージョン | 用途 |
|------|------|------------|------|
| Framework | Next.js | `^16.0.7` | App Router、画面配信 |
| UI | React / React DOM | `^19.2.3` | 画面構築 |
| 言語 | TypeScript | `^5` | 型安全 |
| Styling | Tailwind CSS | `^4` | UIスタイル |
| Motion | Framer Motion | `^12.23.26` | メニュー/カード等アニメーション |
| UI通知 | Sonner | `^2.0.7` | toast表示 |
| Icons | Lucide React | `^0.562.0` | グローバルメニューアイコン |
| DB Client | supabase-js | `^2.87.1` | questions/user_results 取得 |

### 2.2 Backend

| 区分 | 技術 | バージョン | 用途 |
|------|------|------------|------|
| Framework | Laravel | `^12.0` | API実装 |
| 言語 | PHP | `^8.2` | アプリ実装 |
| Serverless | Bref / Laravel Bridge | `^2.4` / `^2.7` | Lambda 実行基盤 |
| AI | google-gemini-php/client / laravel | `^2.7` / `^2.0` | 描写生成 |
| Queue | Laravel Queue | Laravel標準 | 非同期ジョブ実行 |
| Test | PHPUnit | `^11.5.3` | ユニット/機能テスト |

### 2.3 インフラ

| 区分 | 構成 |
|------|------|
| Frontend配信 | Next.js（実行環境はリポジトリ外。コード上は固定なし） |
| Backend配信 | AWS Lambda（`ap-northeast-1`） via Serverless Framework |
| DB/データストア | Supabase（PostgreSQL + REST） |
| Queue Worker | Lambda `worker` 関数を1分間隔で `queue:work --stop-when-empty --max-time=600` 実行 |

---

## 3. システムアーキテクチャ

```mermaid
flowchart TD
  A[Start/Quiz UI] --> B[useOoX Hook]
  B --> C[POST /api/calculate]
  C --> D[CalculateService]
  D --> E[order + conflicts + health]
  E --> B
  B --> F[Resolve/Hierarchy UI]
  F --> G[POST /api/describe]
  G --> H[GenerateDescriptionJob]
  H --> I[DescribeService + Gemini]
  B --> J[GET /api/describe/status/{jobId}]
  J --> K[Cache: job_status/job_result]
  B --> L[POST /api/results]
  L --> M[Supabase user_results]
  N[/world] --> M
```

### 3.1 主要責務分割

- `frontend/components/Screens.tsx`
  - stepに応じて `Start/Quiz/Resolve/Hierarchy/Result/World` を切り替える。
- `frontend/hooks/useOoX.ts`
  - アプリ状態、API呼び出し、ポーリング、保存処理を集約。
- `backend/routes/api.php`
  - 4つの公開API（calculate/describe/status/results）を提供。
- `backend/app/Services/CalculateService.php`
  - 順序最適化、葛藤検出、健全度判定。
- `backend/app/Jobs/GenerateDescriptionJob.php`
  - Gemini生成の非同期実行、キャッシュ状態管理。

---

## 4. ディレクトリ構成

```text
oox/
├── frontend/
│   ├── app/
│   │   ├── page.tsx                  # ルート: <Screens />
│   │   ├── world/page.tsx            # World専用ページ
│   │   ├── layout.tsx                # GlobalMenu + Toaster + fonts
│   │   └── test/*                    # 画面単体テスト用ページ
│   ├── components/
│   │   ├── Screens.tsx               # step遷移のルータ
│   │   ├── screens/start|quiz|resolve|hierarchy|result|world
│   │   └── shared/GlobalMenu.tsx
│   ├── hooks/
│   │   ├── useOoX.ts                 # 中心ロジック
│   │   └── useIsMobile.ts
│   ├── lib/
│   │   ├── api/                      # calculate/describe/results client
│   │   ├── oox/                      # matches/health/tier計算
│   │   └── supabase/                 # questions取得
│   ├── constants/                    # steps/api/messages/icons/tier/cells
│   ├── types/oox.ts                  # 共通型
│   └── public/images/*               # UI画像・セル画像・結果アイコン
├── backend/
│   ├── routes/api.php                # APIルーティング
│   ├── app/Http/
│   │   ├── Controllers/*             # Calculate/Describe/Result
│   │   └── Requests/*                # 各APIバリデーション
│   ├── app/Services/
│   │   ├── CalculateService.php
│   │   ├── DescribeService.php
│   │   └── SupabaseService.php
│   ├── app/Jobs/GenerateDescriptionJob.php
│   ├── config/                       # queue/database/services/gemini 等
│   ├── tests/Unit/CalculateServiceTest.php
│   └── serverless.yml                # Lambda構成
└── SPEC.md
```

---

## 5. フロントエンド詳細

### 5.1 エントリとレイアウト

- `frontend/app/page.tsx`
  - `<Screens />` を表示。
- `frontend/app/layout.tsx`
  - 全ページ共通で `GlobalMenu` と `Toaster` を表示。
  - フォントは `Geist`, `Geist_Mono`, `Quicksand`。

### 5.2 画面遷移（`Screens.tsx`）

| Step | 表示コンポーネント | 遷移トリガー |
|------|---------------------|--------------|
| `start` | `StartScreen` | `handleStart()` |
| `quiz` | `QuizScreen` | Start後 |
| `resolve` | `ResolveScreen` | calculate結果にconflictsあり |
| `hierarchy` | `HierarchyScreen` | conflicts解消済み |
| `result` | `ResultScreen` | describe完了 |
| `world` | `WorldScreen` | Resultのボタン |

### 5.3 中心ロジック（`useOoX.ts`）

主要 state:
- `step`, `questions`, `answers`
- `calculateResult`, `describeResult`
- `currentConflict`, `conflictBlock`, `resolvedBlock`, `resolveCount`
- `tierMap`, `finalOrder`
- `loading`, `loadingMessage`

主要処理:
1. 初回マウント時に `fetchQuestions()` で Supabase `questions` 取得
2. Quiz完了で `/api/calculate` 実行
3. conflictsありなら Resolveへ、なければ Hierarchyへ
4. Hierarchy確定で `/api/describe` 実行 -> `job_id` 取得
5. `POLL_INTERVAL=3000ms` で `/api/describe/status/{jobId}` をポーリング
6. completedで Resultへ遷移し `/api/results` 保存
7. `router.push('/world')` で Worldページへ

### 5.4 Quiz

- `QuizScreen` は `QuizPC` / `QuizMobile` を `useIsMobile(768)` で切替。
- 回答時間は `useLayoutEffect + performance.now()` で計測し、`response_time_ms` として保持。
- 未選択では Next不可。
- 最後の質問で `onCalculate()` を実行。

### 5.5 Resolve

- `conflictBlock` は `[system_order_winner, user_winner]`。
- 2枚カードから1つ選択して `resolvedBlock` に保持。
- 確定時に `fixed_match` を組み立てて再計算（`/api/calculate`）。
- 衝突が残れば次の conflict を継続表示。

### 5.6 Hierarchy

- `calculateResult.order` を平坦化し8機能順を生成。
- 境界線 `borders=[2,4,6]` を UI操作で変更。
- 境界から `tierMap` を都度算出:
  - `<2`: Dominant
  - `<4`: High
  - `<6`: Middle
  - それ以外: Low
- 確定時に `onConfirmHierarchy(currentTierMap)` 実行。

### 5.7 Result

- `describeResult.title/description` を表示。
- アイコンは `getIcon(dominant, second)`。
- ボタンで Worldへ遷移。

### 5.8 World

- `/world` ページで `supabase.from('user_results').select('*').order('created_at', { ascending: false }).limit(100)` を取得。
- PC版 (`WorldPC`): `second_function` ごとにバイオーム座標へ配置。
- Mobile版 (`WorldMobile`): グリッド表示。
- クリックで `UserModal` を表示。

### 5.9 共通ユーティリティ

- `frontend/lib/oox/matches.ts`
  - `buildRichAnswersFromState`（comparisonのみ）
  - `buildAllRichAnswers`（comparison + diagnostic）
- `frontend/lib/oox/health.ts`
  - diagnosticの `scoreValue` を機能別合算。
- `frontend/lib/oox/tier.ts`
  - `buildDefaultTierMap`, `isCompleteTierMap`。
- `frontend/utils/browserId.ts`
  - `localStorage` に `oox_browser_id` を保持。

---

## 6. バックエンド詳細

### 6.1 ルーティング（`backend/routes/api.php`）

- `POST /api/calculate` -> `CalculateController`（invokable）
- `POST /api/describe` -> `DescribeController@store`
- `GET /api/describe/status/{jobId}` -> `DescribeController@show`
- `POST /api/results` -> `ResultController@store`

### 6.2 Controllers

#### CalculateController

1. `CalculateRequest` でバリデーション
2. `SupabaseService::fetchQuestions()` で質問定義取得
3. `CalculateService::calculateBestOrder()` 実行
4. `calculateHealthStatus()` で O/o/x 生成
5. `order/conflicts/health` を返却

#### DescribeController

- `store()`
  - UUID `job_id` 生成
  - `job_status_{job_id}` を cache に `queued` で保存（TTL 600）
  - `GenerateDescriptionJob` を dispatch
  - `202 Accepted` + `job_id` 返却
- `show(jobId)`
  - `job_result_{job_id}` を最優先で返却
  - なければ `job_status_{job_id}` を返却
  - どちらもなければ `404 not_found`

#### ResultController

- `SaveResultRequest` で検証後、`SupabaseService::saveResult()` で保存。
- 失敗時は `500`。

### 6.3 Services

#### CalculateService

- `convertAnswersToMatches()`
  - comparison質問のみを対象に `winner/loser/time/question_id` へ変換
- `runKemenyYoung()`
  - 8機能の全順列（40,320通り）を `Heap's Algorithm` で列挙
  - 回答と整合する勝敗に重み加算し最大スコア順列を採用
  - `fixed_match` 指定時は矛盾順列を除外
- `detectConflicts()`
  - 最適順序と回答勝敗の逆転を検出
  - `response_time_ms` 降順で返却
- `calculateHealthStatus()`
  - score>=3: `O`, score===2: `o`, score<=1: `x`

#### DescribeService

- `buildGeminiPrompt()` で日本語プロンプトを構築（本文のみ要求）
- `Gemini::generativeModel('models/gemini-pro-latest')` で生成
- `generateTitle()` は `finalOrder` 上位3機能から生物名タイトルを合成

#### SupabaseService

- `fetchQuestions()`
  - `/rest/v1/questions?select=id,type,left_function_code,right_function_code`
- `saveResult()`
  - `/rest/v1/user_results` にPOST（`Prefer: return=minimal`）
- 接続設定は `config('services.supabase.url/key')`

### 6.4 Jobs

#### GenerateDescriptionJob

- `timeout = 600`, `tries = 3`
- 実行時に `job_status_* = processing`
- 成功時 `job_result_* = completed + data`（TTL 3600）
- 失敗時 `job_result_* = failed + error`（TTL 3600）

---

## 7. API リファレンス

## 7.1 POST `/api/calculate`

Request (from `CalculateRequest`):

| フィールド | 型 | 必須 | 制約 |
|------------|----|------|------|
| answers | array | 必須 | - |
| answers.*.question_id | string | 必須 | - |
| answers.*.choice_id | string | 必須 | `A/B` |
| answers.*.function_code | string | 必須 | `Ni,Ne,Ti,Te,Fi,Fe,Si,Se` |
| answers.*.response_time_ms | integer | 必須 | `>=0` |
| health_scores | array | 必須 | 各値 `numeric >=0 or null` |
| fixed_match | array | 任意 | - |
| fixed_match.winner | string | 任意 | FunctionCode |
| fixed_match.loser | string | 任意 | FunctionCode |

Response:

```json
{
  "order": ["Ni", "Ti", "Fe", "..."],
  "conflicts": [
    {
      "question_id": "...",
      "user_winner": "Ni",
      "system_order_winner": "Ti",
      "response_time_ms": 42000
    }
  ],
  "health": {
    "Ni": "O",
    "Ne": "o",
    "Ti": "x"
  }
}
```

## 7.2 POST `/api/describe`

Request (from `DescribeRequest`):

| フィールド | 型 | 必須 | 制約 |
|------------|----|------|------|
| finalOrder | array | 必須 | 各要素 FunctionCode |
| healthStatus | array | 必須 | 各値 `O/o/x` |
| tierMap | array | 必須 | 各値 `Dominant/High/Middle/Low` |

Response: `202 Accepted`

```json
{ "message": "Accepted", "job_id": "uuid" }
```

## 7.3 GET `/api/describe/status/{jobId}`

返却パターン:

- 完了:
```json
{ "status": "completed", "data": { "title": "...", "description": "..." } }
```
- 失敗:
```json
{ "status": "failed", "error": "生成に失敗しました。もう一度お試しください。" }
```
- 実行中/待機:
```json
{ "status": "queued" }
```
または
```json
{ "status": "processing" }
```
- 無効ID: `404`

## 7.4 POST `/api/results`

Request (from `SaveResultRequest`):

| フィールド | 型 | 必須 | 制約 |
|------------|----|------|------|
| answers | array | 必須 | RichAnswer配列 |
| function_order | array | 必須 | size=8, FunctionCode |
| tier_map | object | 必須 | 値 `Dominant/High/Middle/Low` |
| health_status | object | 必須 | 値 `O/o/x` |
| dominant_function | string | 必須 | FunctionCode |
| second_function | string | 必須 | FunctionCode |
| title | string | 必須 | max 255 |
| description | string | 必須 | - |
| icon_url | string | 必須 | - |
| browser_id | string | 必須 | UUID |
| user_id | string/null | 任意 | - |
| is_public | boolean | 必須 | - |

成功時: `201 {"message":"Result saved successfully"}`

---

## 8. データモデル・型

### 8.1 FunctionCode / Tier / Step

- `FunctionCode`: `Ni|Ne|Ti|Te|Fi|Fe|Si|Se`
- `Tier`: `Dominant|High|Middle|Low`
- `Step`: `start|quiz|resolve|hierarchy|result|world`

### 8.2 主要型（`frontend/types/oox.ts`）

- `Question`
  - `ComparisonQuestion` (`type: comparison`, left/rightあり)
  - `DiagnosticQuestion` (`type: diagnostic`, rightなし)
- `AnswerData`
  - `{ choiceId: 'A'|'B', responseTimeMs: number }`
- `CalculateResponse`
  - `{ order: FunctionCode[], conflicts: Conflict[], health: Record<FunctionCode,'O'|'o'|'x'> }`
- `DescribeResponse`
  - `{ title: string, description: string }`
- `WorldUserResult`
  - `user_results` の表示用/配置用データ

### 8.3 Supabase質問整形

`fetchQuestions()` で `questions + choices` を読み、以下を保証:

- choicesを `A,B` 順に整列
- `comparison` を先、`diagnostic` を後にソート
- DBスネークケースをフロント型へ変換

---

## 9. アルゴリズム

### 9.1 順序最適化（Kemeny-Young）

1. comparison回答を `winner/loser` 対戦データへ変換
2. 8機能全順列（40,320）を生成
3. 各順列で、`winner が loser より上位` の対戦に重み加点
4. 最大スコア順列を `bestOrder` とする

### 9.2 重み関数（回答時間ベース）

- `<= 20,000ms`: `2.0`
- `<= 60,000ms`: `1.0`
- `> 60,000ms`: `0.5`

### 9.3 fixed_match 再計算

- Resolveでユーザーが選んだ勝敗を `fixed_match` として送信
- `winner` が `loser` より下になる順列を評価対象から除外

### 9.4 葛藤検出

- 条件: `orderIndex(user_winner) > orderIndex(user_loser)`
- 出力: `question_id`, `user_winner`, `system_order_winner`, `response_time_ms`
- 並び順: `response_time_ms` 降順

### 9.5 健全度ステータス

- score >= 3 => `O`
- score == 2 => `o`
- score <= 1 => `x`
- 未設定機能はデフォルト `o`

---

## 10. 非同期・ジョブ制御

### 10.1 describe処理

1. フロント `startDescribeJob()` が `/api/describe` 実行
2. バックが `job_id` 採番して `queued` 登録
3. Job実行で `processing`
4. 完了時 `job_result_{jobId}` に `completed + data`
5. フロントが3秒間隔で status API を再試行

### 10.2 キャッシュキー

- `job_status_{jobId}`: 処理中状態（TTL 600）
- `job_result_{jobId}`: 完了/失敗結果（TTL 3600）

### 10.3 ワーカー実行

`serverless.yml` の `worker` 関数:

- スケジュール: `rate(1 minute)`
- 実コマンド: `queue:work --stop-when-empty --max-time=600`
- 関数タイムアウト: `720s`

---

## 11. 設定・環境変数

### 11.1 Frontend

| 変数 | 用途 |
|------|------|
| `NEXT_PUBLIC_API_URL` | APIベースURL（未設定時 `https://fbrh5j7g55.execute-api.ap-northeast-1.amazonaws.com`） |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |

### 11.2 Backend

| 変数 | 用途 |
|------|------|
| `SUPABASE_URL` | Supabase REST endpoint |
| `SUPABASE_SERVICE_KEY` | Supabase service role key |
| `GEMINI_API_KEY` | Gemini API key |
| `GEMINI_BASE_URL` | Gemini base URL（任意） |
| `GEMINI_REQUEST_TIMEOUT` | Gemini request timeout |
| `QUEUE_CONNECTION` | Queue接続（serverlessでは `database`） |
| `CACHE_STORE` | Cache store（serverlessでは `database`） |
| `DB_*` | DB接続情報 |

### 11.3 Serverless設定（`backend/serverless.yml`）

- region: `ap-northeast-1`
- functions:
  - `web` (`php-82-fpm`, timeout 28)
  - `artisan` (`php-82-console`, timeout 720)
  - `worker` (`php-82-console`, timeout 720, 1分毎スケジュール)
- layer: `${bref-extra:pgsql-php-82}`

---

## 12. 開発・運用ガイド

### 12.1 ローカル起動

- Frontend
  - `cd frontend && npm install && npm run dev`
- Backend
  - `cd backend && composer setup`
  - `cd backend && composer run dev`

### 12.2 テスト/静的チェック

- Frontend Lint: `cd frontend && npm run lint`
- Frontend Build: `cd frontend && npm run build`
- Backend Test: `cd backend && composer test`

### 12.3 仕様更新時の確認ポイント

- 画面追加/変更: `components/screens/*`, `Screens.tsx`, `useOoX.ts`
- API変更: `routes/api.php`, `Requests/*`, `lib/api/*`
- 計算ロジック変更: `CalculateService.php`, `tests/Unit/CalculateServiceTest.php`
- 非同期変更: `DescribeController.php`, `GenerateDescriptionJob.php`, `serverless.yml`

---

## 13. トラブルシューティング

| 現象 | 主な原因 | 対応 |
|------|----------|------|
| `Missing Supabase environment variables` (frontend) | `NEXT_PUBLIC_SUPABASE_URL/ANON_KEY` 未設定 | `.env` を設定して再起動 |
| `/api/calculate` が500 | Supabase questions取得失敗、または計算例外 | backendログ確認、`SUPABASE_*` と questionsデータを確認 |
| describeが終わらない | worker未実行 or queue未処理 | queue worker実行状態、`QUEUE_CONNECTION`、`job_status_*` を確認 |
| status APIが404 | 無効なjob_id、TTL切れ | 新しいdescribe実行でjob_idを再取得 |
| 結果保存が失敗 | `SaveResultRequest` バリデーション or Supabase保存失敗 | payloadの型/必須項目確認、`SUPABASE_SERVICE_KEY`確認 |

---

## 14. 変更履歴

- 2026-02-14: 初版作成（frontend/backend横断、API契約・アルゴリズム・ジョブ制御を実装基準で記述）
