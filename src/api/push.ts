import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '@/db';
import { pushSubscriptions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

const pushSubscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export const pushApp = new Hono()
  .post('/subscribe', zValidator('json', pushSubscribeSchema), async (c) => {
    const userId = c.req.header('X-User-Id');
    if (!userId) {
      return c.json({ error: 'X-User-Id header is required' }, 400);
    }

    const { endpoint, keys } = c.req.valid('json');

    // 既存の購読をupsert
    const existing = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, endpoint))
      .get();

    if (existing) {
      await db
        .update(pushSubscriptions)
        .set({ p256dh: keys.p256dh, auth: keys.auth, userId })
        .where(eq(pushSubscriptions.endpoint, endpoint));

      return c.json({ success: true }, 200);
    }

    await db.insert(pushSubscriptions).values({
      userId,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    });

    return c.json({ success: true }, 201);
  })
  .delete('/subscribe', async (c) => {
    const userId = c.req.header('X-User-Id');
    if (!userId) {
      return c.json({ error: 'X-User-Id header is required' }, 400);
    }

    await db
      .delete(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId));

    return c.json({ success: true });
  });
