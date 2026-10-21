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

export function extractEpisodeNumber(title?: string): number | undefined {
  if (!title) return undefined;
  const match = title.match(/(?:Episode|Ep|ഭാഗം|Part|പാർട്ട്)\s*[:#-]?\s*(\d+)/i) ||
                title.match(/\|\s*.*?(\d+)\s*$/) ||
                title.match(/^(\d+)\s*\|/);
  if (match && match[1]) {
    const num = parseInt(match[1], 10);
    if (!isNaN(num) && num > 0 && num < 10000) return num;
  }
  return undefined;
}

export function matchProgramByTitle(title?: string): { programId: string; programName: string; category: string } | null {
  const t = (title || '').toLowerCase();
  if (t.includes('ഇഹ്‍യാ') || t.includes('ഇഹ്യാ') || t.includes('ihya') || t.includes('ഹൃദയ വഴികൾ')) {
    return { programId: 'ihya-uloomudheen', programName: 'Ihya Uloomudheen', category: 'Spirituality' };
  }
  if (t.includes('നൂറുൽ ഹിറ') || t.includes('noorul hira') || t.includes('baqarah') || t.includes('ബഖറ')) {
    return { programId: 'noorul-hira', programName: 'Noorul Hira', category: 'Quran' };
  }
  if (t.includes('മിനൽ ഖൽബ്') || t.includes('minal qalb')) {
    return { programId: 'minal-qalb', programName: 'Minal Qalb', category: 'General' };
  }
  if (t.includes('ആനന്ദപ്പൊരുൾ') || t.includes('ananthaporul') || t.includes('അനസ് അമാനി')) {
    return { programId: 'ananthapporul', programName: 'Ananthapporul', category: 'Motivation' };
  }
  if (t.includes('ഫിഖ്ഹ്') || t.includes('fiqh')) {
    return { programId: 'fiqh-file', programName: 'Fiqh Files', category: 'Fiqh' };
  }
  return null;
}

function parseRelativeTimeToIso(relStr?: string): string {
  if (!relStr) return new Date().toISOString().split('T')[0];
  const str = relStr.toLowerCase().trim();
  const now = new Date();
  const numMatch = str.match(/(\d+)/);
  const n = numMatch ? parseInt(numMatch[1], 10) : 1;

  if (str.includes('second')) now.setSeconds(now.getSeconds() - n);
  else if (str.includes('minute') || str.includes('m ago')) now.setMinutes(now.getMinutes() - n);
  else if (str.includes('hour') || str.includes('h ago')) now.setHours(now.getHours() - n);
  else if (str.includes('day') || str.includes('d ago')) now.setDate(now.getDate() - n);
  else if (str.includes('week') || str.includes('w ago')) now.setDate(now.getDate() - (n * 7));
  else if (str.includes('month') || str.includes('mo ago')) now.setMonth(now.getMonth() - n);
  else if (str.includes('year') || str.includes('y ago')) now.setFullYear(now.getFullYear() - n);
  return now.toISOString().split('T')[0];
}

function extractYtInitialData(html: string): any | null {
  const jsonMatch = html.match(/var ytInitialData = ({[\s\S]*?});<\/script>/);
  if (!jsonMatch) return null;
  try {
    return JSON.parse(jsonMatch[1]);
  } catch {
    return null;
  }
}

function extractYtInitialPlayerResponse(html: string): any | null {
  const startIdx = html.indexOf('ytInitialPlayerResponse = {');
  if (startIdx === -1) return null;
  const jsonStart = html.indexOf('{', startIdx);
  let depth = 0;
  let jsonEnd = -1;
  let inString = false;
  let escape = false;
  for (let i = jsonStart; i < html.length; i++) {
    const char = html[i];
    if (escape) { escape = false; continue; }
    if (char === '\\') { escape = true; continue; }
    if (char === '"') { inString = !inString; continue; }
    if (!inString) {
      if (char === '{') depth++;
      else if (char === '}') {
        depth--;
        if (depth === 0) {
          jsonEnd = i + 1;
          break;
        }
      }
    }
  }
  if (jsonEnd === -1) return null;
  try {
    return JSON.parse(html.substring(jsonStart, jsonEnd));
  } catch {
    return null;
  }
}

export interface YouTubeFeedVideo {
  slug: string;
  id: string;
  youtubeId: string;
  title: string;
  description: string;
  duration?: string;
  publishedAt: string;
  customThumbnail: string;
  category: string;
  status: 'published';
  episodeNumber?: number;
  programId?: string;
  programName?: string;
  playlist?: string;
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

  // Strategy 1: Fetch YouTube playlist page HTML and parse ytInitialData (modern lockupViewModel)
  try {
    const res = await fetch(`https://www.youtube.com/playlist?list=${playlistId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    if (res.ok) {
      const html = await res.text();
      const data = extractYtInitialData(html);
      if (data) {
        const videos: YouTubeFeedVideo[] = [];
        const seen = new Set<string>();

        const search = (obj: any) => {
          if (!obj || typeof obj !== 'object') return;
          if (obj.lockupViewModel) {
            const vm = obj.lockupViewModel;
            const videoId = vm.rendererContext?.commandContext?.onTap?.innertubeCommand?.watchEndpoint?.videoId;
            if (videoId && !seen.has(videoId)) {
              seen.add(videoId);
              const title = vm.metadata?.lockupMetadataViewModel?.title?.content || '';
              const duration = vm.contentImage?.thumbnailViewModel?.overlays?.[0]?.thumbnailBottomOverlayViewModel?.badges?.[0]?.thumbnailBadgeViewModel?.text || '';
              const epNum = extractEpisodeNumber(title);

              videos.push({
                slug: `youtube-${videoId}`,
                id: `youtube-${videoId}`,
                youtubeId: videoId,
                title,
                description: '',
                duration,
                publishedAt: new Date().toISOString().split('T')[0],
                customThumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
                category: programCategory || 'General',
                status: 'published',
                episodeNumber: epNum,
                programId: programSlug || '',
                playlist: playlistId,
                language
              });
            }
          }
          if (obj.playlistVideoRenderer) {
            const pvr = obj.playlistVideoRenderer;
            const videoId = pvr.videoId;
            if (videoId && !seen.has(videoId)) {
              seen.add(videoId);
              const title = pvr.title?.runs?.[0]?.text || pvr.title?.simpleText || '';
              const duration = pvr.lengthText?.simpleText || '';
              const epNum = extractEpisodeNumber(title);

              videos.push({
                slug: `youtube-${videoId}`,
                id: `youtube-${videoId}`,
                youtubeId: videoId,
                title,
                description: '',
                duration,
                publishedAt: new Date().toISOString().split('T')[0],
                customThumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
                category: programCategory || 'General',
                status: 'published',
                episodeNumber: epNum,
                programId: programSlug || '',
                playlist: playlistId,
                language
              });
            }
          }
          for (const k of Object.keys(obj)) search(obj[k]);
        };

        search(data);
        if (videos.length > 0) return videos;
      }
    }
  } catch (err) {
    console.warn(`HTML playlist parsing warning for ${playlistId}:`, err);
  }

  // Strategy 2: Fallback to RSS feed if available
  try {
    const res = await fetch(`https://www.youtube.com/feeds/videos.xml?playlist_id=${playlistId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    if (res.ok) {
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
        const episodeNumber = extractEpisodeNumber(title);

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
          playlist: playlistId,
          language
        });
      }

      if (videos.length > 0) return videos;
    }
  } catch (err) {
    console.warn(`RSS playlist parsing warning for ${playlistId}:`, err);
  }

  return [];
}

