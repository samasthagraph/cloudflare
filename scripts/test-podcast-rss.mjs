export async function parsePodcastRss(feedUrl = 'https://anchor.fm/s/115f86d24/podcast/rss') {
  const res = await fetch(feedUrl);
  if (!res.ok) throw new Error(`Failed to fetch RSS feed: ${res.status}`);
  const xml = await res.text();
  
  // Extract channel artwork
  const channelImgMatch = xml.match(/<channel>[\s\S]*?<itunes:image[^>]*href=["']([^"']+)["']/i) || xml.match(/<image>[\s\S]*?<url>([^<]+)<\/url>/i);
  const defaultImage = channelImgMatch ? channelImgMatch[1] : '';

  const items = xml.split('<item>').slice(1);
  return items.map((item, idx) => {
    const rawTitle = (item.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/i)?.[1] || item.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || '').trim();
    const rawDesc = (item.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/i)?.[1] || item.match(/<description>([\s\S]*?)<\/description>/i)?.[1] || '').trim();
    const cleanDesc = rawDesc.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    
    const audioUrl = item.match(/<enclosure[^>]*url=["']([^"']+)["']/i)?.[1] || '';
    const imgMatch = item.match(/<itunes:image[^>]*href=["']([^"']+)["']/i)?.[1];
    const image = imgMatch || defaultImage;
    
    const duration = item.match(/<itunes:duration>([^<]+)<\/itunes:duration>/i)?.[1] || '00:00';
    const pubDateStr = item.match(/<pubDate>([^<]+)<\/pubDate>/i)?.[1] || '';
    const link = item.match(/<link>([^<]+)<\/link>/i)?.[1] || '';
    const guid = item.match(/<guid[^>]*>([^<]+)<\/guid>/i)?.[1] || '';
    const epMatch = item.match(/<itunes:episode>(\d+)<\/itunes:episode>/i);
    const episodeNumber = epMatch ? parseInt(epMatch[1], 10) : items.length - idx;

    // Generate clean slug from link or title or guid
    let slug = '';
    if (link && link.includes('/episodes/')) {
      slug = link.split('/episodes/')[1].split('?')[0].replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
    }
    if (!slug) {
      slug = rawTitle
        .toLowerCase()
        .replace(/[^a-zA-Z0-9\u0D00-\u0D7F]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }
    if (!slug) slug = `episode-${episodeNumber}`;

    return {
      slug,
      title: rawTitle,
      description: cleanDesc,
      audioUrl,
      image,
      coverImage: image,
      duration,
      publishedAt: pubDateStr ? new Date(pubDateStr).toISOString() : new Date().toISOString(),
      episodeNumber,
      spotifyUrl: link,
      status: 'published',
      category: 'Podcast'
    };
  });
}

// Test run
parsePodcastRss().then(episodes => {
  console.log(`Successfully parsed ${episodes.length} episodes:`);
  episodes.forEach((ep, i) => {
    console.log(`\n[${i+1}] ${ep.title}`);
    console.log(`    Slug: ${ep.slug}`);
    console.log(`    Duration: ${ep.duration}`);
    console.log(`    Audio: ${ep.audioUrl}`);
    console.log(`    Image: ${ep.image}`);
    console.log(`    Spotify: ${ep.spotifyUrl}`);
  });
}).catch(console.error);
