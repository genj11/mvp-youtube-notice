import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '@/db';
import { channels, userSubscriptions } from '@/db/schema';
import { eq, and, count } from 'drizzle-orm';
import { subscribeWebSub } from '@/lib/websub';

const channelSchema = z.object({
  channelId: z.string().regex(/^UC[\w-]{22}$/),
});

const MAX_CHANNELS = 10;

export const channelsApp = new Hono()
  .get('/', async (c) => {
    const userId = c.req.header('X-User-Id');
    if (!userId) {
      return c.json({ error: 'X-User-Id header is required' }, 400);
    }

    const subscriptions = await db
      .select({
        id: channels.id,
        channelId: channels.channelId,
        channelName: channels.channelName,
        liveState: channels.liveState,
        createdAt: userSubscriptions.createdAt,
      })
      .from(userSubscriptions)
      .innerJoin(channels, eq(userSubscriptions.channelId, channels.id))
      .where(eq(userSubscriptions.userId, userId));

    return c.json(subscriptions);
  })
  .post('/', zValidator('json', channelSchema), async (c) => {
    const userId = c.req.header('X-User-Id');
    if (!userId) {
      return c.json({ error: 'X-User-Id header is required' }, 400);
    }

    const { channelId } = c.req.valid('json');

    // 登録上限チェック
    const [subCount] = await db
      .select({ count: count() })
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, userId));

    if (subCount.count >= MAX_CHANNELS) {
      return c.json({ error: `Maximum ${MAX_CHANNELS} channels allowed` }, 429);
    }

    // チャンネルをupsert
    let channel = await db
      .select()
      .from(channels)
      .where(eq(channels.channelId, channelId))
      .get();

    if (!channel) {
      channel = await db
        .insert(channels)
        .values({ channelId })
        .returning()
        .get();

      // 新規チャンネルの場合、WebSub購読
      try {
        await subscribeWebSub(channelId);
      } catch (e) {
        console.error('WebSub subscribe failed:', e);
      }
    }

    // ユーザー購読を登録
    const existing = await db
      .select()
      .from(userSubscriptions)
      .where(
        and(
          eq(userSubscriptions.userId, userId),
          eq(userSubscriptions.channelId, channel.id),
        ),
      )
      .get();

    if (existing) {
      return c.json({ error: 'Already subscribed' }, 409);
    }

    await db.insert(userSubscriptions).values({
      userId,
      channelId: channel.id,
    });

    return c.json(
      {
        id: channel.id,
        channelId: channel.channelId,
        channelName: channel.channelName,
        createdAt: channel.updatedAt,
      },
      201,
    );
  })
  .delete('/:id', async (c) => {
    const userId = c.req.header('X-User-Id');
    if (!userId) {
      return c.json({ error: 'X-User-Id header is required' }, 400);
    }

    const channelDbId = c.req.param('id');

    await db
      .delete(userSubscriptions)
      .where(
        and(
          eq(userSubscriptions.userId, userId),
          eq(userSubscriptions.channelId, channelDbId),
        ),
      );

    return c.json({ success: true });
  });
