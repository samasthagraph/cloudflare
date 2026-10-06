import { json, type LoaderFunctionArgs } from "@remix-run/cloudflare";
import { isEnglish } from "~/utils/language";
import Profile, { meta as originalMeta } from "./profile";

export const meta = originalMeta;

export const loader = async ({ context }: LoaderFunctionArgs) => {
  let profile = {
    identity: { name: "Samastha Graph", subtitle: "The visual universe of knowledge journey", biography: "Official digital platform exploring the universe of knowledge.", logo: "" },
    featuredCTA: { title: "Visit Website", url: "https://samasthagraph.com", active: true },
    links: [],
    featuredContent: { showLatestVideo: false, showLatestPodcast: false, showLatestArticle: false }
  };
  
  let latestVideo = null;
  let latestPodcast = null;
  let latestArticle = null;

  try {
    const env = (context as any)?.cloudflare?.env || (context as any)?.env || (typeof process !== 'undefined' ? process.env : {});

    // 1. D1 Database First
    if (env?.DB) {
      try {
        const { getDbSetting, getDbVideos, getDbPodcasts, getDbArticles } = await import("~/utils/db.server");
        const [dbProfile, dbVideos, dbPodcasts, dbArticles] = await Promise.all([
          getDbSetting(env.DB, "profile"),
          getDbVideos(env.DB),
          getDbPodcasts(env.DB),
          getDbArticles(env.DB)
        ]);

        if (dbProfile) {
          profile = {
            ...dbProfile,
            identity: dbProfile.enIdentity || dbProfile.identity,
          };
        }
        if (dbVideos) {
          const enVideos = dbVideos.filter(isEnglish);
          if (enVideos.length > 0) latestVideo = enVideos[0];
        }
        if (dbPodcasts) {
          const enPods = dbPodcasts.filter(isEnglish);
          if (enPods.length > 0) latestPodcast = enPods[0];
        }
        if (dbArticles) {
          const enArts = dbArticles.filter(isEnglish);
          if (enArts.length > 0) latestArticle = enArts[0];
        }
      } catch (dbErr) {
        console.warn("D1 en.profile fetch warning:", dbErr);
      }
    }

    // 2. Static JSON fallback
    if (!profile.links || profile.links.length === 0) {
      const localProfile = import.meta.glob("../content/settings/profile.json", { import: 'default', eager: true });
      for (const path in localProfile) {
        const data = localProfile[path] as any;
        if (data) {
          profile = {
            ...data,
            identity: data.enIdentity || data.identity,
          };
        }
      }
    }

    if (!latestVideo && profile.featuredContent?.showLatestVideo) {
      const videos = import.meta.glob("../content/videos/*.json", { import: 'default', eager: true });
      const videoList = Object.entries(videos)
        .map(([path, content]: any) => ({ slug: path.split('/').pop()?.replace('.json', ''), ...content }))
        .filter((v: any) => v.status !== 'draft' && isEnglish(v))
        .sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());
      latestVideo = videoList[0] || null;
    }

    if (!latestPodcast && profile.featuredContent?.showLatestPodcast) {
      const podcasts = import.meta.glob("../content/podcasts/*.json", { import: 'default', eager: true });
      const podcastList = Object.entries(podcasts)
        .map(([path, content]: any) => ({ slug: path.split('/').pop()?.replace('.json', ''), ...content }))
        .filter((p: any) => p.status !== 'draft' && isEnglish(p))
        .sort((a, b) => (b.episodeNumber || 0) - (a.episodeNumber || 0));
      latestPodcast = podcastList[0] || null;
    }
  } catch (e) {
    console.error("Error loading English profile data", e);
  }

  return json({ profile, latestVideo, latestPodcast, latestArticle }, {
    headers: { "Cache-Control": "public, max-age=0, must-revalidate" }
  });
};

export default Profile;
