import React, { useState, useEffect } from 'react';
import { useLoaderData, useNavigate, useLocation, useRouteError, isRouteErrorResponse, Link } from "@remix-run/react";
import { json, redirect, type MetaFunction } from "@remix-run/cloudflare";
import { ChevronDown, ChevronUp, Share2, Check, Link as LinkIcon, Facebook, Twitter, MessageCircle, Clock, Calendar, Plus } from 'lucide-react';
import { PodcastPlayer } from '../components/PodcastPlayer';
import { PodcastArtwork } from '../components/PodcastArtwork';
import { PodcastRecommendations } from '../components/PodcastRecommendations';
import { isEnglish } from '~/utils/language';
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
    return [{ title: "Podcast Not Found | Samastha Graph" }];
  }
  const { podcast } = data;
  const ogImage = podcast.customThumbnail || podcast.artwork || `/default-podcast.jpg`;
  return [
    { title: `${podcast.title} | Samastha Graph Podcasts` },
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
    console.error("Live Spotify podcast fetch error in English detail:", e);
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
      audioUrl: p.audioUrl,
      title: p.title,
      theme: activeTheme,
      description: p.description || p.body || "",
      category: p.category || "General",
      programme: p.programme || null,
      playlist: p.playlist || p.series || null,
      episodeNumber: p.episodeNumber || null,
      date: p.publishedAt ? new Date(p.publishedAt).toLocaleDateString() : "Recent",
      rawDate: p.publishedAt || "1970-01-01",
      duration: p.duration || null,
      status: p.status || "published",
      customThumbnail: p.customThumbnail || p.image || p.coverImage || p.artwork || "https://d3t3ozftmdmh3i.cloudfront.net/staging/podcast_uploaded_nologo/46535697/46535697-1786530965061-a1e35ade3abba.jpg",
      artwork: p.artwork || p.image || p.coverImage || "https://d3t3ozftmdmh3i.cloudfront.net/staging/podcast_uploaded_nologo/46535697/46535697-1786530965061-a1e35ade3abba.jpg",
      language: p.language,
      translationGroupId: p.translationGroupId
    };
  });

  const published = allPodcasts.filter(p => p.status === 'published');
  published.sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime());

  const englishPublished = published.filter(p => isEnglish(p));

  const activePodcast = englishPublished.find(p => p.slug === slug) || published.find(p => p.slug === slug);
  if (!activePodcast) {
    throw new Response("Podcast Not Found", { status: 404 });
  }
  published.sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime());

  const upcoming = allPodcasts.filter(p => p.status === 'scheduled');

  // Related Logic
  let related = englishPublished.filter(p => p.slug !== slug && p.category === activePodcast.category);
  if (related.length === 0) related = englishPublished.filter(p => p.slug !== slug); // fallback to recent
  
  let series = [];
  let upNext = null;
  
  if (activePodcast.playlist) {
    series = englishPublished.filter(p => p.playlist === activePodcast.playlist).sort((a, b) => (a.episodeNumber || 0) - (b.episodeNumber || 0));
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
      p.translationGroupId === activePodcast.translationGroupId && p.slug !== activePodcast.slug && !isEnglish(p)
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
    <div className={`min-h-screen font-sans transition-colors duration-1000 ease-in-out selection:bg-[#C5A059] selection:text-white flex flex-col overflow-x-hidden ${isPlaying ? 'bg-[#27272A]' : 'bg-[#F7F5F0]'}`}>
      
      {/* Dynamic Soundscape Background */}
      <div 
        className={`fixed inset-0 pointer-events-none transition-opacity duration-1000 ease-in-out z-0 ${isPlaying ? 'opacity-100' : 'opacity-0'}`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#2D5A46]/20 via-[#27272A] to-[#27272A]" />
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 lg:pt-20 pb-16 w-full flex-grow relative z-10 flex flex-col lg:flex-row gap-12 lg:gap-20">
        
        {/* Left Column: Artwork & Player */}
        <div className="w-full lg:w-1/2 flex flex-col gap-10">
          
          <PodcastArtwork 
            imageUrl={podcast.customThumbnail || podcast.image || podcast.coverImage || podcast.artwork || 'https://d3t3ozftmdmh3i.cloudfront.net/staging/podcast_uploaded_nologo/46535697/46535697-1786530965061-a1e35ade3abba.jpg'}
            title={podcast.title}
            isPlaying={isPlaying}
          />

          {/* Desktop Metadata (Title here on desktop to match wireframe async) */}
          <div className="hidden lg:flex flex-col gap-3">
             <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[#C5A059]">
              <span>{podcast.programme || podcast.category}</span>
              {podcast.episodeNumber && <span>• Episode {podcast.episodeNumber}</span>}
            </div>
            <h1 className={`font-heading font-bold leading-tight ${isPlaying ? 'text-[#F7F5F0]' : 'text-[#18181B]'} transition-colors duration-1000 ${podcast.theme.title} text-left`}>
              {podcast.title}
            </h1>
            <div className={`flex items-center gap-4 text-sm font-medium transition-colors duration-1000 ${isPlaying ? 'text-[#c1d5cd]' : 'text-[#52525B]'}`}>
              <div className="flex items-center gap-1.5"><Calendar size={16} /> {podcast.date}</div>
              {podcast.duration && <div className="flex items-center gap-1.5"><Clock size={16} /> {podcast.duration}</div>}
            </div>
          </div>

          <div className="w-full max-w-lg mx-auto flex flex-col gap-4">
             <PodcastPlayer 
                slug={podcast.slug}
                audioUrl={podcast.audioUrl}
                title={podcast.title}
                isPlaying={isPlaying}
                setIsPlaying={setIsPlaying}
                onEnded={handleEnded}
             />
             
             {/* Autoplay Toggle */}
             {upNext && (
               <div className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-colors duration-1000 ${isPlaying ? 'bg-[#2D5A46]/10 border-[#2D5A46]/30' : 'bg-white border-[#E4E4E7]'}`}>
                 <div className="flex flex-col">
                   <span className={`text-sm font-semibold transition-colors duration-1000 ${isPlaying ? 'text-[#F7F5F0]' : 'text-[#18181B]'}`}>Autoplay Next</span>
                   <span className={`text-xs transition-colors duration-1000 ${isPlaying ? 'text-[#c1d5cd]' : 'text-[#52525B]'}`}>Playing next: {upNext.title}</span>
                 </div>
                 <button 
                   onClick={() => setAutoplayNext(!autoplayNext)}
                   className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${autoplayNext ? 'bg-[#2D5A46]' : 'bg-gray-300'}`}
                 >
                   <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoplayNext ? 'translate-x-6' : 'translate-x-1'}`} />
                 </button>
               </div>
             )}
          </div>

        </div>

        {/* Right Column: Editorial & Recommendations */}
        <div className="w-full lg:w-1/2 flex flex-col gap-10">
          
          {/* Mobile Metadata (Hidden on Desktop) */}
          <div className="flex lg:hidden flex-col gap-3">
             <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[#C5A059]">
              <span>{podcast.programme || podcast.category}</span>
              {podcast.episodeNumber && <span>• Episode {podcast.episodeNumber}</span>}
            </div>
            <h1 className={`font-heading font-bold leading-tight ${isPlaying ? 'text-[#F7F5F0]' : 'text-[#18181B]'} transition-colors duration-1000 ${podcast.theme.title} text-left`}>
              {podcast.title}
            </h1>
            <div className={`flex items-center gap-4 text-sm font-medium transition-colors duration-1000 ${isPlaying ? 'text-[#c1d5cd]' : 'text-[#52525B]'}`}>
              <div className="flex items-center gap-1.5"><Calendar size={16} /> {podcast.date}</div>
              {podcast.duration && <div className="flex items-center gap-1.5"><Clock size={16} /> {podcast.duration}</div>}
            </div>
          </div>

          {/* Action Bar (Share & Queue) */}
          <div className={`flex flex-wrap items-center gap-4 py-4 border-y transition-colors duration-1000 ${isPlaying ? 'border-[#52525B]/40' : 'border-[#E4E4E7]'}`}>
            <div className="relative">
              <button 
                onClick={handleShare}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full border shadow-sm transition-colors text-sm font-semibold
                  ${isPlaying 
                    ? 'bg-[#18181B] border-[#52525B] text-[#F7F5F0] hover:bg-[#27272A] hover:border-[#C5A059]' 
                    : 'bg-white border-[#E4E4E7] text-[#27272A] hover:bg-[#F5EFE0] hover:border-[#C5A059]'}`}
              >
                <Share2 size={16} /> Share
              </button>
              {showShareMenu && (
                <div className="absolute left-0 mt-2 w-48 bg-white border border-[#E4E4E7] rounded-xl shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <button onClick={handleCopyLink} className="flex items-center gap-3 w-full px-3 py-2 text-sm text-[#27272A] hover:bg-[#F5EFE0] rounded-lg transition-colors">
                    {shareCopied ? <Check size={16} className="text-[#2D5A46]" /> : <LinkIcon size={16} />} 
                    {shareCopied ? 'Copied!' : 'Copy Link'}
                  </button>
                  <a href={`https://api.whatsapp.com/send?text=${encodeURIComponent(podcast.title + ' ' + url)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 w-full px-3 py-2 text-sm text-[#27272A] hover:bg-[#F5EFE0] rounded-lg transition-colors">
                    <MessageCircle size={16} /> WhatsApp
                  </a>
                  <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(podcast.title)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 w-full px-3 py-2 text-sm text-[#27272A] hover:bg-[#F5EFE0] rounded-lg transition-colors">
                    <Twitter size={16} /> X (Twitter)
                  </a>
                  <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 w-full px-3 py-2 text-sm text-[#27272A] hover:bg-[#F5EFE0] rounded-lg transition-colors">
                    <Facebook size={16} /> Facebook
                  </a>
                </div>
              )}
            </div>

            <button 
              onClick={handleAddToQueue}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full border shadow-sm transition-colors text-sm font-semibold
                ${isPlaying 
                  ? 'bg-transparent border-[#52525B] text-[#C5A059] hover:bg-[#18181B]' 
                  : 'bg-transparent border-[#E4E4E7] text-[#2D5A46] hover:bg-white'}`}
            >
              {queueAdded ? <Check size={16} /> : <Plus size={16} />} 
              {queueAdded ? 'Added to Queue' : 'Add to Queue'}
            </button>
          </div>

          {/* Description */}
          {podcast.description && (
            <div className={`p-6 rounded-2xl border transition-colors duration-1000 ${isPlaying ? 'bg-[#18181B]/80 border-[#52525B]/30' : 'bg-white border-[#E4E4E7]'}`}>
              <h3 className={`text-lg font-bold mb-3 transition-colors duration-1000 ${isPlaying ? 'text-[#F7F5F0]' : 'text-[#27272A]'}`}>About this episode</h3>
              <div 
                className={`relative font-body leading-relaxed transition-all duration-500 overflow-hidden ${isPlaying ? 'text-[#c1d5cd]' : 'text-[#52525B]'} ${expandedDesc ? '' : 'max-h-32'}`}
              >
                <div dangerouslySetInnerHTML={{ __html: podcast.description }} className={podcast.theme.body} />
                {!expandedDesc && (
                  <div className={`absolute bottom-0 left-0 right-0 h-16 pointer-events-none transition-colors duration-1000 ${isPlaying ? 'bg-gradient-to-t from-[#18181B] to-transparent' : 'bg-gradient-to-t from-white to-transparent'}`}></div>
                )}
              </div>
              <button 
                onClick={() => setExpandedDesc(!expandedDesc)}
                className={`mt-4 flex items-center gap-1.5 text-sm font-semibold transition-colors ${isPlaying ? 'text-[#C5A059] hover:text-[#E4E4E7]' : 'text-[#2D5A46] hover:text-[#234737]'}`}
              >
                {expandedDesc ? 'Show less' : 'Read more'}
                {expandedDesc ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>
          )}

          {/* Recommendations & Series Navigator */}
          <div className={`pt-6 ${isPlaying ? 'opacity-80 hover:opacity-100 transition-opacity' : ''}`}>
            <PodcastRecommendations 
              upNext={upNext}
              recommended={related}
              upcoming={upcoming}
              series={series}
              activeSlug={podcast.slug}
            />
          </div>

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
