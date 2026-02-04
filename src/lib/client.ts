import { createId } from '@paralleldrive/cuid2';

const USER_ID_KEY = 'yt-notify-user-id';

export function getUserId(): string {
  if (typeof window === 'undefined') return '';

  let userId = localStorage.getItem(USER_ID_KEY);
  if (!userId) {
    userId = createId();
    localStorage.setItem(USER_ID_KEY, userId);
  }
  return userId;
}

export async function registerUser(userId: string): Promise<void> {
  await apiFetch('/api/users', {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
}

export async function apiFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const userId = getUserId();
  const headers = new Headers(init?.headers);
  headers.set('X-User-Id', userId);
  if (init?.body) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(path, {
    ...init,
    headers,
  });
}
