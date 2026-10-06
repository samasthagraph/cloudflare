import { json, type LoaderFunctionArgs, type MetaFunction } from "@remix-run/cloudflare";
import { isEnglish } from "~/utils/language";
import PodcastsIndex, { meta as originalMeta } from "./podcasts._index";
import { getPodcastShows, fetchLiveSpotifyPodcasts, type PodcastShow } from "~/utils/podcasts.server";
import podcastShowsConfig from "../content/settings/podcast-shows.json";
import { getDbPodcasts, getDbSetting } from "~/utils/db.server";

export const meta: MetaFunction = originalMeta;

export const loader = async ({ context }: LoaderFunctionArgs) => {
  const env = (context as any)?.cloudflare?.env || (context as any)?.env || (typeof process !== 'undefined' ? process.env : {});
  const [dbPodcasts, dbShowsSetting] = await Promise.all([
    getDbPodcasts(env?.DB),
    getDbSetting(env?.DB, "podcast-shows")
  ]);

  const showsSource = dbShowsSetting?.shows || (podcastShowsConfig as any)?.shows;
  const shows: PodcastShow[] = getPodcastShows(showsSource);
  let livePodcasts: any[] = [];
  if (shows && shows.length > 0) {
    try {
      livePodcasts = await fetchLiveSpotifyPodcasts(shows);
    } catch (e) {}
  }

  let podcastsData: any[] = [];
  if (env?.DB) {
    const podcastMap = new Map<string, any>();
    (dbPodcasts || []).forEach(ep => podcastMap.set(ep.slug, ep));
    livePodcasts.forEach(ep => {
      if (!podcastMap.has(ep.slug)) podcastMap.set(ep.slug, ep);
    });
    podcastsData = Array.from(podcastMap.values()).filter((p: any) => p.status !== 'draft' && isEnglish(p));
  } else {
    const jsonPodcasts = import.meta.glob("../content/podcasts/*.json", { import: 'default', eager: true });
    const localPodcasts = Object.entries(jsonPodcasts).map(([path, content]: any) => {
      return { slug: path.split('/').pop()?.replace('.json', ''), ...content };
    });
    const podcastMap = new Map<string, any>();
    localPodcasts.forEach(ep => podcastMap.set(ep.slug, ep));
    livePodcasts.forEach(ep => {
      if (!podcastMap.has(ep.slug)) podcastMap.set(ep.slug, ep);
    });
    podcastsData = Array.from(podcastMap.values()).filter((p: any) => p.status !== 'draft' && isEnglish(p));
  }

  podcastsData.sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());
  
  return json({ podcasts: podcastsData, shows }, {
    headers: { "Cache-Control": "public, max-age=0, must-revalidate" }
  });
};

export default PodcastsIndex;


