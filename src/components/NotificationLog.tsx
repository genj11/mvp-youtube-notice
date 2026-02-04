'use client';

interface LogEntry {
  id: string;
  channelName: string | null;
  channelId: string;
  videoId: string;
  sentAt: string;
}

interface NotificationLogProps {
  logs: LogEntry[];
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;

  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'たった今';
  if (minutes < 60) return `${minutes}分前`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}時間前`;

  const days = Math.floor(hours / 24);
  return `${days}日前`;
}

export function NotificationLog({ logs }: NotificationLogProps) {
  if (logs.length === 0) {
    return <p className="text-sm text-zinc-400">通知履歴はありません</p>;
  }

  return (
    <ul className="space-y-1">
      {logs.map((log) => (
        <li key={log.id} className="text-sm text-zinc-600 dark:text-zinc-400">
          <a
            href={`https://www.youtube.com/watch?v=${log.videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            {log.channelName || log.channelId} が配信を開始
          </a>
          <span className="ml-2 text-xs text-zinc-400">
            ({timeAgo(log.sentAt)})
          </span>
        </li>
      ))}
    </ul>
  );
}
