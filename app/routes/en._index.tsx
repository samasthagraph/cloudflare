import { json, type LoaderFunctionArgs } from "@remix-run/cloudflare";
import fm from "front-matter";
import { isEnglish } from "~/utils/language";
import Index, { meta as originalMeta } from "./_index";
import { fetchLiveSpotifyPodcasts } from "~/utils/podcasts.server";
import { fetchLiveYouTubeVideos } from "~/utils/youtube";
import { getDbArticles, getDbVideos, getDbPodcasts, getDbPrograms, getDbSetting } from "~/utils/db.server";

export const loader = async ({ context }: LoaderFunctionArgs) => {
  const env = (context as any)?.cloudflare?.env || (context as any)?.env || (typeof process !== 'undefined' ? process.env : {});

  // 1. Articles
  const [dbArticles, dbVideos, dbPodcasts, dbPrograms, dbHomepage, dbPodcastPlatforms] = await Promise.all([
    getDbArticles(env?.DB),
    getDbVideos(env?.DB),
    getDbPodcasts(env?.DB),
    getDbPrograms(env?.DB),
    getDbSetting(env?.DB, "homepage"),
    getDbSetting(env?.DB, "podcast-platforms")
  ]);

  let articlesData: any[] = [];
  let allPrograms: any[] = [];
  let videosData: any[] = [];
  let podcastsData: any[] = [];

  if (env?.DB) {
    articlesData = (dbArticles || []).filter((a: any) => a.status !== 'draft' && isEnglish(a));
    allPrograms = (dbPrograms || []).filter((p: any) => p.status === 'published' || !p.status);
    videosData = (dbVideos || []).filter((v: any) => v.status !== 'draft' && isEnglish(v));
    podcastsData = (dbPodcasts || []).filter((p: any) => p.status !== 'draft' && isEnglish(p));
  } else {
    const mdxArticles = import.meta.glob("../content/articles/*.mdx", { query: '?raw', import: 'default', eager: true });
    articlesData = Object.entries(mdxArticles).map(([path, content]) => {
      const slug = path.split('/').pop()?.replace('.mdx', '');
      const { attributes } = fm(content as string);
      return { slug, ...(attributes as any) };
    }).filter((a: any) => a.status !== 'draft' && isEnglish(a));

    const jsonPrograms = import.meta.glob("../content/programs/*.json", { import: 'default', eager: true });
    allPrograms = Object.entries(jsonPrograms).map(([path, content]: any) => ({
      slug: path.split('/').pop()?.replace('.json', ''),
      ...content
    }));

    const jsonVideos = import.meta.glob("../content/videos/*.json", { import: 'default', eager: true });
    videosData = Object.entries(jsonVideos).map(([path, content]: any) => ({
      slug: path.split('/').pop()?.replace('.json', ''),
      ...content
    })).filter((v: any) => v.status !== 'draft' && isEnglish(v));

    const jsonPodcasts = import.meta.glob("../content/podcasts/*.json", { import: 'default', eager: true });
    podcastsData = Object.entries(jsonPodcasts).map(([path, content]: any) => ({
      slug: path.split('/').pop()?.replace('.json', ''),
      ...content
    })).filter((p: any) => p.status !== 'draft' && isEnglish(p));
  }

  articlesData.sort((a: any, b: any) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());
  podcastsData.sort((a: any, b: any) => (b.episodeNumber || 0) - (a.episodeNumber || 0));

  if (allPrograms.length > 0) {
    try {
      const liveVideos = await fetchLiveYouTubeVideos(allPrograms);
      if (liveVideos.length > 0) {
        const videoMap = new Map<string, any>();
        videosData.forEach(v => videoMap.set(v.slug, v));
        liveVideos.forEach(v => {
          if (!videoMap.has(v.slug) && isEnglish(v) && v.status !== 'draft') {
            videoMap.set(v.slug, v);
          }
        });
        videosData = Array.from(videoMap.values());
      }
    } catch (e) {
      console.warn("Failed to fetch live YouTube videos in en._index:", e);
    }
  }
  videosData.sort((a: any, b: any) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());

  // 4. Settings
  let homepageSettings = dbHomepage;
  if (!homepageSettings) {
    try {
      const settingsFiles = import.meta.glob("../content/settings/homepage.json", { import: 'default', eager: true });
      homepageSettings = Object.values(settingsFiles)[0] || null;
    } catch (e) {}
  }

  let podcastPlatforms = dbPodcastPlatforms;
  if (!podcastPlatforms) {
    try {
      const platformFiles = import.meta.glob("../content/settings/podcast-platforms.json", { import: 'default', eager: true });
      podcastPlatforms = Object.values(platformFiles)[0] || null;
    } catch (e) {}
  }

  const heroSetting = homepageSettings?.hero;
  let resolvedHero = null;
  if (heroSetting && heroSetting.enabled !== false) {
    if (heroSetting.type === 'video') {
      resolvedHero = videosData.find((v: any) => v.slug === heroSetting.slug) || null;
      if (!resolvedHero && videosData.length > 0) resolvedHero = videosData[0]; // Fallback to latest video
    } else if (heroSetting.type === 'article') {
      resolvedHero = articlesData.find((a: any) => a.slug === heroSetting.slug) || null;
      if (!resolvedHero && articlesData.length > 0) resolvedHero = articlesData[0]; // Fallback to latest article
    }
  }

  return json({ 
    articles: articlesData, 
    videos: videosData.slice(0, 10), 
    podcasts: podcastsData, 
    hero: resolvedHero, 
    homepageSettings,
    podcastPlatforms
  }, {
    headers: { "Cache-Control": "public, max-age=0, must-revalidate" }
  });
};

export const meta = originalMeta;
export default Index;

