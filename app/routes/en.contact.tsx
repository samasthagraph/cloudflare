import { json } from "@remix-run/cloudflare";
import Contact, { meta as originalMeta, action as originalAction } from "./contact";

export const meta = originalMeta;
export const action = originalAction;

export const loader = async ({ context }: any) => {
  const env = context?.cloudflare?.env || context?.env || (typeof process !== 'undefined' ? process.env : {});
  let contactData = null;
  let aboutData = null;
  
  if (env?.DB) {
    try {
      const { getDbSetting } = await import("~/utils/db.server");
      const [dbContact, dbAbout] = await Promise.all([
        getDbSetting(env.DB, "contact"),
        getDbSetting(env.DB, "about")
      ]);
      if (dbContact) contactData = dbContact;
      if (dbAbout) aboutData = dbAbout;
    } catch (e) {
      console.warn("D1 en.contact loader fetch warning:", e);
    }
  }

  if (!contactData) {
    try {
      const localContact = import.meta.glob("../content/settings/contact.json", { import: 'default', eager: true });
      for (const path in localContact) {
        contactData = localContact[path] as any;
      }
    } catch (e) {}
  }
  if (!aboutData) {
    try {
      const localAbout = import.meta.glob("../content/settings/about.json", { import: 'default', eager: true });
      for (const path in localAbout) {
        aboutData = localAbout[path] as any;
      }
    } catch (e) {}
  }

  const englishContactData = contactData ? {
    hero: contactData.enHero || null,
    details: contactData.enDetails || null,
    location: contactData.enLocation || null,
    communicationNote: contactData.enCommunicationNote || null
  } : {
    hero: null,
    details: null,
    location: null,
    communicationNote: null
  };

  return json({ data: englishContactData, aboutData }, {
    headers: { "Cache-Control": "public, max-age=0, must-revalidate" }
  });
};

export default Contact;
