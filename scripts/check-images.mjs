const feeds = [
  'https://anchor.fm/s/117e2a474/podcast/rss',
  'https://anchor.fm/s/11773b7f8/podcast/rss',
  'https://anchor.fm/s/117f7ef3c/podcast/rss',
  'https://anchor.fm/s/116cf0fa0/podcast/rss',
  'https://anchor.fm/s/11752d344/podcast/rss',
  'https://anchor.fm/s/115f86d24/podcast/rss'
];

async function check() {
  for (const url of feeds) {
    const res = await fetch(url);
    const xml = await res.text();
    const chTitle = (xml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || xml.match(/<title>(.*?)<\/title>/))?.[1];
    const chImg = (xml.match(/<channel>[\s\S]*?<itunes:image[^>]*href=["']([^"']+)["']/i) || xml.match(/<image>[\s\S]*?<url>([^<]+)<\/url>/i))?.[1];
    console.log('\n=== SHOW:', chTitle, '===');
    console.log('Channel Image:', chImg);
    const items = xml.split('<item>').slice(1);
    items.forEach((item, idx) => {
      const epTitle = (item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || item.match(/<title>(.*?)<\/title>/))?.[1];
      const epImg = item.match(/<itunes:image[^>]*href=["']([^"']+)["']/i)?.[1];
      console.log(`  Ep ${idx+1}: ${epTitle?.slice(0, 35)} --> ${epImg ? 'EXISTS: ' + epImg.slice(0, 60) + '...' : '(NONE - fallback)'}`);
    });
  }
}
check();
