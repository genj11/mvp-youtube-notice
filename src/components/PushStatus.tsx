'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/client';

export function PushStatus() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(async (reg) => {
        const sub = await reg.pushManager.getSubscription();
        setSubscribed(!!sub);
      });
    }
  }, []);

  const subscribe = useCallback(async () => {
    setLoading(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== 'granted') return;

      const reg = await navigator.serviceWorker.ready;
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        console.error('VAPID public key not configured');
        return;
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey,
      });

      const json = sub.toJSON();
      await apiFetch('/api/push/subscribe', {
        method: 'POST',
        body: JSON.stringify({
          endpoint: sub.endpoint,
          keys: {
            p256dh: json.keys?.p256dh,
            auth: json.keys?.auth,
          },
        }),
      });

      setSubscribed(true);
    } catch (e) {
      console.error('Push subscribe error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const statusText =
    permission === 'granted' && subscribed
      ? 'ON'
      : permission === 'denied'
        ? 'ブロック中'
        : 'OFF';

  return (
    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">Push通知: </span>
          <span className={`font-semibold ${statusText === 'ON' ? 'text-green-600' : 'text-zinc-500'}`}>
            {statusText}
          </span>
        </div>
        {!(permission === 'granted' && subscribed) && permission !== 'denied' && (
          <button
            onClick={subscribe}
            disabled={loading}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '処理中...' : '通知を許可する'}
          </button>
        )}
        {permission === 'denied' && (
          <span className="text-xs text-zinc-400">ブラウザ設定から許可してください</span>
        )}
      </div>
    </div>
  );
}
