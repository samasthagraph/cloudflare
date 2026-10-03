import { json } from "@remix-run/cloudflare";
import About, { meta as originalMeta } from "./about";

export const meta = originalMeta;

export const loader = async () => {
  let aboutData = null;
  try {
    const localAbout = import.meta.glob("../content/settings/about.json", { import: 'default', eager: true });
    for (const path in localAbout) {
      aboutData = localAbout[path] as any;
    }
  } catch (e) {}

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

  return json({ data: englishData });
};

export default About;
