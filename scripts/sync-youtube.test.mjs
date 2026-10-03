import test from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { syncYouTube, setFetcher, setApiKeyProvider } from './sync-youtube.mjs';

const TEST_DIR = path.join(process.cwd(), 'test-content-tmp');
const PROGRAMS_DIR = path.join(TEST_DIR, 'programs');
const VIDEOS_DIR = path.join(TEST_DIR, 'videos');

function setupDirs() {
  if (fs.existsSync(TEST_DIR)) fs.rmSync(TEST_DIR, { recursive: true, force: true });
  fs.mkdirSync(PROGRAMS_DIR, { recursive: true });
  fs.mkdirSync(VIDEOS_DIR, { recursive: true });
}

function teardownDirs() {
  if (fs.existsSync(TEST_DIR)) fs.rmSync(TEST_DIR, { recursive: true, force: true });
}

test('YouTube Sync Tests', async (t) => {
  t.beforeEach(() => {
    setupDirs();
    setApiKeyProvider(() => 'test-api-key');
  });

  t.after(() => {
    teardownDirs();
  });

  await t.test('Test A, H, I: New video generates correct draft', async () => {
    fs.writeFileSync(path.join(PROGRAMS_DIR, 'prog1.json'), JSON.stringify({
      status: 'published',
      youtubePlaylistId: 'playlist1'
    }));

    setFetcher(async (url) => {
      return {
        ok: true,
        json: async () => ({
          items: [{
            status: { privacyStatus: 'public' },
            snippet: { title: 'New Video', description: 'Desc', publishedAt: '2026-09-22T10:00:00Z' },
            contentDetails: { videoId: 'newvideo123' }
          }]
        })
      };
    });

    await syncYouTube(TEST_DIR);

    const draftPath = path.join(VIDEOS_DIR, 'youtube-newvideo123.json');
    assert.ok(fs.existsSync(draftPath), 'Draft should be created');
    
    const draft = JSON.parse(fs.readFileSync(draftPath, 'utf8'));
    assert.strictEqual(draft.language, 'ml'); // Test H
    assert.strictEqual(draft.programId, 'prog1'); // Test I
    assert.strictEqual(draft.episodeNumber, 0); // Test I
    assert.strictEqual(draft.translationGroupId, ''); // Test I
    assert.strictEqual(draft.status, 'published');
    assert.strictEqual(draft.youtubeId, 'newvideo123');
    assert.strictEqual(draft.publishedAt, '2026-09-22');
  });

  await t.test('Test B & J: Existing video (JSON & MDX) is skipped, additive behavior', async () => {
    fs.writeFileSync(path.join(PROGRAMS_DIR, 'prog1.json'), JSON.stringify({
      status: 'published',
      youtubePlaylistId: 'playlist1'
    }));

    // Create existing JSON
    fs.writeFileSync(path.join(VIDEOS_DIR, 'existing-json.json'), JSON.stringify({
      youtubeId: 'exist123456',
      title: 'Original Title JSON'
    }));

    // Create existing MDX
    fs.writeFileSync(path.join(VIDEOS_DIR, 'existing-mdx.mdx'), `---\nyoutubeId: existMDX456\ntitle: Original Title MDX\n---\nBody`);

    setFetcher(async (url) => {
      return {
        ok: true,
        json: async () => ({
          items: [
            {
              status: { privacyStatus: 'public' },
              snippet: { title: 'Changed Title JSON' },
              contentDetails: { videoId: 'exist123456' }
            },
            {
              status: { privacyStatus: 'public' },
              snippet: { title: 'Changed Title MDX' },
              contentDetails: { videoId: 'existMDX456' }
            },
            {
              status: { privacyStatus: 'public' },
              snippet: { title: 'Novel Video' },
              contentDetails: { videoId: 'novel123456' }
            }
          ]
        })
      };
    });

    await syncYouTube(TEST_DIR);

    // Assert additive: existing files were not modified
    const jsonContent = JSON.parse(fs.readFileSync(path.join(VIDEOS_DIR, 'existing-json.json')));
    assert.strictEqual(jsonContent.title, 'Original Title JSON');

    const novelDraft = path.join(VIDEOS_DIR, 'youtube-novel123456.json');
    assert.ok(fs.existsSync(novelDraft));

    const exist1 = path.join(VIDEOS_DIR, 'youtube-exist123456.json');
    assert.ok(!fs.existsSync(exist1), 'Should not create duplicate draft for existing JSON');
    
    const exist2 = path.join(VIDEOS_DIR, 'youtube-existMDX456.json');
    assert.ok(!fs.existsSync(exist2), 'Should not create duplicate draft for existing MDX');
  });

  await t.test('Test A: Full playlist URL', async () => {
    fs.writeFileSync(path.join(PROGRAMS_DIR, 'prog-url.json'), JSON.stringify({
      status: 'published',
      youtubePlaylistId: 'https://www.youtube.com/playlist?list=PLUrl123'
    }));

    let requestedUrl = '';
    setFetcher(async (url) => {
      requestedUrl = url;
      return {
        ok: true,
        json: async () => ({
          items: [{ status: { privacyStatus: 'public' }, contentDetails: { videoId: 'urlvid1' } }]
        })
      };
    });

    await syncYouTube(TEST_DIR);
    assert.ok(requestedUrl.includes('playlistId=PLUrl123'), 'URL should be correctly extracted to PLUrl123');
  });

  await t.test('Test C & D: Existing video update & Existing draft remains draft', async () => {
    fs.writeFileSync(path.join(PROGRAMS_DIR, 'minal-qalb.json'), JSON.stringify({
      status: 'published',
      youtubePlaylistId: 'playlist1'
    }));

    // Existing published video with wrong/missing programId
    fs.writeFileSync(path.join(VIDEOS_DIR, 'youtube-VIDEO_A.json'), JSON.stringify({
      youtubeId: 'VIDEO_A',
      status: 'published',
      title: 'Original Title'
    }));

    // Existing draft video
    fs.writeFileSync(path.join(VIDEOS_DIR, 'youtube-VIDEO_B.json'), JSON.stringify({
      youtubeId: 'VIDEO_B',
      status: 'draft'
    }));

    setFetcher(async () => {
      return {
        ok: true,
        json: async () => ({
          items: [
            { status: { privacyStatus: 'public' }, contentDetails: { videoId: 'VIDEO_A' } },
            { status: { privacyStatus: 'public' }, contentDetails: { videoId: 'VIDEO_B' } }
          ]
        })
      };
    });

    await syncYouTube(TEST_DIR);

    const videoA = JSON.parse(fs.readFileSync(path.join(VIDEOS_DIR, 'youtube-VIDEO_A.json')));
    assert.strictEqual(videoA.programId, 'minal-qalb', 'Program ID should be updated');
    assert.strictEqual(videoA.status, 'published', 'Status should remain published');
    assert.strictEqual(videoA.title, 'Original Title', 'Other metadata should be preserved');

    const videoB = JSON.parse(fs.readFileSync(path.join(VIDEOS_DIR, 'youtube-VIDEO_B.json')));
    assert.strictEqual(videoB.programId, 'minal-qalb', 'Program ID should be updated');
    assert.strictEqual(videoB.status, 'draft', 'Status should remain draft');
  });

  await t.test('Test C & D: Duplicate within playlist and across playlists', async () => {
    fs.writeFileSync(path.join(PROGRAMS_DIR, 'prog1.json'), JSON.stringify({
      status: 'published',
      youtubePlaylistId: 'playlist1'
    }));
    fs.writeFileSync(path.join(PROGRAMS_DIR, 'prog2.json'), JSON.stringify({
      status: 'published',
      youtubePlaylistId: 'playlist2'
    }));

    setFetcher(async (url) => {
      if (url.includes('playlist1')) {
        return {
          ok: true,
          json: async () => ({
            items: [
              { status: { privacyStatus: 'public' }, contentDetails: { videoId: 'dup12345678' } },
              { status: { privacyStatus: 'public' }, contentDetails: { videoId: 'dup12345678' } } // Same in same playlist
            ]
          })
        };
      }
      if (url.includes('playlist2')) {
        return {
          ok: true,
          json: async () => ({
            items: [
              { status: { privacyStatus: 'public' }, contentDetails: { videoId: 'dup12345678' } } // Same across playlist
            ]
          })
        };
      }
    });

    await syncYouTube(TEST_DIR);

    const files = fs.readdirSync(VIDEOS_DIR);
    assert.strictEqual(files.length, 1);
    assert.strictEqual(files[0], 'youtube-dup12345678.json');
  });

  await t.test('Test E: Filename collision', async () => {
    fs.writeFileSync(path.join(PROGRAMS_DIR, 'prog1.json'), JSON.stringify({
      status: 'published',
      youtubePlaylistId: 'playlist1'
    }));

    // Pre-create the target filename with the matching ID
    fs.writeFileSync(path.join(VIDEOS_DIR, 'youtube-col12345678.json'), JSON.stringify({
      youtubeId: 'col12345678',
      title: 'Original pre-created'
    }));

    setFetcher(async () => ({
      ok: true,
      json: async () => ({
        items: [{ status: { privacyStatus: 'public' }, contentDetails: { videoId: 'col12345678' } }]
      })
    }));

    await syncYouTube(TEST_DIR);

    const content = JSON.parse(fs.readFileSync(path.join(VIDEOS_DIR, 'youtube-col12345678.json')));
    assert.strictEqual(content.title, 'Original pre-created', 'Should never overwrite existing file');
  });

  await t.test('Test B: Pagination (Test F)', async () => {
    fs.writeFileSync(path.join(PROGRAMS_DIR, 'prog1.json'), JSON.stringify({
      status: 'published',
      youtubePlaylistId: 'playlist1'
    }));

    setFetcher(async (url) => {
      if (!url.includes('pageToken')) {
        return {
          ok: true,
          json: async () => ({
            nextPageToken: 'page2',
            items: [{ status: { privacyStatus: 'public' }, contentDetails: { videoId: 'page1videoX' } }]
          })
        };
      } else {
        return {
          ok: true,
          json: async () => ({
            items: [{ status: { privacyStatus: 'public' }, contentDetails: { videoId: 'page2videoX' } }]
          })
        };
      }
    });

    await syncYouTube(TEST_DIR);

    assert.ok(fs.existsSync(path.join(VIDEOS_DIR, 'youtube-page1videoX.json')));
    assert.ok(fs.existsSync(path.join(VIDEOS_DIR, 'youtube-page2videoX.json')));
  });

  await t.test('Test G: Missing API key', async () => {
    setApiKeyProvider(() => '');
    
    // We override process.exit to catch it in the test
    const originalExit = process.exit;
    let exitCode = null;
    process.exit = (code) => { exitCode = code; throw new Error('Exit'); };
    
    try {
      await syncYouTube(TEST_DIR);
    } catch (e) {
      // Expected
    } finally {
      process.exit = originalExit;
    }
    
    assert.strictEqual(exitCode, 1, 'Should exit with 1 if API key missing');
  });

  await t.test('Atomic Behavior: Playlist A succeeds, Playlist B fails -> NO writes', async () => {
    fs.writeFileSync(path.join(PROGRAMS_DIR, 'prog1.json'), JSON.stringify({
      status: 'published',
      youtubePlaylistId: 'playlist-success'
    }));
    fs.writeFileSync(path.join(PROGRAMS_DIR, 'prog2.json'), JSON.stringify({
      status: 'published',
      youtubePlaylistId: 'playlist-fail'
    }));

    setFetcher(async (url) => {
      if (url.includes('playlist-success')) {
        return {
          ok: true,
          json: async () => ({
            items: [{ status: { privacyStatus: 'public' }, contentDetails: { videoId: 'atomic123' } }]
          })
        };
      } else {
        return { ok: false, status: 500, text: async () => 'Internal Error' };
      }
    });

    try {
      await syncYouTube(TEST_DIR);
      assert.fail('Should have thrown an error');
    } catch(e) {
      assert.match(e.message, /API fetch failed/);
    }

    const files = fs.readdirSync(VIDEOS_DIR);
    assert.strictEqual(files.length, 0, 'No draft files should be written if any playlist fails');
  });
});
