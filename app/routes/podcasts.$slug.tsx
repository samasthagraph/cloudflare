import React, { useState, useEffect } from 'react';
import { useLoaderData, useNavigate, useLocation, useRouteError, isRouteErrorResponse, Link } from "@remix-run/react";
import { json, redirect, type MetaFunction } from "@remix-run/cloudflare";
import { ChevronDown, ChevronUp, Share2, Check, Link as LinkIcon, Facebook, Twitter, MessageCircle, Clock, Calendar, Plus } from 'lucide-react';
import { PodcastPlayer } from '../components/PodcastPlayer';
import { PodcastArtwork } from '../components/PodcastArtwork';
import { PodcastRecommendations } from '../components/PodcastRecommendations';
import { isMalayalam } from '~/utils/language';
import { fetchLiveSpotifyPodcasts } from '~/utils/podcasts.server';
import { getDbPodcasts } from '~/utils/db.server';

const themeMap: Record<string, { title: string; body: string; align: string }> = {
  'theme-malayalam-standard': {
    title: 'font-heading text-3xl md:text-5xl',
    body: 'font-sans',
    align: 'text-left'
  },
  'theme-cinematic': {
    title: 'font-poppins text-3xl md:text-5xl',
    body: 'font-inter',
    align: 'text-left'
  },
  'theme-english-minimal': {
    title: 'font-inter text-2xl md:text-4xl',
    body: 'font-inter',
    align: 'text-left'
  }
};

export const meta: MetaFunction<typeof loader> = ({ data }: any) => {
  if (!data || !data.podcast) {
    return [{ title: "Podcast Not Found • Samastha Graph" }];
  }
  const { podcast } = data;
  const ogImage = podcast.customThumbnail || podcast.artwork || `/default-podcast.jpg`;
  return [
    { title: `${podcast.title} • Samastha Graph` },
    { name: "description", content: podcast.description?.substring(0, 160) || "Listen to this podcast on Samastha Graph." },
    { property: "og:title", content: podcast.title },
    { property: "og:description", content: podcast.description?.substring(0, 160) },
    { property: "og:image", content: ogImage },
    { property: "og:type", content: "music.song" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: podcast.title },
    { name: "twitter:description", content: podcast.description?.substring(0, 160) },
    { name: "twitter:image", content: ogImage },
    { tagName: "link", rel: "canonical", href: data.url },
    ...(data.counterpartSlug ? [
      { tagName: "link", rel: "alternate", hreflang: "ml", href: `https://samasthagraph.pages.dev/podcasts/${new URL(data.url).pathname.startsWith('/en') ? data.counterpartSlug : podcast.slug}` },
      { tagName: "link", rel: "alternate", hreflang: "en", href: `https://samasthagraph.pages.dev/en/podcasts/${new URL(data.url).pathname.startsWith('/en') ? podcast.slug : data.counterpartSlug}` }
    ] : [])
  ] as any;
};

