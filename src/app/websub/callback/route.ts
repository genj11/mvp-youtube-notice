import { NextRequest, NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';
import { handleFeedUpdate } from '@/lib/notification';

// WebSub検証（GET）
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const challenge = searchParams.get('hub.challenge');
  const topic = searchParams.get('hub.topic');

  if (mode === 'subscribe' && challenge && topic) {
    console.log(`WebSub verified: ${topic}`);
    return new NextResponse(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  return new NextResponse('Bad Request', { status: 400 });
}

// WebSubフィード受信（POST）
export async function POST(request: NextRequest) {
  const body = await request.text();

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
  });

  try {
    const feed = parser.parse(body);
    const entry = feed?.feed?.entry;

    if (!entry) {
      return new NextResponse('No entry found', { status: 200 });
    }

    const videoId = entry['yt:videoId'];
    const channelId = entry['yt:channelId'];

    if (!videoId || !channelId) {
      return new NextResponse('Missing videoId or channelId', { status: 200 });
    }

    console.log(`WebSub feed received: channel=${channelId}, video=${videoId}`);

    // 非同期でライブ判定・通知処理
    handleFeedUpdate(channelId, videoId).catch((e) => {
      console.error('handleFeedUpdate error:', e);
    });

    return new NextResponse('OK', { status: 200 });
  } catch (e) {
    console.error('XML parse error:', e);
    return new NextResponse('Parse error', { status: 200 });
  }
}
