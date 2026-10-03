import { json } from "@remix-run/cloudflare";
import { isEnglish } from "~/utils/language";
import { fetchYouTubePlaylistVideos } from "~/utils/youtube";
import VideosIndex from "./videos._index";

export const loader = async () => {
  const jsonVideos = import.meta.glob("../content/videos/*.json", { import: 'default', eager: true });
  const mdxVideos = import.meta.glob("../content/videos/*.mdx", { query: '?raw', import: 'default', eager: true });
  
  const videosData = [
    ...Object.entries(jsonVideos).map(([path, content]: any) => {
      return { slug: path.split('/').pop()?.replace('.json', ''), ...content };
    }),
    ...Object.entries(mdxVideos).map(([path, content]: any) => {
      const slug = path.split('/').pop()?.replace('.mdx', '');
      return { slug, ...content };
    })
  ].filter(isEnglish).sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());

  // Load programs (English only, published only)
  const programsGlob = import.meta.glob("../content/programs/*.json", { import: 'default', eager: true });
  const programs = Object.entries(programsGlob)
    .map(([path, content]: any) => ({
      slug: path.split('/').pop()?.replace('.json', ''),
      ...content,
    }))
    .filter(isEnglish)
    .filter((p: any) => p.status === 'published')
    .sort((a: any, b: any) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());

  // Calculate episode counts per program
  const programCounts: Record<string, number> = {};
  await Promise.all(
    programs.map(async (p: any) => {
      const matching = videosData.filter((v: any) => v.programId === p.slug);
      if (matching.length > 0) {
        programCounts[p.slug] = matching.length;
      } else if (p.youtubePlaylistId) {
        try {
          const feed = await fetchYouTubePlaylistVideos(p.youtubePlaylistId, p.slug, p.category, 'en');
          programCounts[p.slug] = feed.length;
        } catch {
          programCounts[p.slug] = 0;
        }
      } else {
        programCounts[p.slug] = 0;
      }
    })
  );

  // Load spotlight settings
  const spotlightGlob = import.meta.glob("../content/settings/spotlight.json", { import: 'default', eager: true });
  let spotlight: any = null;
  for (const content of Object.values(spotlightGlob)) {
    spotlight = content as any;
    break;
  }

  return json({ videos: videosData, programs, programCounts, spotlight });
};

export default VideosIndex;
