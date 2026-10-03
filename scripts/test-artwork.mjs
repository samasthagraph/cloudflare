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

function resolveArtwork(title, showId, imgFromRss, defaultShowImg) {
  const t = (title || '').toLowerCase();
  
  // Specific Episode Mappings across all shows:
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

(async () => {
  for (const show of shows) {
    console.log(`\n================== SHOW: ${show.id} | ${show.title} ==================`);
    const xml = await fetchUrl(show.feedUrl);
    const items = xml.split('<item>').slice(1);
    items.forEach((item, idx) => {
      const titleMatch = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/s) || item.match(/<title>(.*?)<\/title>/s);
      const title = titleMatch ? titleMatch[1].trim() : 'Unknown';
      const itunesImg = item.match(/<itunes:image href="([^"]+)"/)?.[1] || '';
      const resolved = resolveArtwork(title, show.id, itunesImg, show.image);
      console.log(`  [${idx + 1}] "${title.slice(0, 45)}" -> ${resolved}`);
    });
  }
})();
