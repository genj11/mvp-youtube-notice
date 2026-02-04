import { Hono } from 'hono';
import { db } from '@/db';
import { notificationLogs, channels } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export const notificationsApp = new Hono()
  .get('/', async (c) => {
    const userId = c.req.header('X-User-Id');
    if (!userId) {
      return c.json({ error: 'X-User-Id header is required' }, 400);
    }

    const logs = await db
      .select({
        id: notificationLogs.id,
        channelName: channels.channelName,
        channelId: channels.channelId,
        videoId: notificationLogs.videoId,
        sentAt: notificationLogs.sentAt,
      })
      .from(notificationLogs)
      .innerJoin(channels, eq(notificationLogs.channelId, channels.id))
      .where(eq(notificationLogs.userId, userId))
      .orderBy(desc(notificationLogs.sentAt))
      .limit(20);

    return c.json(logs);
  });
