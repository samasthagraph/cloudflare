import type { D1Database } from "@cloudflare/workers-types";
import { saveDbVideo, saveDbPodcast, getDbPrograms, getDbSetting, saveDbSetting, ensureTablesExist } from "./db.server";
import { fetchLiveYouTubeVideos, type YouTubeFeedVideo } from "./youtube";
import { fetchLiveSpotifyPodcasts, getPodcastShows, type PodcastShow, type PodcastEpisode } from "./podcasts.server";
import podcastShowsConfig from "../content/settings/podcast-shows.json";

export interface SyncResult {
  success: boolean;
  skipped?: boolean;
  videosCount: number;
  podcastsCount: number;
  message: string;
  timestamp: number;
}

const SYNC_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes cache window

let inFlightSync: Promise<SyncResult> | null = null;
let lastMemorySyncTime = 0;

export async function syncLatestMedia(
  db: D1Database,
  options: { force?: boolean } = {}
): Promise<SyncResult> {
  const now = Date.now();

  // If sync already in progress, await it
  if (inFlightSync) {
    return inFlightSync;
  }

  // Check debounce unless forced
  if (!options.force) {
    if (now - lastMemorySyncTime < SYNC_INTERVAL_MS) {
      return {
        success: true,
        skipped: true,
        videosCount: 0,
        podcastsCount: 0,
        message: "Sync skipped (recently synced in memory).",
        timestamp: lastMemorySyncTime
      };
    }

    try {
      await ensureTablesExist(db);
      const syncStatus = await getDbSetting(db, "media_sync_status");
      const lastDbSync = Number(syncStatus?.timestamp || 0);
      if (lastDbSync > 0 && now - lastDbSync < SYNC_INTERVAL_MS) {
        lastMemorySyncTime = lastDbSync;
        return {
          success: true,
          skipped: true,
          videosCount: Number(syncStatus?.videosCount || 0),
          podcastsCount: Number(syncStatus?.podcastsCount || 0),
          message: "Sync skipped (recently synced in database).",
          timestamp: lastDbSync
        };
      }
    } catch (e) {
      // Proceed with sync if setting check fails
    }
  }

  inFlightSync = (async () => {
    try {
      await ensureTablesExist(db);

      // 1. Load active programs for playlist mapping
      let programs = await getDbPrograms(db);
      if (!programs || programs.length === 0) {
        programs = [
          { slug: 'ananthapporul', title: 'Ananthapporul', youtubePlaylistId: 'PLaLL-m5GKmYI', category: 'Motivation' },
          { slug: 'fiqh-file', title: 'Fiqh Files', youtubePlaylistId: 'PLa-bpNXHJmxc', category: 'Fiqh' },
          { slug: 'minal-qalb', title: 'Minal Qalb', youtubePlaylistId: 'PLF7zyCLUrbbg', category: 'General' },
          { slug: 'noorul-hira', title: 'Noorul Hira', youtubePlaylistId: 'PLRWOJUbVCZr4', category: 'Quran' },
          { slug: 'ihya-uloomudheen', title: 'Ihya Uloomudheen', youtubePlaylistId: 'PLDgsmtwhHihM', category: 'Spirituality' }
        ];
      }

      // 2. Fetch live YouTube videos (channel uploads + program playlists)
      let liveVideos: YouTubeFeedVideo[] = [];
      try {
        liveVideos = await fetchLiveYouTubeVideos(programs);
      } catch (ytErr) {
        console.warn("Error fetching live YouTube videos during sync:", ytErr);
      }

      // 3. Upsert videos to D1
      let savedVideosCount = 0;
      for (const v of liveVideos) {
        try {
          await saveDbVideo(db, {
            slug: v.slug,
            youtubeId: v.youtubeId,
            title: v.title,
            description: v.description || "",
            duration: v.duration || "",
            customThumbnail: v.customThumbnail,
            thumbnailUrl: v.customThumbnail,
            category: v.category || "General",
            programId: v.programId || null,
            programName: v.programName || v.programId || "",
            playlist: v.playlist || null,
            episodeNumber: v.episodeNumber || null,
            status: "published",
            language: v.language || "ml",
            publishedAt: v.publishedAt || new Date().toISOString()
          });
          savedVideosCount++;
        } catch (vSaveErr) {
          console.warn(`Failed to save video ${v.slug} to D1:`, vSaveErr);
        }
      }

      // 4. Load podcast shows settings
      const dbShowsSetting = await getDbSetting(db, "podcast-shows");
      const showsSource = dbShowsSetting?.shows || (podcastShowsConfig as any)?.shows;
      const shows: PodcastShow[] = getPodcastShows(showsSource);

      // 5. Fetch live podcasts from Anchor RSS feeds
      let liveEpisodes: PodcastEpisode[] = [];
      try {
        liveEpisodes = await fetchLiveSpotifyPodcasts(shows);
      } catch (podErr) {
        console.warn("Error fetching live podcasts during sync:", podErr);
      }

      // 6. Upsert podcast episodes to D1
      let savedPodcastsCount = 0;
      for (const ep of liveEpisodes) {
        try {
          await saveDbPodcast(db, {
            slug: ep.slug,
            title: ep.title,
            description: ep.description || "",
            audioUrl: ep.audioUrl,
            duration: ep.duration,
            coverImage: ep.coverImage || ep.image || ep.artwork || "",
            showName: ep.showTitle || ep.showName || ep.category || "Samastha Graph",
            showId: ep.showId || "samastha-graph",
            episodeNumber: ep.episodeNumber || 1,
            spotifyUrl: ep.spotifyUrl || "",
            status: "published",
            language: ep.language || "ml",
            publishedAt: ep.publishedAt || new Date().toISOString()
          });
          savedPodcastsCount++;
        } catch (pSaveErr) {
          console.warn(`Failed to save podcast episode ${ep.slug} to D1:`, pSaveErr);
        }
      }

      // 7. Save sync timestamp and summary in site_settings
      const syncMeta = {
        timestamp: Date.now(),
        isoDate: new Date().toISOString(),
        videosCount: savedVideosCount,
        podcastsCount: savedPodcastsCount
      };

      try {
        await saveDbSetting(db, "media_sync_status", syncMeta);
      } catch (sErr) {
        console.warn("Failed to save media_sync_status to D1:", sErr);
      }

      lastMemorySyncTime = Date.now();

      return {
        success: true,
        videosCount: savedVideosCount,
        podcastsCount: savedPodcastsCount,
        message: `Successfully synced ${savedVideosCount} videos and ${savedPodcastsCount} podcast episodes.`,
        timestamp: lastMemorySyncTime
      };
    } catch (err: any) {
      console.error("Critical error in syncLatestMedia:", err);
      return {
        success: false,
        videosCount: 0,
        podcastsCount: 0,
        message: err?.message || "Sync failed due to an unexpected error.",
        timestamp: Date.now()
      };
    } finally {
      inFlightSync = null;
    }
  })();

  return inFlightSync;
}

export async function syncLatestMediaIfNeeded(db?: D1Database): Promise<void> {
  if (!db) return;
  try {
    // Non-blocking auto-sync check
    await syncLatestMedia(db, { force: false });
  } catch (err) {
    console.warn("Background sync warning (non-fatal):", err);
  }
}
