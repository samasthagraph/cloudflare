import { json } from "@remix-run/cloudflare";
import fm from "front-matter";
import { isEnglish } from "~/utils/language";
import Index, { meta as originalMeta } from "./_index";

export const loader = async () => {
  const mdxArticles = import.meta.glob("../content/articles/*.mdx", { query: '?raw', import: 'default', eager: true });
  const articlesData = Object.entries(mdxArticles).map(([path, content]) => {
    const slug = path.split('/').pop()?.replace('.mdx', '');
    const { attributes } = fm(content as string);
    return { slug, ...(attributes as any) };
  }).filter((a: any) => a.status !== 'draft' && isEnglish(a)).sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());

  const jsonVideos = import.meta.glob("../content/videos/*.json", { import: 'default', eager: true });
  const videosData = Object.entries(jsonVideos).map(([path, content]: any) => {
    return { slug: path.split('/').pop()?.replace('.json', ''), ...content };
  }).filter((v: any) => v.status !== 'draft' && isEnglish(v)).sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());

  const jsonPodcasts = import.meta.glob("../content/podcasts/*.json", { import: 'default', eager: true });
  const podcastsData = Object.entries(jsonPodcasts).map(([path, content]: any) => {
    return { slug: path.split('/').pop()?.replace('.json', ''), ...content };
  }).filter((p: any) => p.status !== 'draft' && isEnglish(p)).sort((a, b) => (b.episodeNumber || 0) - (a.episodeNumber || 0));

  let homepageSettings = null;
  try {
    const settingsFiles = import.meta.glob("../content/settings/homepage.json", { import: 'default', eager: true });
    homepageSettings = Object.values(settingsFiles)[0] || null;
  } catch (e) {}

  let podcastPlatforms = null;
  try {
    const platformFiles = import.meta.glob("../content/settings/podcast-platforms.json", { import: 'default', eager: true });
    podcastPlatforms = Object.values(platformFiles)[0] || null;
  } catch (e) {}

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
