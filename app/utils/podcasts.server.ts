import podcastShowsData from '../content/settings/podcast-shows.json';

export interface PodcastShow {
  id: string;
  title: string;
  subtitle?: string;
  feedUrl: string;
  image?: string;
  description?: string;
  active?: boolean;
  order?: number;
}

export interface PodcastEpisode {
  slug: string;
  rawSlug?: string;
  showId: string;
  showTitle: string;
  showSubtitle?: string;
  showImage?: string;
  title: string;
  description: string;
  audioUrl: string;
  rawAudioUrl: string;
  image: string;
  coverImage: string;
  customThumbnail: string;
  artwork: string;
  duration: string;
  publishedAt: string;
  episodeNumber: number;
  spotifyUrl: string;
  status: string;
  category: string;
  themePreset: string;
  language?: string;
}

let cacheTime = 0;
let cachedEpisodes: PodcastEpisode[] | null = null;
let cachedShows: PodcastShow[] | null = null;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache

function resolveArtwork(title: string, showId: string, imgFromRss?: string, defaultShowImg?: string) {
  const t = (title || '').toLowerCase();
  
  // 1. Noorul Hira Episodes
  if (showId === 'noorul-hira' || t.includes('noorul hira') || t.includes('നൂറുൽ ഹിറ')) {
    if (t.includes('04') || t.includes('പരലോകം') || t.includes('അടിമയായാൽ')) {
      return 'https://i.ytimg.com/vi/F2OPQDM-sq0/hqdefault.jpg';
    }
    if (t.includes('03') || t.includes('തെറ്റിനെ') || t.includes('ന്യായീകരിക്കാറുണ്ടോ')) {
      return 'https://i.ytimg.com/vi/cAO8V0ZnMSI/hqdefault.jpg';
    }
    if (t.includes('02') || t.includes('മനുഷ്യരെ') || t.includes('പറ്റിക്കാം')) {
      return 'https://i.ytimg.com/vi/SVyssYvacDc/hqdefault.jpg';
    }
    if (t.includes('01') || t.includes('സാലറിയും') || t.includes('ഫോളോവേഴ്‌സും')) {
      return 'https://i.ytimg.com/vi/RbhBS4Rytq8/hqdefault.jpg';
    }
    if (t.includes('intro') || t.includes('ഫാത്തിഹ') || t.includes('നേതാവ്')) {
      return 'https://i.ytimg.com/vi/Gv7BbUzUeag/hqdefault.jpg';
    }
    return 'https://i.ytimg.com/vi/Gv7BbUzUeag/hqdefault.jpg';
  }

  // 2. Ananthaporul Episodes
  if (showId === 'ananthaporul' || t.includes('ആനന്ദപ്പൊരുൾ') || t.includes('ananthaporul')) {
    if (t.includes('06') || t.includes('പിശാചിൽ') || t.includes('രക്ഷ')) {
      return 'https://i.ytimg.com/vi/sI64S8R0zdE/hqdefault.jpg';
    }
    if (t.includes('05') || t.includes('മിണ്ടാതിരിക്കാൻ')) {
      return 'https://i.ytimg.com/vi/utR9opueTc0/hqdefault.jpg';
    }
    if (t.includes('04') || t.includes('മക്കൾ നന്നാവണോ') || t.includes('എളുപ്പ വഴി')) {
      return 'https://i.ytimg.com/vi/6BHSL49uMj4/hqdefault.jpg';
    }
    if (t.includes('03') || t.includes('വിജയരഹസ്യങ്ങൾ')) {
      return 'https://i.ytimg.com/vi/22UcrISZDNY/hqdefault.jpg';
    }
    if (t.includes('02') || t.includes('ഇഷ്ടം')) {
      return 'https://i.ytimg.com/vi/sI64S8R0zdE/hqdefault.jpg';
    }
    if (t.includes('01') || t.includes('ഡിമോട്ടിവേറ്റ്')) {
      return 'https://i.ytimg.com/vi/gWio9Nojn7Q/hqdefault.jpg';
    }
    return 'https://i.ytimg.com/vi/gWio9Nojn7Q/hqdefault.jpg';
  }

  // 3. Minal Qalb Episodes
  if (showId === 'minal-qalb' || t.includes('minal qalb') || t.includes('മിനൽ ഖൽബ്')) {
    if (t.includes('06') || t.includes('രാഷ്ട്രീയക്കാർ') || t.includes('അധിക്ഷേപിച്ചിരുന്നു')) {
      return 'https://i.ytimg.com/vi/na7sQzB_lQw/hqdefault.jpg';
    }
    if (t.includes('05') || t.includes('മിനിറ്റ്‌സ് ബുക്കിൽ') || t.includes('തുന്നിച്ചേർത്ത')) {
      return 'https://i.ytimg.com/vi/TwxmHLDLSuU/hqdefault.jpg';
    }
    if (t.includes('04') || t.includes('ദുർവ്യാഖ്യാനം')) {
      return 'https://i.ytimg.com/vi/0BjdTGRSZgk/hqdefault.jpg';
    }
    if (t.includes('03') || t.includes('ശംസുൽ ഉലമ ശംസുൽ ഉലമ തന്നെയാണ്')) {
      return 'https://i.ytimg.com/vi/z8bQFqfhLN8/hqdefault.jpg';
    }
    if (t.includes('02') || t.includes('ആരോപണവുമില്ല')) {
      return 'https://i.ytimg.com/vi/H0XAMl9Ej6o/hqdefault.jpg';
    }
    if (t.includes('01') || t.includes('ഉസ്താദും ശിഷ്യനും') || t.includes('clear cut')) {
      return 'https://i.ytimg.com/vi/zwUidpWhYgM/hqdefault.jpg';
    }
    return 'https://i.ytimg.com/vi/zwUidpWhYgM/hqdefault.jpg';
  }

  // 4. Samastha Graph Show (Single Feed with All Guests)
  if (t.includes('മുഹ്‌യിദ്ദീൻ') || t.includes('muhyidheen') || t.includes('ലിപിക്കും')) {
    return 'https://i.ytimg.com/vi/TwxmHLDLSuU/hqdefault.jpg';
  }
  if (t.includes('footprints') || t.includes('ഗ്രാൻഡ് മുഫ്തി') || t.includes('മലേഷ്യൻ')) {
    return 'https://d3t3ozftmdmh3i.cloudfront.net/staging/podcast_uploaded_episode/46535697/46535697-1786718302573-a57d4874c478.jpg';
  }
  if (t.includes('ജലീൽ') || t.includes('jaleel') || t.includes('സമത്വത്തിന്റെ')) {
    return 'https://i.ytimg.com/vi/zwUidpWhYgM/hqdefault.jpg';
  }
  if (t.includes('രാമനുണ്ണി') || t.includes('ramanunni') || t.includes('പൊന്നാനി')) {
    return 'https://i.ytimg.com/vi/iqIk1TTqfKQ/hqdefault.jpg';
  }
  if (t.includes('ജോയ്') || t.includes('joy') || t.includes('സ്ത്രീധനം')) {
    return 'https://i.ytimg.com/vi/gWio9Nojn7Q/hqdefault.jpg';
  }
  if (t.includes('കുറുപ്പ്') || t.includes('കവിത പാടുന്നതിനെ')) {
    return 'https://d3t3ozftmdmh3i.cloudfront.net/staging/podcast_uploaded_episode/46535697/46535697-1786718302573-a57d4874c478.jpg';
  }
  if (t.includes('timeline') || t.includes('ടൈംലൈൻ') || t.includes('മദ്ഹുറസൂൽ') || t.includes('മാദിഹീങ്ങൾ') || t.includes('പട്ടുവം') || t.includes('ഫാറൂഖ്')) {
    return 'https://i.ytimg.com/vi/iqIk1TTqfKQ/hqdefault.jpg';
  }
  if (t.includes('കാന്തപുരം') || t.includes('kanthapuram')) {
    return 'https://d3t3ozftmdmh3i.cloudfront.net/staging/podcast_uploaded_episode/46535697/46535697-1786718302573-a57d4874c478.jpg';
  }

  // If specific individual episode image was provided in RSS (and is not generic show logo)
  if (imgFromRss && typeof imgFromRss === 'string' && imgFromRss.includes('podcast_uploaded_episode')) {
    return imgFromRss.trim();
  }

  return defaultShowImg || 'https://d3t3ozftmdmh3i.cloudfront.net/staging/podcast_uploaded_nologo/46535697/46535697-1786530965061-a1e35ade3abba.jpg';
}

