# OoX

質問回答から 8心理機能（Ni/Ne/Ti/Te/Fi/Fe/Si/Se）の序列・健全度・階層を算出し、最終的に AI 描写を生成する性格診断アプリです。

詳細仕様は `/Users/shogomorisawa/dev/personal/projects/oox/SPEC.md` を参照してください。

## 構成

- `frontend/`: Next.js 16 + TypeScript + Tailwind CSS 4
- `backend/`: Laravel 12 API（Bref + AWS Lambda 対応）
- データストア: Supabase（questions / user_results）

## ユーザーフロー

1. `Start`
2. `Quiz`（comparison + diagnostic）
3. `Resolve`（葛藤がある場合のみ）
4. `Hierarchy`（8機能を4階層に割当）
5. `Result`（タイトル + 描写表示）
6. `World`（他ユーザー結果の閲覧）

## アーキテクチャ概要

- `POST /api/calculate`
  - comparison回答を元に **重み付きKemeny-Young法（8! 全順列評価）** で最適順序を算出
  - conflicts と health（O/o/x）を返却
- `POST /api/describe`
  - 非同期ジョブを投入して `job_id` を返却
- `GET /api/describe/status/{jobId}`
  - `queued/processing/completed/failed` をポーリング取得
- `POST /api/results`
  - 最終結果を Supabase `user_results` に保存

## 技術スタック

### Frontend

- Next.js `^16.0.7`
- React / React DOM `^19.2.3`
- TypeScript `^5`
- Tailwind CSS `^4`
- Framer Motion `^12.23.26`
- `@supabase/supabase-js` `^2.87.1`

### Backend

- Laravel `^12.0`
- PHP `^8.2`
- Bref `^2.4`
- `google-gemini-php/client` `^2.7`
- `google-gemini-php/laravel` `^2.0`

## セットアップ

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
composer setup
composer run dev
```

`composer setup` は以下を実行します。
- `composer install`
- `.env` 作成（未存在時）
- `php artisan key:generate`
- `php artisan migrate --force`
- `npm install && npm run build`

## 環境変数

### Frontend

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Backend

- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `GEMINI_API_KEY`
- `GEMINI_BASE_URL`（任意）
- `GEMINI_REQUEST_TIMEOUT`
- `DB_*`
- `QUEUE_CONNECTION`
- `CACHE_STORE`

## テスト / Lint

### Frontend

```bash
cd frontend
npm run lint
npm run build
```

### Backend

```bash
cd backend
composer test
```

## デプロイ補足

`backend/serverless.yml` で AWS Lambda（`ap-northeast-1`）向けに以下を定義しています。
- `web`（API）
- `artisan`（CLI）
- `worker`（1分間隔で queue:work 実行）

