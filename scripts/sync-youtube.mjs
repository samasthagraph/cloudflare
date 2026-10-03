import fs from 'fs';
import path from 'path';
import fm from 'front-matter';

// To support mocked testing, allow overriding fetch and env
let fetcher = globalThis.fetch;
let getApiKey = () => process.env.YOUTUBE_API_KEY;

export function setFetcher(mock) { fetcher = mock; }
export function setApiKeyProvider(mockFn) { getApiKey = mockFn; }

export async function syncYouTube(contentDir) {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error("ERROR: YOUTUBE_API_KEY is not set.");
    process.exit(1);
  }

  const programsDir = path.join(contentDir, 'programs');
  const videosDir = path.join(contentDir, 'videos');

  // Ensure directories exist
  if (!fs.existsSync(programsDir)) fs.mkdirSync(programsDir, { recursive: true });
  if (!fs.existsSync(videosDir)) fs.mkdirSync(videosDir, { recursive: true });

  // 1. Read existing programs and extract youtubePlaylistIds
  const eligiblePlaylists = new Map();
  const programFiles = fs.readdirSync(programsDir).filter(f => f.endsWith('.json'));
  for (const file of programFiles) {
    try {
      const content = JSON.parse(fs.readFileSync(path.join(programsDir, file), 'utf8'));
      if (content.status === 'published' && content.youtubePlaylistId) {
        let pid = content.youtubePlaylistId.trim();
        try {
          if (pid.includes('youtube.com/') || pid.includes('youtu.be/')) {
            const urlObj = new URL(pid);
            if (urlObj.searchParams.has('list')) {
              pid = urlObj.searchParams.get('list');
            } else {
              console.error(`Warning: URL provided but no 'list' parameter found in ${pid}`);
            }
          }
        } catch (err) {
          console.error(`Warning: Failed to parse playlist URL ${pid}`);
        }
        eligiblePlaylists.set(pid, file.replace('.json', ''));
      }
    } catch (e) {
      console.error(`Warning: Failed to parse program file ${file}`, e);
    }
  }

  if (eligiblePlaylists.size === 0) {
    console.log("No published programs with playlist IDs found. Exiting.");
    return;
  }

  // 2. Read existing videos and extract youtubeIds (both JSON and MDX)
  const knownYoutubeIds = new Map();
  const videoFiles = fs.readdirSync(videosDir).filter(f => f.endsWith('.json') || f.endsWith('.mdx'));
  for (const file of videoFiles) {
    try {
      const filepath = path.join(videosDir, file);
      const fileContent = fs.readFileSync(filepath, 'utf8');
      let youtubeId = null;
      if (file.endsWith('.json')) {
        const json = JSON.parse(fileContent);
        youtubeId = json.youtubeId;
      } else if (file.endsWith('.mdx')) {
        const { attributes } = fm(fileContent);
        youtubeId = attributes.youtubeId;
      }
      if (youtubeId) {
        knownYoutubeIds.set(youtubeId, filepath);
      }
    } catch (e) {
      console.error(`Warning: Failed to parse video file ${file}`, e);
    }
  }

  // 3. Fetch all eligible playlists atomically
  const newDrafts = [];
  const updates = [];
  const discoveredIdsThisRun = new Set();

  for (const [playlistId, programSlug] of eligiblePlaylists.entries()) {
    let pageToken = '';
    while (true) {
      const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails,status&maxResults=50&playlistId=${playlistId}&key=${apiKey}${pageToken ? `&pageToken=${pageToken}` : ''}`;
      
      const res = await fetcher(url);
      if (!res.ok) {
        console.error(`ERROR: Failed to fetch playlist ${playlistId}. Status: ${res.status}`);
        // Atomic fail: Do not proceed with any writes if an API call fails
        throw new Error(`API fetch failed for playlist ${playlistId}`);
      }

      const data = await res.json();
      
      for (const item of data.items || []) {
        // Skip private or deleted videos
        const privacyStatus = item.status?.privacyStatus;
        if (privacyStatus === 'private' || privacyStatus === 'privacyStatusUnspecified') {
          continue;
        }

        const videoId = item.contentDetails?.videoId;
        if (!videoId) continue;

        // Avoid duplicate processing in the same run
        if (discoveredIdsThisRun.has(videoId)) {
          continue;
        }
        discoveredIdsThisRun.add(videoId);

        // Update existing if known
        if (knownYoutubeIds.has(videoId)) {
          const filepath = knownYoutubeIds.get(videoId);
          if (filepath.endsWith('.json')) {
            try {
              const fileContent = fs.readFileSync(filepath, 'utf8');
              const existing = JSON.parse(fileContent);
              if (existing.programId !== programSlug) {
                existing.programId = programSlug;
                updates.push({ filepath, content: existing });
              }
            } catch (e) {
              console.error(`Warning: Failed to read/update existing file ${filepath}`);
            }
          }
          continue;
        }

        // Filename collision check
        const filename = `youtube-${videoId}.json`;
        const filepath = path.join(videosDir, filename);
        if (fs.existsSync(filepath)) {
           try {
              const existingContent = fs.readFileSync(filepath, 'utf8');
              // Check if it's JSON
              if (filepath.endsWith('.json')) {
                 const existing = JSON.parse(existingContent);
                 if (existing.youtubeId === videoId) {
                    knownYoutubeIds.set(videoId, filepath);
                    if (existing.programId !== programSlug) {
                       existing.programId = programSlug;
                       updates.push({ filepath, content: existing });
                    }
                    continue;
                 }
              } else if (filepath.endsWith('.mdx')) {
                 const { attributes } = fm(existingContent);
                 if (attributes.youtubeId === videoId) {
                    knownYoutubeIds.set(videoId, filepath);
                    continue;
                 }
              }
              console.error(`ERROR: Filename collision for ${filename} with conflicting youtubeId!`);
              throw new Error("Filename collision with conflicting youtubeId");
           } catch(e) {
               console.error(`ERROR: Filename collision for ${filename} (unparseable file or mismatch)!`, e);
               throw new Error("Filename collision unparseable or mismatch");
           }
        }

        const publishedAt = item.snippet?.publishedAt ? item.snippet.publishedAt.slice(0, 10) : '';

        // Add to drafts
        newDrafts.push({
          filepath,
          content: {
            title: item.snippet?.title || '',
            description: item.snippet?.description || '',
            youtubeId: videoId,
            publishedAt: publishedAt,
            status: 'published',
            language: 'ml',
            category: 'General',
            programId: programSlug,
            translationGroupId: ''
          }
        });
      }

      if (data.nextPageToken) {
        pageToken = data.nextPageToken;
      } else {
        break;
      }
    }
  }

  // 4. Atomic Write
  for (const update of updates) {
    fs.writeFileSync(update.filepath, JSON.stringify(update.content, null, 2), 'utf8');
    console.log(`Updated existing video for youtubeId: ${update.content.youtubeId}`);
  }

  for (const draft of newDrafts) {
    fs.writeFileSync(draft.filepath, JSON.stringify(draft.content, null, 2), 'utf8');
    console.log(`Created new video for youtubeId: ${draft.content.youtubeId}`);
  }

  console.log(`Synchronization complete. Created ${newDrafts.length} new videos, updated ${updates.length} existing videos.`);
}

// Allow running directly
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  const contentDir = path.resolve('./app/content');
  syncYouTube(contentDir).catch(e => {
    console.error("Sync failed:", e.message);
    process.exit(1);
  });
}
