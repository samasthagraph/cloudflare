import { useState, useEffect, useRef } from "react";
import { json, redirect } from "@remix-run/cloudflare";
import { ProfileAdmin } from "../components/ProfileAdmin";
import { HomepageAdmin } from "../components/HomepageAdmin";
import { PlatformAdmin } from "../components/PlatformAdmin";
import { AboutAdmin } from "../components/AboutAdmin";
import { ContactAdmin } from "../components/ContactAdmin";
import { PodcastShowsAdmin } from "../components/PodcastShowsAdmin";
import { AuthorsAdmin } from "../components/AuthorsAdmin";
import { HeaderAdmin } from "../components/HeaderAdmin";
import { HeroAdmin } from "../components/HeroAdmin";
import { PillarsAdmin } from "../components/PillarsAdmin";
import { LeadershipAdmin } from "../components/LeadershipAdmin";
import { GlobalNetworkAdmin } from "../components/GlobalNetworkAdmin";
import { HighlightsAdmin } from "../components/HighlightsAdmin";
import { FatwaAdmin } from "../components/FatwaAdmin";
import { EducationAdmin } from "../components/EducationAdmin";
import { GetInvolvedAdmin } from "../components/GetInvolvedAdmin";
import { MushawaraAdmin } from "../components/MushawaraAdmin";
import { FooterAdmin } from "../components/FooterAdmin";
import { ContactMessagesAdmin } from "../components/ContactMessagesAdmin";
import { useActionData, Form, useNavigation, useLoaderData, useSubmit, Link, useSearchParams } from "@remix-run/react";
import fm from "front-matter";
import RichTextEditor from '../components/RichTextEditor';

import {
  Menu, X, Edit, Trash2, Eye, Plus, Send, RefreshCw, Calendar as CalendarIcon, Search,
  LayoutDashboard, FileText, Video, Mic, ChevronDown, LogOut, ExternalLink, Radio,
  Mail, MessageSquare, Compass, Sliders, Layers, Award, Globe, Activity,
  BookOpenCheck, GraduationCap, Users, LayoutTemplate, Sparkles, CheckCircle2, ChevronRight, User
} from 'lucide-react';
import { getSessionStorage } from "../sessions.server";
import { fetchYouTubePlaylistVideos } from "../utils/youtube";
import {
  getDbArticles, getDbVideos, getDbPodcasts, getDbPrograms, getDbSetting, getDbAuthors, getDbContactMessages,
  saveDbArticle, saveDbVideo, saveDbPodcast, saveDbProgram, saveDbSetting, saveDbAuthors,
  updateDbContactMessageStatus, deleteDbContactMessage,
  deleteDbArticle, deleteDbVideo, deleteDbPodcast, deleteDbProgram
} from "../utils/db.server";

function sanitizeSlug(newSlug: string, title: string): string {
  let finalSlug = newSlug || title;
  return finalSlug
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function validateImageUrl(url: string | undefined | null): boolean {
  if (!url) return true;
  const trimmed = url.trim();
  if (trimmed === "") return true;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    if (trimmed.includes("ibb.co")) return false;
    return true;
  }
  if (trimmed.startsWith("/") || trimmed.startsWith("./") || trimmed.startsWith("../")) {
    return true;
  }
  if (/^[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+$/.test(trimmed)) {
    return true;
  }
  return false;
}

async function writeLocalFile(filePath: string, content: string) {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const fullPath = path.resolve(process.cwd(), filePath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(fullPath, content, 'utf-8');
    return true;
  } catch (e) {
    console.warn("Local file write fallback skipped or unavailable:", e);
    return false;
  }
}

async function deleteLocalFile(filePath: string) {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const fullPath = path.resolve(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
    return true;
  } catch (e) {
    console.warn("Local file delete fallback skipped or unavailable:", e);
    return false;
  }
}

async function checkLocalFileExists(filePath: string) {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const fullPath = path.resolve(process.cwd(), filePath);
    return fs.existsSync(fullPath);
  } catch (e) {
    return false;
  }
}

