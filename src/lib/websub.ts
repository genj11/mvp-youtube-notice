const WEBSUB_HUB = 'https://pubsubhubbub.appspot.com/';

export async function subscribeWebSub(channelId: string): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    throw new Error('NEXT_PUBLIC_APP_URL is not set');
  }

  const topic = `https://www.youtube.com/xml/feeds/videos.xml?channel_id=${channelId}`;
  const callback = `${appUrl}/websub/callback`;

  const body = new URLSearchParams({
    'hub.callback': callback,
    'hub.topic': topic,
    'hub.mode': 'subscribe',
    'hub.lease_seconds': '432000', // 5日間
  });

  const response = await fetch(WEBSUB_HUB, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new Error(`WebSub subscribe failed: ${response.status} ${response.statusText}`);
  }
}
