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
    const env = context?.cloudflare?.env || context?.env || (typeof process !== 'undefined' ? process.env : {});
    const githubToken = env.GITHUB_TOKEN;
    const githubOwner = env.GITHUB_OWNER || "samasthagraph";
    const githubRepo = env.GITHUB_REPO || "cloudflare";

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

    if (profile.featuredContent?.showLatestVideo) {
      const videos = import.meta.glob("../content/videos/*.json", { import: 'default', eager: true });
      const videoList = Object.entries(videos)
        .map(([path, content]: any) => ({ slug: path.split('/').pop()?.replace('.json', ''), ...content }))
        .filter((v: any) => v.status !== 'draft' && isEnglish(v))
        .sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());
      latestVideo = videoList[0] || null;
    }

    if (profile.featuredContent?.showLatestPodcast) {
      const podcasts = import.meta.glob("../content/podcasts/*.json", { import: 'default', eager: true });
      const podcastList = Object.entries(podcasts)
        .map(([path, content]: any) => ({ slug: path.split('/').pop()?.replace('.json', ''), ...content }))
        .filter((p: any) => p.status !== 'draft' && isEnglish(p))
        .sort((a, b) => (b.episodeNumber || 0) - (a.episodeNumber || 0));
      latestPodcast = podcastList[0] || null;
    }

    if (githubToken) {
      const fetchFileContent = async (path: string) => {
        const res = await fetch(`https://api.github.com/repos/${githubOwner}/${githubRepo}/contents/${path}?ref=main`, {
          headers: { "Authorization": `token ${githubToken}`, "User-Agent": "Samastha-CMS", "Accept": "application/vnd.github.v3+json" }
        });
        if (res.ok) {
          const data = await res.json();
          const base64 = data.content.replace(/\n/g, '');
          const binaryString = atob(base64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
          return new TextDecoder('utf-8').decode(bytes);
        }
        return null;
      };

      const liveProfileStr = await fetchFileContent("app/content/settings/profile.json");
      if (liveProfileStr) {
        const liveData = JSON.parse(liveProfileStr);
        profile = {
          ...liveData,
          identity: liveData.enIdentity || liveData.identity,
        };
      }
    }
  } catch (e) {
    console.error("Error loading English profile data", e);
  }

  return json({ profile, latestVideo, latestPodcast, latestArticle });
};

export default Profile;
