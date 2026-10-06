import { useState, useEffect, useRef, useMemo } from "react";
import { json, redirect, type MetaFunction } from "@remix-run/cloudflare";

export const meta: MetaFunction = () => {
  return [
    { title: "Admin Dashboard • Samastha Graph" },
  ];
};

import { HeaderAdmin } from "../components/HeaderAdmin";
import { FooterAdmin } from "../components/FooterAdmin";
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

import {
  Menu, X, Edit, Trash2, Eye, Plus, Send, Bold, Italic, List, ListOrdered,
  Link as LinkIcon, RefreshCw, Calendar as CalendarIcon, Search, LayoutDashboard,
  FileText, Video, Mic, BarChart2, ChevronDown, LogOut, Settings, Quote,
  Underline as UnderlineIcon, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Heading1, Heading2, Heading3, Heading4, Strikethrough, Minus, User, Share2,
  ExternalLink, Radio, Rss, PanelTop, PanelBottom, Sparkles, Users, Headphones,
  UserCircle, PhoneCall, Info, ArrowRight, Layers, Box, CheckCircle2, MessageSquare,
  Layout
} from 'lucide-react';
import { getSessionStorage } from "../sessions.server";
import { fetchYouTubePlaylistVideos, extractYouTubePlaylistId, fetchLiveYouTubeVideos } from "../utils/youtube";
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
  let headerSettings = null;
  let footerSettings = null;

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
        }),
        ...((settingsFiles as any[]) || []).filter(f => f.name === 'header.json').map(async (file) => {
          const content = await fetchFileContent(file.url);
          headerSettings = JSON.parse(content);
        }),
        ...((settingsFiles as any[]) || []).filter(f => f.name === 'footer.json').map(async (file) => {
          const content = await fetchFileContent(file.url);
          footerSettings = JSON.parse(content);
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
      if (path.includes('header.json')) {
        headerSettings = jsonSettings[path];
      }
      if (path.includes('footer.json')) {
        footerSettings = jsonSettings[path];
      }
    }
  }

  if (env?.DB) {
    try {
      const [dbArticles, dbVideos, dbPodcasts, dbPrograms, dbHomepage, dbAbout, dbContact, dbSocial, dbPodcastPlatforms, dbPodcastShows, dbProfile, dbAuthors, dbSpotlight, dbHeader, dbFooter] = await Promise.all([
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
        getDbSetting(env.DB, "spotlight"),
        getDbSetting(env.DB, "header"),
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
        programs.forEach((p: any) => map.set(p.slug, { ...p, status: p.status || 'published' }));
        dbPrograms.forEach((p: any) => {
          const existing = map.get(p.slug) || {};
          map.set(p.slug, { ...existing, ...p, status: p.status || existing.status || 'published' });
        });
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
      if (dbHeader) headerSettings = dbHeader;
      if (dbFooter) footerSettings = dbFooter;
    } catch (e) {
      console.warn("D1 loader merge warning:", e);
    }
  }

  try {
    const liveYtVideos = await fetchLiveYouTubeVideos(programs);
    if (liveYtVideos.length > 0) {
      const map = new Map<string, any>();
      videos.forEach((v: any) => map.set(v.slug, v));
      liveYtVideos.forEach((v: any) => {
        if (!map.has(v.slug)) map.set(v.slug, v);
      });
      videos = Array.from(map.values()).sort((a: any, b: any) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());
    }
  } catch (e) {
    console.warn("Live YouTube sync warning in admin loader:", e);
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
    authorsSettings: authorsSettings || { authors: [] },
    headerSettings,
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
        try {
          await saveDbSetting(env.DB, "homepage", parsedData);
        } catch (dbErr) {
          console.error("D1 saveDbSetting homepage error:", dbErr);
        }
      }
      await writeLocalFile("app/content/settings/homepage.json", jsonContent);

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
        try {
          await saveDbSetting(env.DB, "about", parsedData);
        } catch (dbErr) {
          console.error("D1 saveDbSetting about error:", dbErr);
        }
      }
      await writeLocalFile("app/content/settings/about.json", jsonContent);

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
        try {
          await saveDbSetting(env.DB, "contact", parsedData);
        } catch (dbErr) {
          console.error("D1 saveDbSetting contact error:", dbErr);
        }
      }
      await writeLocalFile("app/content/settings/contact.json", jsonContent);

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
        try {
          await saveDbSetting(env.DB, "social-platforms", parsedData);
        } catch (dbErr) {
          console.error("D1 saveDbSetting social-platforms error:", dbErr);
        }
      }
      await writeLocalFile("app/content/settings/social-platforms.json", jsonContent);

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
        try {
          await saveDbSetting(env.DB, "podcast-platforms", parsedData);
        } catch (dbErr) {
          console.error("D1 saveDbSetting podcast-platforms error:", dbErr);
        }
      }
      await writeLocalFile("app/content/settings/podcast-platforms.json", jsonContent);

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
      await writeLocalFile("app/content/settings/authors.json", jsonContent);

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

    if (intent === "saveHeader") {
      const dataStr = formData.get("headerData") as string;
      const parsedData = JSON.parse(dataStr);
      if (parsedData.logo && !validateImageUrl(parsedData.logo)) return json({ error: "Invalid image URL in header logo." }, { status: 400 });
      const jsonContent = JSON.stringify(parsedData, null, 2);

      if (env?.DB) {
        try {
          await saveDbSetting(env.DB, "header", parsedData);
        } catch (dbErr) {
          console.error("D1 saveDbSetting header error:", dbErr);
        }
      }
      await writeLocalFile("app/content/settings/header.json", jsonContent);

      await commitToGitHub({
        token: githubToken,
        owner,
        repo,
        path: "app/content/settings/header.json",
        content: jsonContent,
        message: "update header settings"
      });
      return json({ success: true, intent: "saveHeader", message: "Header navigation settings saved successfully!" });
    }

    if (intent === "saveFooter") {
      const dataStr = formData.get("footerData") as string;
      const parsedData = JSON.parse(dataStr);
      if (parsedData.logo && !validateImageUrl(parsedData.logo)) return json({ error: "Invalid image URL in footer logo." }, { status: 400 });
      const jsonContent = JSON.stringify(parsedData, null, 2);

      if (env?.DB) {
        try {
          await saveDbSetting(env.DB, "footer", parsedData);
        } catch (dbErr) {
          console.error("D1 saveDbSetting footer error:", dbErr);
        }
      }
      await writeLocalFile("app/content/settings/footer.json", jsonContent);

      await commitToGitHub({
        token: githubToken,
        owner,
        repo,
        path: "app/content/settings/footer.json",
        content: jsonContent,
        message: "update footer settings"
      });
      return json({ success: true, intent: "saveFooter", message: "Footer settings saved successfully!" });
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
      const parsedData = { platforms: JSON.parse(platformsJsonStr) };
      const contentStr = JSON.stringify(parsedData, null, 2);

      if (env?.DB) {
        try {
          await saveDbSetting(env.DB, "podcast-platforms", parsedData);
        } catch (dbErr) {
          console.error("D1 saveDbSetting podcast-platforms error:", dbErr);
        }
      }
      await writeLocalFile("app/content/settings/podcasts.json", contentStr);

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
        try {
          await saveDbSetting(env.DB, "podcast-shows", parsedData);
        } catch (dbErr) {
          console.error("D1 saveDbSetting podcast-shows error:", dbErr);
        }
      }
      await writeLocalFile("app/content/settings/podcast-shows.json", contentStr);

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
        try {
          await saveDbSetting(env.DB, "profile", parsedData);
        } catch (dbErr) {
          console.error("D1 saveDbSetting profile error:", dbErr);
        }
      }
      await writeLocalFile("app/content/settings/profile.json", contentStr);

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
        try {
          await saveDbSetting(env.DB, "spotlight", spotlightData);
        } catch (dbErr) {
          console.error("D1 saveDbSetting spotlight error:", dbErr);
        }
      }
      await writeLocalFile("app/content/settings/spotlight.json", JSON.stringify(spotlightData, null, 2));

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
    footerSettings
  } = loaderData;

  // Keep state updated whenever server loader revalidates
  useEffect(() => {
    if (loaderData?.articles) setArticles(loaderData.articles);
  }, [loaderData?.articles]);

  useEffect(() => {
    if (loaderData?.videos) setVideos(loaderData.videos);
  }, [loaderData?.videos]);

  useEffect(() => {
    if (loaderData?.podcasts) setPodcasts(loaderData.podcasts);
  }, [loaderData?.podcasts]);

  useEffect(() => {
    if (loaderData?.programs) setPrograms(loaderData.programs);
  }, [loaderData?.programs]);

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
      } else if (actionData.intent === "saveHeader") {
        setView("header");
      } else if (actionData.intent === "saveFooter") {
        setView("footer");
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
    <div className="min-h-screen bg-[#F8F9FA] font-inter flex flex-col md:flex-row">
      {/* Dark Wine/Burgundy Sidebar */}
      <aside className="hidden md:flex w-64 bg-[#2A0B16] text-white flex-col flex-shrink-0 min-h-screen border-r border-[#3E1122] shadow-xl z-20">
        {/* Brand Header */}
        <div className="px-5 py-6 border-b border-[#3E1122]/70 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-full bg-[#E5A93C] text-[#2A0B16] font-extrabold flex items-center justify-center text-lg shadow-md">
            S
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white leading-tight font-heading">
              Samastha CMS
            </h1>
            <p className="text-[10px] tracking-widest uppercase font-semibold text-[#E5A93C]/80 mt-0.5">
              ADMINISTRATOR
            </p>
          </div>
        </div>

        {/* Sidebar Nav */}
        <div className="flex-1 px-3 py-4 space-y-6 overflow-y-auto max-h-[calc(100vh-140px)] custom-scrollbar">
          <div>
            <div className="text-[11px] font-bold text-rose-200/40 uppercase tracking-wider px-3 pb-2">
              CONTENT
            </div>
            <nav className="space-y-1">
              <button
                onClick={() => setView("overview")}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-between ${
                  view === "overview"
                    ? "bg-[#541527] text-white font-semibold shadow-inner"
                    : "text-rose-100/75 hover:bg-white/10 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <LayoutDashboard size={17} className={view === "overview" ? "text-[#E5A93C]" : "opacity-80"} />
                  <span>Dashboard</span>
                </div>
                {view === "overview" && <div className="w-2 h-2 rounded-full bg-[#E5A93C] animate-pulse"></div>}
              </button>

              <button
                onClick={() => { setView("articles"); setPage(1); setSearchQuery(""); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-between ${
                  view.includes("article") || view.includes("Article")
                    ? "bg-[#541527] text-white font-semibold shadow-inner"
                    : "text-rose-100/75 hover:bg-white/10 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <FileText size={17} className={view.includes("article") ? "text-[#E5A93C]" : "opacity-80"} />
                  <span>News &amp; Updates</span>
                </div>
                {(view.includes("article") || view.includes("Article")) && <div className="w-2 h-2 rounded-full bg-[#E5A93C] animate-pulse"></div>}
              </button>

              <button
                onClick={() => { setView("videos"); setPage(1); setSearchQuery(""); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-between ${
                  view.includes("video") || view.includes("Video") || view.includes("program") || view.includes("Program")
                    ? "bg-[#541527] text-white font-semibold shadow-inner"
                    : "text-rose-100/75 hover:bg-white/10 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Video size={17} className={view.includes("video") || view.includes("program") ? "text-[#E5A93C]" : "opacity-80"} />
                  <span>Videos &amp; Series</span>
                </div>
                {(view.includes("video") || view.includes("program")) && <div className="w-2 h-2 rounded-full bg-[#E5A93C] animate-pulse"></div>}
              </button>

              <button
                onClick={() => { setView("podcasts"); setPage(1); setSearchQuery(""); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-between ${
                  view.includes("podcast") || view.includes("Podcast")
                    ? "bg-[#541527] text-white font-semibold shadow-inner"
                    : "text-rose-100/75 hover:bg-white/10 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Mic size={17} className={view.includes("podcast") ? "text-[#E5A93C]" : "opacity-80"} />
                  <span>Audio Podcasts</span>
                </div>
                {view.includes("podcast") && <div className="w-2 h-2 rounded-full bg-[#E5A93C] animate-pulse"></div>}
              </button>

              <button
                onClick={() => { setView("settings-podcast-shows"); setPage(1); setSearchQuery(""); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-between ${
                  view === "settings-podcast-shows"
                    ? "bg-[#541527] text-white font-semibold shadow-inner"
                    : "text-rose-100/75 hover:bg-white/10 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Radio size={17} className={view === "settings-podcast-shows" ? "text-[#E5A93C]" : "opacity-80"} />
                  <span>Podcast Shows &amp; RSS</span>
                </div>
                {view === "settings-podcast-shows" && <div className="w-2 h-2 rounded-full bg-[#E5A93C] animate-pulse"></div>}
              </button>

              <button
                onClick={() => { setView("authors"); setPage(1); setSearchQuery(""); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-between ${
                  view === "authors"
                    ? "bg-[#541527] text-white font-semibold shadow-inner"
                    : "text-rose-100/75 hover:bg-white/10 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Users size={17} className={view === "authors" ? "text-[#E5A93C]" : "opacity-80"} />
                  <span>Authors &amp; Scholars</span>
                </div>
                {view === "authors" && <div className="w-2 h-2 rounded-full bg-[#E5A93C] animate-pulse"></div>}
              </button>

              <button
                onClick={() => setView("spotlight")}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-between ${
                  view === "spotlight"
                    ? "bg-[#541527] text-white font-semibold shadow-inner"
                    : "text-rose-100/75 hover:bg-white/10 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Sparkles size={17} className={view === "spotlight" ? "text-[#E5A93C]" : "opacity-80"} />
                  <span>Hero &amp; Spotlight</span>
                </div>
                {view === "spotlight" && <div className="w-2 h-2 rounded-full bg-[#E5A93C] animate-pulse"></div>}
              </button>

              <button
                onClick={() => setView("header")}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-between ${
                  view === "header"
                    ? "bg-[#541527] text-white font-semibold shadow-inner"
                    : "text-rose-100/75 hover:bg-white/10 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <PanelTop size={17} className={view === "header" ? "text-[#E5A93C]" : "opacity-80"} />
                  <span>Header</span>
                </div>
                {view === "header" && <div className="w-2 h-2 rounded-full bg-[#E5A93C] animate-pulse"></div>}
              </button>

              <button
                onClick={() => setView("footer")}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-between ${
                  view === "footer"
                    ? "bg-[#541527] text-white font-semibold shadow-inner"
                    : "text-rose-100/75 hover:bg-white/10 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <PanelBottom size={17} className={view === "footer" ? "text-[#E5A93C]" : "opacity-80"} />
                  <span>Footer</span>
                </div>
                {view === "footer" && <div className="w-2 h-2 rounded-full bg-[#E5A93C] animate-pulse"></div>}
              </button>

              <button
                onClick={() => setView("settings-about")}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-between ${
                  view === "settings-about"
                    ? "bg-[#541527] text-white font-semibold shadow-inner"
                    : "text-rose-100/75 hover:bg-white/10 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Info size={17} className={view === "settings-about" ? "text-[#E5A93C]" : "opacity-80"} />
                  <span>About Settings</span>
                </div>
                {view === "settings-about" && <div className="w-2 h-2 rounded-full bg-[#E5A93C] animate-pulse"></div>}
              </button>

              <button
                onClick={() => setView("settings-contact")}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-between ${
                  view === "settings-contact"
                    ? "bg-[#541527] text-white font-semibold shadow-inner"
                    : "text-rose-100/75 hover:bg-white/10 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <PhoneCall size={17} className={view === "settings-contact" ? "text-[#E5A93C]" : "opacity-80"} />
                  <span>Contact Settings</span>
                </div>
                {view === "settings-contact" && <div className="w-2 h-2 rounded-full bg-[#E5A93C] animate-pulse"></div>}
              </button>

              <button
                onClick={() => setView("homepage")}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-between ${
                  view === "homepage"
                    ? "bg-[#541527] text-white font-semibold shadow-inner"
                    : "text-rose-100/75 hover:bg-white/10 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Layout size={17} className={view === "homepage" ? "text-[#E5A93C]" : "opacity-80"} />
                  <span>Homepage Settings</span>
                </div>
                {view === "homepage" && <div className="w-2 h-2 rounded-full bg-[#E5A93C] animate-pulse"></div>}
              </button>

              <button
                onClick={() => setView("settings-social-platforms")}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-between ${
                  view === "settings-social-platforms"
                    ? "bg-[#541527] text-white font-semibold shadow-inner"
                    : "text-rose-100/75 hover:bg-white/10 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Share2 size={17} className={view === "settings-social-platforms" ? "text-[#E5A93C]" : "opacity-80"} />
                  <span>Social Platforms</span>
                </div>
                {view === "settings-social-platforms" && <div className="w-2 h-2 rounded-full bg-[#E5A93C] animate-pulse"></div>}
              </button>

              <button
                onClick={() => setView("settings-podcast-platforms")}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-between ${
                  view === "settings-podcast-platforms"
                    ? "bg-[#541527] text-white font-semibold shadow-inner"
                    : "text-rose-100/75 hover:bg-white/10 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Headphones size={17} className={view === "settings-podcast-platforms" ? "text-[#E5A93C]" : "opacity-80"} />
                  <span>Podcast Platforms</span>
                </div>
                {view === "settings-podcast-platforms" && <div className="w-2 h-2 rounded-full bg-[#E5A93C] animate-pulse"></div>}
              </button>

              <button
                onClick={() => setView("profile")}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-between ${
                  view === "profile"
                    ? "bg-[#541527] text-white font-semibold shadow-inner"
                    : "text-rose-100/75 hover:bg-white/10 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <UserCircle size={17} className={view === "profile" ? "text-[#E5A93C]" : "opacity-80"} />
                  <span>Profile Link Hub</span>
                </div>
                {view === "profile" && <div className="w-2 h-2 rounded-full bg-[#E5A93C] animate-pulse"></div>}
              </button>

              <a
                href="https://fiqhfiles.samasthagraph.com/admin"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-rose-100/75 hover:bg-white/10 hover:text-white transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <ExternalLink size={17} className="opacity-80" />
                  <span>Fiqh Files CMS</span>
                </div>
                <span className="text-[10px] text-amber-300/70 font-mono">↗</span>
              </a>
            </nav>
          </div>
        </div>

        {/* User Footer in Sidebar */}
        <div className="p-4 border-t border-[#3E1122] flex items-center justify-between text-xs text-rose-200/60">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
            <span>Admin Active</span>
          </div>
          <Form method="post">
            <input type="hidden" name="intent" value="logout" />
            <button type="submit" className="text-rose-200/70 hover:text-white flex items-center gap-1">
              <LogOut size={14} /> Exit
            </button>
          </Form>
        </div>
      </aside>

      {/* Main Right Side Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header Bar */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-md"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-bold tracking-widest text-gray-400 uppercase">CONTROL PANEL</span>
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-700 text-xs font-semibold shadow-2xs">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span>CONNECTED</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              target="_blank"
              className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-md hover:bg-gray-100 transition-colors"
            >
              <ExternalLink size={14} /> View Live Site
            </Link>

            <button
              onClick={handleDeploy}
              disabled={isDeploying || isSubmitting}
              className="flex items-center gap-1.5 bg-[#c8a136] hover:bg-[#b08d2f] text-white px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors disabled:opacity-50 shadow-sm"
            >
              <RefreshCw size={13} className={isDeploying ? "animate-spin" : ""} />
              <span>{isDeploying ? "Deploying..." : "Deploy"}</span>
            </button>

            <Form method="post" className="hidden sm:block">
              <input type="hidden" name="intent" value="logout" />
              <button type="submit" className="text-xs font-medium text-gray-500 hover:text-red-600 flex items-center gap-1 px-2.5 py-1.5 rounded hover:bg-gray-100 transition-colors">
                <LogOut size={14} /> Logout
              </button>
            </Form>
          </div>
        </header>

        {/* Mobile Slide-Down Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-[#2A0B16] text-white p-4 border-b border-[#3E1122] shadow-xl space-y-2 z-40">
            <button onClick={() => { setView("overview"); setIsMobileMenuOpen(false); }} className="w-full text-left py-2 px-3 rounded hover:bg-white/10 text-sm flex items-center gap-2">
              <LayoutDashboard size={16} /> Dashboard
            </button>
            <button onClick={() => { setView("articles"); setPage(1); setSearchQuery(""); setIsMobileMenuOpen(false); }} className="w-full text-left py-2 px-3 rounded hover:bg-white/10 text-sm flex items-center gap-2">
              <FileText size={16} /> News &amp; Updates
            </button>
            <button onClick={() => { setView("videos"); setPage(1); setSearchQuery(""); setIsMobileMenuOpen(false); }} className="w-full text-left py-2 px-3 rounded hover:bg-white/10 text-sm flex items-center gap-2">
              <Video size={16} /> Videos &amp; Series
            </button>
            <button onClick={() => { setView("podcasts"); setPage(1); setSearchQuery(""); setIsMobileMenuOpen(false); }} className="w-full text-left py-2 px-3 rounded hover:bg-white/10 text-sm flex items-center gap-2">
              <Mic size={16} /> Audio Podcasts
            </button>
            <button onClick={() => { setView("authors"); setIsMobileMenuOpen(false); }} className="w-full text-left py-2 px-3 rounded hover:bg-white/10 text-sm flex items-center gap-2">
              <Users size={16} /> Authors &amp; Scholars
            </button>
            <button onClick={() => { setView("header"); setIsMobileMenuOpen(false); }} className="w-full text-left py-2 px-3 rounded hover:bg-white/10 text-sm flex items-center gap-2">
              <PanelTop size={16} /> Header Settings
            </button>
            <button onClick={() => { setView("footer"); setIsMobileMenuOpen(false); }} className="w-full text-left py-2 px-3 rounded hover:bg-white/10 text-sm flex items-center gap-2">
              <PanelBottom size={16} /> Footer Settings
            </button>
            <button onClick={() => { setView("settings-about"); setIsMobileMenuOpen(false); }} className="w-full text-left py-2 px-3 rounded hover:bg-white/10 text-sm flex items-center gap-2">
              <Info size={16} /> About Settings
            </button>
            <button onClick={() => { setView("settings-contact"); setIsMobileMenuOpen(false); }} className="w-full text-left py-2 px-3 rounded hover:bg-white/10 text-sm flex items-center gap-2">
              <PhoneCall size={16} /> Contact Settings
            </button>
            <button onClick={() => { setView("profile"); setIsMobileMenuOpen(false); }} className="w-full text-left py-2 px-3 rounded hover:bg-white/10 text-sm flex items-center gap-2">
              <UserCircle size={16} /> Profile Link Hub
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {actionData?.success && (
            <div className="bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 p-4 mb-6 rounded-r-lg flex items-center gap-3 shadow-xs">
              <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
              <p className="text-sm font-medium">{actionData.message}</p>
            </div>
          )}
          {actionData?.error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-800 p-4 mb-6 rounded-r-lg flex items-center gap-3 shadow-xs">
              <X size={18} className="text-red-600 flex-shrink-0" />
              <p className="text-sm font-medium">{actionData.error}</p>
            </div>
          )}

          {/* Header Editor */}
          {view === "header" && (
            <Form method="post">
              <input type="hidden" name="intent" value="saveHeader" />
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 font-heading">Header Settings</h1>
                  <p className="text-sm text-gray-500 mt-1">Configure brand logo, top navigation links, and visibility toggles.</p>
                </div>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setView("overview")} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold text-sm hover:bg-gray-50">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSubmitting} className="bg-[#15664a] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#0f4d38] transition-colors flex items-center gap-2 shadow-sm text-sm disabled:opacity-50">
                    <Send size={16} /> {isSubmitting ? "Saving..." : "Save Header"}
                  </button>
                </div>
              </div>
              <HeaderAdmin headerSettings={headerSettings} />
            </Form>
          )}

          {/* Footer Editor */}
          {view === "footer" && (
            <Form method="post">
              <input type="hidden" name="intent" value="saveFooter" />
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 font-heading">Footer Settings</h1>
                  <p className="text-sm text-gray-500 mt-1">Manage brand slogan, copyright notice, and footer navigation columns.</p>
                </div>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setView("overview")} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold text-sm hover:bg-gray-50">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSubmitting} className="bg-[#15664a] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#0f4d38] transition-colors flex items-center gap-2 shadow-sm text-sm disabled:opacity-50">
                    <Send size={16} /> {isSubmitting ? "Saving..." : "Save Footer"}
                  </button>
                </div>
              </div>
              <FooterAdmin footerSettings={footerSettings} />
            </Form>
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
                          <td className="px-4 py-3"><StatusBadge status={program.status || 'published'} /></td>
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
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 font-heading">Dashboard Overview</h1>
                  <p className="text-sm text-gray-500 mt-1">Complete control and management of all Samastha Graph content modules.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    All Systems Operational
                  </span>
                </div>
              </div>

              {/* 3 Metric Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="bg-white p-5 sm:p-6 rounded-xl border border-gray-200/80 shadow-xs hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Content Modules</p>
                      <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1 font-heading">14 Sections</h3>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg">
                      <LayoutDashboard size={24} />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-3 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    Full site editing enabled
                  </p>
                </div>

                <div className="bg-white p-5 sm:p-6 rounded-xl border border-gray-200/80 shadow-xs hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Dynamic Items</p>
                      <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1 font-heading">{articles.length + videos.length + podcasts.length + programs.length} Items</h3>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg">
                      <FileText size={24} />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-3 text-xs font-medium text-gray-500">
                    <span>{articles.length} Articles</span>
                    <span>•</span>
                    <span>{videos.length} Videos</span>
                    <span>•</span>
                    <span>{podcasts.length} Podcasts</span>
                  </div>
                </div>

                <div className="bg-white p-5 sm:p-6 rounded-xl border border-gray-200/80 shadow-xs hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Authors &amp; Shows</p>
                      <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1 font-heading">
                        {(authorsSettings?.authors?.length || 0) + (podcastShowsSettings?.shows?.length || 0)} Configured
                      </h3>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-lg">
                      <Users size={24} />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-3 text-xs font-medium text-gray-500">
                    <span>{authorsSettings?.authors?.length || 0} Authors</span>
                    <span>•</span>
                    <span>{podcastShowsSettings?.shows?.length || 0} Podcast Shows</span>
                  </div>
                </div>
              </div>

              {/* 14-Card Content Section Hub Grid */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-800 font-heading">Content &amp; Configuration Sections</h2>
                  <span className="text-xs text-gray-400 font-medium">Click any card to manage</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* 1. Header Settings */}
                  <button
                    onClick={() => setView("header")}
                    className="group bg-white p-5 rounded-xl border border-gray-200/80 shadow-2xs hover:shadow-md hover:border-[#2A0B16]/30 transition-all text-left flex flex-col justify-between"
                  >
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 rounded-lg bg-rose-50 text-[#2A0B16] flex items-center justify-center group-hover:bg-[#2A0B16] group-hover:text-white transition-colors">
                        <PanelTop size={20} />
                      </div>
                      <span className="text-xs font-bold text-gray-400 group-hover:text-[#2A0B16] group-hover:translate-x-0.5 transition-all">→</span>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-base font-bold text-gray-900 group-hover:text-[#2A0B16] transition-colors">Header Navigation</h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">Logo, brand text, multilingual menu items, search &amp; language switcher toggles.</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                      <span>Brand &amp; Navigation</span>
                      <span className="text-[#15664a] font-semibold">Active</span>
                    </div>
                  </button>

                  {/* 2. Footer Settings */}
                  <button
                    onClick={() => setView("footer")}
                    className="group bg-white p-5 rounded-xl border border-gray-200/80 shadow-2xs hover:shadow-md hover:border-[#2A0B16]/30 transition-all text-left flex flex-col justify-between"
                  >
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
                        <PanelBottom size={20} />
                      </div>
                      <span className="text-xs font-bold text-gray-400 group-hover:text-amber-700 group-hover:translate-x-0.5 transition-all">→</span>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-base font-bold text-gray-900 group-hover:text-amber-700 transition-colors">Footer &amp; Legal</h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">Tagline, copyright text, organization links, and content links columns.</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                      <span>Brand &amp; Columns</span>
                      <span className="text-[#15664a] font-semibold">Active</span>
                    </div>
                  </button>

                  {/* 3. News & Updates */}
                  <button
                    onClick={() => { setView("articles"); setPage(1); }}
                    className="group bg-white p-5 rounded-xl border border-gray-200/80 shadow-2xs hover:shadow-md hover:border-blue-500/30 transition-all text-left flex flex-col justify-between"
                  >
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <FileText size={20} />
                      </div>
                      <span className="text-xs font-bold text-gray-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all">→</span>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors">News &amp; Updates</h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">Articles, editorials, and publications in Malayalam and English.</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                      <span>{articles.length} Total Articles</span>
                      <span className="text-blue-600 font-semibold">{articles.filter((a: any) => a.status === 'published').length} Live</span>
                    </div>
                  </button>

                  {/* 4. Videos & Series */}
                  <button
                    onClick={() => { setView("videos"); setPage(1); }}
                    className="group bg-white p-5 rounded-xl border border-gray-200/80 shadow-2xs hover:shadow-md hover:border-red-500/30 transition-all text-left flex flex-col justify-between"
                  >
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-colors">
                        <Video size={20} />
                      </div>
                      <span className="text-xs font-bold text-gray-400 group-hover:text-red-600 group-hover:translate-x-0.5 transition-all">→</span>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-base font-bold text-gray-900 group-hover:text-red-600 transition-colors">Videos &amp; Series</h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">YouTube videos, episode playlists, thumbnails, and categories.</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                      <span>{videos.length} Videos</span>
                      <span className="text-red-600 font-semibold">{programs.length} Programs</span>
                    </div>
                  </button>

                  {/* 5. Audio Podcasts */}
                  <button
                    onClick={() => { setView("podcasts"); setPage(1); }}
                    className="group bg-white p-5 rounded-xl border border-gray-200/80 shadow-2xs hover:shadow-md hover:border-purple-500/30 transition-all text-left flex flex-col justify-between"
                  >
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
                        <Mic size={20} />
                      </div>
                      <span className="text-xs font-bold text-gray-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all">→</span>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-base font-bold text-gray-900 group-hover:text-purple-600 transition-colors">Audio Podcasts</h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">MP3 audio episodes, durations, series names, and descriptions.</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                      <span>{podcasts.length} Episodes</span>
                      <span className="text-purple-600 font-semibold">Audio Feed</span>
                    </div>
                  </button>

                  {/* 6. Podcast Shows & RSS */}
                  <button
                    onClick={() => setView("settings-podcast-shows")}
                    className="group bg-white p-5 rounded-xl border border-gray-200/80 shadow-2xs hover:shadow-md hover:border-indigo-500/30 transition-all text-left flex flex-col justify-between"
                  >
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <Radio size={20} />
                      </div>
                      <span className="text-xs font-bold text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all">→</span>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-base font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">Podcast Shows &amp; RSS</h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">Spotify / Anchor RSS sync, show artwork, and auto-sync feeds.</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                      <span>{podcastShowsSettings?.shows?.length || 0} Shows Configured</span>
                      <span className="text-indigo-600 font-semibold">RSS Engine</span>
                    </div>
                  </button>

                  {/* 7. Authors & Scholars */}
                  <button
                    onClick={() => setView("authors")}
                    className="group bg-white p-5 rounded-xl border border-gray-200/80 shadow-2xs hover:shadow-md hover:border-emerald-500/30 transition-all text-left flex flex-col justify-between"
                  >
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-700 group-hover:text-white transition-colors">
                        <Users size={20} />
                      </div>
                      <span className="text-xs font-bold text-gray-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all">→</span>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-base font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">Authors &amp; Scholars</h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">Add scholars, profile photos, biographic descriptions, and credentials.</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                      <span>{authorsSettings?.authors?.length || 0} Authors</span>
                      <span className="text-emerald-700 font-semibold">Contributors</span>
                    </div>
                  </button>

                  {/* 8. Hero & Spotlight */}
                  <button
                    onClick={() => setView("spotlight")}
                    className="group bg-white p-5 rounded-xl border border-gray-200/80 shadow-2xs hover:shadow-md hover:border-yellow-500/30 transition-all text-left flex flex-col justify-between"
                  >
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 rounded-lg bg-yellow-50 text-yellow-700 flex items-center justify-center group-hover:bg-yellow-600 group-hover:text-white transition-colors">
                        <Sparkles size={20} />
                      </div>
                      <span className="text-xs font-bold text-gray-400 group-hover:text-yellow-700 group-hover:translate-x-0.5 transition-all">→</span>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-base font-bold text-gray-900 group-hover:text-yellow-700 transition-colors">Hero &amp; Spotlight</h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">Featured video, upcoming live broadcast countdown, or banner showcase.</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                      <span>Hero Placement</span>
                      <span className="text-yellow-700 font-semibold">{spotlightSettings?.heroType || "video"}</span>
                    </div>
                  </button>

                  {/* 9. Homepage Settings */}
                  <button
                    onClick={() => setView("homepage")}
                    className="group bg-white p-5 rounded-xl border border-gray-200/80 shadow-2xs hover:shadow-md hover:border-teal-500/30 transition-all text-left flex flex-col justify-between"
                  >
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center group-hover:bg-teal-700 group-hover:text-white transition-colors">
                        <Layout size={20} />
                      </div>
                      <span className="text-xs font-bold text-gray-400 group-hover:text-teal-700 group-hover:translate-x-0.5 transition-all">→</span>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-base font-bold text-gray-900 group-hover:text-teal-700 transition-colors">Homepage Settings</h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">Landing hero copy, highlights, section order, and featured items.</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                      <span>Main Landing</span>
                      <span className="text-teal-700 font-semibold">Homepage</span>
                    </div>
                  </button>

                  {/* 10. About Page */}
                  <button
                    onClick={() => setView("settings-about")}
                    className="group bg-white p-5 rounded-xl border border-gray-200/80 shadow-2xs hover:shadow-md hover:border-cyan-500/30 transition-all text-left flex flex-col justify-between"
                  >
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 rounded-lg bg-cyan-50 text-cyan-700 flex items-center justify-center group-hover:bg-cyan-700 group-hover:text-white transition-colors">
                        <Info size={20} />
                      </div>
                      <span className="text-xs font-bold text-gray-400 group-hover:text-cyan-700 group-hover:translate-x-0.5 transition-all">→</span>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-base font-bold text-gray-900 group-hover:text-cyan-700 transition-colors">About Us Page</h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">Mission, vision, history story, and photo gallery configuration.</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                      <span>Story &amp; Gallery</span>
                      <span className="text-cyan-700 font-semibold">About Page</span>
                    </div>
                  </button>

                  {/* 11. Contact Page */}
                  <button
                    onClick={() => setView("settings-contact")}
                    className="group bg-white p-5 rounded-xl border border-gray-200/80 shadow-2xs hover:shadow-md hover:border-green-500/30 transition-all text-left flex flex-col justify-between"
                  >
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 rounded-lg bg-green-50 text-green-700 flex items-center justify-center group-hover:bg-green-700 group-hover:text-white transition-colors">
                        <PhoneCall size={20} />
                      </div>
                      <span className="text-xs font-bold text-gray-400 group-hover:text-green-700 group-hover:translate-x-0.5 transition-all">→</span>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-base font-bold text-gray-900 group-hover:text-green-700 transition-colors">Contact Settings</h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">Phone numbers, email addresses, office location, and map coordinates.</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                      <span>Office &amp; Inquiries</span>
                      <span className="text-green-700 font-semibold">Contact</span>
                    </div>
                  </button>

                  {/* 12. Social Platforms */}
                  <button
                    onClick={() => setView("settings-social-platforms")}
                    className="group bg-white p-5 rounded-xl border border-gray-200/80 shadow-2xs hover:shadow-md hover:border-pink-500/30 transition-all text-left flex flex-col justify-between"
                  >
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center group-hover:bg-pink-600 group-hover:text-white transition-colors">
                        <Share2 size={20} />
                      </div>
                      <span className="text-xs font-bold text-gray-400 group-hover:text-pink-600 group-hover:translate-x-0.5 transition-all">→</span>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-base font-bold text-gray-900 group-hover:text-pink-600 transition-colors">Social Platforms</h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">YouTube, Instagram, Facebook, Telegram, WhatsApp &amp; X links.</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                      <span>Social Media</span>
                      <span className="text-pink-600 font-semibold">Follow Links</span>
                    </div>
                  </button>

                  {/* 13. Podcast Platforms */}
                  <button
                    onClick={() => setView("settings-podcast-platforms")}
                    className="group bg-white p-5 rounded-xl border border-gray-200/80 shadow-2xs hover:shadow-md hover:border-violet-500/30 transition-all text-left flex flex-col justify-between"
                  >
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center group-hover:bg-violet-600 group-hover:text-white transition-colors">
                        <Headphones size={20} />
                      </div>
                      <span className="text-xs font-bold text-gray-400 group-hover:text-violet-600 group-hover:translate-x-0.5 transition-all">→</span>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-base font-bold text-gray-900 group-hover:text-violet-600 transition-colors">Podcast Platforms</h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">Spotify, Apple Podcasts, Amazon Music, and Google Podcasts buttons.</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                      <span>Platform Links</span>
                      <span className="text-violet-600 font-semibold">Audio Apps</span>
                    </div>
                  </button>

                  {/* 14. Profile Link Hub */}
                  <button
                    onClick={() => setView("profile")}
                    className="group bg-white p-5 rounded-xl border border-gray-200/80 shadow-2xs hover:shadow-md hover:border-orange-500/30 transition-all text-left flex flex-col justify-between"
                  >
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-colors">
                        <UserCircle size={20} />
                      </div>
                      <span className="text-xs font-bold text-gray-400 group-hover:text-orange-600 group-hover:translate-x-0.5 transition-all">→</span>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-base font-bold text-gray-900 group-hover:text-orange-600 transition-colors">Profile Link Hub</h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">Link-in-bio page, avatar, intro tagline, and direct quick-action links.</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                      <span>Bio &amp; Quick Links</span>
                      <span className="text-orange-600 font-semibold">/profile</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Recent Activity Table */}
              <div className="bg-white rounded-xl shadow-xs border border-gray-200/80 overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/70">
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Recent Content Activity</h3>
                  <span className="text-xs text-gray-400">Last 5 updated records</span>
                </div>
                <div className="divide-y divide-gray-100">
                  {allRecentActivity.map((item: any) => (
                    <div key={`${item.type}-${item.slug}`} className="p-4 sm:px-6 hover:bg-gray-50/80 transition-colors flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${item.type === 'article' ? 'bg-blue-50 text-blue-600' : item.type === 'video' ? 'bg-red-50 text-red-600' : 'bg-purple-50 text-purple-600'}`}>
                          {item.type === 'article' ? <FileText size={15} /> : item.type === 'video' ? <Video size={15} /> : <Mic size={15} />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{item.title}</p>
                          <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-0.5">
                            <span className="uppercase font-medium text-gray-400">{item.type}</span>
                            <span>•</span>
                            <span>{item.publishedAt}</span>
                            <span>•</span>
                            <StatusBadge status={item.status || 'published'} />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {item.type === 'article' && (
                          <button onClick={() => openArticleEditor(item)} className="px-3 py-1 bg-gray-100 hover:bg-[#15664a] hover:text-white rounded text-xs font-semibold text-gray-700 transition-colors">
                            Edit
                          </button>
                        )}
                        {item.type === 'video' && (
                          <button onClick={() => openVideoEditor(item)} className="px-3 py-1 bg-gray-100 hover:bg-[#15664a] hover:text-white rounded text-xs font-semibold text-gray-700 transition-colors">
                            Edit
                          </button>
                        )}
                        {item.type === 'podcast' && (
                          <button onClick={() => openPodcastEditor(item)} className="px-3 py-1 bg-gray-100 hover:bg-[#15664a] hover:text-white rounded text-xs font-semibold text-gray-700 transition-colors">
                            Edit
                          </button>
                        )}
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
