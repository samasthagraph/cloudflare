import React, { useState } from 'react';
import { useLoaderData, Link, useRouteError, isRouteErrorResponse } from "@remix-run/react";
import { json, redirect, type MetaFunction } from "@remix-run/cloudflare";
import { PlayCircle, Share2, Facebook, Twitter, MessageCircle, Clock, Tag, Search, MoreVertical, ThumbsUp, MessageSquare, ChevronDown, Calendar, ChevronUp, Check, Link as LinkIcon } from "lucide-react";
import { OptimizedImage } from "~/components/OptimizedImage";
import { isMalayalam } from "~/utils/language";
import { extractYouTubeId, getYouTubeThumbnail } from "~/utils/youtube";

const themeMap: Record<string, { title: string; body: string; align: string }> = {
  'theme-malayalam-standard': {
    title: 'font-heading text-2xl md:text-3xl',
    body: 'font-sans',
    align: 'text-left'
  },
  'theme-cinematic': {
    title: 'font-poppins text-3xl md:text-4xl',
    body: 'font-inter',
    align: 'text-center'
  },
  'theme-english-minimal': {
    title: 'font-inter text-xl md:text-2xl',
    body: 'font-inter',
    align: 'text-left'
  }
};

export const meta: MetaFunction<typeof loader> = ({ data }: any) => {
  if (!data || !data.video) {
    return [{ title: "Video Not Found | Samastha Graph" }];
  }
  const { video } = data;
  const ogImage = video.customThumbnail || getYouTubeThumbnail(video.youtubeId);
  return [
    { title: `${video.title} | Samastha Graph` },
    { name: "description", content: video.description?.substring(0, 160) || "Watch this video on Samastha Graph." },
    { property: "og:title", content: video.title },
    { property: "og:description", content: video.description?.substring(0, 160) },
    { property: "og:image", content: ogImage },
    { property: "og:type", content: "video.other" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: video.title },
    { name: "twitter:description", content: video.description?.substring(0, 160) },
    { name: "twitter:image", content: ogImage },
    { tagName: "link", rel: "canonical", href: data.url },
    ...(data.counterpartSlug ? [
      { tagName: "link", rel: "alternate", hreflang: "ml", href: `https://samasthagraph.pages.dev/videos/${new URL(data.url).pathname.startsWith('/en') ? data.counterpartSlug : video.slug}` },
      { tagName: "link", rel: "alternate", hreflang: "en", href: `https://samasthagraph.pages.dev/en/videos/${new URL(data.url).pathname.startsWith('/en') ? video.slug : data.counterpartSlug}` }
    ] : [])
  ] as any;
};