export function getCleanAudioUrl(url: string) {
  if (!url) return '';
  if (url.includes('/https%3A%2F%2F')) {
    const parts = url.split('/https%3A%2F%2F');
    return 'https://' + decodeURIComponent(parts[1]);
  }
  if (url.includes('/http%3A%2F%2F')) {
    const parts = url.split('/http%3A%2F%2F');
    return 'http://' + decodeURIComponent(parts[1]);
  }
  return url;
}

export function getPodcastShows(customShows?: PodcastShow[]): PodcastShow[] {
  const list = customShows || (podcastShowsData as any)?.shows || [];
  return (list as PodcastShow[])
    .filter((s) => s.active !== false && s.feedUrl)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
}

export async function fetchFeedEpisodes(show: PodcastShow): Promise<PodcastEpisode[]> {
  try {
    const res = await fetch(show.feedUrl, {
      headers: {
        'User-Agent': 'SamasthaGraph-PodcastSync/1.0 (+https://samasthagraph.com)'
      }
    });

    if (!res.ok) {
      console.warn(`Failed to fetch RSS feed for show ${show.title}: ${res.status}`);
      return [];
    }

    const xml = await res.text();
    const channelImgMatch = xml.match(/<channel>[\s\S]*?<itunes:image[^>]*href=["']([^"']+)["']/i) || xml.match(/<image>[\s\S]*?<url>([^<]+)<\/url>/i);
    const defaultImage = channelImgMatch ? channelImgMatch[1] : (show.image || '');

    const items = xml.split('<item>').slice(1);
    return items.map((item, idx) => {
      const rawTitle = (item.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/i)?.[1] || item.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || '').trim();
      const rawDesc = (item.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/i)?.[1] || item.match(/<description>([\s\S]*?)<\/description>/i)?.[1] || '').trim();
      const cleanDesc = rawDesc.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      
      const rawAudioUrl = item.match(/<enclosure[^>]*url=["']([^"']+)["']/i)?.[1] || '';
      const audioUrl = getCleanAudioUrl(rawAudioUrl);

      const imgMatch = item.match(/<itunes:image[^>]*href=["']([^"']+)["']/i)?.[1];
      const image = resolveArtwork(rawTitle, show.id, imgMatch || defaultImage, show.image);
      
      const duration = item.match(/<itunes:duration>([^<]+)<\/itunes:duration>/i)?.[1] || '00:00';
      const pubDateStr = item.match(/<pubDate>([^<]+)<\/pubDate>/i)?.[1] || '';
      const link = item.match(/<link>([^<]+)<\/link>/i)?.[1] || '';
      const epMatch = item.match(/<itunes:episode>(\d+)<\/itunes:episode>/i);
      const episodeNumber = epMatch ? parseInt(epMatch[1], 10) : items.length - idx;

      let rawSlug = '';
      if (link && link.includes('/episodes/')) {
        rawSlug = link.split('/episodes/')[1].split('?')[0].replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
      }
      if (!rawSlug) {
        rawSlug = rawTitle
          .toLowerCase()
          .replace(/[^a-zA-Z0-9\u0D00-\u0D7F]+/g, '-')
          .replace(/^-+|-+$/g, '');
      }
      if (!rawSlug) rawSlug = `episode-${episodeNumber}`;

      // Unique slug with show prefix unless already uniquely prefixed
      const slug = show.id === 'samastha-graph' ? rawSlug : `${show.id}-${rawSlug}`;

      return {
        slug,
        rawSlug,
        showId: show.id,
        showTitle: show.title,
        showSubtitle: show.subtitle || show.title,
        showImage: show.image || defaultImage,
        title: rawTitle,
        description: cleanDesc,
        audioUrl,
        rawAudioUrl,
        image,
        coverImage: image,
        customThumbnail: image,
        artwork: image,
        duration,
        publishedAt: pubDateStr ? new Date(pubDateStr).toISOString() : new Date().toISOString(),
        episodeNumber,
        spotifyUrl: link,
        status: 'published',
        category: show.subtitle || show.title || 'Podcast',
        themePreset: 'theme-malayalam-standard'
      };
    });
  } catch (e) {
    console.error(`Error parsing feed for show ${show.title}:`, e);
    return [];
  }
}

export async function fetchLiveSpotifyPodcasts(customShows?: PodcastShow[]): Promise<PodcastEpisode[]> {
  const now = Date.now();
  if (!customShows && cachedEpisodes && (now - cacheTime < CACHE_TTL_MS)) {
    return cachedEpisodes;
  }

  const shows = getPodcastShows(customShows);
  try {
    const showResults = await Promise.all(
      shows.map((show) => fetchFeedEpisodes(show))
    );

    const allEpisodes = showResults.flat();
    if (allEpisodes.length > 0) {
      // Sort by publish date descending
      allEpisodes.sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());
      if (!customShows) {
        cachedEpisodes = allEpisodes;
        cacheTime = now;
      }
      return allEpisodes;
    }
  } catch (e) {
    console.error('Error fetching all live Spotify shows:', e);
  }

  return cachedEpisodes || [];
}
