export function extractYouTubeId(urlOrId?: string): string {
  if (!urlOrId) return "";
  const str = String(urlOrId).trim();
  
  // If it's already an 11-character video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(str)) {
    return str;
  }

  try {
    const url = new URL(str.startsWith("http") ? str : `https://${str}`);
    if (url.hostname.includes("youtu.be")) {
      return url.pathname.replace(/^\//, "").split("/")[0].split("?")[0];
    }
    if (url.pathname.startsWith("/embed/")) {
      return url.pathname.split("/")[2]?.split("?")[0] || "";
    }
    if (url.pathname.startsWith("/live/")) {
      return url.pathname.split("/")[2]?.split("?")[0] || "";
    }
    if (url.pathname.startsWith("/shorts/")) {
      return url.pathname.split("/")[2]?.split("?")[0] || "";
    }
    if (url.searchParams.has("v")) {
      return url.searchParams.get("v") || "";
    }
  } catch {
    // Fallback regex match
    const match = str.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([a-zA-Z0-9_-]{11})/);
    if (match && match[1]) {
      return match[1];
    }
  }

  return str;
}

export function extractYouTubePlaylistId(urlOrId?: string): string {
  if (!urlOrId) return "";
  const str = String(urlOrId).trim();

  if (str.includes("youtube.com") || str.includes("youtu.be")) {
    try {
      const url = new URL(str.startsWith("http") ? str : `https://${str}`);
      if (url.searchParams.has("list")) {
        return url.searchParams.get("list") || "";
      }
    } catch {}
    const match = str.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) return match[1];
  }

  return str;
}

export function getYouTubeThumbnail(urlOrId?: string, quality: 'maxres' | 'hq' | 'mq' | 'sd' = 'hq'): string {
  const id = extractYouTubeId(urlOrId);
  if (!id) return "";
  
  if (quality === 'maxres') {
    return `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;
  }
  if (quality === 'mq') {
    return `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;
  }
  if (quality === 'sd') {
    return `https://i.ytimg.com/vi/${id}/sddefault.jpg`;
  }
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

function decodeXmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');
}

export interface YouTubeFeedVideo {
  slug: string;
  id: string;
  youtubeId: string;
  title: string;
  description: string;
  publishedAt: string;
  customThumbnail: string;
  category: string;
  status: 'published';
  episodeNumber?: number;
  programId?: string;
  language?: string;
}

export async function fetchYouTubePlaylistVideos(
  playlistIdOrUrl: string,
  programSlug?: string,
  programCategory?: string,
  language: string = 'ml'
): Promise<YouTubeFeedVideo[]> {
  const playlistId = extractYouTubePlaylistId(playlistIdOrUrl);
  if (!playlistId) return [];

  try {
    const res = await fetch(`https://www.youtube.com/feeds/videos.xml?playlist_id=${playlistId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    if (!res.ok) {
      console.warn(`Failed to fetch YouTube playlist RSS feed for ${playlistId}, status: ${res.status}`);
      return [];
    }

    const xml = await res.text();
    const entryMatches = xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g);
    const videos: YouTubeFeedVideo[] = [];

    for (const match of entryMatches) {
      const entryXml = match[1];
      const idMatch = entryXml.match(/<yt:videoId>([\s\S]*?)<\/yt:videoId>/);
      const titleMatch = entryXml.match(/<title>([\s\S]*?)<\/title>/);
      const dateMatch = entryXml.match(/<published>([\s\S]*?)<\/published>/);
      const descMatch = entryXml.match(/<media:description>([\s\S]*?)<\/media:description>/);
      const thumbMatch = entryXml.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/);

      const youtubeId = idMatch ? idMatch[1].trim() : '';
      if (!youtubeId) continue;

      const rawTitle = titleMatch ? titleMatch[1].trim() : '';
      const title = decodeXmlEntities(rawTitle);
      const rawDesc = descMatch ? descMatch[1].trim() : '';
      const description = decodeXmlEntities(rawDesc);
      const rawDate = dateMatch ? dateMatch[1].trim() : '';
      const publishedAt = rawDate ? rawDate.split('T')[0] : new Date().toISOString().split('T')[0];
      const thumbnail = thumbMatch ? thumbMatch[1].trim() : `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;

      // Extract episode number if present in title (e.g. "Episode 01", "Ep 2", "EP 05")
      let episodeNumber: number | undefined;
      const epMatch = title.match(/(?:Episode|Ep|ഭാഗം)\s*[:#-]?\s*(\d+)/i);
      if (epMatch && epMatch[1]) {
        episodeNumber = parseInt(epMatch[1], 10);
      }

      videos.push({
        slug: `youtube-${youtubeId}`,
        id: `youtube-${youtubeId}`,
        youtubeId,
        title,
        description,
        publishedAt,
        customThumbnail: thumbnail,
        category: programCategory || 'General',
        status: 'published',
        episodeNumber,
        programId: programSlug || '',
        language
      });
    }

    return videos;
  } catch (err) {
    console.error(`Error fetching YouTube playlist videos for ${playlistId}:`, err);
    return [];
  }
}
