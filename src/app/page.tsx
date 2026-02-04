'use client';

import { useEffect, useState, useCallback } from 'react';
import { getUserId, registerUser, apiFetch } from '@/lib/client';
import { PushStatus } from '@/components/PushStatus';
import { ChannelForm } from '@/components/ChannelForm';
import { ChannelList } from '@/components/ChannelList';
import { NotificationLog } from '@/components/NotificationLog';

interface Channel {
  id: string;
  channelId: string;
  channelName: string | null;
  liveState: string;
}

interface LogEntry {
  id: string;
  channelName: string | null;
  channelId: string;
  videoId: string;
  sentAt: string;
}

export default function Home() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [ready, setReady] = useState(false);

  const fetchChannels = useCallback(async () => {
    const res = await apiFetch('/api/channels');
    if (res.ok) {
      setChannels(await res.json());
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    const res = await apiFetch('/api/notifications');
    if (res.ok) {
      setLogs(await res.json());
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const userId = getUserId();
      await registerUser(userId);

      // Service Worker登録
      if ('serviceWorker' in navigator) {
        await navigator.serviceWorker.register('/sw.js');
      }

      await Promise.all([fetchChannels(), fetchLogs()]);
      setReady(true);
    };
    init();
  }, [fetchChannels, fetchLogs]);

  const handleRefresh = useCallback(() => {
    fetchChannels();
    fetchLogs();
  }, [fetchChannels, fetchLogs]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-zinc-400">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">YouTube Live Notify</h1>

      <div className="space-y-6">
        <PushStatus />

        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <ChannelForm channelCount={channels.length} onAdded={handleRefresh} />
        </div>

        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            登録済みチャンネル
          </h2>
          <ChannelList channels={channels} onDeleted={handleRefresh} />
        </div>

        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            最近の通知
          </h2>
          <NotificationLog logs={logs} />
        </div>
      </div>
    </div>
  );
}
