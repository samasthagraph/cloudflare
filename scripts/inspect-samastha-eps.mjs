import fs from 'fs';

async function check() {
  const res = await fetch('https://anchor.fm/s/115f86d24/podcast/rss');
  const xml = await res.text();
  const items = xml.split('<item>').slice(1);
  console.log(`Total items in Samastha Graph feed: ${items.length}`);
  
  items.forEach((item, idx) => {
    const title = (item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || item.match(/<title>(.*?)<\/title>/))?.[1] || '';
    const desc = (item.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) || item.match(/<description>([\s\S]*?)<\/description>/))?.[1] || '';
    const link = item.match(/<link>(.*?)<\/link>/)?.[1] || '';
    const img = item.match(/<itunes:image[^>]*href=["']([^"']+)["']/i)?.[1] || '';
    
    // Look for youtube links in description
    const ytMatch = desc.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/);
    const ytId = ytMatch ? ytMatch[1] : null;

    console.log(`\n--- EPISODE ${items.length - idx} ---`);
    console.log(`Title: ${title}`);
    console.log(`Link: ${link}`);
    console.log(`YouTube ID in desc: ${ytId}`);
    console.log(`Image URL: ${img}`);
  });
}

check();