export const loader = async ({ params, context, request }: any) => {
  const { slug } = params;
  let allPodcasts: any[] = [];

  const env = context?.cloudflare?.env || context?.env || (typeof process !== 'undefined' ? process.env : {});
  const githubToken = env.GITHUB_TOKEN;
  const githubOwner = env.GITHUB_OWNER || "samasthagraph";
  const githubRepo = env.GITHUB_REPO || "cloudflare";

  const localPodcasts = import.meta.glob("../content/podcasts/*.json", { import: 'default', eager: true });
  const localMap = new Map();
  Object.entries(localPodcasts).forEach(([path, content]: any) => {
    const s = path.split('/').pop()?.replace('.json', '');
    localMap.set(s, { slug: s, ...content });
  });

  const dbPodcasts = await getDbPodcasts(env?.DB);
  dbPodcasts.forEach((p: any) => {
    if (p.slug) localMap.set(p.slug, p);
  });

  try {
    const liveEpisodes = await fetchLiveSpotifyPodcasts();
    liveEpisodes.forEach(ep => localMap.set(ep.slug, ep));
  } catch (e) {
    console.error("Live Spotify podcast fetch error:", e);
  }

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

      const podcastFiles = await fetchFolder('podcasts').catch(() => []);
      
      await Promise.all(
        (podcastFiles as any[] || []).filter(f => f.name.endsWith('.json')).map(async (file) => {
          const content = await fetchFileContent(file.url);
          const s = file.name.replace('.json', '');
          localMap.set(s, { slug: s, ...JSON.parse(content) }); // Override local with live github data
        })
      );
    } catch (e) {
      console.error("GitHub Sync failed, using local files only:", e);
    }
  }

  allPodcasts = Array.from(localMap.values());

  // Format podcasts
  allPodcasts = allPodcasts.map((p: any, index: number) => {
    const activeTheme = themeMap[p.themePreset] || themeMap['theme-malayalam-standard'];
    
    return {
      id: p.slug || p.id || `podcast-${index}`,
      slug: p.slug,
      rawSlug: p.rawSlug || p.slug,
      showId: p.showId || 'samastha-graph',
      showTitle: p.showTitle || 'Samastha Graph',
      showSubtitle: p.showSubtitle || 'Samastha Graph',
      showImage: p.showImage || p.image,
      audioUrl: p.audioUrl,
      title: p.title,
      theme: activeTheme,
      description: p.description || p.body || "",
      category: p.category || p.showSubtitle || p.showTitle || "General",
      programme: p.programme || p.showTitle || null,
      playlist: p.playlist || p.series || p.showTitle || null,
      episodeNumber: p.episodeNumber || null,
      date: p.publishedAt ? new Date(p.publishedAt).toLocaleDateString() : "Recent",
      rawDate: p.publishedAt || "1970-01-01",
      duration: p.duration || null,
      status: p.status || "published",
      customThumbnail: p.customThumbnail || p.image || p.coverImage || p.artwork || "https://d3t3ozftmdmh3i.cloudfront.net/staging/podcast_uploaded_nologo/46535697/46535697-1786530965061-a1e35ade3abba.jpg",
      artwork: p.artwork || p.image || p.coverImage || "https://d3t3ozftmdmh3i.cloudfront.net/staging/podcast_uploaded_nologo/46535697/46535697-1786530965061-a1e35ade3abba.jpg",
      spotifyUrl: p.spotifyUrl || null,
      language: p.language,
      translationGroupId: p.translationGroupId
    };
  });

  const published = allPodcasts.filter(p => p.status === 'published');
  published.sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime());

  const malayalamPublished = published.filter(p => isMalayalam(p));

  const activePodcast = 
    malayalamPublished.find(p => p.slug === slug || p.rawSlug === slug || p.slug.endsWith('-' + slug)) || 
    published.find(p => p.slug === slug || p.rawSlug === slug || p.slug.endsWith('-' + slug));
  if (!activePodcast) {
    throw new Response("Podcast Not Found", { status: 404 });
  }
  published.sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime());

  const upcoming = allPodcasts.filter(p => p.status === 'scheduled');

  // Related Logic
  let related = malayalamPublished.filter(p => p.slug !== slug && p.category === activePodcast.category);
  if (related.length === 0) related = malayalamPublished.filter(p => p.slug !== slug); // fallback to recent
  
  let series = [];
  let upNext = null;
  
  if (activePodcast.playlist) {
    series = malayalamPublished.filter(p => p.playlist === activePodcast.playlist).sort((a, b) => (a.episodeNumber || 0) - (b.episodeNumber || 0));
    // Determine next in series
    const currentIndex = series.findIndex(p => p.slug === slug);
    if (currentIndex !== -1 && currentIndex < series.length - 1) {
      upNext = series[currentIndex + 1];
    }
  } else {
    upNext = related.length > 0 ? related[0] : null;
  }
  
  let counterpartSlug = null;
  if (activePodcast.translationGroupId) {
    const counterpart = published.find((p: any) => 
      p.translationGroupId === activePodcast.translationGroupId && p.slug !== activePodcast.slug && !isMalayalam(p)
    );
    if (counterpart) counterpartSlug = counterpart.slug;
  }

  return json(
    { 
      podcast: activePodcast, 
      related: related.slice(0, 6), 
      series, 
      upNext, 
      upcoming: upcoming.slice(0, 4),
      url: request.url, 
      counterpartSlug 
    },
    {
      headers: {
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    }
  );
};