async function checkGithubFileExists(token: string | undefined, owner: string, repo: string, path: string) {
  if (!token) {
    return await checkLocalFileExists(path);
  }
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=main`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "User-Agent": "SamasthaGraph-CMS" }
    });
    return res.ok;
  } catch (e) {
    return await checkLocalFileExists(path);
  }
}

async function handleSlugRenameSequence({
  githubToken, owner, repo, folderPath, extension, originalSlug, finalSlug, contentStr, message
}: any) {
  if (originalSlug && originalSlug !== finalSlug) {
    const originalExists = await checkGithubFileExists(githubToken, owner, repo, `${folderPath}/${originalSlug}${extension}`);
    if (!originalExists && githubToken) {
      throw new Error(`Original file ${originalSlug}${extension} does not exist at expected path.`);
    }
    const newExists = await checkGithubFileExists(githubToken, owner, repo, `${folderPath}/${finalSlug}${extension}`);
    if (newExists) {
      throw new Error("That URL slug is already in use.");
    }
  } else if (!originalSlug) {
    const newExists = await checkGithubFileExists(githubToken, owner, repo, `${folderPath}/${finalSlug}${extension}`);
    if (newExists) {
      throw new Error("That URL slug is already in use.");
    }
  }

  await commitToGitHub({
    token: githubToken, owner, repo,
    path: `${folderPath}/${finalSlug}${extension}`,
    content: contentStr, message
  });

  if (originalSlug && originalSlug !== finalSlug) {
    try {
      await commitToGitHub({
        token: githubToken, owner, repo,
        path: `${folderPath}/${originalSlug}${extension}`,
        actionType: "DELETE", message: `Rename cleanup: delete ${originalSlug}`
      });
      return { success: true, renameStatus: "success" };
    } catch (e) {
      return { success: true, renameStatus: "incomplete", error: "Content was saved with the new URL, but the old URL could not be removed." };
    }
  }

  return { success: true, renameStatus: "none" };
}

async function commitToGitHub({
  token, owner, repo, path, content, message, branch = "main", actionType = "PUT"
}: any) {
  if (!token) {
    if (actionType === "DELETE") {
      await deleteLocalFile(path);
      return { success: true, action: "deleted", path };
    }
    await writeLocalFile(path, content);
    return { success: true, action: "saved", path };
  }

  let sha: string | undefined;
  const checkRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "User-Agent": "SamasthaGraph-CMS" }
  });

  if (checkRes.ok) {
    const data = await checkRes.json() as { sha: string };
    sha = data.sha;
  }

  if (actionType === "DELETE") {
    if (!sha) {
      await deleteLocalFile(path);
      return { success: true, deleted: path };
    }
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "User-Agent": "SamasthaGraph-CMS", "Content-Type": "application/json" },
      body: JSON.stringify({ message, sha, branch })
    });
    if (!res.ok) throw new Error("Delete failed");
    return res.json();
  }

  const utf8Bytes = new TextEncoder().encode(content);
  let binaryString = "";
  for (let i = 0; i < utf8Bytes.length; i++) binaryString += String.fromCharCode(utf8Bytes[i]);
  const base64Content = btoa(binaryString);

  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "User-Agent": "SamasthaGraph-CMS", "Content-Type": "application/json" },
    body: JSON.stringify({ message, content: base64Content, branch, ...(sha ? { sha } : {}) })
  });

  if (!res.ok) {
    console.warn("GitHub API commit failed, attempting local file fallback.");
    await writeLocalFile(path, content);
    return { success: true, fallback: "local", path };
  }
  return res.json();
}

export const loader = async ({ request, context }: any) => {
  const env = context?.cloudflare?.env || context?.env || (typeof process !== 'undefined' ? process.env : {});
  const { getSession } = getSessionStorage(env);
  const session = await getSession(request.headers.get("Cookie"));
  if (!session.get("adminAuthenticated")) {
    throw redirect("/admin/login");
  }

  let articles: any[] = [];
  let videos: any[] = [];
  let podcasts: any[] = [];
  let programs: any[] = [];
  let spotlightSettings = null;
  let platformSettings = null;
  let profileSettings = null;
  let homepageSettings = null;
  let aboutSettings = null;
  let contactSettings = null;
  let socialPlatformSettings = null;
  let podcastPlatformSettings = null;
  let podcastShowsSettings = null;
  let authorsSettings = null;
  let headerSettings = null;
  let heroSettings = null;
  let pillarsSettings = null;
  let leadershipSettings = null;
  let globalNetworkSettings = null;
  let highlightsSettings = null;
  let fatwaSettings = null;
  let educationSettings = null;
  let getInvolvedSettings = null;
  let mushawaraSettings = null;
  let footerSettings = null;
  let contactMessages: any[] = [];

  // Local Static Glob Fallback
  const mdxArticles = import.meta.glob("../content/articles/*.mdx", { query: '?raw', import: 'default', eager: true });
  articles = Object.entries(mdxArticles).map(([path, content]) => {
    const fileSlug = path.split('/').pop()?.replace('.mdx', '');
    const { attributes, body } = fm(content as string);
    return { slug: fileSlug, ...(attributes as any), body, type: 'article' };
  }).sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());

  const jsonVideos = import.meta.glob("../content/videos/*.json", { import: 'default', eager: true });
  videos = Object.entries(jsonVideos).map(([path, content]: any) => {
    return { slug: path.split('/').pop()?.replace('.json', ''), ...content, type: 'video' };
  }).sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());

  const jsonPodcasts = import.meta.glob("../content/podcasts/*.json", { import: 'default', eager: true });
  podcasts = Object.entries(jsonPodcasts).map(([path, content]: any) => {
    return { slug: path.split('/').pop()?.replace('.json', ''), ...content, type: 'podcast' };
  }).sort((a, b) => (b.episodeNumber || 0) - (a.episodeNumber || 0));

  const jsonPrograms = import.meta.glob("../content/programs/*.json", { import: 'default', eager: true });
  programs = Object.entries(jsonPrograms).map(([path, content]: any) => {
    return { slug: path.split('/').pop()?.replace('.json', ''), ...content, type: 'program' };
  }).sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());

  const jsonSettings = import.meta.glob("../content/settings/*.json", { import: 'default', eager: true });
  for (const path in jsonSettings) {
    if (path.includes('podcasts.json')) platformSettings = jsonSettings[path];
    if (path.includes('profile.json')) profileSettings = jsonSettings[path];
    if (path.includes('homepage.json')) homepageSettings = jsonSettings[path];
    if (path.includes('about.json')) aboutSettings = jsonSettings[path];
    if (path.includes('contact.json')) contactSettings = jsonSettings[path];
    if (path.includes('social-platforms.json')) socialPlatformSettings = jsonSettings[path];
    if (path.includes('podcast-platforms.json')) podcastPlatformSettings = jsonSettings[path];
    if (path.includes('podcast-shows.json')) podcastShowsSettings = jsonSettings[path];
    if (path.includes('spotlight.json')) spotlightSettings = jsonSettings[path];
    if (path.includes('authors.json')) authorsSettings = jsonSettings[path];
    if (path.includes('header.json')) headerSettings = jsonSettings[path];
    if (path.includes('hero.json')) heroSettings = jsonSettings[path];
    if (path.includes('pillars.json')) pillarsSettings = jsonSettings[path];
    if (path.includes('leadership.json')) leadershipSettings = jsonSettings[path];
    if (path.includes('global-network.json')) globalNetworkSettings = jsonSettings[path];
    if (path.includes('highlights.json')) highlightsSettings = jsonSettings[path];
    if (path.includes('fatwa.json')) fatwaSettings = jsonSettings[path];
    if (path.includes('education.json')) educationSettings = jsonSettings[path];
    if (path.includes('get-involved.json')) getInvolvedSettings = jsonSettings[path];
    if (path.includes('mushawara.json')) mushawaraSettings = jsonSettings[path];
    if (path.includes('footer.json')) footerSettings = jsonSettings[path];
    if (path.includes('messages.json')) contactMessages = (jsonSettings[path] as any) || [];
  }

  // D1 Database Merge
  if (env?.DB) {
    try {
      const [
        dbArticles, dbVideos, dbPodcasts, dbPrograms, dbMessages,
        dbHomepage, dbAbout, dbContact, dbSocial, dbPodcastPlatforms, dbPodcastShows,
        dbProfile, dbAuthors, dbSpotlight, dbHeader, dbHero, dbPillars, dbLeadership,
        dbGlobalNetwork, dbHighlights, dbFatwa, dbEducation, dbGetInvolved, dbMushawara, dbFooter
      ] = await Promise.all([
        getDbArticles(env.DB),
        getDbVideos(env.DB),
        getDbPodcasts(env.DB),
        getDbPrograms(env.DB),
        getDbContactMessages(env.DB),
        getDbSetting(env.DB, "homepage"),
        getDbSetting(env.DB, "about"),
        getDbSetting(env.DB, "contact"),
        getDbSetting(env.DB, "social-platforms"),
        getDbSetting(env.DB, "podcast-platforms"),
        getDbSetting(env.DB, "podcast-shows"),
        getDbSetting(env.DB, "profile"),
        getDbAuthors(env.DB),
        getDbSetting(env.DB, "spotlight"),
        getDbSetting(env.DB, "header"),
        getDbSetting(env.DB, "hero"),
        getDbSetting(env.DB, "pillars"),
        getDbSetting(env.DB, "leadership"),
        getDbSetting(env.DB, "global-network"),
        getDbSetting(env.DB, "highlights"),
        getDbSetting(env.DB, "fatwa"),
        getDbSetting(env.DB, "education"),
        getDbSetting(env.DB, "get-involved"),
        getDbSetting(env.DB, "mushawara"),
        getDbSetting(env.DB, "footer")
      ]);

      if (dbArticles && dbArticles.length > 0) {
        const map = new Map<string, any>();
        articles.forEach((a: any) => map.set(a.slug, a));
        dbArticles.forEach((a: any) => map.set(a.slug, a));
        articles = Array.from(map.values()).sort((a: any, b: any) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());
      }
      if (dbVideos && dbVideos.length > 0) {
        const map = new Map<string, any>();
        videos.forEach((v: any) => map.set(v.slug, v));
        dbVideos.forEach((v: any) => map.set(v.slug, v));
        videos = Array.from(map.values()).sort((a: any, b: any) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());
      }
      if (dbPodcasts && dbPodcasts.length > 0) {
        const map = new Map<string, any>();
        podcasts.forEach((p: any) => map.set(p.slug, p));
        dbPodcasts.forEach((p: any) => map.set(p.slug, p));
        podcasts = Array.from(map.values()).sort((a: any, b: any) => (b.episodeNumber || 0) - (a.episodeNumber || 0));
      }
      if (dbPrograms && dbPrograms.length > 0) {
        const map = new Map<string, any>();
        programs.forEach((p: any) => map.set(p.slug, p));
        dbPrograms.forEach((p: any) => map.set(p.slug, p));
        programs = Array.from(map.values()).sort((a: any, b: any) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());
      }
      if (dbMessages && dbMessages.length > 0) contactMessages = dbMessages;
      if (dbHomepage) homepageSettings = dbHomepage;
      if (dbAbout) aboutSettings = dbAbout;
      if (dbContact) contactSettings = dbContact;
      if (dbSocial) socialPlatformSettings = dbSocial;
      if (dbPodcastPlatforms) podcastPlatformSettings = dbPodcastPlatforms;
      if (dbPodcastShows) podcastShowsSettings = dbPodcastShows;
      if (dbProfile) profileSettings = dbProfile;
      if (dbAuthors?.authors) authorsSettings = dbAuthors;
      if (dbSpotlight) spotlightSettings = dbSpotlight;
      if (dbHeader) headerSettings = dbHeader;
      if (dbHero) heroSettings = dbHero;
      if (dbPillars) pillarsSettings = dbPillars;
      if (dbLeadership) leadershipSettings = dbLeadership;
      if (dbGlobalNetwork) globalNetworkSettings = dbGlobalNetwork;
      if (dbHighlights) highlightsSettings = dbHighlights;
      if (dbFatwa) fatwaSettings = dbFatwa;
      if (dbEducation) educationSettings = dbEducation;
      if (dbGetInvolved) getInvolvedSettings = dbGetInvolved;
      if (dbMushawara) mushawaraSettings = dbMushawara;
      if (dbFooter) footerSettings = dbFooter;
    } catch (e) {
      console.warn("D1 loader merge warning:", e);
    }
  }

  return json({
    articles,
    videos,
    podcasts,
    programs,
    contactMessages,
    spotlightSettings,
    platformSettings,
    profileSettings,
    homepageSettings,
    aboutSettings,
    contactSettings,
    socialPlatformSettings,
    podcastPlatformSettings,
    podcastShowsSettings,
    authorsSettings: authorsSettings || { authors: [] },
    headerSettings,
    heroSettings,
    pillarsSettings,
    leadershipSettings,
    globalNetworkSettings,
    highlightsSettings,
    fatwaSettings,
    educationSettings,
    getInvolvedSettings,
    mushawaraSettings,
    footerSettings
  });
};

export const action = async ({ request, context }: any) => {
  const env = context?.cloudflare?.env || context?.env || (typeof process !== 'undefined' ? process.env : {});
  const { getSession, destroySession } = getSessionStorage(env);
  const session = await getSession(request.headers.get("Cookie"));
  if (!session.has("adminAuthenticated")) {
    throw redirect("/admin/login");
  }

  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "logout") {
    return redirect("/admin/login", {
      headers: { "Set-Cookie": await destroySession(session) },
    });
  }

  if (intent === "deploy") {
    const hook = env?.CLOUDFLARE_DEPLOY_HOOK || process.env?.CLOUDFLARE_DEPLOY_HOOK;
    if (!hook) return json({ error: "Deploy hook missing" }, { status: 500 });
    await fetch(hook, { method: "POST" });
    return json({ success: true, message: "Production deployment triggered successfully!" });
  }

  const githubToken = env?.GITHUB_TOKEN || "";
  const owner = "samasthagraph";
  const repo = "cloudflare";

  try {
    // Generic settings saver helper
    const handleSettingSave = async (key: string, formField: string, filename: string, titleLabel: string) => {
      const dataStr = formData.get(formField) as string;
      const parsedData = JSON.parse(dataStr);
      const jsonContent = JSON.stringify(parsedData, null, 2);

      if (env?.DB) {
        await saveDbSetting(env.DB, key, parsedData);
      }

      await commitToGitHub({
        token: githubToken,
        owner,
        repo,
        path: `app/content/settings/${filename}`,
        content: jsonContent,
        message: `update ${key} settings`
      });

      return json({ success: true, intent, message: `${titleLabel} saved successfully!` });
    };

    if (intent === "saveHeader") return await handleSettingSave("header", "headerData", "header.json", "Header settings");
    if (intent === "saveHero") return await handleSettingSave("hero", "heroData", "hero.json", "Hero settings");
    if (intent === "savePillars") return await handleSettingSave("pillars", "pillarsData", "pillars.json", "Core Pillars");
    if (intent === "saveLeadership") return await handleSettingSave("leadership", "leadershipData", "leadership.json", "Leadership settings");
    if (intent === "saveGlobalNetwork") return await handleSettingSave("global-network", "globalNetworkData", "global-network.json", "Global Network settings");
    if (intent === "saveHighlights") return await handleSettingSave("highlights", "highlightsData", "highlights.json", "Key Highlights");
    if (intent === "saveFatwa") return await handleSettingSave("fatwa", "fatwaData", "fatwa.json", "Ideology & Fatwa settings");
    if (intent === "saveEducation") return await handleSettingSave("education", "educationData", "education.json", "Education settings");
    if (intent === "saveGetInvolved") return await handleSettingSave("get-involved", "getInvolvedData", "get-involved.json", "WhatsApp & Community settings");
    if (intent === "saveMushawara") return await handleSettingSave("mushawara", "mushawaraData", "mushawara.json", "Mushawara Council members");
    if (intent === "saveFooter") return await handleSettingSave("footer", "footerData", "footer.json", "Footer settings");
    if (intent === "saveHomepage") return await handleSettingSave("homepage", "homepageData", "homepage.json", "Homepage settings");
    if (intent === "saveAbout") return await handleSettingSave("about", "aboutData", "about.json", "About Us settings");
    if (intent === "saveContact") return await handleSettingSave("contact", "contactData", "contact.json", "Contact Us settings");
    if (intent === "saveSocialPlatforms") return await handleSettingSave("social-platforms", "socialPlatformData", "social-platforms.json", "Social Platforms");
    if (intent === "savePodcastPlatforms") return await handleSettingSave("podcast-platforms", "podcastPlatformData", "podcast-platforms.json", "Podcast Platforms");
    if (intent === "savePodcastShows") return await handleSettingSave("podcast-shows", "podcastShowsData", "podcast-shows.json", "Podcast Shows & RSS");

    if (intent === "updateMessageStatus") {
      const msgId = formData.get("messageId") as string;
      const newStatus = formData.get("newStatus") as string;
      if (env?.DB) {
        await updateDbContactMessageStatus(env.DB, msgId, newStatus);
      }
      return json({ success: true, message: `Message marked as ${newStatus}!` });
    }

    if (intent === "deleteMessage") {
      const msgId = formData.get("messageId") as string;
      if (env?.DB) {
        await deleteDbContactMessage(env.DB, msgId);
      }
      return json({ success: true, message: "Message deleted successfully!" });
    }

    if (intent === "saveAuthors") {
      const dataStr = formData.get("authorsData") as string;
      const parsedData = JSON.parse(dataStr);
      const jsonContent = JSON.stringify(parsedData, null, 2);

      if (env?.DB) {
        try {
          await saveDbAuthors(env.DB, parsedData.authors || []);
        } catch (dbErr) {
          console.error("D1 saveDbAuthors error:", dbErr);
        }
      }

      await commitToGitHub({
        token: githubToken,
        owner,
        repo,
        path: "app/content/settings/authors.json",
        content: jsonContent,
        message: "update authors list"
      });
      return json({ success: true, intent: "saveAuthors", message: "Authors saved successfully!" });
    }

    if (intent === "saveProfile") {
      const profileDataStr = formData.get("profileData") as string;
      const parsedData = JSON.parse(profileDataStr);
      const contentStr = JSON.stringify(parsedData, null, 2);

      if (env?.DB) {
        await saveDbSetting(env.DB, "profile", parsedData);
      }

      await commitToGitHub({
        token: githubToken,
        owner,
        repo,
        path: `app/content/settings/profile.json`,
        content: contentStr,
        message: `config: update profile settings`
      });
      return json({ success: true, intent: "saveProfile", message: "Profile settings updated successfully!" });
    }

    if (intent === "saveSpotlight") {
      const heroType = formData.get("heroType") as string || "video";
      const referenceId = formData.get("referenceId") as string || "";
      const customBanner = formData.get("customBanner") as string || "";
      const upcomingTitle = formData.get("upcomingTitle") as string || "";
      const upcomingDate = formData.get("upcomingDate") as string || "";
      const upcomingDescription = formData.get("upcomingDescription") as string || "";

      const spotlightData: any = { heroType, customBanner };
      if (heroType === "upcoming") {
        spotlightData.referenceId = "";
        spotlightData.upcomingTitle = upcomingTitle;
        spotlightData.upcomingDate = upcomingDate;
        spotlightData.upcomingDescription = upcomingDescription;
      } else {
        spotlightData.referenceId = referenceId;
      }

      if (env?.DB) {
        await saveDbSetting(env.DB, "spotlight", spotlightData);
      }

      await commitToGitHub({
        token: githubToken, owner, repo,
        path: "app/content/settings/spotlight.json",
        content: JSON.stringify(spotlightData, null, 2),
        message: "config: update spotlight settings"
      });
      return json({ success: true, intent: "saveSpotlight", message: "Spotlight settings saved successfully!" });
    }

    if (intent === "delete") {
      const path = formData.get("path") as string;
      const directItemType = formData.get("itemType") as string;
      const directSlug = formData.get("slug") as string;
      const itemType = directItemType || (path?.includes('/articles/') ? 'article' : path?.includes('/videos/') ? 'video' : 'podcast');
      const slug = directSlug || path?.split('/').pop()?.replace('.mdx', '')?.replace('.json', '');

      if (env?.DB && slug) {
        try {
          if (itemType === "article") await deleteDbArticle(env.DB, slug);
          else if (itemType === "video") await deleteDbVideo(env.DB, slug);
          else if (itemType === "podcast") await deleteDbPodcast(env.DB, slug);
        } catch (e) {
          console.warn("D1 delete warning:", e);
        }
      }

      if (path) {
        await commitToGitHub({ token: githubToken, owner, repo, path, actionType: "DELETE", message: `delete: ${path}` });
      }

      return json({ success: true, intent: "delete", itemType, slug, message: "Deleted successfully!" });
    }

    if (intent === "move") {
      const slug = formData.get("slug") as string;
      const contentStr = formData.get("contentStr") as string;
      const type = formData.get("type") as string;
      const extension = type === "article" ? ".mdx" : ".json";
      const folder = type === "article" ? "articles" : "videos";
      await commitToGitHub({ token: githubToken, owner, repo, path: `app/content/${folder}/${slug}${extension}`, content: contentStr, message: `update date for ${slug}` });
      return json({ success: true, message: "Date moved successfully!" });
    }

    if (intent === "saveArticle") {
      const originalSlug = formData.get("originalSlug") as string;
      const newSlug = formData.get("newSlug") as string;
      const title = formData.get("title") as string;
      const advancedTitle = formData.get("advancedTitle") as string;
      const excerpt = formData.get("excerpt") as string;
      const coverImage = formData.get("coverImage") as string;
      const thumbImage = formData.get("thumbImage") as string;
      const category = formData.get("category") as string;
      const author = formData.get("author") as string;
      const seoTitle = formData.get("seoTitle") as string;
      const seoDescription = formData.get("seoDescription") as string;
      const themePreset = formData.get("themePreset") as string || "theme-malayalam-standard";
      const status = formData.get("status") as string || "draft";
      const body = formData.get("body") as string;
      const date = formData.get("publishedAt") as string || new Date().toISOString().split('T')[0];

      if (!validateImageUrl(coverImage)) return json({ error: "Invalid cover image URL." }, { status: 400 });

      const finalSlug = newSlug || originalSlug || title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
      const language = formData.get("language") as string || "ml";
      const originalLanguage = formData.get("originalLanguage") as string;
      const translationGroupId = formData.get("translationGroupId") as string;
      const isNewRecord = !originalSlug;
      const shouldSaveLanguage = isNewRecord || language !== "ml" || originalLanguage !== "";

      const articleData = { slug: finalSlug, title, advancedTitle: advancedTitle || title, excerpt, coverImage, thumbImage, category: category || 'News', author: author || 'admin', seoTitle, seoDescription, themePreset, status, body, publishedAt: date, type: 'article', translationGroupId };

      if (env?.DB) {
        try {
          await saveDbArticle(env.DB, articleData);
        } catch (dbErr) {
          console.error("D1 saveDbArticle error:", dbErr);
        }
      }

      const contentStr = `---
title: ${JSON.stringify(title)}
advancedTitle: ${JSON.stringify(advancedTitle || title)}
themePreset: ${JSON.stringify(themePreset)}
publishedAt: ${JSON.stringify(date)}
coverImage: ${JSON.stringify(coverImage || '')}
thumbImage: ${JSON.stringify(thumbImage || '')}
category: ${JSON.stringify(category || 'News')}
author: ${JSON.stringify(author || 'admin')}
seoTitle: ${JSON.stringify(seoTitle || '')}
seoDescription: ${JSON.stringify(seoDescription || '')}
excerpt: ${JSON.stringify(excerpt)}
status: ${JSON.stringify(status)}${shouldSaveLanguage ? `\nlanguage: ${JSON.stringify(language)}` : ''}${translationGroupId ? `\ntranslationGroupId: ${JSON.stringify(translationGroupId)}` : ''}
---

${body}`;

      await handleSlugRenameSequence({
        githubToken,
        owner,
        repo,
        folderPath: "app/content/articles",
        extension: ".mdx",
        originalSlug,
        finalSlug,
        contentStr,
        message: `content: save article ${title}`
      });

      return json({ success: true, intent, item: articleData, message: `Article "${title}" saved successfully!` });
    }

    if (intent === "saveVideo") {
      const originalSlug = formData.get("originalSlug") as string;
      const newSlug = formData.get("newSlug") as string;
      const title = formData.get("title") as string;
      const advancedTitle = formData.get("advancedTitle") as string;
      const youtubeId = formData.get("youtubeId") as string;
      const customThumbnail = formData.get("customThumbnail") as string;
      const category = formData.get("category") as string;
      const author = formData.get("author") as string;
      const status = formData.get("status") as string || "draft";
      const body = formData.get("body") as string;
      const date = formData.get("publishedAt") as string || new Date().toISOString().split('T')[0];
      const themePreset = formData.get("themePreset") as string || "theme-malayalam-standard";

      const finalSlug = newSlug || originalSlug || title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
      const language = formData.get("language") as string || "ml";
      const originalLanguage = formData.get("originalLanguage") as string;
      const translationGroupId = formData.get("translationGroupId") as string;
      const isNewRecord = !originalSlug;
      const shouldSaveLanguage = isNewRecord || language !== "ml" || originalLanguage !== "";

      const videoData: any = {
        title,
        advancedTitle: advancedTitle || title,
        youtubeId,
        customThumbnail: customThumbnail || '',
        category: category || 'General',
        author: author || 'admin',
        themePreset,
        status,
        publishedAt: date,
        body
      };

      if (shouldSaveLanguage) videoData.language = language;
      if (translationGroupId) videoData.translationGroupId = translationGroupId;

      const programId = formData.get("programId") as string;
      const episodeNumberRaw = formData.get("episodeNumber") as string;
      const episodeNumberVal = episodeNumberRaw ? parseInt(episodeNumberRaw, 10) : null;

      if (programId) videoData.programId = programId;
      if (episodeNumberVal && !isNaN(episodeNumberVal)) videoData.episodeNumber = episodeNumberVal;

      if (env?.DB) {
        try {
          await saveDbVideo(env.DB, { slug: finalSlug, ...videoData });
        } catch (dbErr) {
          console.error("D1 saveDbVideo error:", dbErr);
        }
      }

      const contentStr = JSON.stringify(videoData, null, 2);

      await handleSlugRenameSequence({
        githubToken,
        owner,
        repo,
        folderPath: "app/content/videos",
        extension: ".json",
        originalSlug,
        finalSlug,
        contentStr,
        message: `content: save video ${title}`
      });

      return json({ success: true, intent, item: { slug: finalSlug, type: 'video', ...videoData }, message: `Video "${title}" saved successfully!` });
    }

    if (intent === "savePodcast") {
      const originalSlug = formData.get("originalSlug") as string;
      const newSlug = formData.get("newSlug") as string;
      const title = formData.get("title") as string;
      const audioUrl = formData.get("audioUrl") as string;
      const customThumbnail = formData.get("customThumbnail") as string;
      const category = formData.get("category") as string;
      const series = formData.get("series") as string;
      const episodeNumber = formData.get("episodeNumber") ? parseInt(formData.get("episodeNumber") as string) : 0;
      const duration = formData.get("duration") as string;
      const status = formData.get("status") as string || "draft";
      const body = formData.get("body") as string;
      const date = formData.get("publishedAt") as string || new Date().toISOString().split('T')[0];

      const finalSlug = newSlug || originalSlug || title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
      const language = formData.get("language") as string || "ml";
      const originalLanguage = formData.get("originalLanguage") as string;
      const translationGroupId = formData.get("translationGroupId") as string;
      const isNewRecord = !originalSlug;
      const shouldSaveLanguage = isNewRecord || language !== "ml" || originalLanguage !== "";

      const podcastData: any = {
        title,
        audioUrl,
        customThumbnail: customThumbnail || '',
        category: category || 'General',
        series: series || '',
        episodeNumber,
        duration: duration || '00:00',
        status,
        publishedAt: date,
        description: body
      };

      if (shouldSaveLanguage) podcastData.language = language;
      if (translationGroupId) podcastData.translationGroupId = translationGroupId;

      if (env?.DB) {
        try {
          await saveDbPodcast(env.DB, { slug: finalSlug, ...podcastData });
        } catch (dbErr) {
          console.error("D1 saveDbPodcast error:", dbErr);
        }
      }

      const contentStr = JSON.stringify(podcastData, null, 2);

      await handleSlugRenameSequence({
        githubToken,
        owner,
        repo,
        folderPath: "app/content/podcasts",
        extension: ".json",
        originalSlug,
        finalSlug,
        contentStr,
        message: `content: save podcast ${title}`
      });

      return json({ success: true, intent, item: { slug: finalSlug, type: 'podcast', ...podcastData }, message: `Podcast "${title}" saved successfully!` });
    }

    if (intent === "saveProgram") {
      const originalSlug = formData.get("originalSlug") as string;
      const newSlug = formData.get("newSlug") as string;
      const title = formData.get("title") as string;
      const description = formData.get("description") as string;
      const coverImage = formData.get("coverImage") as string;
      const category = formData.get("category") as string;
      let rawPlaylistId = formData.get("youtubePlaylistId") as string || "";
      rawPlaylistId = rawPlaylistId.trim();
      let normalizedPlaylistId = rawPlaylistId;
      if (rawPlaylistId) {
        if (rawPlaylistId.includes("youtube.com") || rawPlaylistId.includes("youtu.be")) {
          const match = rawPlaylistId.match(/[?&]list=([a-zA-Z0-9_-]+)/);
          if (match && match[1]) {
            normalizedPlaylistId = match[1];
          }
        }
      }

      const youtubeThumbnail = formData.get("youtubeThumbnail") as string;
      const status = formData.get("status") as string || "draft";
      const date = formData.get("publishedAt") as string || new Date().toISOString().split('T')[0];
      const language = formData.get("language") as string || "ml";
      const finalSlug = sanitizeSlug(newSlug, title);

      const programData: any = {
        title,
        description: description || '',
        coverImage: coverImage || '',
        category: category || 'General',
        youtubePlaylistId: normalizedPlaylistId,
        status,
        publishedAt: date,
      };
      if (youtubeThumbnail) programData.youtubeThumbnail = youtubeThumbnail;
      programData.language = language;

      if (env?.DB) {
        try {
          await saveDbProgram(env.DB, { slug: finalSlug, ...programData });
        } catch (dbErr) {
          console.error("D1 saveDbProgram error:", dbErr);
        }
      }

      const contentStr = JSON.stringify(programData, null, 2);

      await handleSlugRenameSequence({
        githubToken, owner, repo,
        folderPath: "app/content/programs",
        extension: ".json",
        originalSlug,
        finalSlug,
        contentStr,
        message: `content: save program ${title}`
      });

      return json({ success: true, intent, item: { slug: finalSlug, type: 'program', ...programData }, message: `Program "${title}" saved successfully!` });
    }

    if (intent === "deleteProgram") {
      const slugToDelete = formData.get("slug") as string;
      if (env?.DB) {
        try {
          await deleteDbProgram(env.DB, slugToDelete);
        } catch (dbErr) {
          console.error("D1 deleteDbProgram error:", dbErr);
        }
      }

      await commitToGitHub({
        token: githubToken, owner, repo,
        path: `app/content/programs/${slugToDelete}.json`,
        actionType: "DELETE",
        message: `delete: program ${slugToDelete}`
      });
      return json({ success: true, intent: "deleteProgram", slug: slugToDelete, message: "Program deleted successfully!" });
    }

    return json({ error: "Unsupported action" }, { status: 400 });
  } catch (error: any) {
    console.error("Action error:", error);
    return json({ error: error.message || "Failed to process request" }, { status: 500 });
  }
};

export default function AdminDashboard() {
  const actionData = useActionData<typeof action>() as any;
  const loaderData = useLoaderData<typeof loader>();

  const [articles, setArticles] = useState(loaderData.articles || []);
  const [videos, setVideos] = useState(loaderData.videos || []);
  const [podcasts, setPodcasts] = useState(loaderData.podcasts || []);
  const [programs, setPrograms] = useState((loaderData.programs || []) as any[]);
  const [spotlightSettings] = useState(loaderData.spotlightSettings as any);
  const [editingProgram, setEditingProgram] = useState<any>(null);
  const [programPlaylistInput, setProgramPlaylistInput] = useState("");
  const [programThumbnailPreview, setProgramThumbnailPreview] = useState("");
  const [spotlightHeroType, setSpotlightHeroType] = useState<string>(spotlightSettings?.heroType || 'video');

  const {
    contactMessages,
    platformSettings,
    profileSettings,
    homepageSettings,
    aboutSettings,
    contactSettings,
    socialPlatformSettings,
    podcastPlatformSettings,
    podcastShowsSettings,
    authorsSettings,
    headerSettings,
    heroSettings,
    pillarsSettings,
    leadershipSettings,
    globalNetworkSettings,
    highlightsSettings,
    fatwaSettings,
    educationSettings,
    getInvolvedSettings,
    mushawaraSettings,
    footerSettings
  } = loaderData;

  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get("tab") || searchParams.get("view");

  const [view, setViewState] = useState<string>(() => {
    if (urlTab) return urlTab;
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("admin_active_tab");
        if (saved) return saved;
      } catch (e) {}
    }
    return "overview";
  });

  const setView = (newView: string) => {
    setViewState(newView);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (newView === "overview") {
        next.delete("tab");
        next.delete("view");
      } else {
        next.set("tab", newView);
        next.delete("view");
      }
      return next;
    }, { replace: true });
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("admin_active_tab", newView);
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (urlTab && urlTab !== view) {
      setViewState(urlTab);
    }
  }, [urlTab]);

  useEffect(() => {
    if (loaderData?.articles) setArticles(loaderData.articles);
    if (loaderData?.videos) setVideos(loaderData.videos);
    if (loaderData?.podcasts) setPodcasts(loaderData.podcasts);
    if (loaderData?.programs) setPrograms(loaderData.programs);
  }, [loaderData]);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [langFilter, setLangFilter] = useState<"all" | "ml" | "en">("all");
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  // Editor states
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editorContent, setEditorContent] = useState("");
  const [youtubePreviewId, setYoutubePreviewId] = useState("");
  const [youtubeInput, setYoutubeInput] = useState("");

  const navigation = useNavigation();
  const submit = useSubmit();
  const isDeploying = navigation.state === "submitting" && navigation.formData?.get("intent") === "deploy";
  const isSubmitting = navigation.state === "submitting" && !isDeploying;

  const handleDeploy = () => {
    submit({ intent: "deploy" }, { method: "post" });
  };

  const handleDelete = (slug: string, type: 'article' | 'video' | 'podcast') => {
    if (window.confirm(`Are you sure you want to completely delete this ${type}? This cannot be undone.`)) {
      const ext = type === 'article' ? '.mdx' : '.json';
      const folder = type === 'article' ? 'articles' : type === 'video' ? 'videos' : 'podcasts';
      submit({ intent: "delete", path: `app/content/${folder}/${slug}${ext}`, itemType: type, slug }, { method: "post" });
    }
  };

  const openArticleEditor = (article?: any) => {
    if (article) {
      setEditingItem(article);
      setEditorContent(article.body || "");
      setView("editArticle");
    } else {
      setEditingItem(null);
      setEditorContent("");
      setView("newArticle");
    }
    setIsMobileMenuOpen(false);
  };

  const openVideoEditor = (video?: any) => {
    if (video) {
      setEditingItem(video);
      setEditorContent(video.body || "");
      setYoutubeInput(video.youtubeId ? `https://youtube.com/watch?v=${video.youtubeId}` : "");
      setYoutubePreviewId(video.youtubeId || "");
      setView("editVideo");
    } else {
      setEditingItem({ status: 'draft', category: 'General', author: 'admin' });
      setEditorContent("");
      setYoutubeInput("");
      setYoutubePreviewId("");
      setView("newVideo");
    }
    setIsMobileMenuOpen(false);
  };

  const openPodcastEditor = (podcast?: any) => {
    if (podcast) {
      setEditingItem(podcast);
      setEditorContent(podcast.description || "");
      setView("editPodcast");
    } else {
      setEditingItem({ status: 'draft', category: 'General', series: '' });
      setEditorContent("");
      setView("newPodcast");
    }
    setIsMobileMenuOpen(false);
  };

  const openProgramEditor = (program?: any) => {
    if (program) {
      setEditingProgram(program);
      const playlistUrl = program.youtubePlaylistId ? `https://youtube.com/playlist?list=${program.youtubePlaylistId}` : "";
      setProgramPlaylistInput(playlistUrl);
      setProgramThumbnailPreview(program.youtubeThumbnail || "");
      setView("editProgram");
    } else {
      setEditingProgram(null);
      setProgramPlaylistInput("");
      setProgramThumbnailPreview("");
      setView("newProgram");
    }
    setIsMobileMenuOpen(false);
  };

  useEffect(() => {
    if (youtubeInput) {
      const match = youtubeInput.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\n]+)/);
      if (match && match[1]) {
        setYoutubePreviewId(match[1]);
      } else {
        setYoutubePreviewId(youtubeInput);
      }
    } else {
      setYoutubePreviewId("");
    }
  }, [youtubeInput]);

  const activeList = view === "articles" ? articles : (view === "videos" ? videos : view === "podcasts" ? podcasts : []);
  const filteredList = activeList.filter((a: any) => {
    const searchMatch = a.title?.toLowerCase().includes(searchQuery.toLowerCase()) || a.slug?.toLowerCase().includes(searchQuery.toLowerCase());
    const lang = a.language || "ml";
    if (langFilter === "all") return searchMatch;
    if (langFilter === "ml") return searchMatch && lang === "ml";
    if (langFilter === "en") return searchMatch && lang === "en";
    return searchMatch;
  });
  const paginatedList = filteredList.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalPages = Math.ceil(filteredList.length / itemsPerPage);

  const StatusBadge = ({ status }: { status: string }) => {
    if (status === 'draft') return <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-yellow-100 text-yellow-800">Draft</span>;
    if (status === 'scheduled') return <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-purple-100 text-purple-800">Scheduled</span>;
    return <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-green-100 text-green-800">Published</span>;
  };

  // Nav Items definition for Sidebar
  const navItems = [
    { id: "overview", label: "Dashboard", icon: LayoutDashboard },
    { id: "contact-messages", label: "Contact Messages", icon: Mail, badge: contactMessages.filter((m: any) => m.status === 'unread').length || undefined },
    { id: "settings-header", label: "Header", icon: Compass },
    { id: "settings-hero", label: "Hero Settings", icon: Sliders },
    { id: "settings-pillars", label: "Core Pillars", icon: Layers },
    { id: "settings-leadership", label: "Leadership", icon: Award },
    { id: "settings-global-network", label: "Global Network", icon: Globe },
    { id: "settings-highlights", label: "Key Highlights", icon: Activity },
    { id: "articles", label: "News & Updates", icon: FileText },
    { id: "settings-about", label: "About Settings", icon: Sparkles },
    { id: "settings-fatwa", label: "Ideology & Fatwa", icon: BookOpenCheck },
    { id: "settings-education", label: "Education Settings", icon: GraduationCap },
    { id: "settings-social-platforms", label: "Network Settings", icon: Globe },
    { id: "authors", label: "Publications & Authors", icon: User },
    { id: "settings-get-involved", label: "Get Involved Settings", icon: MessageSquare },
    { id: "settings-mushawara", label: "Mushawara Members", icon: Users },
    { id: "settings-contact", label: "Contact Settings", icon: Mail },
    { id: "settings-footer", label: "Footer", icon: LayoutTemplate },
    { id: "videos", label: "Videos & Series", icon: Video },
    { id: "podcasts", label: "Podcasts & Feeds", icon: Mic },
    { id: "profile", label: "Bio / Hub Profile", icon: User },
    { id: "homepage", label: "Featured Overrides", icon: LayoutDashboard }
  ];

  // Dashboard content cards for the grid
  const dashboardCards = [
    { id: "contact-messages", title: "Contact Messages Inbox", desc: "Read, reply to, and manage contact form submission enquiries", icon: Mail },
    { id: "settings-get-involved", title: "WhatsApp Group Settings", desc: "Manage WhatsApp group invite link, title, button text, and details", icon: MessageSquare },
    { id: "settings-header", title: "Header", desc: "Brand labels, logo, and navigation links", icon: Compass },
    { id: "settings-hero", title: "Hero Settings", desc: "Hero titles, CTA buttons, background, and highlights", icon: Sliders },
    { id: "settings-about", title: "About Page Settings", desc: "Overview, constitution, history and timeline", icon: Sparkles },
    { id: "settings-pillars", title: "Core Pillars", desc: "Organisation focus areas, knowledge & community pillars", icon: Layers },
    { id: "settings-leadership", title: "Leadership", desc: "Prominent leaders, photo portraits, and their roles", icon: Award },
    { id: "settings-global-network", title: "Global Network", desc: "Global map image and worldwide diaspora chapters", icon: Globe },
    { id: "settings-highlights", title: "Key Highlights", desc: "Stats and metrics counters (Madrasas, students, teachers)", icon: Activity },
    { id: "articles", title: "News & Updates", desc: "Articles, editorial posts, and official announcements", icon: FileText },
    { id: "settings-fatwa", title: "Fatwa Page Settings", desc: "Banner, ideological stance, and recent fatwas", icon: BookOpenCheck },
    { id: "settings-contact", title: "Contact Page Settings", desc: "Address, phone, email, map URL, working hours, and notes", icon: Mail },
    { id: "settings-footer", title: "Footer", desc: "Brand details, social links, contact, and quick links", icon: LayoutTemplate },
    { id: "authors", title: "Authors & Scholars", desc: "Scholars, writers, biographic details, and avatars", icon: User },
    { id: "settings-education", title: "Education Ecosystem", desc: "Institutions, universities, syllabus, and board facts", icon: GraduationCap },
    { id: "settings-mushawara", title: "Mushawara Council", desc: "Supreme 40-member decision-making council members", icon: Users },
    { id: "videos", title: "Videos & Series", desc: "YouTube playlist sync, programs, and video library", icon: Video },
    { id: "podcasts", title: "Podcasts & Audio Shows", desc: "Episodes, Spotify/Apple feeds, and waveform audio", icon: Mic }
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex text-[#1F2937] font-sans antialiased">
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#230715] text-[#F3E8EE] flex-shrink-0 flex flex-col justify-between hidden md:flex border-r border-[#380E23]">
        <div className="flex flex-col flex-1 min-h-0">
          {/* Logo Brand Header */}
          <div className="p-5 flex items-center gap-3 border-b border-white/5 cursor-pointer" onClick={() => setView("overview")}>
            <div className="w-10 h-10 rounded-full bg-[#E5A93C] text-[#230715] font-black text-xl flex items-center justify-center shadow-md">
              S
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base text-white tracking-wide leading-tight">Samastha CMS</span>
              <span className="text-[10px] font-semibold tracking-widest text-[#E5A93C]/80 uppercase">ADMINISTRATOR</span>
            </div>
          </div>

          {/* Nav List */}
          <div className="p-3 space-y-1 overflow-y-auto flex-1 custom-scrollbar">
            <div className="px-3 pt-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-white/40">
              CONTENT
            </div>

            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = view === item.id || (item.id === "articles" && view.includes("Article")) || (item.id === "videos" && (view.includes("Video") || view.includes("Program"))) || (item.id === "podcasts" && view.includes("Podcast"));
              return (
                <button
                  key={item.id}
                  onClick={() => setView(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? "bg-[#431326] text-white shadow-sm"
                      : "text-[#D9C2CE] hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <Icon size={16} className={isActive ? "text-[#E5A93C]" : "text-[#B3889D]"} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {isActive && (
                    <div className="w-1.5 h-1.5 rounded-full bg-[#E5A93C] shadow-sm ml-2 flex-shrink-0" />
                  )}
                  {!isActive && item.badge && (
                    <span className="px-1.5 py-0.5 bg-[#861937] text-white text-[10px] rounded-full font-bold ml-2">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/5 space-y-2 bg-[#1A0510]">
          <a
            href="https://fiqhfiles.samasthagraph.com/admin"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-[#D9C2CE] hover:text-white hover:bg-white/5 transition-colors"
          >
            <span className="flex items-center gap-2"><ExternalLink size={14} /> Fiqh Files CMS</span>
            <span className="text-[10px] text-[#E5A93C]">↗</span>
          </a>
          <Form method="post">
            <input type="hidden" name="intent" value="logout" />
            <button
              type="submit"
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-rose-300 hover:text-white hover:bg-rose-900/30 transition-colors"
            >
              <LogOut size={14} /> Log Out
            </button>
          </Form>
        </div>
      </aside>

      {/* MAIN CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* TOP BAR */}
        <header className="h-16 bg-white border-b border-gray-200 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-gray-500">
              <span className="cursor-pointer hover:text-gray-900" onClick={() => setView("overview")}>CONTROL PANEL</span>
              <span>•</span>
              <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] tracking-wider">CONNECTED</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              target="_blank"
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Eye size={14} /> View Site
            </Link>

            <button
              onClick={handleDeploy}
              disabled={isDeploying || isSubmitting}
              className="flex items-center gap-2 bg-[#E5A93C] hover:bg-[#D0962C] text-[#230715] px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs disabled:opacity-50"
            >
              <RefreshCw size={14} className={isDeploying ? "animate-spin" : ""} />
              <span>{isDeploying ? "Deploying..." : "Deploy to Cloudflare"}</span>
            </button>
          </div>
        </header>

        {/* MOBILE DRAWER */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-black/60 flex">
            <div className="w-72 bg-[#230715] text-[#F3E8EE] flex flex-col justify-between p-4 h-full">
              <div className="space-y-4 overflow-y-auto">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <span className="font-bold text-white">Samastha CMS</span>
                  <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
                </div>
                <div className="space-y-1">
                  {navItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => { setView(item.id); setIsMobileMenuOpen(false); }}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-3 ${
                        view === item.id ? "bg-[#431326] text-white" : "text-[#D9C2CE] hover:bg-white/5"
                      }`}
                    >
                      <item.icon size={16} /> {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex-1" onClick={() => setIsMobileMenuOpen(false)} />
          </div>
        )}

        {/* PAGE CONTENT */}
        <main className="flex-1 p-6 sm:p-8 lg:p-10 max-w-7xl w-full mx-auto">
          {actionData?.success && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 mb-6 rounded-xl flex items-center gap-3 shadow-xs">
              <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
              <p className="text-sm font-semibold">{actionData.message}</p>
            </div>
          )}
          {actionData?.error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 mb-6 rounded-xl shadow-xs">
              <p className="text-sm font-semibold">{actionData.error}</p>
            </div>
          )}

          {/* DASHBOARD VIEW (Reference Image Style) */}
          {view === "overview" && (
            <div className="space-y-8 animate-[fade-in_0.2s_ease-out]">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 font-heading">Dashboard</h1>
                <p className="text-xs text-gray-500 mt-1">Manage your website content. Select a section below to get started.</p>
              </div>

              {/* 3 Top Summary Boxes */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs">
                  <div className="text-3xl font-extrabold text-[#781B38] font-heading">18</div>
                  <div className="text-sm font-bold text-gray-800 mt-1">Content Sections</div>
                  <div className="text-xs text-gray-400 mt-0.5">managed via CMS</div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs">
                  <div className="text-3xl font-extrabold text-[#781B38] font-heading">12</div>
                  <div className="text-sm font-bold text-gray-800 mt-1">Singletons</div>
                  <div className="text-xs text-gray-400 mt-0.5">single-instance configs</div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs">
                  <div className="text-3xl font-extrabold text-[#781B38] font-heading">6</div>
                  <div className="text-sm font-bold text-gray-800 mt-1">Collections</div>
                  <div className="text-xs text-gray-400 mt-0.5">multi-entry resources</div>
                </div>
              </div>

              {/* Content Sections Grid */}
              <div className="space-y-4">
                <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  CONTENT SECTIONS
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {dashboardCards.map(card => {
                    const CardIcon = card.icon;
                    return (
                      <div
                        key={card.id}
                        onClick={() => setView(card.id)}
                        className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs hover:border-[#781B38]/50 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex gap-4 items-start group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-[#FDF2F4] text-[#781B38] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                          <CardIcon size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 font-bold text-sm text-gray-900 group-hover:text-[#781B38] transition-colors">
                            <span>{card.title}</span>
                            <span className="text-gray-400 group-hover:translate-x-0.5 transition-transform text-xs">→</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2">
                            {card.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* CONTACT MESSAGES INBOX */}
          {view === "contact-messages" && (
            <ContactMessagesAdmin messages={contactMessages} />
          )}

          {/* HEADER SETTINGS */}
          {view === "settings-header" && (
            <Form method="post">
              <input type="hidden" name="intent" value="saveHeader" />
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 font-heading">Header &amp; Navigation</h1>
                  <p className="text-xs text-gray-500 mt-1">Configure brand identity and navigation menu links.</p>
                </div>
                <button type="submit" disabled={isSubmitting} className="bg-[#781B38] hover:bg-[#5E152C] text-white px-5 py-2 rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-2 disabled:opacity-50">
                  <Send size={14} /> {isSubmitting ? "Saving..." : "Save Header"}
                </button>
              </div>
              <HeaderAdmin headerSettings={headerSettings} />
            </Form>
          )}

          {/* HERO SETTINGS */}
          {view === "settings-hero" && (
            <Form method="post">
              <input type="hidden" name="intent" value="saveHero" />
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 font-heading">Hero &amp; Banner Settings</h1>
                  <p className="text-xs text-gray-500 mt-1">Manage main headline, description, and call to action.</p>
                </div>
                <button type="submit" disabled={isSubmitting} className="bg-[#781B38] hover:bg-[#5E152C] text-white px-5 py-2 rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-2 disabled:opacity-50">
                  <Send size={14} /> {isSubmitting ? "Saving..." : "Save Hero"}
                </button>
              </div>
              <HeroAdmin heroSettings={heroSettings} videos={videos} articles={articles} />
            </Form>
          )}

          {/* CORE PILLARS */}
          {view === "settings-pillars" && (
            <Form method="post">
              <input type="hidden" name="intent" value="savePillars" />
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 font-heading">Core Pillars</h1>
                  <p className="text-xs text-gray-500 mt-1">Manage organization focus areas and foundational values.</p>
                </div>
                <button type="submit" disabled={isSubmitting} className="bg-[#781B38] hover:bg-[#5E152C] text-white px-5 py-2 rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-2 disabled:opacity-50">
                  <Send size={14} /> {isSubmitting ? "Saving..." : "Save Pillars"}
                </button>
              </div>
              <PillarsAdmin pillarsSettings={pillarsSettings} />
            </Form>
          )}

          {/* LEADERSHIP */}
          {view === "settings-leadership" && (
            <Form method="post">
              <input type="hidden" name="intent" value="saveLeadership" />
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 font-heading">Leadership &amp; Scholars</h1>
                  <p className="text-xs text-gray-500 mt-1">Manage prominent scholars, roles, and portraits.</p>
                </div>
                <button type="submit" disabled={isSubmitting} className="bg-[#781B38] hover:bg-[#5E152C] text-white px-5 py-2 rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-2 disabled:opacity-50">
                  <Send size={14} /> {isSubmitting ? "Saving..." : "Save Leadership"}
                </button>
              </div>
              <LeadershipAdmin leadershipSettings={leadershipSettings} />
            </Form>
          )}

          {/* GLOBAL NETWORK */}
          {view === "settings-global-network" && (
            <Form method="post">
              <input type="hidden" name="intent" value="saveGlobalNetwork" />
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 font-heading">Global Network</h1>
                  <p className="text-xs text-gray-500 mt-1">Manage diaspora presence, map image, and regional branches.</p>
                </div>
                <button type="submit" disabled={isSubmitting} className="bg-[#781B38] hover:bg-[#5E152C] text-white px-5 py-2 rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-2 disabled:opacity-50">
                  <Send size={14} /> {isSubmitting ? "Saving..." : "Save Global Network"}
                </button>
              </div>
              <GlobalNetworkAdmin globalNetworkSettings={globalNetworkSettings} />
            </Form>
          )}

          {/* KEY HIGHLIGHTS */}
          {view === "settings-highlights" && (
            <Form method="post">
              <input type="hidden" name="intent" value="saveHighlights" />
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 font-heading">Key Highlights</h1>
                  <p className="text-xs text-gray-500 mt-1">Manage impact statistics, counters, and labels.</p>
                </div>
                <button type="submit" disabled={isSubmitting} className="bg-[#781B38] hover:bg-[#5E152C] text-white px-5 py-2 rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-2 disabled:opacity-50">
                  <Send size={14} /> {isSubmitting ? "Saving..." : "Save Highlights"}
                </button>
              </div>
              <HighlightsAdmin highlightsSettings={highlightsSettings} />
            </Form>
          )}

          {/* IDEOLOGY & FATWA */}
          {view === "settings-fatwa" && (
            <Form method="post">
              <input type="hidden" name="intent" value="saveFatwa" />
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 font-heading">Ideology &amp; Fatwa Guidance</h1>
                  <p className="text-xs text-gray-500 mt-1">Manage theological stance, banner, and recent fatwas.</p>
                </div>
                <button type="submit" disabled={isSubmitting} className="bg-[#781B38] hover:bg-[#5E152C] text-white px-5 py-2 rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-2 disabled:opacity-50">
                  <Send size={14} /> {isSubmitting ? "Saving..." : "Save Fatwa Settings"}
                </button>
              </div>
              <FatwaAdmin fatwaSettings={fatwaSettings} />
            </Form>
          )}

          {/* EDUCATION SETTINGS */}
          {view === "settings-education" && (
            <Form method="post">
              <input type="hidden" name="intent" value="saveEducation" />
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 font-heading">Education Ecosystem</h1>
                  <p className="text-xs text-gray-500 mt-1">Manage education board facts, syllabus, and universities.</p>
                </div>
                <button type="submit" disabled={isSubmitting} className="bg-[#781B38] hover:bg-[#5E152C] text-white px-5 py-2 rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-2 disabled:opacity-50">
                  <Send size={14} /> {isSubmitting ? "Saving..." : "Save Education"}
                </button>
              </div>
              <EducationAdmin educationSettings={educationSettings} />
            </Form>
          )}

          {/* GET INVOLVED / WHATSAPP */}
          {view === "settings-get-involved" && (
            <Form method="post">
              <input type="hidden" name="intent" value="saveGetInvolved" />
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 font-heading">Get Involved &amp; WhatsApp Group</h1>
                  <p className="text-xs text-gray-500 mt-1">Manage WhatsApp group link, Telegram, and volunteer program.</p>
                </div>
                <button type="submit" disabled={isSubmitting} className="bg-[#781B38] hover:bg-[#5E152C] text-white px-5 py-2 rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-2 disabled:opacity-50">
                  <Send size={14} /> {isSubmitting ? "Saving..." : "Save Community Settings"}
                </button>
              </div>
              <GetInvolvedAdmin getInvolvedSettings={getInvolvedSettings} />
            </Form>
          )}

          {/* MUSHAWARA MEMBERS */}
          {view === "settings-mushawara" && (
            <Form method="post">
              <input type="hidden" name="intent" value="saveMushawara" />
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 font-heading">Supreme Mushawara Members</h1>
                  <p className="text-xs text-gray-500 mt-1">Manage central council scholars and representatives.</p>
                </div>
                <button type="submit" disabled={isSubmitting} className="bg-[#781B38] hover:bg-[#5E152C] text-white px-5 py-2 rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-2 disabled:opacity-50">
                  <Send size={14} /> {isSubmitting ? "Saving..." : "Save Mushawara"}
                </button>
              </div>
              <MushawaraAdmin mushawaraSettings={mushawaraSettings} />
            </Form>
          )}

          {/* FOOTER SETTINGS */}
          {view === "settings-footer" && (
            <Form method="post">
              <input type="hidden" name="intent" value="saveFooter" />
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 font-heading">Footer Settings</h1>
                  <p className="text-xs text-gray-500 mt-1">Manage copyright statement, brand note, and link columns.</p>
                </div>
                <button type="submit" disabled={isSubmitting} className="bg-[#781B38] hover:bg-[#5E152C] text-white px-5 py-2 rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-2 disabled:opacity-50">
                  <Send size={14} /> {isSubmitting ? "Saving..." : "Save Footer"}
                </button>
              </div>
              <FooterAdmin footerSettings={footerSettings} />
            </Form>
          )}

          {/* ABOUT US SETTINGS */}
          {view === "settings-about" && (
            <Form method="post">
              <input type="hidden" name="intent" value="saveAbout" />
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 font-heading">About Us Settings</h1>
                  <p className="text-xs text-gray-500 mt-1">Manage hero, history story, mission, gallery, and CTA.</p>
                </div>
                <button type="submit" disabled={isSubmitting} className="bg-[#781B38] hover:bg-[#5E152C] text-white px-5 py-2 rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-2 disabled:opacity-50">
                  <Send size={14} /> {isSubmitting ? "Saving..." : "Save About Settings"}
                </button>
              </div>
              <AboutAdmin aboutSettings={aboutSettings} />
            </Form>
          )}

          {/* CONTACT PAGE SETTINGS */}
          {view === "settings-contact" && (
            <Form method="post">
              <input type="hidden" name="intent" value="saveContact" />
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 font-heading">Contact Us Settings</h1>
                  <p className="text-xs text-gray-500 mt-1">Manage address, email, phone, and location information.</p>
                </div>
                <button type="submit" disabled={isSubmitting} className="bg-[#781B38] hover:bg-[#5E152C] text-white px-5 py-2 rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-2 disabled:opacity-50">
                  <Send size={14} /> {isSubmitting ? "Saving..." : "Save Contact Settings"}
                </button>
              </div>
              <ContactAdmin contactSettings={contactSettings} />
            </Form>
          )}

          {/* SOCIAL PLATFORMS */}
          {view === "settings-social-platforms" && (
            <Form method="post">
              <input type="hidden" name="intent" value="saveSocialPlatforms" />
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 font-heading">Social Platforms</h1>
                  <p className="text-xs text-gray-500 mt-1">Manage social media accounts and profile docks.</p>
                </div>
                <button type="submit" disabled={isSubmitting} className="bg-[#781B38] hover:bg-[#5E152C] text-white px-5 py-2 rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-2 disabled:opacity-50">
                  <Send size={14} /> {isSubmitting ? "Saving..." : "Save Social Platforms"}
                </button>
              </div>
              <PlatformAdmin platformSettings={socialPlatformSettings} platformType="social" />
            </Form>
          )}

          {/* AUTHORS & SCHOLARS */}
          {view === "authors" && (
            <Form method="post">
              <input type="hidden" name="intent" value="saveAuthors" />
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 font-heading">Authors &amp; Scholars</h1>
                  <p className="text-xs text-gray-500 mt-1">Manage writers, scholars, and contributors.</p>
                </div>
                <button type="submit" disabled={isSubmitting} className="bg-[#781B38] hover:bg-[#5E152C] text-white px-5 py-2 rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-2 disabled:opacity-50">
                  <Send size={14} /> {isSubmitting ? "Saving..." : "Save All Authors"}
                </button>
              </div>
              <AuthorsAdmin authorsSettings={authorsSettings || { authors: [] }} />
            </Form>
          )}

          {/* PROFILE HUB */}
          {view === "profile" && (
            <ProfileAdmin profileSettings={profileSettings} />
          )}

          {/* HOMEPAGE FEATURED */}
          {view === "homepage" && (
            <Form method="post">
              <input type="hidden" name="intent" value="saveHomepage" />
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 font-heading">Featured Hero Overrides</h1>
                  <p className="text-xs text-gray-500 mt-1">Configure featured video or article cards.</p>
                </div>
                <button type="submit" disabled={isSubmitting} className="bg-[#781B38] hover:bg-[#5E152C] text-white px-5 py-2 rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-2 disabled:opacity-50">
                  <Send size={14} /> {isSubmitting ? "Saving..." : "Save Overrides"}
                </button>
              </div>
              <HomepageAdmin homepageSettings={homepageSettings} articles={articles} videos={videos} />
            </Form>
          )}

          {/* PODCAST SHOWS & RSS */}
          {view === "settings-podcast-shows" && (
            <Form method="post">
              <input type="hidden" name="intent" value="savePodcastShows" />
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 font-heading">Podcast Shows &amp; RSS Feeds</h1>
                  <p className="text-xs text-gray-500 mt-1">Manage Spotify &amp; Anchor RSS feeds, show artwork, and audio channels.</p>
                </div>
                <button type="submit" disabled={isSubmitting} className="bg-[#781B38] hover:bg-[#5E152C] text-white px-5 py-2 rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-2 disabled:opacity-50">
                  <Send size={14} /> {isSubmitting ? "Saving..." : "Save All Shows"}
                </button>
              </div>
              <PodcastShowsAdmin podcastShowsSettings={podcastShowsSettings || { shows: [] }} />
            </Form>
          )}

          {/* ARTICLES / VIDEOS / PODCASTS LIST VIEWS */}
          {(view === "articles" || view === "videos" || view === "podcasts") && (
            <div className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden">
              {view === "videos" && (
                <div className="flex border-b border-gray-200 bg-gray-50/50">
                  <button onClick={() => setView("videos")} className="px-6 py-3 border-b-2 font-bold text-xs border-[#781B38] text-[#781B38]">All Videos</button>
                  <button onClick={() => setView("programs")} className="px-6 py-3 border-b-2 border-transparent font-medium text-xs text-gray-500 hover:text-gray-700">Programs &amp; Playlists</button>
                </div>
              )}
              <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <h2 className="text-lg font-bold text-gray-900 capitalize font-heading">{view === "videos" ? "All Videos" : view}</h2>
                <div className="flex gap-3 w-full sm:w-auto">
                  <div className="relative w-full sm:w-64">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder={`Search ${view}...`}
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                      className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#781B38]"
                    />
                  </div>
                  <select
                    value={langFilter}
                    onChange={(e) => { setLangFilter(e.target.value as any); setPage(1); }}
                    className="px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs outline-none"
                  >
                    <option value="all">All</option>
                    <option value="ml">ML</option>
                    <option value="en">EN</option>
                  </select>
                  <button
                    onClick={() => view === "articles" ? openArticleEditor() : view === "videos" ? openVideoEditor() : openPodcastEditor()}
                    className="flex items-center gap-1.5 bg-[#781B38] hover:bg-[#5E152C] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap"
                  >
                    <Plus size={14} /> New
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100 text-xs">
                  <thead className="bg-gray-50 text-gray-500 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-6 py-3 text-left">#</th>
                      <th className="px-6 py-3 text-left">Title</th>
                      <th className="px-6 py-3 text-left">Status</th>
                      <th className="px-6 py-3 text-left">Date</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedList.length === 0 ? (
                      <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">No records found.</td></tr>
                    ) : paginatedList.map((item: any, idx: number) => (
                      <tr key={item.slug} className="hover:bg-gray-50/70 transition-colors">
                        <td className="px-6 py-3.5 text-gray-400">{(page - 1) * itemsPerPage + idx + 1}</td>
                        <td className="px-6 py-3.5">
                          <div className="font-semibold text-gray-900 truncate max-w-[280px]">{item.title}</div>
                          <div className="text-[11px] text-gray-400 truncate max-w-[200px]">{item.slug}</div>
                        </td>
                        <td className="px-6 py-3.5"><StatusBadge status={item.status || 'published'} /></td>
                        <td className="px-6 py-3.5 text-gray-500">{item.publishedAt}</td>
                        <td className="px-6 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link to={`/${view}/${item.slug}`} target="_blank" className="text-gray-400 hover:text-blue-600 p-1" title="View"><Eye size={15} /></Link>
                            <button onClick={() => view === "articles" ? openArticleEditor(item) : view === "videos" ? openVideoEditor(item) : openPodcastEditor(item)} className="text-gray-400 hover:text-[#781B38] p-1" title="Edit"><Edit size={15} /></button>
                            <button onClick={() => handleDelete(item.slug, view === "articles" ? "article" : view === "videos" ? "video" : "podcast")} className="text-gray-400 hover:text-red-600 p-1" title="Delete"><Trash2 size={15} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
                  <span>Page {page} of {totalPages}</span>
                  <div className="flex gap-1.5">
                    <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-2.5 py-1 border rounded-md disabled:opacity-40">Prev</button>
                    <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-2.5 py-1 border rounded-md disabled:opacity-40">Next</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* EDITORS (Articles, Videos, Podcasts) */}
          {(view === "newArticle" || view === "editArticle" || view === "newVideo" || view === "editVideo" || view === "newPodcast" || view === "editPodcast") && (
            <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
                <h2 className="text-xl font-bold text-gray-900 font-heading">
                  {view.includes("Article") ? (view === "newArticle" ? "Create Article" : "Edit Article") :
                   view.includes("Video") ? (view === "newVideo" ? "Create Video" : "Edit Video") :
                   (view === "newPodcast" ? "Create Podcast" : "Edit Podcast")}
                </h2>
                <button type="button" onClick={() => setView(view.includes("Article") ? "articles" : view.includes("Video") ? "videos" : "podcasts")} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
              </div>

              <Form method="post" className="space-y-6">
                <input type="hidden" name="originalSlug" value={editingItem?.slug || ""} />
                <input type="hidden" name="intent" value={view.includes("Video") ? "saveVideo" : view.includes("Podcast") ? "savePodcast" : "saveArticle"} />
                <input type="hidden" name="body" value={editorContent} />
                <input type="hidden" name="publishedAt" value={editingItem?.publishedAt || ""} />

                {view.includes("Podcast") && (
                  <div className="space-y-4 bg-purple-50/50 p-5 rounded-xl border border-purple-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Audio URL *</label>
                        <input type="text" name="audioUrl" defaultValue={editingItem?.audioUrl} placeholder="https://.../audio.mp3" required={view.includes("Podcast")} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Duration (e.g. 45:30)</label>
                        <input type="text" name="duration" defaultValue={editingItem?.duration} placeholder="00:00" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                      </div>
                    </div>
                  </div>
                )}

                {view.includes("Video") && (
                  <div className="space-y-4 bg-red-50/50 p-5 rounded-xl border border-red-100">
                    <input type="hidden" name="youtubeId" value={youtubePreviewId} />
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">YouTube URL *</label>
                      <input type="text" value={youtubeInput} onChange={(e) => setYoutubeInput(e.target.value)} placeholder="https://youtube.com/watch?v=..." required={view.includes("Video")} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Title *</label>
                    <input type="text" name="title" defaultValue={editingItem?.title} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">URL Slug (Optional)</label>
                    <input type="text" name="newSlug" defaultValue={editingItem?.slug || ""} placeholder="e.g. my-slug" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Language</label>
                    <select name="language" defaultValue={editingItem?.language || "ml"} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                      <option value="ml">Malayalam</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
                    <input type="text" name="category" defaultValue={editingItem?.category || "News"} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Author</label>
                    <input type="text" name="author" defaultValue={editingItem?.author || "Samastha Graph"} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-malayalam" />
                  </div>
                </div>

                {view.includes("Article") && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Cover Image URL</label>
                    <input type="text" name="coverImage" defaultValue={editingItem?.coverImage} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="https://..." />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">{view.includes("Article") ? "Excerpt *" : "Short Description"}</label>
                  <textarea name="excerpt" defaultValue={editingItem?.excerpt} rows={2} required={view.includes("Article")} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Body Content</label>
                  <RichTextEditor content={editorContent} onChange={setEditorContent} />
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                  <button type="button" onClick={() => setView(view.includes("Article") ? "articles" : view.includes("Video") ? "videos" : "podcasts")} className="px-5 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="bg-[#781B38] hover:bg-[#5E152C] text-white px-7 py-2 rounded-xl text-xs font-bold transition-colors disabled:opacity-50">
                    {isSubmitting ? "Saving..." : "Save Content"}
                  </button>
                </div>
              </Form>
            </div>
          )}

          {/* PROGRAMS VIEW */}
          {view === "programs" && (
            <div className="space-y-6">
              <div className="flex border-b border-gray-200 bg-gray-50/50 rounded-t-xl overflow-hidden">
                <button onClick={() => setView("videos")} className="px-6 py-3 border-b-2 border-transparent font-medium text-xs text-gray-500 hover:text-gray-700">All Videos</button>
                <button onClick={() => setView("programs")} className="px-6 py-3 border-b-2 font-bold text-xs border-[#781B38] text-[#781B38]">Programs &amp; Playlists</button>
              </div>
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900 font-heading">Programs &amp; Playlists</h1>
                <button onClick={() => openProgramEditor()} className="flex items-center gap-1.5 bg-[#781B38] hover:bg-[#5E152C] text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors">
                  <Plus size={14} /> Create Program
                </button>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 text-gray-500 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="text-left px-6 py-3">Title</th>
                      <th className="text-left px-6 py-3">Category</th>
                      <th className="text-left px-6 py-3">Language</th>
                      <th className="text-right px-6 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {programs.map((p: any) => (
                      <tr key={p.slug} className="hover:bg-gray-50/70">
                        <td className="px-6 py-3 font-semibold text-gray-900">{p.title}</td>
                        <td className="px-6 py-3 text-gray-600">{p.category || 'General'}</td>
                        <td className="px-6 py-3 uppercase">{p.language || 'ml'}</td>
                        <td className="px-6 py-3 text-right">
                          <button onClick={() => openProgramEditor(p)} className="p-1 text-gray-400 hover:text-[#781B38]"><Edit size={15} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* EDIT PROGRAM */}
          {(view === "newProgram" || view === "editProgram") && (
            <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
                <h2 className="text-xl font-bold text-gray-900 font-heading">{view === "newProgram" ? "Create Program" : "Edit Program"}</h2>
                <button type="button" onClick={() => setView("programs")} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
              </div>
              <Form method="post" className="space-y-4">
                <input type="hidden" name="intent" value="saveProgram" />
                <input type="hidden" name="originalSlug" value={editingProgram?.slug || ""} />
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Title *</label>
                  <input type="text" name="title" defaultValue={editingProgram?.title} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                  <textarea name="description" defaultValue={editingProgram?.description} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
                    <input type="text" name="category" defaultValue={editingProgram?.category || 'General'} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Language</label>
                    <select name="language" defaultValue={editingProgram?.language || 'ml'} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                      <option value="ml">Malayalam</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                  <button type="button" onClick={() => setView("programs")} className="px-5 py-2 border border-gray-300 rounded-xl text-xs font-semibold">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="bg-[#781B38] hover:bg-[#5E152C] text-white px-7 py-2 rounded-xl text-xs font-bold disabled:opacity-50">Save Program</button>
                </div>
              </Form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
