import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { usersApp } from '@/api/users';
import { channelsApp } from '@/api/channels';
import { pushApp } from '@/api/push';
import { notificationsApp } from '@/api/notifications';

const app = new Hono().basePath('/api');

app.route('/users', usersApp);
app.route('/channels', channelsApp);
app.route('/push', pushApp);
app.route('/notifications', notificationsApp);

app.get('/health', (c) => c.json({ status: 'ok' }));

export const GET = handle(app);
export const POST = handle(app);
export const DELETE = handle(app);
