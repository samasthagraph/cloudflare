import { json, type LoaderFunctionArgs, type MetaFunction } from "@remix-run/cloudflare";
import { isEnglish } from "~/utils/language";
import { fetchYouTubePlaylistVideos } from "~/utils/youtube";
import VideosIndex, { meta as originalMeta } from "./videos._index";
import { getDbVideos, getDbPrograms, getDbSetting } from "~/utils/db.server";

export const meta: MetaFunction = originalMeta;

export const loader = async ({ context }: LoaderFunctionArgs) => {
  const env = (context as any)?.cloudflare?.env || (context as any)?.env || (typeof process !== 'undefined' ? process.env : {});
  const [dbVideos, dbPrograms, dbSpotlight] = await Promise.all([
    getDbVideos(env?.DB),
    getDbPrograms(env?.DB),
    getDbSetting(env?.DB, "spotlight")
  ]);

  // Load programs
  const programsGlob = import.meta.glob("../content/programs/*.json", { import: 'default', eager: true });
  const staticPrograms = Object.entries(programsGlob).map(([path, content]: any) => ({
    slug: path.split('/').pop()?.replace('.json', ''),
    ...content,
  }));

  const programMap = new Map<string, any>();
  staticPrograms.forEach(p => { if (p.slug) programMap.set(p.slug, p); });
  dbPrograms.forEach(p => { if (p.slug) programMap.set(p.slug, p); });

  const programs = Array.from(programMap.values())
    .filter(isEnglish)
    .filter((p: any) => p.status === 'published')
    .sort((a: any, b: any) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());

  let liveVideos: any[] = [];
  try {
    const { fetchLiveYouTubeVideos } = await import("~/utils/youtube");
    liveVideos = await fetchLiveYouTubeVideos(programs);
  } catch (e) {
    console.warn("Failed to fetch live YouTube videos in en.videos._index:", e);
  }

  const jsonVideos = import.meta.glob("../content/videos/*.json", { import: 'default', eager: true });
  const mdxVideos = import.meta.glob("../content/videos/*.mdx", { query: '?raw', import: 'default', eager: true });
  
  const staticVideos = [
    ...Object.entries(jsonVideos).map(([path, content]: any) => {
      return { slug: path.split('/').pop()?.replace('.json', ''), ...content };
    }),
    ...Object.entries(mdxVideos).map(([path, content]: any) => {
      const slug = path.split('/').pop()?.replace('.mdx', '');
      return { slug, ...content };
    })
  ];

  const videoMap = new Map<string, any>();
  staticVideos.forEach(v => { if (v.slug) videoMap.set(v.slug, v); });
  dbVideos.forEach(v => { if (v.slug) videoMap.set(v.slug, v); });
  liveVideos.forEach(v => { if (v.slug) videoMap.set(v.slug, v); });

  const videosData = Array.from(videoMap.values())
    .filter(isEnglish)
    .sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());

  // Calculate episode counts per program
  const programCounts: Record<string, number> = {};
  programs.forEach((p: any) => {
    programCounts[p.slug] = videosData.filter((v: any) => v.programId === p.slug).length;
  });

  // Load spotlight settings
  let spotlight = dbSpotlight;
  if (!spotlight) {
    const spotlightGlob = import.meta.glob("../content/settings/spotlight.json", { import: 'default', eager: true });
    for (const content of Object.values(spotlightGlob)) {
      spotlight = content as any;
      break;
    }
  }

  return json({ videos: videosData, programs, programCounts, spotlight });
};

export default VideosIndex;
