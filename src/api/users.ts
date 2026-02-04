import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

const userSchema = z.object({
  userId: z.string().min(1),
});

export const usersApp = new Hono()
  .post('/', zValidator('json', userSchema), async (c) => {
    const { userId } = c.req.valid('json');

    const existing = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .get();

    if (existing) {
      return c.json(existing, 200);
    }

    const newUser = await db
      .insert(users)
      .values({ id: userId })
      .returning()
      .get();

    return c.json(newUser, 201);
  });
