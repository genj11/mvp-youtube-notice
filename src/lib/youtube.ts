interface VideoItem {
  liveStreamingDetails?: {
    actualStartTime?: string;
    actualEndTime?: string;
  };
}

interface YouTubeApiResponse {
  items?: VideoItem[];
}

export async function isLive(videoId: string): Promise<boolean> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error('YOUTUBE_API_KEY is not set');
  }

  const url = new URL('https://www.googleapis.com/youtube/v3/videos');
  url.searchParams.set('part', 'liveStreamingDetails');
  url.searchParams.set('id', videoId);
  url.searchParams.set('key', apiKey);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`YouTube API error: ${response.status}`);
  }

  const data: YouTubeApiResponse = await response.json();
  const video = data.items?.[0];
  if (!video?.liveStreamingDetails) return false;

  const { actualStartTime, actualEndTime } = video.liveStreamingDetails;

  // 開始済み かつ 終了していない = LIVE
  return !!actualStartTime && !actualEndTime;
}
