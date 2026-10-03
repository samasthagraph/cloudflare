import { json, type LoaderFunctionArgs } from "@remix-run/cloudflare";
import { isEnglish } from "~/utils/language";
import PodcastsIndex from "./podcasts._index";
import { getPodcastShows, fetchLiveSpotifyPodcasts, type PodcastShow } from "~/utils/podcasts.server";
import podcastShowsConfig from "../content/settings/podcast-shows.json";
import { getDbPodcasts, getDbSetting } from "~/utils/db.server";

export const loader = async ({ context }: LoaderFunctionArgs) => {
  const env = (context as any)?.cloudflare?.env || (context as any)?.env || (typeof process !== 'undefined' ? process.env : {});
  const [dbPodcasts, dbShowsSetting] = await Promise.all([
    getDbPodcasts(env?.DB),
    getDbSetting(env?.DB, "podcast-shows")
  ]);

  const showsSource = dbShowsSetting?.shows || (podcastShowsConfig as any)?.shows;
  const shows: PodcastShow[] = getPodcastShows(showsSource);
  let livePodcasts: any[] = [];
  try {
    livePodcasts = await fetchLiveSpotifyPodcasts(shows);
  } catch (e) {}

  const jsonPodcasts = import.meta.glob("../content/podcasts/*.json", { import: 'default', eager: true });
  const localPodcasts = Object.entries(jsonPodcasts).map(([path, content]: any) => {
    return { slug: path.split('/').pop()?.replace('.json', ''), ...content };
  });

  const podcastMap = new Map<string, any>();
  localPodcasts.forEach(ep => podcastMap.set(ep.slug, ep));
  dbPodcasts.forEach(ep => podcastMap.set(ep.slug, ep));
  livePodcasts.forEach(ep => podcastMap.set(ep.slug, ep));

  const podcastsData = Array.from(podcastMap.values())
    .filter((p: any) => p.status !== 'draft' && isEnglish(p))
    .sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());
  
  return json({ podcasts: podcastsData, shows });
};

export default PodcastsIndex;