export async function fetchChannelUploads(
  channelHandle: string = '@SamasthaGraph',
  language: string = 'ml'
): Promise<YouTubeFeedVideo[]> {
  try {
    const handle = channelHandle.startsWith('@') ? channelHandle : `@${channelHandle}`;
    const res = await fetch(`https://www.youtube.com/${handle}/videos`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    if (!res.ok) {
      console.warn(`Channel uploads fetch failed for ${handle}: ${res.status}`);
      return [];
    }

    const html = await res.text();
    const data = extractYtInitialData(html);
    if (!data) return [];

    const videos: YouTubeFeedVideo[] = [];
    const seen = new Set<string>();

    const search = (obj: any) => {
      if (!obj || typeof obj !== 'object') return;
      if (obj.lockupViewModel) {
        const vm = obj.lockupViewModel;
        const videoId = vm.rendererContext?.commandContext?.onTap?.innertubeCommand?.watchEndpoint?.videoId ||
          vm.contentImage?.thumbnailViewModel?.overlays?.[0]?.thumbnailBottomOverlayViewModel?.badges?.[0]?.thumbnailBadgeViewModel?.animationActivationTargetId;
        
        if (videoId && !seen.has(videoId)) {
          seen.add(videoId);
          const title = vm.metadata?.lockupMetadataViewModel?.title?.content || '';
          const metaParts = vm.metadata?.lockupMetadataViewModel?.metadata?.contentMetadataViewModel?.metadataRows?.[0]?.metadataParts || [];
          const relDate = metaParts[1]?.text?.content || metaParts[0]?.text?.content || '';
          const duration = vm.contentImage?.thumbnailViewModel?.overlays?.[0]?.thumbnailBottomOverlayViewModel?.badges?.[0]?.thumbnailBadgeViewModel?.text || '';
          const epNum = extractEpisodeNumber(title);
          const progMatch = matchProgramByTitle(title);

          videos.push({
            slug: `youtube-${videoId}`,
            id: `youtube-${videoId}`,
            youtubeId: videoId,
            title,
            description: '',
            duration,
            publishedAt: parseRelativeTimeToIso(relDate),
            customThumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
            category: progMatch?.category || 'General',
            status: 'published',
            episodeNumber: epNum,
            programId: progMatch?.programId || '',
            programName: progMatch?.programName || '',
            language
          });
        }
      }
      for (const k of Object.keys(obj)) search(obj[k]);
    };

    search(data);
    return videos;
  } catch (err) {
    console.error('Error fetching YouTube channel uploads:', err);
    return [];
  }
}

export async function fetchLiveYouTubeVideos(
  programs: any[],
  channelHandle: string = '@SamasthaGraph'
): Promise<YouTubeFeedVideo[]> {
  const videoMap = new Map<string, YouTubeFeedVideo>();

  // 1. Fetch channel uploads first (provides recent uploads with relative dates)
  try {
    const channelVideos = await fetchChannelUploads(channelHandle);
    channelVideos.forEach(v => videoMap.set(v.youtubeId, v));
  } catch (err) {
    console.warn("Channel uploads fetch error:", err);
  }

  // 2. Fetch all program playlists in parallel
  if (programs && programs.length > 0) {
    const validPrograms = programs.filter(p => p.youtubePlaylistId && p.status !== 'draft');
    await Promise.all(
      validPrograms.map(async (p) => {
        try {
          const feed = await fetchYouTubePlaylistVideos(
            p.youtubePlaylistId,
            p.slug,
            p.category,
            p.language || 'ml'
          );
          feed.forEach(pv => {
            if (videoMap.has(pv.youtubeId)) {
              // Enrich existing channel video with program info
              const existing = videoMap.get(pv.youtubeId)!;
              videoMap.set(pv.youtubeId, {
                ...existing,
                programId: p.slug,
                programName: p.title,
                category: p.category || existing.category,
                playlist: p.youtubePlaylistId,
                episodeNumber: pv.episodeNumber || existing.episodeNumber
              });
            } else {
              videoMap.set(pv.youtubeId, {
                ...pv,
                programName: p.title
              });
            }
          });
        } catch (err) {
          console.warn(`Error loading playlist feed for program ${p.slug}:`, err);
        }
      })
    );
  }

  const allVideos = Array.from(videoMap.values());
  allVideos.sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());
  return allVideos;
}

