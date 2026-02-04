import webpush from 'web-push';
import { db } from '@/db';
import {
  channels,
  pushSubscriptions,
  userSubscriptions,
  notificationLogs,
} from '@/db/schema';
import { eq } from 'drizzle-orm';
import { isLive } from './youtube';

function initWebPush() {
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT;

  if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
    throw new Error('VAPID keys are not configured');
  }

  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

export async function handleFeedUpdate(
  ytChannelId: string,
  videoId: string,
): Promise<void> {
  // チャンネルをDBから取得
  const channel = await db
    .select()
    .from(channels)
    .where(eq(channels.channelId, ytChannelId))
    .get();

  if (!channel) {
    console.log(`Channel not found: ${ytChannelId}`);
    return;
  }

  // YouTube APIでライブ判定
  let live: boolean;
  try {
    live = await isLive(videoId);
  } catch (e) {
    console.error('YouTube API error:', e);
    return;
  }

  if (!live) {
    return;
  }

  // 重複チェック: 同じvideoIdなら通知しない
  if (channel.lastLiveVideoId === videoId) {
    return;
  }

  // 状態更新
  await db
    .update(channels)
    .set({
      liveState: 'LIVE',
      lastLiveVideoId: videoId,
      updatedAt: new Date(),
    })
    .where(eq(channels.id, channel.id));

  // このチャンネルを購読しているユーザーを取得
  const subscribers = await db
    .select({ userId: userSubscriptions.userId })
    .from(userSubscriptions)
    .where(eq(userSubscriptions.channelId, channel.id));

  if (subscribers.length === 0) {
    return;
  }

  // Web Push送信
  initWebPush();

  const payload = JSON.stringify({
    title: `配信開始: ${channel.channelName || ytChannelId}`,
    body: 'YouTubeでライブが始まりました',
    icon: '/icon-192.png',
    data: {
      url: `https://www.youtube.com/watch?v=${videoId}`,
    },
  });

  for (const { userId } of subscribers) {
    const subs = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId));

    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload,
        );

        // 通知ログ記録
        await db.insert(notificationLogs).values({
          userId,
          channelId: channel.id,
          videoId,
        });
      } catch (e: unknown) {
        const error = e as { statusCode?: number };
        if (error.statusCode === 410) {
          // 購読が無効 → 削除
          await db
            .delete(pushSubscriptions)
            .where(eq(pushSubscriptions.id, sub.id));
        }
        console.error('Push send failed:', e);
      }
    }
  }
}
