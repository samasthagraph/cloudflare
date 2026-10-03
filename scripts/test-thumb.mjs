import fs from 'fs';
import { parsePodcastRss } from './sync-podcasts.mjs';

const vDir = './app/content/videos';
const videos = fs.readdirSync(vDir).filter(f => f.endsWith('.json')).map(f => JSON.parse(fs.readFileSync(vDir + '/' + f, 'utf8')));

function resolveEpisodeThumbnail(title, rssImage, videos) {
  if (rssImage && !rssImage.includes('podcast_uploaded_nologo') && !rssImage.includes('a1e35ade3abba')) {
    return rssImage;
  }
  const clean = (str) => str.toLowerCase().replace(/[^a-z0-9\u0D00-\u0D7F]+/g, ' ').trim();
  const titleClean = clean(title);

  for (const video of videos) {
    const vTitleClean = clean(video.title);
    if (titleClean.includes(vTitleClean) || vTitleClean.includes(titleClean)) {
      if (video.customThumbnail) return video.customThumbnail;
      if (video.youtubeId) return 'https://img.youtube.com/vi/' + video.youtubeId + '/hqdefault.jpg';
    }
  }

  for (const video of videos) {
    const vTitleClean = clean(video.title);
    const epMatch1 = title.match(/Episode\s*0?(\d+)/i);
    const epMatch2 = video.title.match(/Episode\s*0?(\d+)/i);
    if (epMatch1 && epMatch2 && epMatch1[1] === epMatch2[1]) {
      if (titleClean.includes('minal qalb') && vTitleClean.includes('minal qalb')) {
        return video.customThumbnail || 'https://img.youtube.com/vi/' + video.youtubeId + '/hqdefault.jpg';
      }
      if (titleClean.includes('noorul hira') && vTitleClean.includes('noorul hira')) {
        return video.customThumbnail || 'https://img.youtube.com/vi/' + video.youtubeId + '/hqdefault.jpg';
      }
    }
  }
  return rssImage;
}

parsePodcastRss().then(eps => {
  eps.forEach((ep, i) => {
    const thumb = resolveEpisodeThumbnail(ep.title, ep.image, videos);
    console.log(`[${i+1}] ${ep.title.slice(0, 30)} -> ${thumb}`);
  });
});
