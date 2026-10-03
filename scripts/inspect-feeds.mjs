import fs from 'fs';
import https from 'https';

const shows = JSON.parse(fs.readFileSync('app/content/settings/podcast-shows.json', 'utf8')).shows;

function fetchUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', () => resolve(''));
  });
}

(async () => {
  for (const show of shows) {
    console.log(`\n================== SHOW: ${show.id} | ${show.title} ==================`);
    const xml = await fetchUrl(show.feedUrl);
    const items = xml.split('<item>').slice(1);
    console.log(`Total episodes in feed: ${items.length}`);
    items.forEach((item, idx) => {
      const titleMatch = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/s) || item.match(/<title>(.*?)<\/title>/s);
      const title = titleMatch ? titleMatch[1].trim() : 'Unknown';
      const itunesImg = item.match(/<itunes:image href="([^"]+)"/)?.[1] || '';
      console.log(`  [${idx + 1}] Title: "${title}"`);
      console.log(`      iTunes Image: ${itunesImg || 'NONE'}`);
    });
  }
})();
