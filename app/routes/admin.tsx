import { useState, useEffect, useRef } from "react";
import { json, redirect } from "@remix-run/cloudflare";
import { AdminLayout } from "../components/AdminLayout";
import { ProfileAdmin } from "../components/ProfileAdmin";
import { HomepageAdmin } from "../components/HomepageAdmin";
import { PlatformAdmin } from "../components/PlatformAdmin";
import { AboutAdmin } from "../components/AboutAdmin";
import { ContactAdmin } from "../components/ContactAdmin";
import { PodcastShowsAdmin } from "../components/PodcastShowsAdmin";
import { AuthorsAdmin } from "../components/AuthorsAdmin";
import { useActionData, Form, useNavigation, useLoaderData, useSubmit, Link, useSearchParams } from "@remix-run/react";
import fm from "front-matter";
import RichTextEditor from '../components/RichTextEditor';
// removed tiptap imports




import { Menu, X, Edit, Trash2, Eye, Plus, Send, Bold, Italic, List, ListOrdered, Link as LinkIcon, RefreshCw, Calendar as CalendarIcon, Search, LayoutDashboard, FileText, Video, Mic, BarChart2, ChevronDown, LogOut, Settings, Quote, Underline as UnderlineIcon, AlignLeft, AlignCenter, AlignRight, AlignJustify, Heading1, Heading2, Heading3, Heading4, Strikethrough, Minus, User, Share2, ExternalLink, Radio, Rss } from 'lucide-react';
import { getSessionStorage } from "../sessions.server";
import { fetchYouTubePlaylistVideos, extractYouTubePlaylistId } from "../utils/youtube";
import {
  getDbArticles, getDbVideos, getDbPodcasts, getDbPrograms, getDbSetting, getDbAuthors,
  saveDbArticle, saveDbVideo, saveDbPodcast, saveDbProgram, saveDbSetting, saveDbAuthors,
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
  
  // Accept standard http and https URLs
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    // Specifically reject ibb.co as per previous rules
    if (trimmed.includes("ibb.co")) return false;
    return true;
  }
  
  // Accept valid relative image paths
  if (trimmed.startsWith("/") || trimmed.startsWith("./") || trimmed.startsWith("../")) {
    return true;
  }
  
  // Accept simple alphanumeric filenames that frontend could prefix
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
      return { success: true, renameStatus: "incomplete", error: "Content was saved with the new URL, but the old URL could not be removed. Please retry the rename." };
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

  const githubToken = env.GITHUB_TOKEN;
  const githubOwner = env.GITHUB_OWNER || "samasthagraph";
  const githubRepo = env.GITHUB_REPO || "cloudflare";

  if (githubToken) {
    try {
      const fetchFolder = async (folder: string) => {
        const res = await fetch(`https://api.github.com/repos/${githubOwner}/${githubRepo}/contents/app/content/${folder}?ref=main`, {
          headers: {
            "Authorization": `token ${githubToken}`,
            "User-Agent": "Samastha-CMS",
            "Accept": "application/vnd.github.v3+json"
          }
        });
        if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
        return await res.json();
      };

      const fetchFileContent = async (url: string) => {
        const res = await fetch(url, {
          headers: {
            "Authorization": `token ${githubToken}`,
            "User-Agent": "Samastha-CMS",
            "Accept": "application/vnd.github.v3+json"
          }
        });
        if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
        const data = await res.json();
        const base64 = data.content.replace(/\n/g, '');
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        const decoder = new TextDecoder('utf-8');
        return decoder.decode(bytes);
      };

      const [articleFiles, videoFiles, podcastFiles, settingsFiles, programFiles] = await Promise.all([
        fetchFolder('articles').catch(() => []),
        fetchFolder('videos').catch(() => []),
        fetchFolder('podcasts').catch(() => []),
        fetchFolder('settings').catch(() => []),
        fetchFolder('programs').catch(() => [])
      ]);

      await Promise.all([
        ...((articleFiles as any[]) || []).filter(f => f.name.endsWith('.mdx')).map(async (file) => {
          const content = await fetchFileContent(file.url);
          const { attributes, body } = fm(content);
          articles.push({ slug: file.name.replace('.mdx', ''), ...(attributes as any), body, type: 'article' });
        }),
        ...((videoFiles as any[]) || []).filter(f => f.name.endsWith('.json')).map(async (file) => {
          const content = await fetchFileContent(file.url);
          videos.push({ slug: file.name.replace('.json', ''), ...JSON.parse(content), type: 'video' });
        }),
        ...((podcastFiles as any[]) || []).filter(f => f.name.endsWith('.json')).map(async (file) => {
          const content = await fetchFileContent(file.url);
          podcasts.push({ slug: file.name.replace('.json', ''), ...JSON.parse(content), type: 'podcast' });
        }),
        ...((settingsFiles as any[]) || []).filter(f => f.name === 'podcasts.json').map(async (file) => {
          const content = await fetchFileContent(file.url);
          platformSettings = JSON.parse(content);
        }),
        ...((settingsFiles as any[]) || []).filter(f => f.name === 'profile.json').map(async (file) => {
          const content = await fetchFileContent(file.url);
          profileSettings = JSON.parse(content);
        }),
        ...((settingsFiles as any[]) || []).filter(f => f.name === 'homepage.json').map(async (file) => {
          const content = await fetchFileContent(file.url);
          homepageSettings = JSON.parse(content);
        }),
        ...((settingsFiles as any[]) || []).filter(f => f.name === 'about.json').map(async (file) => {
          const content = await fetchFileContent(file.url);
          aboutSettings = JSON.parse(content);
        }),
        ...((settingsFiles as any[]) || []).filter(f => f.name === 'contact.json').map(async (file) => {
          const content = await fetchFileContent(file.url);
          contactSettings = JSON.parse(content);
        }),
        ...((settingsFiles as any[]) || []).filter(f => f.name === 'social-platforms.json').map(async (file) => {
          const content = await fetchFileContent(file.url);
          socialPlatformSettings = JSON.parse(content);
        }),
        ...((settingsFiles as any[]) || []).filter(f => f.name === 'podcast-platforms.json').map(async (file) => {
          const content = await fetchFileContent(file.url);
          podcastPlatformSettings = JSON.parse(content);
        }),
        ...((settingsFiles as any[]) || []).filter(f => f.name === 'podcast-shows.json').map(async (file) => {
          const content = await fetchFileContent(file.url);
          podcastShowsSettings = JSON.parse(content);
        }),
        ...((programFiles as any[]) || []).filter(f => f.name.endsWith('.json')).map(async (file) => {
          const content = await fetchFileContent(file.url);
          programs.push({ slug: file.name.replace('.json', ''), ...JSON.parse(content), type: 'program' });
        }),
        ...((settingsFiles as any[]) || []).filter(f => f.name === 'authors.json').map(async (file) => {
          const content = await fetchFileContent(file.url);
          authorsSettings = JSON.parse(content);
        }),
        ...((settingsFiles as any[]) || []).filter(f => f.name === 'spotlight.json').map(async (file) => {
          const content = await fetchFileContent(file.url);
          spotlightSettings = JSON.parse(content);
        })
      ]);

      articles.sort((a: any, b: any) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());
      videos.sort((a: any, b: any) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());
      podcasts.sort((a: any, b: any) => (b.episodeNumber || 0) - (a.episodeNumber || 0));
      programs.sort((a: any, b: any) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());

    } catch (e) {
      console.error("GitHub Sync failed, falling back to local files:", e);
      articles = [];
      videos = [];
      podcasts = [];
    }
  }

  if (articles.length === 0 && videos.length === 0 && podcasts.length === 0) {
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
      if (path.includes('podcasts.json')) {
        platformSettings = jsonSettings[path];
      }
      if (path.includes('profile.json')) {
        profileSettings = jsonSettings[path];
      }
      if (path.includes('homepage.json')) {
        homepageSettings = jsonSettings[path];
      }
      if (path.includes('about.json')) {
        aboutSettings = jsonSettings[path];
      }
      if (path.includes('contact.json')) {
        contactSettings = jsonSettings[path];
      }
      if (path.includes('social-platforms.json')) {
        socialPlatformSettings = jsonSettings[path];
      }
      if (path.includes('podcast-platforms.json')) {
        podcastPlatformSettings = jsonSettings[path];
      }
      if (path.includes('podcast-shows.json')) {
        podcastShowsSettings = jsonSettings[path];
      }
      if (path.includes('spotlight.json')) {
        spotlightSettings = jsonSettings[path];
      }
      if (path.includes('authors.json')) {
        authorsSettings = jsonSettings[path];
      }
    }
  }

  if (env?.DB) {
    try {
      const [dbArticles, dbVideos, dbPodcasts, dbPrograms, dbHomepage, dbAbout, dbContact, dbSocial, dbPodcastPlatforms, dbPodcastShows, dbProfile, dbAuthors, dbSpotlight] = await Promise.all([
        getDbArticles(env.DB),
        getDbVideos(env.DB),
        getDbPodcasts(env.DB),
        getDbPrograms(env.DB),
        getDbSetting(env.DB, "homepage"),
        getDbSetting(env.DB, "about"),
        getDbSetting(env.DB, "contact"),
        getDbSetting(env.DB, "social-platforms"),
        getDbSetting(env.DB, "podcast-platforms"),
        getDbSetting(env.DB, "podcast-shows"),
        getDbSetting(env.DB, "profile"),
        getDbSetting(env.DB, "authors"),
        getDbSetting(env.DB, "spotlight")
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
      if (dbHomepage) homepageSettings = dbHomepage;
      if (dbAbout) aboutSettings = dbAbout;
      if (dbContact) contactSettings = dbContact;
      if (dbSocial) socialPlatformSettings = dbSocial;
      if (dbPodcastPlatforms) podcastPlatformSettings = dbPodcastPlatforms;
      if (dbPodcastShows) podcastShowsSettings = dbPodcastShows;
      if (dbProfile) profileSettings = dbProfile;
      if (dbAuthors) authorsSettings = dbAuthors;
      if (dbSpotlight) spotlightSettings = dbSpotlight;
    } catch (e) {
      console.warn("D1 loader merge warning:", e);
    }
  }

  return json({
    articles,
    videos,
    podcasts,
    programs,
    spotlightSettings,
    platformSettings,
    profileSettings,
    homepageSettings,
    aboutSettings,
    contactSettings,
    socialPlatformSettings,
    podcastPlatformSettings,
    podcastShowsSettings,
    authorsSettings: authorsSettings || { authors: [] }
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
    const hook = context?.cloudflare?.env?.CLOUDFLARE_DEPLOY_HOOK || context?.env?.CLOUDFLARE_DEPLOY_HOOK || process.env.CLOUDFLARE_DEPLOY_HOOK;
    if (!hook) return json({ error: "Deploy hook missing" }, { status: 500 });
    await fetch(hook, { method: "POST" });
    return json({ success: true, message: "Production deployment triggered successfully!" });
  }

  const githubToken = env?.GITHUB_TOKEN || "";
  const owner = "samasthagraph";
  const repo = "cloudflare";

  try {
    if (intent === "saveHomepage") {
      const dataStr = formData.get("homepageData") as string;
      const parsedData = JSON.parse(dataStr);
      if (parsedData.hero?.image && !validateImageUrl(parsedData.hero.image)) return json({ error: "Invalid image URL in hero." }, { status: 400 });
      if (parsedData.about?.image && !validateImageUrl(parsedData.about.image)) return json({ error: "Invalid image URL in about section." }, { status: 400 });
      const jsonContent = JSON.stringify(parsedData, null, 2);

      if (env?.DB) {
        await saveDbSetting(env.DB, "homepage", parsedData);
      }

      await commitToGitHub({
        token: githubToken,
        owner,
        repo,
        path: "app/content/settings/homepage.json",
        content: jsonContent,
        message: "update homepage settings"
      });
      return json({ success: true, message: "Homepage settings saved successfully!" });
    }

    if (intent === "saveAbout") {
      const dataStr = formData.get("aboutData") as string;
      const parsedData = JSON.parse(dataStr);
      if (parsedData.hero?.image && !validateImageUrl(parsedData.hero.image)) return json({ error: "Invalid image URL in hero section." }, { status: 400 });
      if (parsedData.story?.image && !validateImageUrl(parsedData.story.image)) return json({ error: "Invalid image URL in story section." }, { status: 400 });
      if (parsedData.gallery) {
        for (const key of Object.keys(parsedData.gallery)) {
          if (parsedData.gallery[key] && !validateImageUrl(parsedData.gallery[key])) return json({ error: `Invalid image URL in gallery (${key}).` }, { status: 400 });
        }
      }
      const jsonContent = JSON.stringify(parsedData, null, 2);

      if (env?.DB) {
        await saveDbSetting(env.DB, "about", parsedData);
      }

      await commitToGitHub({
        token: githubToken,
        owner,
        repo,
        path: "app/content/settings/about.json",
        content: jsonContent,
        message: "update about page settings"
      });
      return json({ success: true, message: "About Us settings saved successfully!" });
    }

    if (intent === "saveContact") {
      const dataStr = formData.get("contactData") as string;
      const parsedData = JSON.parse(dataStr);
      if (parsedData.hero?.image && !validateImageUrl(parsedData.hero.image)) return json({ error: "Invalid image URL in hero section." }, { status: 400 });
      if (parsedData.location?.image && !validateImageUrl(parsedData.location.image)) return json({ error: "Invalid image URL in location section." }, { status: 400 });
      const jsonContent = JSON.stringify(parsedData, null, 2);

      if (env?.DB) {
        await saveDbSetting(env.DB, "contact", parsedData);
      }

      await commitToGitHub({
        token: githubToken,
        owner,
        repo,
        path: "app/content/settings/contact.json",
        content: jsonContent,
        message: "update contact page settings"
      });
      return json({ success: true, message: "Contact Us settings saved successfully!" });
    }

    if (intent === "saveSocialPlatforms") {
      const dataStr = formData.get("socialPlatformData") as string;
      const parsedData = JSON.parse(dataStr);
      const jsonContent = JSON.stringify(parsedData, null, 2);

      if (env?.DB) {
        await saveDbSetting(env.DB, "social-platforms", parsedData);
      }

      await commitToGitHub({
        token: githubToken,
        owner,
        repo,
        path: "app/content/settings/social-platforms.json",
        content: jsonContent,
        message: "update social platforms settings"
      });
      return json({ success: true, message: "Social Platforms settings saved successfully!" });
    }

    if (intent === "savePodcastPlatforms") {
      const dataStr = formData.get("podcastPlatformData") as string;
      const parsedData = JSON.parse(dataStr);
      const jsonContent = JSON.stringify(parsedData, null, 2);

      if (env?.DB) {
        await saveDbSetting(env.DB, "podcast-platforms", parsedData);
      }

      await commitToGitHub({
        token: githubToken,
        owner,
        repo,
        path: "app/content/settings/podcast-platforms.json",
        content: jsonContent,
        message: "update podcast platforms settings"
      });
      return json({ success: true, message: "Podcast Platforms settings saved successfully!" });
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

      if (!validateImageUrl(customThumbnail)) return json({ error: "Invalid custom thumbnail URL." }, { status: 400 });

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

      if (!validateImageUrl(customThumbnail)) return json({ error: "Invalid custom thumbnail URL." }, { status: 400 });

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

    if (intent === "savePlatformSettings") {
      const platformsJsonStr = formData.get("platforms") as string;
      const contentStr = JSON.stringify({ platforms: JSON.parse(platformsJsonStr) }, null, 2);

      if (env?.DB) {
        await saveDbSetting(env.DB, "podcast-platforms", { platforms: JSON.parse(platformsJsonStr) });
      }

      if (githubToken) {
        await commitToGitHub({
          token: githubToken,
          owner,
          repo,
          path: `app/content/settings/podcasts.json`,
          content: contentStr,
          message: `config: update podcast platforms`
        });
      }
      return json({ success: true, message: "Platform settings updated successfully!" });
    }

    if (intent === "savePodcastShows") {
      const podcastShowsDataStr = formData.get("podcastShowsData") as string;
      const parsedData = JSON.parse(podcastShowsDataStr);
      const contentStr = JSON.stringify(parsedData, null, 2);

      if (env?.DB) {
        await saveDbSetting(env.DB, "podcast-shows", parsedData);
      }

      if (githubToken) {
        await commitToGitHub({
          token: githubToken,
          owner,
          repo,
          path: "app/content/settings/podcast-shows.json",
          content: contentStr,
          message: "config: update podcast shows and RSS feeds"
        });
      }

      return json({ success: true, intent: "savePodcastShows", message: "Podcast shows and RSS feeds updated successfully!" });
    }

    if (intent === "saveProfile") {
      const profileDataStr = formData.get("profileData") as string;
      const parsedData = JSON.parse(profileDataStr);
      if (parsedData.logo && !validateImageUrl(parsedData.logo)) return json({ error: "Invalid image URL in profile logo." }, { status: 400 });
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
          } else {
            return json({ error: "Invalid YouTube playlist URL." }, { status: 400 });
          }
        } else if (rawPlaylistId.includes("http://") || rawPlaylistId.includes("https://")) {
          return json({ error: "Invalid YouTube playlist URL." }, { status: 400 });
        }
      }

      const youtubeThumbnail = formData.get("youtubeThumbnail") as string;
      const status = formData.get("status") as string || "draft";
      const date = formData.get("publishedAt") as string || new Date().toISOString().split('T')[0];
      const language = formData.get("language") as string || "ml";
      const originalLanguage = formData.get("originalLanguage") as string;
      const translationGroupId = formData.get("translationGroupId") as string;
      const isNewRecord = !originalSlug;
      const shouldSaveLanguage = isNewRecord || language !== "ml" || originalLanguage !== "";

      if (!title) return json({ error: "Program title is required." }, { status: 400 });
      if (coverImage && !validateImageUrl(coverImage)) return json({ error: "Invalid cover image URL." }, { status: 400 });

      const finalSlug = sanitizeSlug(newSlug, title);
      if (!finalSlug) return json({ error: "Could not generate a valid URL slug from this title. Please provide an English slug manually." }, { status: 400 });

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
      if (shouldSaveLanguage) programData.language = language;
      if (translationGroupId) programData.translationGroupId = translationGroupId;

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

      // Automatically fetch playlist videos and save them
      let syncMessage = `Program "${title}" saved successfully!`;
      if (normalizedPlaylistId) {
        try {
          const playlistVideos = await fetchYouTubePlaylistVideos(normalizedPlaylistId, finalSlug, category, language);
          if (playlistVideos.length > 0) {
            for (const vid of playlistVideos) {
              const vidContent = {
                title: vid.title,
                description: vid.description || '',
                youtubeId: vid.youtubeId,
                publishedAt: vid.publishedAt,
                status: 'published',
                language: vid.language || 'ml',
                category: vid.category || category || 'General',
                programId: finalSlug,
                ...(typeof vid.episodeNumber === 'number' ? { episodeNumber: vid.episodeNumber } : {})
              };
              if (env?.DB) {
                await saveDbVideo(env.DB, { slug: `youtube-${vid.youtubeId}`, ...vidContent });
              }
              const vidJson = JSON.stringify(vidContent, null, 2);
              await commitToGitHub({
                token: githubToken,
                owner,
                repo,
                path: `app/content/videos/youtube-${vid.youtubeId}.json`,
                content: vidJson,
                message: `content: auto-sync playlist video ${vid.title}`
              });
            }
            syncMessage = `Program "${title}" saved and ${playlistVideos.length} playlist videos synced!`;
          }
        } catch (err) {
          console.warn("Failed to auto-fetch playlist videos during program save:", err);
        }
      }

      return json({ success: true, intent, item: { slug: finalSlug, type: 'program', ...programData }, message: syncMessage });
    }

    if (intent === "deleteProgram") {
      const slugToDelete = formData.get("slug") as string;
      const referencingVideosCount = parseInt(formData.get("referencingVideosCount") as string || "0", 10);
      if (referencingVideosCount > 0) {
        return json({ error: `Cannot delete Program: ${referencingVideosCount} video${referencingVideosCount === 1 ? '' : 's'} reference this program. Remove the program assignment from videos first.` }, { status: 400 });
      }

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

    if (intent === "saveSpotlight") {
      const heroType = formData.get("heroType") as string || "video";
      const referenceId = formData.get("referenceId") as string || "";
      const customBanner = formData.get("customBanner") as string || "";
      const upcomingTitle = formData.get("upcomingTitle") as string || "";
      const upcomingDate = formData.get("upcomingDate") as string || "";
      const upcomingDescription = formData.get("upcomingDescription") as string || "";

      if (customBanner && !validateImageUrl(customBanner)) return json({ error: "Invalid custom banner URL." }, { status: 400 });

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


    return json({ error: "Unsupported action" }, { status: 400 });
  } catch (error: any) {
    console.error("GitHub API error:", error);
    return json({ error: error.message || "Failed to push to GitHub" }, { status: 500 });
  }
};



export default function AdminDashboard() {
  const actionDataAny = useActionData<typeof action>() as any;
  const actionData = actionDataAny;

  const [articles, setArticles] = useState(useLoaderData<typeof loader>().articles);
  const [videos, setVideos] = useState(useLoaderData<typeof loader>().videos);
  const [podcasts, setPodcasts] = useState(useLoaderData<typeof loader>().podcasts);
  const [programs, setPrograms] = useState(useLoaderData<typeof loader>().programs as any[]);
  const [spotlightSettings] = useState(useLoaderData<typeof loader>().spotlightSettings as any);
  const [editingProgram, setEditingProgram] = useState<any>(null);
  const [programPlaylistInput, setProgramPlaylistInput] = useState("");
  const [programThumbnailPreview, setProgramThumbnailPreview] = useState("");
  const [spotlightHeroType, setSpotlightHeroType] = useState<string>(spotlightSettings?.heroType || 'video');
  const {
    platformSettings,
    profileSettings,
    homepageSettings,
    aboutSettings,
    contactSettings,
    socialPlatformSettings,
    podcastPlatformSettings,
    podcastShowsSettings,
    authorsSettings
  } = useLoaderData<typeof loader>();

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
    } else if (!urlTab && typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("admin_active_tab");
        if (saved && saved !== "overview" && saved !== view) {
          setView(saved);
        }
      } catch (e) {}
    }
  }, [urlTab]);

  useEffect(() => {
    if (actionData?.success) {
      if (actionData.intent === "delete") {
        if (actionData.itemType === 'article') setArticles(prev => prev.filter(a => a.slug !== actionData.slug));
        if (actionData.itemType === 'video') setVideos(prev => prev.filter(v => v.slug !== actionData.slug));
        if (actionData.itemType === 'podcast') setPodcasts(prev => prev.filter(p => p.slug !== actionData.slug));
      } else if (actionData.intent === "saveArticle") {
        setArticles(prev => {
          const exists = prev.find(a => a.slug === actionData.item.slug);
          const list = exists ? prev.map(a => a.slug === actionData.item.slug ? actionData.item : a) : [actionData.item, ...prev];
          return list.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
        });
        setView("articles");
      } else if (actionData.intent === "saveVideo") {
        setVideos(prev => {
          const exists = prev.find(v => v.slug === actionData.item.slug);
          const list = exists ? prev.map(v => v.slug === actionData.item.slug ? actionData.item : v) : [actionData.item, ...prev];
          return list.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
        });
        setView("videos");
      } else if (actionData.intent === "savePodcast") {
        setPodcasts(prev => {
          const exists = prev.find(p => p.slug === actionData.item.slug);
          const list = exists ? prev.map(p => p.slug === actionData.item.slug ? actionData.item : p) : [actionData.item, ...prev];
          return list.sort((a, b) => (b.episodeNumber || 0) - (a.episodeNumber || 0));
        });
        setView("podcasts");
      } else if (actionData.intent === "saveProgram") {
        setPrograms(prev => {
          const exists = prev.find((p: any) => p.slug === actionData.item.slug);
          const list = exists ? prev.map((p: any) => p.slug === actionData.item.slug ? actionData.item : p) : [actionData.item, ...prev];
          return list.sort((a: any, b: any) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());
        });
        setView("programs");
      } else if (actionData.intent === "deleteProgram") {
        setPrograms(prev => prev.filter((p: any) => p.slug !== actionData.slug));
        setView("programs");
      } else if (actionData.intent === "saveAuthors") {
        setView("authors");
      } else if (actionData.intent === "savePodcastShows") {
        setView("settings-podcast-shows");
      } else if (actionData.intent === "saveSpotlight") {
        setView("spotlight");
      } else if (actionData.intent === "saveProfile") {
        setView("profile");
      } else if (actionData.intent === "saveHomepage") {
        setView("homepage");
      } else if (actionData.intent === "saveAbout") {
        setView("settings-about");
      } else if (actionData.intent === "saveContact") {
        setView("settings-contact");
      } else if (actionData.intent === "saveSocialPlatforms") {
        setView("settings-social-platforms");
      } else if (actionData.intent === "savePodcastPlatforms") {
        setView("settings-podcast-platforms");
      }
    }
  }, [actionData]);

  const [isCreateDropdownOpen, setIsCreateDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCreateDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navigation = useNavigation();
  const submit = useSubmit();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Lists state
  const [searchQuery, setSearchQuery] = useState("");
  const [langFilter, setLangFilter] = useState<"all" | "ml" | "en">("all");
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const handleCategoryClick = (category: string) => {
    setView(category);
    setPage(1);
    setSearchQuery("");
    setExpandedSection(prev => prev === category ? null : category);
  };
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  // Editor state
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editorContent, setEditorContent] = useState("");
  const [youtubePreviewId, setYoutubePreviewId] = useState("");
  const [youtubeInput, setYoutubeInput] = useState("");
  const [platformsState, setPlatformsState] = useState(platformSettings?.platforms || []);

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


  const handleDeleteProgram = (slug: string) => {
    const referencingCount = videos.filter((v: any) => v.programId === slug).length;
    if (referencingCount > 0) {
      alert(`Cannot delete Program: ${referencingCount} video${referencingCount === 1 ? '' : 's'} reference this program. Remove the program assignment from videos first.`);
      return;
    }
    if (window.confirm('Are you sure you want to delete this program? This cannot be undone.')) {
      submit({ intent: "deleteProgram", slug, referencingVideosCount: String(referencingCount) }, { method: "post" });
    }
  };

  const handleMove = (item: any, type: 'article' | 'video' | 'podcast') => {
    const newDate = window.prompt("Enter new date (YYYY-MM-DD):", item.publishedAt);
    if (newDate && newDate !== item.publishedAt) {
      let contentStr = "";
      if (type === 'article') {
        contentStr = `---
title: ${JSON.stringify(item.title)}
advancedTitle: ${JSON.stringify(item.advancedTitle || item.title)}
themePreset: ${JSON.stringify(item.themePreset)}
publishedAt: ${JSON.stringify(newDate)}
coverImage: ${JSON.stringify(item.coverImage || '')}
thumbImage: ${JSON.stringify(item.thumbImage || '')}
category: ${JSON.stringify(item.category || 'News')}
author: ${JSON.stringify(item.author || 'admin')}
seoTitle: ${JSON.stringify(item.seoTitle || '')}
seoDescription: ${JSON.stringify(item.seoDescription || '')}
excerpt: ${JSON.stringify(item.excerpt)}
status: ${JSON.stringify(item.status || 'published')}
---

${item.body}`;
      } else {
        const videoData = { ...item, publishedAt: newDate };
        delete videoData.slug;
        delete videoData.type;
        contentStr = JSON.stringify(videoData, null, 2);
      }
      submit({ intent: "move", slug: item.slug, contentStr, newDate, type }, { method: "post" });
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

  // YouTube Extract Logic
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

  // Program Playlist Thumbnail Extraction Logic
  useEffect(() => {
    if (programPlaylistInput) {
      const matchV = programPlaylistInput.match(/[?&]v=([a-zA-Z0-9_-]+)/);
      if (matchV && matchV[1]) {
        setProgramThumbnailPreview(`https://img.youtube.com/vi/${matchV[1]}/hqdefault.jpg`);
      }
    } else {
      setProgramThumbnailPreview("");
    }
  }, [programPlaylistInput]);

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

  const allRecentActivity = [...articles, ...videos, ...podcasts].sort((a: any, b: any) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime()).slice(0, 5);

  const StatusBadge = ({ status }: { status: string }) => {
    if (status === 'draft') return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Draft</span>;
    if (status === 'scheduled') return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">Scheduled</span>;
    return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Published</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50 font-inter flex flex-col">
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button className="md:hidden p-2 text-gray-500" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView("overview")}>
              <img src="/Logo.png" alt="Samastha Graph Logo" className="h-14 w-auto sm:h-16" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200 rounded-full">
               <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
               <span className="text-xs font-semibold text-green-700">System Ready</span>
            </div>
            <Form method="post">
              <input type="hidden" name="originalSlug" value={editingItem?.slug || ""} />
                <input type="hidden" name="intent" value="logout" />
              <button type="submit" className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-sm transition-colors">
                <LogOut size={16} /> Logout
              </button>
            </Form>
            <button
              onClick={handleDeploy}
              disabled={isDeploying || isSubmitting}
              className="flex items-center gap-2 bg-[#c8a136] hover:bg-[#b08d2f] text-white px-4 py-2 rounded-sm text-sm font-semibold transition-colors disabled:opacity-50 shadow-sm"
            >
              <RefreshCw size={16} className={isDeploying ? "animate-spin" : ""} />
              <span className="hidden sm:inline">{isDeploying ? "Deploying..." : "Deploy to Cloudflare"}</span>
            </button>
          </div>
        </div>
      </header>

      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 shadow-lg absolute w-full z-40 pb-4">
          <div className="px-4 pt-4 space-y-3 max-h-[80vh] overflow-y-auto">
            <button onClick={() => { setView("overview"); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 text-left px-4 py-2.5 rounded-sm font-medium transition-colors ${view === "overview" ? "bg-[#15664a] text-white" : "text-gray-700 hover:bg-gray-100"}`}>
              <LayoutDashboard size={18} /> Overview Hub
            </button>

            <h4 className="px-4 pt-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Content</h4>

            <div>
              <button onClick={() => handleCategoryClick("articles")} className={`w-full flex items-center justify-between px-4 py-2.5 rounded-sm font-medium transition-colors ${view.includes("article") || view.includes("Article") ? "bg-[#15664a] text-white" : "text-gray-700 hover:bg-gray-100"}`}>
                <div className="flex items-center gap-3"><FileText size={18} /> Articles</div>
                <ChevronDown size={16} className={`transform transition-transform ${expandedSection === "articles" ? 'rotate-180' : ''}`} />
              </button>
              {expandedSection === "articles" && (
                <div className="pl-11 pr-4 py-2 space-y-1 bg-gray-50 border-l-2 border-[#15664a] ml-4 mt-1 rounded-r-sm">
                  <button onClick={() => { setView("articles"); setPage(1); setSearchQuery(""); setIsMobileMenuOpen(false); }} className={`block w-full text-left py-1.5 text-sm font-medium ${view === "articles" ? "text-[#15664a]" : "text-gray-600 hover:text-gray-900"}`}>List Articles</button>
                  <button onClick={() => { openArticleEditor(); setIsMobileMenuOpen(false); }} className={`block w-full text-left py-1.5 text-sm font-medium ${view === "newArticle" ? "text-[#15664a]" : "text-gray-600 hover:text-gray-900"}`}>+ Create Article</button>
                </div>
              )}
            </div>

            <div>
              <button onClick={() => handleCategoryClick("videos")} className={`w-full flex items-center justify-between px-4 py-2.5 rounded-sm font-medium transition-colors ${view.includes("video") || view.includes("Video") || view.includes("program") || view.includes("Program") ? "bg-[#15664a] text-white" : "text-gray-700 hover:bg-gray-100"}`}>
                <div className="flex items-center gap-3"><Video size={18} /> Videos</div>
                <ChevronDown size={16} className={`transform transition-transform ${expandedSection === "videos" ? 'rotate-180' : ''}`} />
              </button>
              {expandedSection === "videos" && (
                <div className="pl-11 pr-4 py-2 space-y-1 bg-gray-50 border-l-2 border-[#15664a] ml-4 mt-1 rounded-r-sm">
                  <div className="text-xs font-bold text-gray-400 mb-1 mt-2 uppercase tracking-wider">All Videos</div>
                  <button onClick={() => { setView("videos"); setPage(1); setSearchQuery(""); setIsMobileMenuOpen(false); }} className={`block w-full text-left py-1.5 text-sm font-medium ${view === "videos" ? "text-[#15664a]" : "text-gray-600 hover:text-gray-900"}`}>List Videos</button>
                  <button onClick={() => { openVideoEditor(); setIsMobileMenuOpen(false); }} className={`block w-full text-left py-1.5 text-sm font-medium ${view === "newVideo" ? "text-[#15664a]" : "text-gray-600 hover:text-gray-900"}`}>+ Create Video</button>
                  <div className="text-xs font-bold text-gray-400 mb-1 mt-3 uppercase tracking-wider">Programs</div>
                  <button onClick={() => { setView("programs"); setPage(1); setSearchQuery(""); setIsMobileMenuOpen(false); }} className={`block w-full text-left py-1.5 text-sm font-medium ${view === "programs" ? "text-[#15664a]" : "text-gray-600 hover:text-gray-900"}`}>List Programs</button>
                  <button onClick={() => { openProgramEditor(); setIsMobileMenuOpen(false); }} className={`block w-full text-left py-1.5 text-sm font-medium ${view === "newProgram" ? "text-[#15664a]" : "text-gray-600 hover:text-gray-900"}`}>+ Create Program</button>
                </div>
              )}
            </div>

            <div>
              <button onClick={() => handleCategoryClick("podcasts")} className={`w-full flex items-center justify-between px-4 py-2.5 rounded-sm font-medium transition-colors ${view === "podcasts" || view === "newPodcast" || view === "editPodcast" ? "bg-[#15664a] text-white" : "text-gray-700 hover:bg-gray-100"}`}>
                <div className="flex items-center gap-3"><Mic size={18} /> Podcasts</div>
                <ChevronDown size={16} className={`transform transition-transform ${expandedSection === "podcasts" ? 'rotate-180' : ''}`} />
              </button>
              {expandedSection === "podcasts" && (
                <div className="pl-11 pr-4 py-2 space-y-1 bg-gray-50 border-l-2 border-[#15664a] ml-4 mt-1 rounded-r-sm">
                  <button onClick={() => { setView("podcasts"); setPage(1); setSearchQuery(""); setIsMobileMenuOpen(false); }} className={`block w-full text-left py-1.5 text-sm font-medium ${view === "podcasts" ? "text-[#15664a]" : "text-gray-600 hover:text-gray-900"}`}>List Podcasts</button>
                  <button onClick={() => { openPodcastEditor(); setIsMobileMenuOpen(false); }} className={`block w-full text-left py-1.5 text-sm font-medium ${view === "newPodcast" ? "text-[#15664a]" : "text-gray-600 hover:text-gray-900"}`}>+ Create Podcast</button>
                </div>
              )}
            </div>


            <button onClick={() => { setView("authors"); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 text-left px-4 py-2.5 rounded-sm font-medium transition-colors ${view === "authors" ? "bg-[#15664a] text-white" : "text-gray-700 hover:bg-gray-100"}`}>
              <User size={18} /> Authors &amp; Scholars
            </button>

            <button onClick={() => { setView("spotlight"); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 text-left px-4 py-2.5 rounded-sm font-medium transition-colors ${view === "spotlight" ? "bg-[#15664a] text-white" : "text-gray-700 hover:bg-gray-100"}`}>
              <Eye size={18} /> Spotlight
            </button>

            <h4 className="px-4 pt-2 text-xs font-bold text-gray-400 uppercase tracking-wider">System</h4>
            <button onClick={() => { setView("profile"); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 text-left px-4 py-2.5 rounded-sm font-medium transition-colors ${view === "profile" ? "bg-[#15664a] text-white" : "text-gray-700 hover:bg-gray-100"}`}>
              <User size={18} /> Profile Settings
            </button>
            <button onClick={() => { setView("homepage"); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 text-left px-4 py-2.5 rounded-sm font-medium transition-colors ${view === "homepage" ? "bg-[#15664a] text-white" : "text-gray-700 hover:bg-gray-100"}`}>
              <LayoutDashboard size={18} /> Homepage Settings
            </button>
            <div>
              <button onClick={() => handleCategoryClick("settings")} className={`w-full flex items-center justify-between px-4 py-2.5 rounded-sm font-medium transition-colors ${view.startsWith("settings-") ? "bg-[#15664a] text-white" : "text-gray-700 hover:bg-gray-100"}`}>
                <div className="flex items-center gap-3"><Settings size={18} /> Settings</div>
                <ChevronDown size={16} className={`transform transition-transform ${expandedSection === "settings" ? 'rotate-180' : ''}`} />
              </button>
              {expandedSection === "settings" && (
                <div className="pl-11 pr-4 py-2 space-y-1 bg-gray-50 border-l-2 border-[#15664a] ml-4 mt-1 rounded-r-sm">
                  <button onClick={() => { setView("settings-podcast-shows"); setIsMobileMenuOpen(false); }} className={`block w-full text-left py-1.5 text-sm font-medium ${view === "settings-podcast-shows" ? "text-[#15664a] font-bold" : "text-gray-600 hover:text-gray-900"}`}>Podcast Shows & RSS</button>
                  <button onClick={() => { setView("settings-about"); setIsMobileMenuOpen(false); }} className={`block w-full text-left py-1.5 text-sm font-medium ${view === "settings-about" ? "text-[#15664a]" : "text-gray-600 hover:text-gray-900"}`}>About Us</button>
                  <button onClick={() => { setView("settings-contact"); setIsMobileMenuOpen(false); }} className={`block w-full text-left py-1.5 text-sm font-medium ${view === "settings-contact" ? "text-[#15664a]" : "text-gray-600 hover:text-gray-900"}`}>Contact Us</button>
                  <button onClick={() => { setView("settings-social-platforms"); setIsMobileMenuOpen(false); }} className={`block w-full text-left py-1.5 text-sm font-medium ${view === "settings-social-platforms" ? "text-[#15664a]" : "text-gray-600 hover:text-gray-900"}`}>Social Platforms</button>
                  <button onClick={() => { setView("settings-podcast-platforms"); setIsMobileMenuOpen(false); }} className={`block w-full text-left py-1.5 text-sm font-medium ${view === "settings-podcast-platforms" ? "text-[#15664a]" : "text-gray-600 hover:text-gray-900"}`}>Podcast Platforms</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex gap-8">
        <aside className="hidden md:block w-64 flex-shrink-0">
          <nav className="space-y-6">
            <div>
              <h4 className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Main</h4>
              <button onClick={() => setView("overview")} className={`w-full flex items-center gap-3 text-left px-4 py-2.5 rounded-sm font-medium transition-colors ${view === "overview" ? "bg-[#15664a] text-white" : "text-gray-700 hover:bg-gray-100"}`}>
                <LayoutDashboard size={18} /> Overview Hub
              </button>
            </div>
            <div>
              <h4 className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Content</h4>
              <button onClick={() => { setView("articles"); setPage(1); setSearchQuery(""); }} className={`w-full flex items-center gap-3 text-left px-4 py-2.5 rounded-sm font-medium transition-colors ${view === "articles" ? "bg-[#15664a] text-white" : "text-gray-700 hover:bg-gray-100"}`}>
                <FileText size={18} /> Articles
              </button>
              <button onClick={() => { setView("videos"); setPage(1); setSearchQuery(""); }} className={`w-full flex items-center gap-3 text-left px-4 py-2.5 rounded-sm font-medium transition-colors ${view === "videos" || view === "programs" || view === "newProgram" || view === "editProgram" || view === "newVideo" || view === "editVideo" ? "bg-[#15664a] text-white" : "text-gray-700 hover:bg-gray-100"}`}>
                <Video size={18} /> Videos
              </button>
              <button onClick={() => { setView("podcasts"); setPage(1); setSearchQuery(""); }} className={`w-full flex items-center gap-3 text-left px-4 py-2.5 rounded-sm font-medium transition-colors ${view === "podcasts" || view === "newPodcast" || view === "editPodcast" ? "bg-[#15664a] text-white" : "text-gray-700 hover:bg-gray-100"}`}>
                <Mic size={18} /> Podcasts
              </button>
              <button onClick={() => { setView("authors"); setPage(1); setSearchQuery(""); }} className={`w-full flex items-center gap-3 text-left px-4 py-2.5 rounded-sm font-medium transition-colors ${view === "authors" ? "bg-[#15664a] text-white" : "text-gray-700 hover:bg-gray-100"}`}>
                <User size={18} /> Authors &amp; Scholars
              </button>
              <button onClick={() => { setView("settings-podcast-shows"); setPage(1); setSearchQuery(""); }} className={`w-full flex items-center gap-3 text-left px-4 py-2.5 rounded-sm font-medium transition-colors ${view === "settings-podcast-shows" ? "bg-[#15664a] text-white" : "text-gray-700 hover:bg-gray-100"}`}>
                <Radio size={18} /> Podcast Shows & RSS
              </button>

              <button onClick={() => { setView("spotlight"); }} className={`w-full flex items-center gap-3 text-left px-4 py-2.5 rounded-sm font-medium transition-colors ${view === "spotlight" ? "bg-[#15664a] text-white" : "text-gray-700 hover:bg-gray-100"}`}>
                <Eye size={18} /> Spotlight
              </button>
              <button onClick={() => { setView("profile"); setPage(1); setSearchQuery(""); }} className={`w-full flex items-center gap-3 text-left px-4 py-2.5 rounded-sm font-medium transition-colors ${view === "profile" ? "bg-[#15664a] text-white" : "text-gray-700 hover:bg-gray-100"}`}>
                <User size={18} /> Profile Hub
              </button>
              <button onClick={() => { setView("homepage"); setPage(1); setSearchQuery(""); }} className={`w-full flex items-center gap-3 text-left px-4 py-2.5 rounded-sm font-medium transition-colors ${view === "homepage" ? "bg-[#15664a] text-white" : "text-gray-700 hover:bg-gray-100"}`}>
                <LayoutDashboard size={18} /> Homepage Settings
              </button>
            </div>
            <div>
              <h4 className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">System</h4>
              <button onClick={() => handleCategoryClick("settings")} className={`w-full flex items-center justify-between px-4 py-2.5 rounded-sm font-medium transition-colors ${view.startsWith("settings-") ? "bg-[#15664a] text-white" : "text-gray-700 hover:bg-gray-100"}`}>
                <div className="flex items-center gap-3"><Settings size={18} /> Settings</div>
                <ChevronDown size={16} className={`transform transition-transform ${expandedSection === "settings" ? 'rotate-180' : ''}`} />
              </button>
              {expandedSection === "settings" && (
                <div className="pl-11 pr-4 py-2 space-y-1 bg-gray-50 border-l-2 border-[#15664a] ml-4 mt-1 rounded-r-sm">
                  <button onClick={() => { setView("settings-podcast-shows"); setPage(1); setSearchQuery(""); }} className={`block w-full text-left py-1.5 text-sm font-medium ${view === "settings-podcast-shows" ? "text-[#15664a] font-bold" : "text-gray-600 hover:text-gray-900"}`}>Podcast Shows & RSS</button>
                  <button onClick={() => { setView("settings-about"); setPage(1); setSearchQuery(""); }} className={`block w-full text-left py-1.5 text-sm font-medium ${view === "settings-about" ? "text-[#15664a]" : "text-gray-600 hover:text-gray-900"}`}>About Us</button>
                  <button onClick={() => { setView("settings-contact"); setPage(1); setSearchQuery(""); }} className={`block w-full text-left py-1.5 text-sm font-medium ${view === "settings-contact" ? "text-[#15664a]" : "text-gray-600 hover:text-gray-900"}`}>Contact Us</button>
                  <button onClick={() => { setView("settings-social-platforms"); setPage(1); setSearchQuery(""); }} className={`block w-full text-left py-1.5 text-sm font-medium ${view === "settings-social-platforms" ? "text-[#15664a]" : "text-gray-600 hover:text-gray-900"}`}>Social Platforms</button>
                  <button onClick={() => { setView("settings-podcast-platforms"); setPage(1); setSearchQuery(""); }} className={`block w-full text-left py-1.5 text-sm font-medium ${view === "settings-podcast-platforms" ? "text-[#15664a]" : "text-gray-600 hover:text-gray-900"}`}>Podcast Platforms</button>
                </div>
              )}
            </div>
            <div>
              <h4 className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">External Systems</h4>
              <a href="https://fiqhfiles.samasthagraph.com/admin" target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-between px-4 py-2.5 rounded-sm font-medium transition-colors text-gray-700 hover:bg-gray-100">
                <div className="flex items-center gap-3"><ExternalLink size={18} /> Fiqh Files CMS ↗</div>
              </a>
            </div>
            <div>
              <h4 className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Quick Actions</h4>
              <div className="relative px-4" ref={dropdownRef}>
                <button
                  onClick={() => setIsCreateDropdownOpen(!isCreateDropdownOpen)}
                  className="w-full flex items-center justify-between bg-[#15664a] text-white px-4 py-2.5 rounded-sm font-medium hover:bg-[#0f4d38] transition-colors shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <Plus size={18} /> Create New
                  </div>
                  <ChevronDown size={16} className={`transform transition-transform ${isCreateDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isCreateDropdownOpen && (
                  <div className="absolute top-full left-4 right-4 mt-2 bg-white border border-gray-200 rounded-sm shadow-lg overflow-hidden z-50">
                    <button onClick={() => { openArticleEditor(); setIsCreateDropdownOpen(false); }} className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100">
                      <FileText size={16} className="text-blue-600" /> New Article
                    </button>
                    <button onClick={() => { openVideoEditor(); setIsCreateDropdownOpen(false); }} className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100">
                      <Video size={16} className="text-red-600" /> New Video
                    </button>
                    <button onClick={() => { openPodcastEditor(); setIsCreateDropdownOpen(false); }} className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100">
                      <Mic size={16} className="text-purple-600" /> New Podcast
                    </button>
                    <button onClick={() => { setView("authors"); setIsCreateDropdownOpen(false); }} className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                      <User size={16} className="text-emerald-600" /> Authors &amp; Scholars
                    </button>
                  </div>
                )}
              </div>
            </div>
          </nav>
        </aside>

        <main className="flex-1 min-w-0">
          {actionData?.success && (
            <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-sm flex justify-between items-center shadow-sm">
              <p>{actionData.message}</p>
            </div>
          )}
          {actionData?.error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-sm shadow-sm">
              <p>{actionData.error}</p>
            </div>
          )}

          {/* Programs List View */}
          {view === "programs" && (
            <div>
              <div className="flex border-b border-gray-200 bg-gray-50 mb-6 rounded-t-sm shadow-sm">
                <button onClick={() => setView("videos")} className="px-6 py-3 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700">All Videos</button>
                <button onClick={() => setView("programs")} className="px-6 py-3 border-b-2 font-medium text-sm border-[#15664a] text-[#15664a]">Programs / Playlists</button>
              </div>
              <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">Programs &amp; Series</h1>
                  <p className="text-gray-500 mt-1">Manage video programs and series collections.</p>
                </div>
                <button onClick={() => openProgramEditor()} className="flex items-center gap-2 bg-[#15664a] text-white px-4 py-2 rounded-sm font-semibold hover:bg-[#0f4d38] transition-colors shadow-sm">
                  <Plus size={18} /> Create Program
                </button>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" placeholder="Search programs..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-sm focus:ring-2 focus:ring-[#15664a] outline-none text-sm" />
                </div>
                <select value={langFilter} onChange={e => setLangFilter(e.target.value as any)} className="px-3 py-2 border border-gray-200 rounded-sm focus:ring-2 focus:ring-[#15664a] outline-none text-sm bg-white">
                  <option value="all">All Languages</option>
                  <option value="ml">Malayalam</option>
                  <option value="en">English</option>
                </select>
              </div>
              <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
                {programs.filter((p: any) => {
                  const searchMatch = p.title?.toLowerCase().includes(searchQuery.toLowerCase()) || p.slug?.toLowerCase().includes(searchQuery.toLowerCase());
                  const lang = p.language || "ml";
                  if (langFilter === "all") return searchMatch;
                  if (langFilter === "ml") return searchMatch && lang === "ml";
                  if (langFilter === "en") return searchMatch && lang === "en";
                  return searchMatch;
                }).length === 0 ? (
                  <div className="p-12 text-center text-gray-400">
                    <BarChart2 size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No programs found.</p>
                    <p className="text-sm mt-1">Create your first Program using the button above.</p>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Title</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">Language</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Category</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                        <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {programs.filter((p: any) => {
                        const searchMatch = p.title?.toLowerCase().includes(searchQuery.toLowerCase()) || p.slug?.toLowerCase().includes(searchQuery.toLowerCase());
                        const lang = p.language || "ml";
                        if (langFilter === "all") return searchMatch;
                        if (langFilter === "ml") return searchMatch && lang === "ml";
                        if (langFilter === "en") return searchMatch && lang === "en";
                        return searchMatch;
                      }).map((program: any) => (
                        <tr key={program.slug} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-800 break-words">{program.title}</div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <div className="text-xs text-gray-400">{program.slug}</div>
                              <div className="text-[10px] font-semibold text-[#15664a] bg-[#15664a]/10 px-1.5 py-0.5 rounded-sm">
                                {videos.filter(v => v.programId === program.slug).length} {videos.filter(v => v.programId === program.slug).length === 1 ? 'video' : 'videos'}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">{program.language === 'en' ? 'EN' : 'ML'}</span>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell text-gray-600">{program.category || 'General'}</td>
                          <td className="px-4 py-3"><StatusBadge status={program.status || 'draft'} /></td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => openProgramEditor(program)} className="p-1.5 text-gray-500 hover:text-[#15664a] hover:bg-green-50 rounded-sm transition-colors" title="Edit">
                                <Edit size={16} />
                              </button>
                              <button onClick={() => handleDeleteProgram(program.slug)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-sm transition-colors" title="Delete">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* Program Editor (Create / Edit) */}
          {(view === "newProgram" || view === "editProgram") && (
            <div>
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">{view === "newProgram" ? "Create Program" : "Edit Program"}</h1>
                  <p className="text-gray-500 mt-1">{view === "newProgram" ? "Add a new video program or series." : `Editing: ${editingProgram?.title}`}</p>
                </div>
                <button type="button" onClick={() => setView("programs")} className="px-4 py-2 border border-gray-300 rounded-sm text-gray-700 font-semibold hover:bg-gray-50">Cancel</button>
              </div>
              <Form method="post" className="space-y-6 bg-white p-6 rounded-sm border border-gray-200 shadow-sm">
                <input type="hidden" name="intent" value="saveProgram" />
                <input type="hidden" name="originalSlug" value={editingProgram?.slug || ""} />
                <input type="hidden" name="originalLanguage" value={editingProgram?.language || ""} />

                {/* Status */}
                <div className="flex flex-col sm:flex-row items-center justify-between bg-gray-50 p-4 rounded-sm border border-gray-200 gap-4">
                  <span className="font-semibold text-gray-700">Visibility Status</span>
                  <div className="flex flex-wrap gap-3">
                    <label className="flex items-center gap-2 bg-white px-4 py-2 border rounded-sm cursor-pointer hover:bg-gray-50">
                      <input type="radio" name="status" value="published" defaultChecked={editingProgram?.status === 'published' || !editingProgram?.status} className="accent-[#15664a]" />
                      <span className="text-sm font-medium text-gray-800">Published</span>
                    </label>
                    <label className="flex items-center gap-2 bg-white px-4 py-2 border rounded-sm cursor-pointer hover:bg-gray-50">
                      <input type="radio" name="status" value="scheduled" defaultChecked={editingProgram?.status === 'scheduled'} className="accent-[#15664a]" />
                      <span className="text-sm font-medium text-gray-800">Scheduled</span>
                    </label>
                    <label className="flex items-center gap-2 bg-white px-4 py-2 border rounded-sm cursor-pointer hover:bg-gray-50">
                      <input type="radio" name="status" value="draft" defaultChecked={editingProgram?.status === 'draft'} className="accent-[#15664a]" />
                      <span className="text-sm font-medium text-gray-800">Draft (Hidden)</span>
                    </label>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Title *</label>
                  <input type="text" name="title" defaultValue={editingProgram?.title} required className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-[#15664a] outline-none" />
                </div>

                {/* Slug */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">URL Slug (Optional: Leave blank to auto-generate from title)</label>
                  <input type="text" name="newSlug" defaultValue={editingProgram?.slug || ""} className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-[#15664a] outline-none" placeholder="e.g. minal-qalb" />
                  <p className="text-xs text-gray-400 mt-1">Must use English/ASCII characters only. Never use Malayalam text as a slug.</p>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description (Optional)</label>
                  <textarea name="description" defaultValue={editingProgram?.description || ''} rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-[#15664a] outline-none" />
                </div>

                {/* Cover Image */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Cover Image (Optional)</label>
                  <input type="text" name="coverImage" defaultValue={editingProgram?.coverImage || ''} className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-[#15664a] outline-none" placeholder="https://..." />
                  <p className="text-xs text-gray-400 mt-1">Leave blank to use the YouTube-derived thumbnail when available.</p>
                </div>
                
                {/* Preview */}
                <div className="mb-6 p-4 border border-gray-200 rounded-sm bg-gray-50 flex flex-col gap-2">
                   <p className="text-sm font-semibold text-gray-700">Preview</p>
                   <div className="aspect-video w-48 bg-[#2D5A46]/10 relative overflow-hidden rounded-sm flex items-center justify-center">
                     {editingProgram?.coverImage ? (
                        <img src={editingProgram.coverImage} className="w-full h-full object-cover" alt="Custom Cover" />
                     ) : programThumbnailPreview ? (
                        <img src={programThumbnailPreview} className="w-full h-full object-cover" alt="YouTube Thumbnail" />
                     ) : (
                        <span className="text-[#2D5A46]/40 text-xl font-bold">▶</span>
                     )}
                   </div>
                   <input type="hidden" name="youtubeThumbnail" value={programThumbnailPreview} />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                  <select name="category" defaultValue={editingProgram?.category || 'General'} className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-[#15664a] outline-none bg-white">
                    <option value="Tafsir">Tafsir</option>
                    <option value="History">History</option>
                    <option value="Kids">Kids</option>
                    <option value="Shorts">Shorts</option>
                    <option value="General">General</option>
                  </select>
                </div>

                {/* YouTube Playlist */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">YouTube Playlist (Optional)</label>
                  <input type="text" name="youtubePlaylistId" value={programPlaylistInput} onChange={(e) => setProgramPlaylistInput(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-[#15664a] outline-none" placeholder="https://youtube.com/playlist?list=..." />
                  <p className="text-xs text-gray-400 mt-1">Paste a YouTube playlist URL or Playlist ID. Used for YouTube sync metadata.</p>
                </div>

                {/* Language + Translation Group */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 border border-gray-200 rounded-sm">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Language</label>
                    <select name="language" defaultValue={editingProgram?.language || 'ml'} className="w-full px-4 py-2 border border-gray-300 bg-white rounded-sm focus:ring-2 focus:ring-[#15664a] outline-none">
                      <option value="ml">Malayalam</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Translation Group ID (Optional)</label>
                    <input type="text" name="translationGroupId" defaultValue={editingProgram?.translationGroupId || ''} className="w-full px-4 py-2 border border-gray-300 bg-white rounded-sm focus:ring-2 focus:ring-[#15664a] outline-none" placeholder="e.g. group-minal-qalb" />
                  </div>
                </div>

                {/* Published At */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Published Date</label>
                  <input type="date" name="publishedAt" defaultValue={editingProgram?.publishedAt || new Date().toISOString().split('T')[0]} className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-[#15664a] outline-none" />
                </div>

                {/* Actions */}
                <div className="pt-6 border-t border-gray-100 flex justify-end gap-4">
                  <button type="button" onClick={() => setView("programs")} className="px-6 py-2 border border-gray-300 rounded-sm text-gray-700 font-semibold hover:bg-gray-50">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="bg-[#15664a] text-white px-8 py-2 rounded-sm font-bold hover:bg-[#0f4d38] transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm">
                    {isSubmitting ? "Saving..." : "Save Program"}
                  </button>
                </div>
              </Form>
            </div>
          )}

          {/* Spotlight Editor */}
          {view === "spotlight" && (
            <div>
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Spotlight / Hero</h1>
                <p className="text-gray-500 mt-1">Configure the editorial hero shown at the top of the Videos page.</p>
              </div>
              <Form method="post" className="space-y-6 bg-white p-6 rounded-sm border border-gray-200 shadow-sm">
                <input type="hidden" name="intent" value="saveSpotlight" />

                {/* Hero Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Spotlight Type</label>
                  <div className="flex flex-wrap gap-3">
                    {(['program', 'video', 'upcoming'] as const).map(type => (
                      <label key={type} className="flex items-center gap-2 bg-gray-50 px-4 py-2 border rounded-sm cursor-pointer hover:bg-gray-100 capitalize">
                        <input type="radio" name="heroType" value={type} defaultChecked={(spotlightSettings?.heroType || 'video') === type} onChange={e => setSpotlightHeroType(e.target.value)} className="accent-[#15664a]" />
                        <span className="text-sm font-medium text-gray-800 capitalize">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Program Reference */}
                {spotlightHeroType === 'program' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Select Program</label>
                    <select name="referenceId" defaultValue={spotlightSettings?.referenceId || ''} className="w-full px-4 py-2 border border-gray-300 bg-white rounded-sm focus:ring-2 focus:ring-[#15664a] outline-none">
                      <option value="">(none)</option>
                      {programs.filter((p: any) => p.status === 'published').map((p: any) => (
                        <option key={p.slug} value={p.slug}>{p.title} ({p.language === 'en' ? 'EN' : 'ML'})</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Video Reference */}
                {spotlightHeroType === 'video' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Select Video</label>
                    <select name="referenceId" defaultValue={spotlightSettings?.referenceId || ''} className="w-full px-4 py-2 border border-gray-300 bg-white rounded-sm focus:ring-2 focus:ring-[#15664a] outline-none">
                      <option value="">(none — auto-select latest)</option>
                      {videos.filter((v: any) => v.status === 'published').slice(0, 50).map((v: any) => (
                        <option key={v.slug} value={v.slug}>{v.title} ({v.language === 'en' ? 'EN' : 'ML'})</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Upcoming Fields */}
                {spotlightHeroType === 'upcoming' && (
                  <div className="space-y-4 p-4 bg-amber-50 border border-amber-200 rounded-sm">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Upcoming Title *</label>
                      <input type="text" name="upcomingTitle" defaultValue={spotlightSettings?.upcomingTitle || ''} className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-amber-400 outline-none" placeholder="e.g. New Series Coming Soon" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Expected Date</label>
                      <input type="date" name="upcomingDate" defaultValue={spotlightSettings?.upcomingDate || ''} className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-amber-400 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Description (Optional)</label>
                      <textarea name="upcomingDescription" defaultValue={spotlightSettings?.upcomingDescription || ''} rows={2} className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-amber-400 outline-none" />
                    </div>
                  </div>
                )}

                {/* Custom Banner */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Custom Banner Image URL (Optional)</label>
                  <input type="text" name="customBanner" defaultValue={spotlightSettings?.customBanner || ''} className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-[#15664a] outline-none" placeholder="https://..." />
                </div>

                <div className="pt-6 border-t border-gray-100 flex justify-end">
                  <button type="submit" disabled={isSubmitting} className="bg-[#15664a] text-white px-8 py-2 rounded-sm font-bold hover:bg-[#0f4d38] transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm">
                    {isSubmitting ? "Saving..." : "Save Spotlight"}
                  </button>
                </div>
              </Form>
            </div>
          )}

          {view === "profile" && (
            <ProfileAdmin profileSettings={profileSettings} />
          )}

          {view === "homepage" && (
            <Form method="post">
              <input type="hidden" name="intent" value="saveHomepage" />
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">Homepage Settings</h1>
                  <p className="text-gray-500 mt-1">Manage the hero section and featured content of the Samastha Graph homepage.</p>
                </div>
                <button type="submit" disabled={isSubmitting} className="bg-[#15664a] text-white px-6 py-2.5 rounded-sm font-semibold hover:bg-[#0f4d38] transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50">
                  <Send size={18} /> {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
              <HomepageAdmin homepageSettings={homepageSettings} articles={articles} videos={videos} />
            </Form>
          )}

          {view === "settings-about" && (
            <Form method="post">
              <input type="hidden" name="intent" value="saveAbout" />
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">About Us Settings</h1>
                  <p className="text-gray-500 mt-1">Manage the content of the About Us page.</p>
                </div>
                <button type="submit" disabled={isSubmitting} className="bg-[#15664a] text-white px-6 py-2.5 rounded-sm font-semibold hover:bg-[#0f4d38] transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50">
                  <Send size={18} /> {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
              {aboutSettings ? (
                <AboutAdmin aboutSettings={aboutSettings} />
              ) : (
                <div className="bg-white p-8 rounded-sm shadow-sm border border-gray-200 text-center text-gray-500">
                  Unable to load About settings. Please refresh and try again.
                </div>
              )}
            </Form>
          )}

          {view === "settings-contact" && (
            <Form method="post">
              <input type="hidden" name="intent" value="saveContact" />
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">Contact Us Settings</h1>
                  <p className="text-gray-500 mt-1">Manage the content of the Contact Us page.</p>
                </div>
                <button type="submit" disabled={isSubmitting} className="bg-[#15664a] text-white px-6 py-2.5 rounded-sm font-semibold hover:bg-[#0f4d38] transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50">
                  <Send size={18} /> {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
              {contactSettings ? (
                <ContactAdmin contactSettings={contactSettings} />
              ) : (
                <div className="bg-white p-8 rounded-sm shadow-sm border border-gray-200 text-center text-gray-500">
                  Unable to load Contact settings. Please refresh and try again.
                </div>
              )}
            </Form>
          )}

          {view === "settings-social-platforms" && (
            <Form method="post">
              <input type="hidden" name="intent" value="saveSocialPlatforms" />
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">Social Platforms</h1>
                  <p className="text-gray-500 mt-1">Manage social media platforms and links.</p>
                </div>
                <button type="submit" disabled={isSubmitting} className="bg-[#15664a] text-white px-6 py-2.5 rounded-sm font-semibold hover:bg-[#0f4d38] transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50">
                  <Send size={18} /> {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
              {socialPlatformSettings ? (
                <PlatformAdmin platformSettings={socialPlatformSettings} platformType="social" />
              ) : (
                <div className="bg-white p-8 rounded-sm shadow-sm border border-gray-200 text-center text-gray-500">
                  Unable to load Social Platform settings. Please refresh and try again.
                </div>
              )}
            </Form>
          )}

          {view === "settings-podcast-platforms" && (
            <Form method="post">
              <input type="hidden" name="intent" value="savePodcastPlatforms" />
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">Podcast Platforms</h1>
                  <p className="text-gray-500 mt-1">Manage podcast platforms and links.</p>
                </div>
                <button type="submit" disabled={isSubmitting} className="bg-[#15664a] text-white px-6 py-2.5 rounded-sm font-semibold hover:bg-[#0f4d38] transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50">
                  <Send size={18} /> {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
              {podcastPlatformSettings ? (
                <PlatformAdmin platformSettings={podcastPlatformSettings} platformType="podcast" />
              ) : (
                <div className="bg-white p-8 rounded-sm shadow-sm border border-gray-200 text-center text-gray-500">
                  Unable to load Podcast Platform settings. Please refresh and try again.
                </div>
              )}
            </Form>
          )}

          {view === "authors" && (
            <Form method="post">
              <input type="hidden" name="intent" value="saveAuthors" />
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">Authors &amp; Scholars</h1>
                  <p className="text-gray-500 mt-1">Manage writers, scholars, and contributors across Samastha Graph.</p>
                </div>
                <button type="submit" disabled={isSubmitting} className="bg-[#15664a] text-white px-6 py-2.5 rounded-sm font-semibold hover:bg-[#0f4d38] transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50">
                  <Send size={18} /> {isSubmitting ? "Saving..." : "Save All Authors"}
                </button>
              </div>
              <AuthorsAdmin authorsSettings={authorsSettings || { authors: [] }} />
            </Form>
          )}

          {view === "settings-podcast-shows" && (
            <Form method="post">
              <input type="hidden" name="intent" value="savePodcastShows" />
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">Podcast Shows & RSS Feeds</h1>
                  <p className="text-gray-500 mt-1">Manage Spotify & Anchor RSS feeds, show titles, and artwork.</p>
                </div>
                <button type="submit" disabled={isSubmitting} className="bg-[#15664a] text-white px-6 py-2.5 rounded-sm font-semibold hover:bg-[#0f4d38] transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50">
                  <Send size={18} /> {isSubmitting ? "Saving..." : "Save All Shows"}
                </button>
              </div>
              <PodcastShowsAdmin podcastShowsSettings={podcastShowsSettings || { shows: [] }} />
            </Form>
          )}

          {view === "overview" && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-800">Dashboard Hub</h1>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-sm shadow border border-gray-200">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><FileText size={24} /></div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Total Articles</p>
                      <h3 className="text-2xl font-bold text-gray-900">{articles.length}</h3>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-4 text-xs font-medium">
                    <span className="text-green-600">{articles.filter((a: any) => a.status !== 'draft').length} Published</span>
                    <span className="text-yellow-600">{articles.filter((a: any) => a.status === 'draft').length} Drafts</span>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-sm shadow border border-gray-200">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-red-50 text-red-600 rounded-lg"><Video size={24} /></div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Total Videos</p>
                      <h3 className="text-2xl font-bold text-gray-900">{videos.length}</h3>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-4 text-xs font-medium">
                    <span className="text-green-600">{videos.filter((v: any) => v.status === 'published').length} Pub</span>
                    <span className="text-purple-600">{videos.filter((v: any) => v.status === 'scheduled').length} Sched</span>
                    <span className="text-yellow-600">{videos.filter((v: any) => v.status === 'draft').length} Draft</span>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-sm shadow border border-gray-200">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><Mic size={24} /></div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Total Podcasts</p>
                      <h3 className="text-2xl font-bold text-gray-900">{podcasts.length}</h3>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-sm shadow border border-gray-200 overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                  <h3 className="text-lg font-bold text-gray-800">Recent Activity</h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {allRecentActivity.map((item: any) => (
                    <div key={`${item.type}-${item.slug}`} className="p-4 sm:px-6 hover:bg-gray-50 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${item.type === 'article' ? 'bg-blue-100 text-blue-600' : item.type === 'video' ? 'bg-red-100 text-red-600' : 'bg-purple-100 text-purple-600'}`}>
                          {item.type === 'article' ? <FileText size={16} /> : item.type === 'video' ? <Video size={16} /> : <Mic size={16} />}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                          <div className="flex gap-2 text-xs text-gray-500 mt-1">
                            <span className="uppercase">{item.type}</span> • <span>{item.publishedAt}</span> • <StatusBadge status={item.status || 'published'} />
                          </div>
                        </div>
                      </div>
                      <div>
                        {item.type === 'article' && <button onClick={() => openArticleEditor(item)} className="text-[#15664a] hover:underline text-sm font-medium">Edit</button>}
                        {item.type === 'video' && <button onClick={() => openVideoEditor(item)} className="text-[#15664a] hover:underline text-sm font-medium">Edit</button>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {(view === "articles" || view === "videos" || view === "podcasts") && (
            <div className="bg-white rounded-sm shadow border border-gray-200 overflow-hidden">
              {view === "videos" && (
                <div className="flex border-b border-gray-200 bg-gray-50">
                  <button onClick={() => setView("videos")} className="px-6 py-3 border-b-2 font-medium text-sm border-[#15664a] text-[#15664a]">All Videos</button>
                  <button onClick={() => setView("programs")} className="px-6 py-3 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700">Programs / Playlists</button>
                </div>
              )}
              <div className="p-4 sm:p-6 border-b border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <h2 className="text-xl font-bold text-gray-800 capitalize">{view === "videos" ? "All Videos" : view}</h2>
                <div className="flex gap-4 w-full sm:w-auto">
                  <div className="relative w-full sm:w-64">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder={`Search ${view}...`}
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-[#15664a] outline-none text-sm"
                    />
                  </div>
                  <select
                    value={langFilter}
                    onChange={(e) => { setLangFilter(e.target.value as any); setPage(1); }}
                    className="px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-[#15664a] outline-none text-sm bg-white"
                  >
                    <option value="all">All Languages</option>
                    <option value="ml">Malayalam (Default)</option>
                    <option value="en">English</option>
                  </select>
                  <button
                    onClick={() => view === "articles" ? openArticleEditor() : view === "videos" ? openVideoEditor() : openPodcastEditor()}
                    className="flex items-center gap-2 bg-[#15664a] text-white px-4 py-2 rounded-sm text-sm font-medium hover:bg-[#0f4d38] whitespace-nowrap"
                  >
                    <Plus size={16} /> New
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedList.length === 0 ? (
                      <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No records found.</td></tr>
                    ) : paginatedList.map((item: any, idx: number) => (
                      <tr key={item.slug} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(page - 1) * itemsPerPage + idx + 1}</td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900 truncate max-w-[200px] sm:max-w-[300px]">{item.title}</div>
                          <div className="text-xs text-gray-500 truncate max-w-[200px]">{item.slug}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={item.status || 'published'} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.publishedAt}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-3">
                            <button onClick={() => handleMove(item, view === "articles" ? "article" : view === "videos" ? "video" : "podcast")} className="text-gray-500 hover:text-[#c8a136]" title="Move / Change Date"><CalendarIcon size={18} /></button>
                            <Link to={`/${view}/${item.slug}`} target="_blank" className="text-gray-500 hover:text-blue-600" title="View Live"><Eye size={18} /></Link>
                            <button onClick={() => view === "articles" ? openArticleEditor(item) : view === "videos" ? openVideoEditor(item) : openPodcastEditor(item)} className="text-gray-500 hover:text-[#15664a]" title="Edit"><Edit size={18} /></button>
                            <button onClick={() => handleDelete(item.slug, view === "articles" ? "article" : view === "videos" ? "video" : "podcast")} className="text-gray-500 hover:text-red-600" title="Delete"><Trash2 size={18} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
                  <span className="text-sm text-gray-700">Page {page} of {totalPages}</span>
                  <div className="flex gap-2">
                    <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 border rounded text-sm disabled:opacity-50">Prev</button>
                    <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border rounded text-sm disabled:opacity-50">Next</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {(view === "newArticle" || view === "editArticle" || view === "newVideo" || view === "editVideo" || view === "newPodcast" || view === "editPodcast") && (
            <div className="bg-white rounded-sm shadow border border-gray-200 p-6 sm:p-8">
              <div className="flex items-center justify-between mb-8 border-b pb-4">
                <h2 className="text-2xl font-bold text-gray-800">
                  {view === "newArticle" && "Create New Article"}
                  {view === "editArticle" && "Edit Article"}
                  {view === "newVideo" && "Create New Video"}
                  {view === "editVideo" && "Edit Video"}
                  {view === "newPodcast" && "Create New Podcast"}
                  {view === "editPodcast" && "Edit Podcast"}
                </h2>
                <button type="button" onClick={() => setView("overview")} className="text-gray-500 hover:text-gray-800"><X size={24} /></button>
              </div>

              <Form method="post" className="space-y-8">
                <input type="hidden" name="originalSlug" value={editingItem?.slug || ""} />
                <input type="hidden" name="intent" value={view.includes("Video") ? "saveVideo" : view.includes("Podcast") ? "savePodcast" : "saveArticle"} />
                <input type="hidden" name="body" value={editorContent} />
                <input type="hidden" name="publishedAt" value={editingItem?.publishedAt || ""} />


                {view.includes("Podcast") && (
                  <div className="space-y-4 bg-purple-50/50 p-6 rounded-sm border border-purple-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Audio URL *</label>
                        <input
                          type="text"
                          name="audioUrl"
                          defaultValue={editingItem?.audioUrl}
                          placeholder="https://.../audio.mp3"
                          required={view.includes("Podcast")}
                          className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-purple-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Duration (e.g. 45:30)</label>
                        <input
                          type="text"
                          name="duration"
                          defaultValue={editingItem?.duration}
                          placeholder="00:00"
                          className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-purple-500 outline-none"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Series Name</label>
                        <input
                          type="text"
                          name="series"
                          defaultValue={editingItem?.series}
                          placeholder="e.g. The Weekly Tafsir"
                          className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-purple-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Episode Number</label>
                        <input
                          type="number"
                          name="episodeNumber"
                          defaultValue={editingItem?.episodeNumber || 0}
                          className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-purple-500 outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Custom Artwork URL (Optional)</label>
                      <input
                        type="text"
                        name="customThumbnail"
                        defaultValue={editingItem?.customThumbnail}
                        className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                )}


                {view.includes("Video") && (
                  <input type="hidden" name="youtubeId" value={youtubePreviewId} />
                )}

                <div className="flex flex-col sm:flex-row items-center justify-between bg-gray-50 p-4 rounded-sm border border-gray-200 gap-4">
                  <span className="font-semibold text-gray-700">Visibility Status</span>
                  <div className="flex flex-wrap gap-3">
                    <label className="flex items-center gap-2 bg-white px-4 py-2 border rounded-sm cursor-pointer hover:bg-gray-50">
                      <input type="radio" name="status" value="published" defaultChecked={editingItem?.status === 'published' || !editingItem?.status} className="accent-[#15664a]" />
                      <span className="text-sm font-medium text-gray-800">Published</span>
                    </label>
                    <label className="flex items-center gap-2 bg-white px-4 py-2 border rounded-sm cursor-pointer hover:bg-gray-50">
                      <input type="radio" name="status" value="scheduled" defaultChecked={editingItem?.status === 'scheduled'} className="accent-[#15664a]" />
                      <span className="text-sm font-medium text-gray-800">Scheduled (Upcoming)</span>
                    </label>
                    <label className="flex items-center gap-2 bg-white px-4 py-2 border rounded-sm cursor-pointer hover:bg-gray-50">
                      <input type="radio" name="status" value="draft" defaultChecked={editingItem?.status === 'draft'} className="accent-[#15664a]" />
                      <span className="text-sm font-medium text-gray-800">Draft (Hidden)</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Title *</label>
                    <input type="text" name="title" defaultValue={editingItem?.title} required className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-[#15664a] outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Advanced Title (HTML/Styling allowed)</label>
                    <input type="text" name="advancedTitle" defaultValue={editingItem?.advancedTitle || editingItem?.title} className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-[#15664a] outline-none" placeholder='<span style="color:red">Title</span>' />
                  </div>
                </div>

                <div className="mt-6 mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">URL Slug (Optional: Leave blank to auto-generate)</label>
                  <input type="text" name="newSlug" defaultValue={editingItem?.slug || ""} className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-[#15664a] outline-none" placeholder="e.g. my-custom-article-slug" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 mb-6 p-4 bg-gray-50 border border-gray-200 rounded-sm">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Language</label>
                    <input type="hidden" name="originalLanguage" value={editingItem?.language || ""} />
                    <select name="language" defaultValue={editingItem?.language || "ml"} className="w-full px-4 py-2 border border-gray-300 bg-white rounded-sm focus:ring-2 focus:ring-[#15664a] outline-none">
                      <option value="ml">Malayalam</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Translation Group ID (Optional)</label>
                    <input type="text" name="translationGroupId" defaultValue={editingItem?.translationGroupId || ""} className="w-full px-4 py-2 border border-gray-300 bg-white rounded-sm focus:ring-2 focus:ring-[#15664a] outline-none" placeholder="e.g. group-123" />
                  </div>
                </div>

                {view.includes("Video") && (
                  <div className="space-y-4 bg-red-50/50 p-6 rounded-sm border border-red-100">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">YouTube URL *</label>
                      <input
                        type="text"
                        value={youtubeInput}
                        onChange={(e) => setYoutubeInput(e.target.value)}
                        placeholder="https://youtube.com/watch?v=..."
                        required={view.includes("Video")}
                        className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-red-500 outline-none"
                      />
                    </div>
                    {youtubePreviewId && (
                      <div className="mt-4 flex flex-col sm:flex-row gap-6 items-start">
                        <div className="w-full sm:w-1/2 aspect-video bg-black rounded-lg overflow-hidden shadow-lg border-2 border-red-100">
                          <iframe
                            src={`https://www.youtube.com/embed/${youtubePreviewId}`}
                            title="YouTube preview"
                            className="w-full h-full"
                            frameBorder="0"
                            allowFullScreen
                          ></iframe>
                        </div>
                        <div className="w-full sm:w-1/2 space-y-2">
                          <p className="text-sm font-semibold text-green-700 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500"></div> Valid YouTube ID: ${youtubePreviewId}</p>
                          <p className="text-xs text-gray-500">Thumbnail automatically extracted.</p>
                          <label className="block text-sm font-semibold text-gray-700 mt-4 mb-2">Custom Thumbnail Override URL (Optional)</label>
                          <input type="text" name="customThumbnail" defaultValue={editingItem?.customThumbnail} className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-red-500 outline-none text-sm" placeholder="Leave blank to use YouTube thumbnail" />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                    {view.includes("Article") ? (
                      <select name="category" defaultValue={editingItem?.category || "News"} className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-[#15664a] outline-none bg-white">
                        <option value="News">News</option>
                        <option value="Articles">Articles</option>
                        <option value="Updates">Updates</option>
                      </select>
                    ) : (
                      <select name="category" defaultValue={editingItem?.category || "General"} className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-red-500 outline-none bg-white">
                        <option value="Tafsir">Tafsir</option>
                        <option value="History">History</option>
                        <option value="Kids">Kids</option>
                        <option value="Shorts">Shorts</option>
                        <option value="General">General</option>
                      </select>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Author</label>
                    <input
                      type="text"
                      name="author"
                      list="authors-options-list"
                      defaultValue={editingItem?.author || "Samastha Graph Editorial"}
                      placeholder="Type or select author..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-[#15664a] outline-none bg-white font-malayalam text-sm"
                    />
                    <datalist id="authors-options-list">
                      {(authorsSettings?.authors || []).map((a: any) => (
                        <option key={a.id} value={a.nameMl || a.name}>
                          {a.name} {a.role ? `(${a.role})` : ''}
                        </option>
                      ))}
                      <option value="Samastha Graph Editorial">Samastha Graph Editorial</option>
                      <option value="Admin">Admin</option>
                      <option value="Guest Writer">Guest Writer</option>
                    </datalist>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-[11px] text-gray-400">Select or type custom name</span>
                      <button type="button" onClick={() => setView("authors")} className="text-[11px] text-[#15664a] font-semibold hover:underline">
                        + Manage Authors
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Theme Preset</label>
                    <select name="themePreset" defaultValue={editingItem?.themePreset || "theme-malayalam-standard"} className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-[#15664a] outline-none bg-white">
                      <option value="theme-malayalam-standard">Standard Malayalam</option>
                      <option value="theme-cinematic">Cinematic Editorial</option>
                      <option value="theme-english-minimal">Minimalist English</option>
                    </select>
                  </div>
                </div>

                {/* Program Assignment */}
                {view.includes("Video") && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-blue-50 border border-blue-100 rounded-sm">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Program / Series (Optional)</label>
                      <select name="programId" defaultValue={editingItem?.programId || ''} className="w-full px-4 py-2 border border-gray-300 bg-white rounded-sm focus:ring-2 focus:ring-[#15664a] outline-none">
                        <option value="">(Standalone video — no program)</option>
                        {programs.map((p: any) => (
                          <option key={p.slug} value={p.slug}>{p.title} ({p.language === 'en' ? 'EN' : 'ML'})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Episode Number (Optional)</label>
                      <input type="number" name="episodeNumber" min="1" defaultValue={editingItem?.episodeNumber || ''} className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-[#15664a] outline-none" placeholder="e.g. 1" />
                      <p className="text-xs text-gray-400 mt-1">Leave blank for standalone videos or unnumbered episodes.</p>
                    </div>
                  </div>
                )}

                {view.includes("Article") && (
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Cover Image URL</label>
                    <input type="text" name="coverImage" defaultValue={editingItem?.coverImage} className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-[#15664a] outline-none" placeholder="https://..." />
                  </div>
                )}

                {view.includes("Article") && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">SEO Title (Optional)</label>
                      <input type="text" name="seoTitle" defaultValue={editingItem?.seoTitle} className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-[#15664a] outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">SEO Description (Optional)</label>
                      <input type="text" name="seoDescription" defaultValue={editingItem?.seoDescription} className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-[#15664a] outline-none" />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{view.includes("Article") ? "Excerpt (Short Summary) *" : "Short Description (Optional)"}</label>
                  <textarea name="excerpt" defaultValue={editingItem?.excerpt} rows={2} required={view.includes("Article")} className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-[#15664a] outline-none"></textarea>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{view.includes("Video") ? "Video Notes / Full Description (Rich Text)" : view.includes("Podcast") ? "Podcast Description (Rich Text) *" : "Article Body (Rich Text) *"}</label>
                  <RichTextEditor content={editorContent} onChange={setEditorContent} />
                </div>

                <div className="pt-6 border-t border-gray-100 flex justify-end gap-4">
                  <button type="button" onClick={() => setView("overview")} className="px-6 py-2 border border-gray-300 rounded-sm text-gray-700 font-semibold hover:bg-gray-50 transition-colors">Cancel</button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-[#15664a] text-white px-8 py-2 rounded-sm font-bold tracking-wide hover:bg-[#0f4d38] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
                  >
                    {isSubmitting ? "Saving..." : `Save ${view.includes("Video") ? "Video" : view.includes("Podcast") ? "Podcast" : "Article"}`}
                  </button>
                </div>
              </Form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