export const loader = async ({ params, context, request }: any) => {
  const { slug } = params;
  let allVideos: any[] = [];

  const env = context?.cloudflare?.env || context?.env || (typeof process !== 'undefined' ? process.env : {});
  const githubToken = env.GITHUB_TOKEN;
  const githubOwner = env.GITHUB_OWNER || "samasthagraph";
  const githubRepo = env.GITHUB_REPO || "cloudflare";

  const jsonVideos = import.meta.glob("../content/videos/*.json", { import: 'default', eager: true });
  const mdxVideos = import.meta.glob("../content/videos/*.mdx", { query: '?raw', import: 'default', eager: true });
  
  const localMap = new Map();
  Object.entries(jsonVideos).forEach(([path, content]: any) => {
    const s = path.split('/').pop()?.replace('.json', '');
    localMap.set(s, { slug: s, ...content });
  });
  Object.entries(mdxVideos).forEach(([path, content]: any) => {
    const s = path.split('/').pop()?.replace('.mdx', '');
    localMap.set(s, { slug: s, ...content });
  });

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
        const data = (await res.json()) as any;
        const base64 = data.content.replace(/\n/g, '');
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        const decoder = new TextDecoder('utf-8');
        return decoder.decode(bytes);
      };

      const videoFiles = await fetchFolder('videos').catch(() => []);
      
      await Promise.all(
        (videoFiles as any[] || []).filter(f => f.name.endsWith('.json')).map(async (file) => {
          const content = await fetchFileContent(file.url);
          const s = file.name.replace('.json', '');
          localMap.set(s, { slug: s, ...JSON.parse(content) }); // Override local with live github data
        })
      );
    } catch (e) {
      console.error("GitHub Sync failed, using local files only:", e);
    }
  }

  allVideos = Array.from(localMap.values());

  if (allVideos.length === 0) {
    const jsonVideos = import.meta.glob("../content/videos/*.json", { import: 'default', eager: true });
    allVideos = Object.entries(jsonVideos).map(([path, content]: any) => {
      return { slug: path.split('/').pop()?.replace('.json', ''), ...content };
    });
  }

  // Format videos
  allVideos = allVideos.map((v: any, index: number) => {
    const ytId = extractYouTubeId(v.youtubeId);
    const activeTheme = themeMap[v.themePreset] || themeMap['theme-malayalam-standard'];
    
    return {
      id: v.slug || v.id || `video-${index}`,
      slug: v.slug,
      youtubeId: ytId,
      title: v.title,
      theme: activeTheme,
      description: v.description || v.body || "",
      category: v.category || (v.programId ? (v.programId === 'minal-qalb' ? 'Minal Qalb' : v.programId === 'noorul-hira' ? 'Noorul Hira' : v.programId === 'ananthapporul' ? 'Ananthapporul' : v.programId) : "General"),
      playlist: v.playlist || null,
      date: v.publishedAt ? new Date(v.publishedAt).toLocaleDateString() : "Recent",
      rawDate: v.publishedAt || "1970-01-01",
      status: v.status || "published",
      customThumbnail: v.customThumbnail || null,
      language: v.language,
      translationGroupId: v.translationGroupId
    };
  }).filter(v => v.status === 'published');

  const malayalamVideos = allVideos.filter(v => isMalayalam(v));
  malayalamVideos.sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime());

  const activeVideo = malayalamVideos.find(v => v.slug === slug);

  if (!activeVideo) {
    throw new Response("Video Not Found", { status: 404 });
  }

  // Find related videos (same category or recent)
  const relatedVideos = malayalamVideos.filter(v => v.slug !== slug && v.category === activeVideo.category).slice(0, 4);
  
  // If we don't have related videos in the same category, just take the most recent ones
  const finalRelated = relatedVideos.length > 0 ? relatedVideos : malayalamVideos.filter(v => v.slug !== slug).slice(0, 4);
  const upNext = finalRelated.length > 0 ? finalRelated[0] : null;

  let counterpartSlug = null;
  if (activeVideo.translationGroupId) {
    const counterpart = allVideos.find((v: any) => 
      v.translationGroupId === activeVideo.translationGroupId && v.slug !== activeVideo.slug && !isMalayalam(v)
    );
    if (counterpart) counterpartSlug = counterpart.slug;
  }

  // Phase 2: find the program this video belongs to, if any
  let videoProgram: any = null;
  if (activeVideo) {
    const rawProgramId = (localMap.get(activeVideo.slug) as any)?.programId ||
      Object.entries(jsonVideos).find(([path]) => path.split('/').pop()?.replace('.json', '') === activeVideo.slug)?.[1] &&
      (Object.entries(jsonVideos).find(([path]) => path.split('/').pop()?.replace('.json', '') === activeVideo.slug)?.[1] as any)?.programId;
    const programId = rawProgramId || null;
    if (programId) {
      const programsGlob = import.meta.glob("../content/programs/*.json", { import: 'default', eager: true });
      const matched = Object.entries(programsGlob)
        .map(([path, content]: any) => ({ slug: path.split('/').pop()?.replace('.json', ''), ...content }))
        .find((p: any) => p.slug === programId && isMalayalam(p) && p.status === 'published');
      if (matched) videoProgram = matched;
    }
  }

  return json(
    { video: activeVideo, relatedVideos: finalRelated, upNext, url: request.url, counterpartSlug, videoProgram },
    {
      headers: {
        "Cache-Control": "public, max-age=60",
      },
    }
  );
};


