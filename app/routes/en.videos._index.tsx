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

  let programs: any[] = [];
  let videosData: any[] = [];

  if (env?.DB) {
    programs = (dbPrograms || [])
      .filter(isEnglish)
      .filter((p: any) => p.status === 'published' || !p.status);
    videosData = (dbVideos || []).filter(isEnglish);
  } else {
    const programsGlob = import.meta.glob("../content/programs/*.json", { import: 'default', eager: true });
    programs = Object.entries(programsGlob)
      .map(([path, content]: any) => ({
        slug: path.split('/').pop()?.replace('.json', ''),
        ...content,
      }))
      .filter(isEnglish)
      .filter((p: any) => p.status === 'published' || !p.status);

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
    videosData = staticVideos.filter(isEnglish);
  }

  programs.sort((a: any, b: any) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());

  if (programs.length > 0) {
    try {
      const { fetchLiveYouTubeVideos } = await import("~/utils/youtube");
      const liveVideos = await fetchLiveYouTubeVideos(programs);
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
      console.warn("Failed to fetch live YouTube videos in en.videos._index:", e);
    }
  }
  videosData.sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());

  // Calculate episode counts per program
  const programCounts: Record<string, number> = {};
  programs.forEach((p: any) => {
    programCounts[p.slug] = videosData.filter((v: any) => 
      (v.programId === p.slug || v.programName === p.title || v.program === p.slug || v.program === p.title) &&
      (v.status === 'published' || !v.status)
    ).length;
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

  return json({ videos: videosData, programs, programCounts, spotlight }, {
    headers: { "Cache-Control": "public, max-age=0, must-revalidate" }
  });
};

export default VideosIndex;
