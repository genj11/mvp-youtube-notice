# セットアップ手順 (手動)

## 1. Turso データベース

- [ ] Turso CLIインストール: `brew install tursodatabase/tap/turso`
- [ ] ログイン: `turso auth login`
- [ ] DB作成: `turso db create youtube-notify`
- [ ] DB URLを取得: `turso db show youtube-notify --url`
- [ ] 認証トークンを取得: `turso db tokens create youtube-notify`
- [ ] `.env` に設定:
  ```
  TURSO_DATABASE_URL="取得したURL"
  TURSO_AUTH_TOKEN="取得したトークン"
  ```
- [ ] スキーマ反映: `pnpm db:push`

## 2. YouTube Data API

- [ ] [Google Cloud Console](https://console.cloud.google.com/) でプロジェクト作成
- [ ] YouTube Data API v3 を有効化
- [ ] APIキーを作成
- [ ] `.env` に設定:
  ```
  YOUTUBE_API_KEY="取得したAPIキー"
  ```

## 3. VAPID鍵 (Web Push)

- [ ] 鍵ペア生成: `npx web-push generate-vapid-keys`
- [ ] `.env` に設定:
  ```
  VAPID_PUBLIC_KEY="生成されたPublic Key"
  VAPID_PRIVATE_KEY="生成されたPrivate Key"
  VAPID_SUBJECT="mailto:your-email@example.com"
  NEXT_PUBLIC_VAPID_PUBLIC_KEY="Public Keyと同じ値"
  ```

## 4. ローカル動作確認

- [ ] `.env` の全項目が設定済みか確認
- [ ] `pnpm dev` で開発サーバー起動
- [ ] `http://localhost:3000` にアクセス
- [ ] チャンネル登録・削除が動作すること
- [ ] Push通知の許可ダイアログが表示されること

## 5. WebSub連携テスト

- [ ] ngrokインストール: `brew install ngrok`
- [ ] トンネル起動: `ngrok http 3000`
- [ ] `.env` の `NEXT_PUBLIC_APP_URL` をngrokのURLに変更
- [ ] チャンネル登録時にWebSub購読が成功すること（コンソールログ確認）
- [ ] WebSubコールバックの検証が通ること

## 6. Vercelデプロイ

- [ ] [Vercel](https://vercel.com/) でプロジェクトをインポート
- [ ] 環境変数を設定（`.env` と同じ内容、`NEXT_PUBLIC_APP_URL` は本番URLに変更）
- [ ] デプロイ実行
- [ ] 本番URLでの動作確認
- [ ] WebSubコールバックが本番URLで機能すること