export default function VideoDetail() {
  const { video, relatedVideos, upNext, url, videoProgram } = useLoaderData<typeof loader>() as any;

  const [expandedDesc, setExpandedDesc] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: video.title,
          text: 'Watch this on Samastha Graph',
          url: url,
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      setShowShareMenu(!showShareMenu);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(url);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
    setShowShareMenu(false);
  };

  const thumbnailImage = video.customThumbnail || getYouTubeThumbnail(video.youtubeId);

  return (
    <div className="min-h-screen bg-[#F7F5F0] font-sans text-[#18181B] selection:bg-[#C5A059] selection:text-white flex flex-col">
      {/* Cinematic Hero */}
      <div className="bg-[#27272A] relative w-full pt-6 pb-12 overflow-hidden border-b border-[#2D5A46]/20 shadow-lg">
        {/* Blurred backdrop for cinematic depth */}
        <div 
          className="absolute inset-0 bg-center bg-cover bg-no-repeat opacity-20 blur-[80px] transform scale-110 pointer-events-none transition-all duration-1000" 
          style={{ backgroundImage: `url(${thumbnailImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#27272A] opacity-80 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="aspect-video w-full max-w-5xl mx-auto bg-black rounded-2xl overflow-hidden shadow-2xl border border-[#52525B]/40 ring-1 ring-[#FFFFFF]/10 animate-in fade-in zoom-in-95 duration-700">
            <iframe 
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${video.youtubeId}?rel=0&modestbranding=1&autoplay=1`}
              title={video.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-grow flex flex-col lg:flex-row gap-12">
        {/* Main Content Column */}
        <div className="w-full lg:w-2/3 flex flex-col gap-8 animate-in slide-in-from-bottom-8 duration-700 delay-100 fill-mode-both">
          
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#2D5A46] uppercase tracking-wider">
              <span className="px-3 py-1 bg-[#2D5A46]/10 rounded-full border border-[#2D5A46]/20">{video.category}</span>
              {video.playlist && (
                <span className="px-3 py-1 bg-[#C5A059]/10 text-[#C5A059] rounded-full border border-[#C5A059]/20">{video.playlist}</span>
              )}
              {videoProgram && (
                <Link to={`/videos/programs/${videoProgram.slug}`}
                  className="px-3 py-1 bg-[#15664a]/10 text-[#15664a] rounded-full border border-[#15664a]/20 hover:bg-[#15664a]/20 transition-colors font-semibold">
                  Part of: {videoProgram.title}
                </Link>
              )}
            </div>

            <h1 className={`font-heading text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight text-[#18181B] ${video.theme.title} text-left`}>
              {video.title}
            </h1>
            
            <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-[#E4E4E7]">
              <div className="flex items-center gap-4 text-sm font-medium text-[#52525B]">
                <div className="flex items-center gap-1.5">
                  <Calendar size={16} />
                  <span>{video.date}</span>
                </div>
              </div>
              
              <div className="relative">
                <button 
                  onClick={handleShare}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E4E4E7] rounded-full shadow-sm hover:bg-[#F5EFE0] hover:border-[#C5A059] transition-colors text-sm font-semibold text-[#27272A]"
                >
                  <Share2 size={16} /> Share
                </button>
                {showShareMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-[#E4E4E7] rounded-xl shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <button onClick={handleCopyLink} className="flex items-center gap-3 w-full px-3 py-2 text-sm text-[#27272A] hover:bg-[#F5EFE0] rounded-lg transition-colors">
                      {shareCopied ? <Check size={16} className="text-green-600" /> : <LinkIcon size={16} />} 
                      {shareCopied ? 'Copied!' : 'Copy Link'}
                    </button>
                    <a href={`https://api.whatsapp.com/send?text=${encodeURIComponent(video.title + ' ' + url)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 w-full px-3 py-2 text-sm text-[#27272A] hover:bg-[#F5EFE0] rounded-lg transition-colors">
                      <MessageCircle size={16} /> WhatsApp
                    </a>
                    <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(video.title)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 w-full px-3 py-2 text-sm text-[#27272A] hover:bg-[#F5EFE0] rounded-lg transition-colors">
                      <Twitter size={16} /> X (Twitter)
                    </a>
                    <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 w-full px-3 py-2 text-sm text-[#27272A] hover:bg-[#F5EFE0] rounded-lg transition-colors">
                      <Facebook size={16} /> Facebook
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {video.description && (
            <div className="bg-white rounded-2xl p-6 border border-[#E4E4E7] shadow-sm">
              <h3 className="text-lg font-bold text-[#27272A] mb-3">About this video</h3>
              <div 
                className={`relative font-body text-[#52525B] leading-relaxed transition-all duration-500 overflow-hidden ${expandedDesc ? '' : 'max-h-24'}`}
              >
                <div dangerouslySetInnerHTML={{ __html: video.description }} className={video.theme.body} />
                {!expandedDesc && (
                  <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
                )}
              </div>
              <button 
                onClick={() => setExpandedDesc(!expandedDesc)}
                className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-[#2D5A46] hover:text-[#234737] transition-colors"
              >
                {expandedDesc ? 'Show less' : 'Read more'}
                {expandedDesc ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>
          )}
        </div>

        {/* Sidebar Column */}
        <div className="w-full lg:w-1/3 flex flex-col gap-8 animate-in slide-in-from-bottom-8 duration-700 delay-200 fill-mode-both overflow-hidden">
          
          {upNext && (
            <div className="flex flex-col gap-4">
              <h3 className="font-heading text-xl font-bold text-[#18181B] border-l-4 border-[#C5A059] pl-3">Up Next</h3>
              <Link 
                to={`/videos/${upNext.slug}`}
                className="group flex gap-4 bg-white p-3 rounded-2xl border border-[#E4E4E7] shadow-sm hover:shadow-md transition-all duration-300 hover:border-[#C5A059]/50 block"
              >
                <div className="w-40 aspect-video rounded-lg overflow-hidden bg-black relative flex-shrink-0">
                  <OptimizedImage 
                    src={upNext.customThumbnail || getYouTubeThumbnail(upNext.youtubeId)}
                    alt={upNext.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors flex items-center justify-center">
                    <PlayCircle size={32} className="text-white/80 group-hover:text-white transition-colors" />
                  </div>
                </div>
                <div className="flex flex-col justify-center flex-grow py-1">
                  <h4 className="font-heading text-sm font-bold text-[#27272A] line-clamp-2 group-hover:text-[#2D5A46] transition-colors mb-1 leading-snug">
                    {upNext.title}
                  </h4>
                  <span className="text-xs text-[#52525B] font-medium">{upNext.date}</span>
                </div>
              </Link>
            </div>
          )}

          {relatedVideos.length > 0 && (
            <div className="flex flex-col gap-4">
              <h3 className="font-heading text-xl font-bold text-[#18181B] border-l-4 border-[#2D5A46] pl-3">Related Videos</h3>
              <div className="flex flex-col gap-3">
                {relatedVideos.map((rv: any) => (
                  <Link 
                    key={rv.id}
                    to={`/videos/${rv.slug}`}
                    className="group flex gap-3 hover:bg-white p-2 rounded-xl transition-colors duration-200"
                  >
                    <div className="w-32 aspect-video rounded-md overflow-hidden bg-black relative flex-shrink-0 shadow-sm">
                      <OptimizedImage 
                        src={rv.customThumbnail || getYouTubeThumbnail(rv.youtubeId)}
                        alt={rv.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="flex flex-col justify-start flex-grow">
                      <h4 className="font-heading text-sm font-bold text-[#27272A] line-clamp-2 group-hover:text-[#2D5A46] transition-colors leading-tight mb-1">
                        {rv.title}
                      </h4>
                      <span className="text-xs text-[#52525B]">{rv.category}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  const is404 = isRouteErrorResponse(error) && error.status === 404;

  return (
    <div className="min-h-screen bg-[#eef3f1] flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
        <h2 className="text-2xl font-heading font-bold text-[#15664a] mb-4">
          {is404 ? 'Video Not Found' : 'Error'}
        </h2>
        <p className="text-[#60834f] mb-8 font-malayalam">
          {is404 ? 'The requested video could not be found.' : 'An unexpected error occurred while loading this video.'}
        </p>
        <Link to="/videos" className="inline-flex items-center gap-2 bg-[#15664a] text-white px-6 py-3 rounded-full hover:bg-[#c8a136] transition-colors">
          <ChevronDown className="rotate-90" size={20} /> Back to Videos
        </Link>
      </div>
    </div>
  );
}
