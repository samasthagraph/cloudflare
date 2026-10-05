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

  const mdxArticles = import.meta.glob("../content/articles/*.mdx", { query: '?raw', import: 'default', eager: true });
  const staticArticles = Object.entries(mdxArticles).map(([path, content]) => {
    const slug = path.split('/').pop()?.replace('.mdx', '');
    const { attributes } = fm(content as string);
    return { slug, ...(attributes as any) };
  });

  const articleMap = new Map<string, any>();
  staticArticles.forEach(a => { if (a.slug) articleMap.set(a.slug, a); });
  dbArticles.forEach(a => { if (a.slug) articleMap.set(a.slug, a); });

  const articlesData = Array.from(articleMap.values())
    .filter((a: any) => a.status !== 'draft' && isEnglish(a))
    .sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());

  // 2. Videos & Programs
  const jsonPrograms = import.meta.glob("../content/programs/*.json", { import: 'default', eager: true });
  const staticPrograms = Object.entries(jsonPrograms).map(([path, content]: any) => ({
    slug: path.split('/').pop()?.replace('.json', ''),
    ...content
  }));
  const programMap = new Map<string, any>();
  staticPrograms.forEach(p => { if (p.slug) programMap.set(p.slug, p); });
  dbPrograms.forEach((p: any) => { if (p.slug) programMap.set(p.slug, p); });
  const allPrograms = Array.from(programMap.values());

  let liveVideos: any[] = [];
  try {
    liveVideos = await fetchLiveYouTubeVideos(allPrograms);
  } catch (e) {
    console.warn("Failed to fetch live YouTube videos in en._index:", e);
  }

  const jsonVideos = import.meta.glob("../content/videos/*.json", { import: 'default', eager: true });
  const staticVideos = Object.entries(jsonVideos).map(([path, content]: any) => {
    return { slug: path.split('/').pop()?.replace('.json', ''), ...content };
  });

  const videoMap = new Map<string, any>();
  staticVideos.forEach(v => { if (v.slug) videoMap.set(v.slug, v); });
  dbVideos.forEach(v => { if (v.slug) videoMap.set(v.slug, v); });
  liveVideos.forEach(v => { if (v.slug) videoMap.set(v.slug, v); });

  const videosData = Array.from(videoMap.values())
    .filter((v: any) => v.status !== 'draft' && isEnglish(v))
    .sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());

  // 3. Podcasts
  let livePodcasts: any[] = [];
  try {
    livePodcasts = await fetchLiveSpotifyPodcasts();
  } catch (e) { }

  const jsonPodcasts = import.meta.glob("../content/podcasts/*.json", { import: 'default', eager: true });
  const staticPodcasts = Object.entries(jsonPodcasts).map(([path, content]: any) => {
    return { slug: path.split('/').pop()?.replace('.json', ''), ...content };
  });

  const podcastMap = new Map<string, any>();
  staticPodcasts.forEach(p => podcastMap.set(p.slug, p));
  dbPodcasts.forEach(p => podcastMap.set(p.slug, p));
  livePodcasts.forEach(ep => podcastMap.set(ep.slug, ep));

  const podcastsData = Array.from(podcastMap.values())
    .filter((p: any) => p.status !== 'draft' && isEnglish(p))
    .sort((a, b) => (b.episodeNumber || 0) - (a.episodeNumber || 0));

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
  });
};

export const meta = originalMeta;
export default Index;

