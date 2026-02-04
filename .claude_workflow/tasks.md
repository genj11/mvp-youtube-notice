# タスク一覧: YouTube Live Notify MVP

## フェーズ1: プロジェクト初期化

### Task 1.1: Next.jsプロジェクトセットアップ ✅
- [x] pnpm init → Next.js 16.1.6 (App Router) プロジェクト作成
- [x] TypeScript設定（strict mode）
- [x] ESLint設定
- [x] `.env.local.example` 作成（環境変数テンプレート）
- [x] `.gitignore` 設定

### Task 1.2: 依存パッケージインストール ✅
- [x] `hono`, `@hono/zod-validator`, `zod` — APIルーティング・バリデーション
- [x] `drizzle-orm`, `drizzle-kit`, `@libsql/client` — DB
- [x] `@paralleldrive/cuid2` — ID生成
- [x] `web-push`, `@types/web-push` — Web Push通知
- [x] `fast-xml-parser` — WebSub XMLパース

### Task 1.3: データベースセットアップ ✅
- [x] `src/db/schema.ts` — Drizzleスキーマ定義（5テーブル）
- [x] `src/db/index.ts` — DBクライアント初期化（遅延初期化対応）
- [x] `drizzle.config.ts` — Drizzle Kit設定
- [x] `pnpm drizzle-kit generate` でマイグレーション生成
- [ ] `pnpm db:push` でDB反映（Turso接続情報設定後に実行）

---

## フェーズ2: バックエンドAPI実装

### Task 2.1: Hono統合セットアップ ✅
- [x] `src/app/api/[[...route]]/route.ts` — Honoメインルーター作成
- [x] ヘルスチェック用エンドポイント `/api/health`

### Task 2.2: ユーザー識別API ✅
- [x] `src/api/users.ts` — POST /api/users（UUID受け取り、usersテーブルに登録）
- [x] X-User-Idヘッダーによるユーザー識別

### Task 2.3: チャンネル登録API ✅
- [x] `src/api/channels.ts` — GET /api/channels（登録済みチャンネル一覧取得）
- [x] POST /api/channels（チャンネル登録、10件制限チェック、channelIdバリデーション）
- [x] DELETE /api/channels/:id（チャンネル削除）
- [x] チャンネル登録時のWebSub購読リクエスト送信

### Task 2.4: Push購読API ✅
- [x] `src/api/push.ts` — POST /api/push/subscribe（Push購読登録）
- [x] DELETE /api/push/subscribe（Push購読解除）

### Task 2.5: 通知履歴API ✅
- [x] `src/api/notifications.ts` — GET /api/notifications（通知ログ取得）

### Task 2.6: WebSubコールバック ✅
- [x] `src/app/websub/callback/route.ts` — GET（購読検証: hub.challenge返却）
- [x] POST（フィード受信: XML解析 → videoId抽出）

### Task 2.7: ライブ判定・通知送信ロジック ✅
- [x] `src/lib/youtube.ts` — YouTube Data API でライブ状態判定（videos.list）
- [x] `src/lib/notification.ts` — 状態遷移ロジック（OFFLINE→LIVE判定、重複排除）
- [x] Push通知送信処理（web-push使用、410 Gone時の購読削除対応）
- [x] notification_logsへの記録

---

## フェーズ3: フロントエンド実装

### Task 3.1: レイアウト・共通設定 ✅
- [x] `src/app/layout.tsx` — 共通レイアウト（メタデータ、フォント設定）
- [x] `src/app/page.tsx` — メインページ（全コンポーネント統合）

### Task 3.2: ユーザー識別（クライアント側） ✅
- [x] `src/lib/client.ts` — UUID生成・localStorage保存ロジック
- [x] 初回アクセス時に POST /api/users 呼び出し
- [x] 以降のリクエストに X-User-Id ヘッダー付与するfetchラッパー

### Task 3.3: Push通知コンポーネント ✅
- [x] `src/components/PushStatus.tsx` — Push通知の許可状態表示
- [x] 通知許可リクエスト処理
- [x] Service Worker登録 → Push購読 → POST /api/push/subscribe

### Task 3.4: チャンネル管理コンポーネント ✅
- [x] `src/components/ChannelForm.tsx` — channelId入力フォーム（バリデーション付き）
- [x] `src/components/ChannelList.tsx` — 登録済みチャンネル一覧（削除ボタン付き）
- [x] 登録件数表示（n/10）

### Task 3.5: 通知履歴コンポーネント ✅
- [x] `src/components/NotificationLog.tsx` — 最近の通知一覧表示

### Task 3.6: Service Worker ✅
- [x] `public/sw.js` — push イベントで通知表示
- [x] notificationclick イベントでYouTubeページを開く

---

## フェーズ4: 結合・動作確認

### Task 4.1: ビルド確認 ✅
- [x] `pnpm build` 成功確認

### Task 4.2: ローカル動作確認
- [ ] Turso DB接続情報設定 → `pnpm db:push`
- [ ] 全APIエンドポイントの疎通確認
- [ ] チャンネル登録→一覧表示→削除の一連フロー確認
- [ ] Push通知の許可→購読登録確認

### Task 4.3: デプロイ準備
- [ ] Vercel設定（環境変数設定）
- [ ] Turso DBの本番セットアップ
- [ ] VAPID鍵の生成（`npx web-push generate-vapid-keys`）
- [ ] デプロイ・動作確認

---

## ファイル構成

```
src/
├── app/
│   ├── api/[[...route]]/route.ts  # Honoメインルーター
│   ├── websub/callback/route.ts   # WebSubコールバック
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── api/
│   ├── users.ts                   # ユーザー登録API
│   ├── channels.ts                # チャンネルCRUD API
│   ├── push.ts                    # Push購読API
│   └── notifications.ts           # 通知履歴API
├── components/
│   ├── PushStatus.tsx             # Push通知状態
│   ├── ChannelForm.tsx            # チャンネル登録フォーム
│   ├── ChannelList.tsx            # チャンネル一覧
│   └── NotificationLog.tsx        # 通知履歴
├── db/
│   ├── schema.ts                  # Drizzleスキーマ
│   └── index.ts                   # DBクライアント
└── lib/
    ├── client.ts                  # クライアント側fetchラッパー
    ├── websub.ts                  # WebSub購読
    ├── youtube.ts                 # YouTube API連携
    └── notification.ts            # ライブ判定・通知送信
public/
└── sw.js                          # Service Worker
```
