# 要件定義書: YouTube Live Notify MVP

## 1. 目的

YouTubeチャンネルのライブ配信開始をリアルタイムで検知し、ユーザーへWeb Push通知で知らせるシステムを構築する。

### 1.1 MVPの価値
- **ライブ配信開始に気づける**こと

### 1.2 MVPの非対象（スコープ外）
- 視聴中UI
- 予定通知
- モバイルPush
- OAuthログイン

---

## 2. 機能要件

### 2.1 チャンネルフォロー機能
- ユーザーがYouTube channelIdを手動入力して登録できる
- 登録したチャンネルを削除できる
- **制限**: 1ユーザーあたり最大10チャンネル

### 2.2 ライブ検知機能
- WebSubを利用してYouTubeフィード更新をリアルタイム受信
- YouTube Data API (`videos.list`) でライブ状態を確定判定
- `search.list`は使用しない（Quota節約・精度確保）

### 2.3 通知機能
- Web Push通知でデスクトップブラウザに配信開始を通知
- 通知クリックでYouTubeの該当動画ページを開く
- **重複通知防止**: 同一videoIdでの重複通知を排除

### 2.4 設定画面（UI）
- Push通知の許可状態表示（ON/OFF）
- channelIdの登録/削除
- 最新通知ログ（推奨）

---

## 3. データモデル

### 3.1 Channel State（システム管理）
| フィールド | 型 | 説明 |
|-----------|-----|------|
| channel_id | string | YouTube channelId |
| live_state | enum | `OFFLINE` / `LIVE` |
| last_live_video_id | string\|null | 最後にLIVE判定したvideoId（重複防止キー） |
| updated_at | datetime | 更新時刻 |

### 3.2 User Subscription（ユーザー管理）
| フィールド | 型 | 説明 |
|-----------|-----|------|
| user_id | string (UUID) | ユーザー識別子 |
| channel_id | string | フォロー対象channelId |
| created_at | datetime | 登録時刻 |

### 3.3 Push Subscription（別管理）
- Web Push購読情報（endpoint, keys等）

---

## 4. 状態遷移

### 4.1 ライブ判定条件
- YouTube Data API `videos.list(part=liveStreamingDetails)` を実行
- `liveStreamingDetails`が存在し、配信中を示す情報がある場合にLIVE

### 4.2 状態遷移表

| 現在状態 | イベント | 条件 | 次状態 | アクション |
|---------|---------|------|--------|-----------|
| OFFLINE | WebSub(videoId) | isLive=true AND last_live_video_id≠videoId | LIVE | Push送信、last_live_video_id更新 |
| OFFLINE | WebSub(videoId) | isLive=false | OFFLINE | (何もしない) |
| LIVE | WebSub(videoId) | isLive=true AND last_live_video_id=videoId | LIVE | 何もしない（重複排除） |
| LIVE | WebSub(videoId) | isLive=true AND last_live_video_id≠videoId | LIVE | Push送信、last_live_video_id更新（枠切替対応） |
| LIVE | WebSub(videoId) | isLive=false | LIVE | 何もしない（MVP） |

---

## 5. 外部インターフェース

### 5.1 WebSub（Inbound）
- **目的**: チャンネル更新のプッシュ受信
- **エンドポイント**:
  - `POST /websub/callback` - フィード更新受信
  - `GET /websub/callback` - 購読検証

### 5.2 YouTube Data API（Outbound）
- **目的**: videoIdのライブ状態確定
- **API**: `videos.list`
- **パラメータ**: `part=liveStreamingDetails`

### 5.3 Web Push（Outbound）
- **Payload**:
  - title: `配信開始: {channelName}`
  - body: `YouTubeでライブが始まりました`
  - url: `https://www.youtube.com/watch?v={videoId}`

---

## 6. 成功基準

1. ユーザーがchannelIdを登録できる
2. 登録したチャンネルがライブ開始したときにWeb Push通知が届く
3. 通知クリックでYouTubeの該当ライブページが開く
4. 同一ライブで重複通知されない
5. 1ユーザー最大10チャンネルの制限が機能する

---

## 7. 技術的制約・前提

- WebSubはYouTubeの公式フィードを利用
- YouTube Data API Quotaを考慮した設計が必要
- デスクトップブラウザのWeb Push対応が前提