export async function fetchSingleYouTubeVideo(
  slugOrId: string,
  programs: any[] = []
): Promise<YouTubeFeedVideo | null> {
  const youtubeId = extractYouTubeId(slugOrId.replace(/^youtube-/, ''));
  if (!youtubeId) return null;

  // 1. Try finding in program playlist feeds first
  if (programs.length > 0) {
    try {
      const liveVideos = await fetchLiveYouTubeVideos(programs);
      const found = liveVideos.find(v => v.youtubeId === youtubeId || v.slug === slugOrId);
      if (found) return found;
    } catch {}
  }

  // 2. Scrape watch page for complete details (title, Malayalam description, publish date, duration)
  try {
    const res = await fetch(`https://www.youtube.com/watch?v=${youtubeId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    if (res.ok) {
      const html = await res.text();
      const playerResp = extractYtInitialPlayerResponse(html);
      if (playerResp && playerResp.videoDetails) {
        const vd = playerResp.videoDetails;
        const micro = playerResp.microformat?.playerMicroformatRenderer;
        const title = vd.title || `YouTube Video ${youtubeId}`;
        const description = vd.shortDescription || '';
        const publishedAt = micro?.publishDate ? micro.publishDate.split('T')[0] : new Date().toISOString().split('T')[0];
        const sec = parseInt(vd.lengthSeconds || '0', 10);
        const duration = sec > 0 ? `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}` : '';
        const epNum = extractEpisodeNumber(title);
        const progMatch = matchProgramByTitle(title);

        return {
          slug: `youtube-${youtubeId}`,
          id: `youtube-${youtubeId}`,
          youtubeId,
          title,
          description,
          duration,
          publishedAt,
          customThumbnail: `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
          category: progMatch?.category || 'General',
          status: 'published',
          episodeNumber: epNum,
          programId: progMatch?.programId || '',
          programName: progMatch?.programName || '',
          language: 'ml'
        };
      }
    }
  } catch (e) {
    console.warn(`Watch page fetch failed for ${youtubeId}:`, e);
  }

  // 3. Fallback to YouTube oEmbed API
  try {
    const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${youtubeId}&format=json`);
    if (res.ok) {
      const data = await res.json() as any;
      const title = data.title || `YouTube Video ${youtubeId}`;
      const epNum = extractEpisodeNumber(title);
      const progMatch = matchProgramByTitle(title);

      return {
        slug: `youtube-${youtubeId}`,
        id: `youtube-${youtubeId}`,
        youtubeId,
        title,
        description: '',
        publishedAt: new Date().toISOString().split('T')[0],
        customThumbnail: data.thumbnail_url || `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
        category: progMatch?.category || 'General',
        status: 'published',
        episodeNumber: epNum,
        programId: progMatch?.programId || '',
        programName: progMatch?.programName || '',
        language: 'ml'
      };
    }
  } catch (e) {
    console.warn(`oEmbed fetch failed for ${youtubeId}:`, e);
  }

  return {
    slug: `youtube-${youtubeId}`,
    id: `youtube-${youtubeId}`,
    youtubeId,
    title: `YouTube Video ${youtubeId}`,
    description: '',
    publishedAt: new Date().toISOString().split('T')[0],
    customThumbnail: `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
    category: 'General',
    status: 'published',
    language: 'ml'
  };
}