export default function PodcastDetail() {
  const { podcast, related, upNext, series, upcoming, url } = useLoaderData<typeof loader>();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [expandedDesc, setExpandedDesc] = useState(false);
  
  const [shareCopied, setShareCopied] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [queueAdded, setQueueAdded] = useState(false);

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: podcast.title,
          text: 'Listen to this podcast on Samastha Graph',
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

  const handleAddToQueue = () => {
    const currentQueue = JSON.parse(localStorage.getItem('podcast_queue') || '[]');
    // Add only basic info needed to render queue (we just save the slug to keep it lightweight)
    if (!currentQueue.includes(podcast.slug)) {
      currentQueue.push(podcast.slug);
      localStorage.setItem('podcast_queue', JSON.stringify(currentQueue));
    }
    setQueueAdded(true);
    setTimeout(() => setQueueAdded(false), 2000);
  };

  const navigate = useNavigate();
  const location = useLocation();
  const [autoplayNext, setAutoplayNext] = useState(false);

  useEffect(() => {
    if (location.state && (location.state as any).autoplay) {
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  }, [podcast.slug, location.state]);

  const handleEnded = () => {
    setIsPlaying(false);
    if (autoplayNext && upNext) {
      navigate(`/podcasts/${upNext.slug}`, { state: { autoplay: true } });
    }
  };

  return (
    <div className="min-h-screen font-sans bg-white text-brand-dark pb-24 overflow-x-hidden selection:bg-brand-gold selection:text-brand-dark">
      
      {/* Top Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 lg:pt-16 pb-8">
        <Link 
          to="/podcasts" 
          className="inline-flex items-center gap-2 text-brand-olive font-bold text-xs uppercase tracking-widest hover:text-brand-gold transition-colors duration-300"
        >
          <span className="transform transition-transform group-hover:-translate-x-1">←</span>
          Back to Podcast
        </Link>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-grow relative z-10">
        <div className="flex flex-col gap-12">
          
          {/* Episode Identity & Artwork Header */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center border-b border-brand-surface/60 pb-10">
            {/* Artwork */}
            <div className="lg:col-span-4 flex justify-center">
              <div className="w-full max-w-sm aspect-video sm:aspect-square rounded-2xl overflow-hidden shadow-2xl border border-brand-surface/60 relative group bg-black">
                <img 
                  src={podcast.customThumbnail || podcast.image || podcast.coverImage || podcast.artwork} 
                  alt={podcast.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="absolute inset-0 bg-black/20 flex items-center justify-center focus:outline-none cursor-pointer"
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  <div className={`w-16 h-16 rounded-full bg-brand-gold text-brand-dark flex items-center justify-center shadow-lg transition-transform duration-300 ${isPlaying ? 'scale-110' : 'group-hover:scale-110'}`}>
                    {isPlaying ? <span className="text-xl font-bold">❚❚</span> : <span className="text-xl font-bold ml-1">▶</span>}
                  </div>
                </button>
              </div>
            </div>

            {/* Title & Metadata */}
            <div className="lg:col-span-8 flex flex-col justify-center">
              <div className="inline-flex items-center gap-3 mb-4">
                <span className="w-8 h-px bg-brand-gold"></span>
                <span className="text-xs font-bold tracking-[0.2em] text-brand-gold uppercase">
                  {podcast.programme || podcast.category || "PODCAST"}
                </span>
              </div>
              
              <h1 className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl leading-tight text-brand-dark mb-6">
                {podcast.title}
              </h1>

              <div className="flex flex-wrap items-center gap-6 text-sm font-semibold tracking-wider text-brand-olive uppercase mb-6">
                {podcast.episodeNumber && <span>Episode {podcast.episodeNumber}</span>}
                <div className="flex items-center gap-2"><Calendar size={16} /> {podcast.date}</div>
                {podcast.duration && <div className="flex items-center gap-2"><Clock size={16} /> {podcast.duration}</div>}
              </div>

              {podcast.spotifyUrl && (
                <div>
                  <a 
                    href={podcast.spotifyUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1DB954] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#1aa34a] transition-colors shadow-md"
                  >
                    Listen on Spotify
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Primary Listening Experience */}
          <section className="bg-brand-light border border-brand-surface/60 rounded-xl p-4 md:p-8 lg:p-12 shadow-[0_20px_50px_-15px_rgba(45,90,70,0.06)] relative overflow-hidden">
            <div className="relative z-10 w-full">
              <div className="mb-6 lg:mb-8 text-xs font-bold tracking-widest text-brand-olive uppercase text-center">
                Listen Now
              </div>
              
              <div className="w-full">
                 <PodcastPlayer 
                    slug={podcast.slug}
                    audioUrl={podcast.audioUrl}
                    title={podcast.title}
                    isPlaying={isPlaying}
                    setIsPlaying={setIsPlaying}
                    onEnded={handleEnded}
                    variant="expanded"
                    podcast={podcast}
                 />
                 
                 {/* Action Bar (Share) */}
                 <div className="mt-8 pt-6 border-t border-brand-surface/40 flex justify-center">
                   <div className="relative">
                     <button 
                       onClick={handleShare}
                       className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-brand-olive hover:text-brand-gold transition-colors"
                     >
                       <Share2 size={16} /> Share Episode
                     </button>
                     {showShareMenu && (
                       <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-48 bg-white border border-brand-surface/60 rounded-xl shadow-xl p-2 z-50">
                         <button onClick={handleCopyLink} className="flex items-center gap-3 w-full px-3 py-2 text-sm font-semibold text-brand-dark hover:bg-brand-light rounded-lg transition-colors">
                           {shareCopied ? <Check size={16} className="text-brand-gold" /> : <LinkIcon size={16} />} 
                           {shareCopied ? 'Copied!' : 'Copy Link'}
                         </button>
                       </div>
                     )}
                   </div>
                 </div>
              </div>
            </div>
          </section>

          {/* Episode Description */}
          {podcast.description && (
            <section className="mt-4 max-w-4xl">
              <h3 className="font-sans text-xs font-bold tracking-widest text-brand-olive uppercase mb-6 flex items-center gap-4">
                Episode Information
                <span className="flex-grow h-px bg-brand-surface/60"></span>
              </h3>
              <div className="prose prose-lg prose-emerald max-w-none text-brand-dark/80 leading-relaxed font-sans">
                <div dangerouslySetInnerHTML={{ __html: podcast.description }} className={podcast.theme.body} />
              </div>
            </section>
          )}

          {/* Footer Navigation */}
          <footer className="mt-16 pt-10 border-t border-brand-surface/60 flex flex-col sm:flex-row justify-between items-center gap-6">
            <Link 
              to="/podcasts" 
              className="group inline-flex items-center gap-3 text-brand-dark font-bold text-sm uppercase tracking-widest hover:text-brand-gold transition-colors"
            >
              <span className="transform transition-transform group-hover:-translate-x-1">←</span>
              Return to Audio Archive
            </Link>
            
            {upNext && (
              <Link 
                to={`/podcasts/${upNext.slug}`}
                className="group inline-flex items-center gap-3 text-brand-dark font-bold text-sm uppercase tracking-widest hover:text-brand-gold transition-colors text-right"
              >
                Next Episode
                <span className="transform transition-transform group-hover:translate-x-1">→</span>
              </Link>
            )}
          </footer>

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
        <h2 className="text-2xl font-heading font-bold text-[#2D5A46] mb-4">
          {is404 ? 'Podcast Not Found' : 'Error'}
        </h2>
        <p className="text-[#60834f] mb-8 font-malayalam">
          {is404 ? 'The requested podcast could not be found.' : 'An unexpected error occurred while loading this podcast.'}
        </p>
        <Link to="/podcasts" className="inline-flex items-center gap-2 bg-[#2D5A46] text-white px-6 py-3 rounded-full hover:bg-[#c8a136] transition-colors">
          <ChevronDown className="rotate-90" size={20} /> Back to Podcasts
        </Link>
      </div>
    </div>
  );
}
