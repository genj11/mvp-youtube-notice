'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/client';

interface ChannelFormProps {
  channelCount: number;
  onAdded: () => void;
}

const CHANNEL_ID_REGEX = /^UC[\w-]{22}$/;
const MAX_CHANNELS = 10;

export function ChannelForm({ channelCount, onAdded }: ChannelFormProps) {
  const [channelId, setChannelId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!CHANNEL_ID_REGEX.test(channelId)) {
      setError('channelIdの形式が不正です（UC で始まる24文字）');
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch('/api/channels', {
        method: 'POST',
        body: JSON.stringify({ channelId }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'エラーが発生しました');
        return;
      }

      setChannelId('');
      onAdded();
    } catch {
      setError('通信エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
        チャンネル登録 ({channelCount}/{MAX_CHANNELS})
      </h2>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={channelId}
          onChange={(e) => setChannelId(e.target.value)}
          placeholder="UCxxxxxxxxxxxxxxxxxxxxxxxx"
          className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          disabled={loading || channelCount >= MAX_CHANNELS}
        />
        <button
          type="submit"
          disabled={loading || channelCount >= MAX_CHANNELS}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '登録中...' : '登録'}
        </button>
      </form>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}
