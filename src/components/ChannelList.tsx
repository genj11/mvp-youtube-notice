'use client';

import { apiFetch } from '@/lib/client';

interface Channel {
  id: string;
  channelId: string;
  channelName: string | null;
  liveState: string;
}

interface ChannelListProps {
  channels: Channel[];
  onDeleted: () => void;
}

export function ChannelList({ channels, onDeleted }: ChannelListProps) {
  const handleDelete = async (id: string) => {
    try {
      await apiFetch(`/api/channels/${id}`, { method: 'DELETE' });
      onDeleted();
    } catch (e) {
      console.error('Delete error:', e);
    }
  };

  if (channels.length === 0) {
    return (
      <p className="text-sm text-zinc-400">登録済みチャンネルはありません</p>
    );
  }

  return (
    <ul className="space-y-2">
      {channels.map((ch) => (
        <li
          key={ch.id}
          className="flex items-center justify-between rounded-md border border-zinc-200 px-3 py-2 dark:border-zinc-800"
        >
          <div className="min-w-0 flex-1">
            <span className="text-sm font-medium">
              {ch.channelName || ch.channelId}
            </span>
            {ch.liveState === 'LIVE' && (
              <span className="ml-2 inline-block rounded bg-red-500 px-1.5 py-0.5 text-xs font-bold text-white">
                LIVE
              </span>
            )}
          </div>
          <button
            onClick={() => handleDelete(ch.id)}
            className="ml-2 text-sm text-red-500 hover:text-red-700"
          >
            削除
          </button>
        </li>
      ))}
    </ul>
  );
}
