import { json } from "@remix-run/cloudflare";
import Contact, { meta as originalMeta, action as originalAction } from "./contact";

export const meta = originalMeta;
export const action = originalAction;

export const loader = async () => {
  let contactData = null;
  let aboutData = null;
  
  try {
    const localContact = import.meta.glob("../content/settings/contact.json", { import: 'default', eager: true });
    for (const path in localContact) {
      contactData = localContact[path] as any;
    }

    const localAbout = import.meta.glob("../content/settings/about.json", { import: 'default', eager: true });
    for (const path in localAbout) {
      aboutData = localAbout[path] as any;
    }
  } catch (e) {}

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

  return json({ data: englishContactData, aboutData });
};

export default Contact;
