import { json } from "@remix-run/cloudflare";
import About, { meta as originalMeta } from "./about";

export const meta = originalMeta;

export const loader = async ({ context }: any) => {
  const env = context?.cloudflare?.env || context?.env || (typeof process !== 'undefined' ? process.env : {});
  let aboutData = null;

  if (env?.DB) {
    try {
      const { getDbSetting } = await import("~/utils/db.server");
      const dbAbout = await getDbSetting(env.DB, "about");
      if (dbAbout) aboutData = dbAbout;
    } catch (e) {
      console.warn("D1 en.about loader fetch warning:", e);
    }
  }

  if (!aboutData) {
    try {
      const localAbout = import.meta.glob("../content/settings/about.json", { import: 'default', eager: true });
      for (const path in localAbout) {
        aboutData = localAbout[path] as any;
      }
    } catch (e) {}
  }

  const englishData = aboutData ? {
    hero: aboutData.enHero || null,
    story: aboutData.enStory || null,
    mission: aboutData.enMission || [],
    gallery: aboutData.gallery || null, // Shared gallery
    work: aboutData.enWork || [],
    cta: aboutData.enCta || null
  } : {
    hero: null,
    story: null,
    mission: [],
    gallery: null,
    work: [],
    cta: null
  };

  return json({ data: englishData }, {
    headers: { "Cache-Control": "public, max-age=0, must-revalidate" }
  });
};

export default About;
