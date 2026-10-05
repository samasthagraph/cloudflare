import React, { useState, useEffect } from 'react';
import { useLoaderData, Link, useRouteLoaderData } from "@remix-run/react";
import { json, type MetaFunction } from "@remix-run/cloudflare";
import { Share2, Link as LinkIcon, Check, MapPin, ChevronRight, PlayCircle, Mic, FileText } from 'lucide-react';
import * as FaIcons from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import * as SiIcons from 'react-icons/si';
import { OptimizedImage } from "~/components/OptimizedImage";

export const meta: MetaFunction = ({ data, location }) => {
  const typedData = data as any;
  const title = `${typedData?.profile?.identity?.name || 'Samastha Graph'} | Profile Hub`;
  const description = typedData?.profile?.identity?.biography || "Explore the universe of knowledge.";
  const url = `https://samasthagraph.pages.dev${location.pathname}`;
  return [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { name: "theme-color", content: "#faf9f6" },
    { property: "og:url", content: url },
    { tagName: "link", rel: "canonical", href: url },
    { tagName: "link", rel: "alternate", hreflang: "ml", href: "https://samasthagraph.pages.dev/profile" },
    { tagName: "link", rel: "alternate", hreflang: "en", href: "https://samasthagraph.pages.dev/en/profile" }
  ];
};

export const loader = async ({ context }: any) => {
  let profile = {
    identity: { name: "Samastha Graph", subtitle: "The Visual Universe of Knowledge", biography: "Official digital platform exploring the universe of knowledge.", logo: "" },
    featuredCTA: { title: "Visit Website", url: "https://samasthagraph.com", active: true },
    links: [],
    featuredContent: { showLatestVideo: false, showLatestPodcast: false, showLatestArticle: false }
  };

  let latestVideo = null;
  let latestPodcast = null;
  let latestArticle = null;

  try {
    const env = context?.cloudflare?.env || context?.env || (typeof process !== 'undefined' ? process.env : {});
    const githubToken = env.GITHUB_TOKEN;
    const githubOwner = env.GITHUB_OWNER || "samasthagraph";
    const githubRepo = env.GITHUB_REPO || "cloudflare";

    const localProfile = import.meta.glob("../content/settings/profile.json", { import: 'default', eager: true });
    for (const path in localProfile) {
      profile = localProfile[path] as any;
    }

    if (profile.featuredContent?.showLatestVideo) {
      const videos = import.meta.glob("../content/videos/*.json", { import: 'default', eager: true });
      const videoList = Object.entries(videos).map(([path, content]: any) => ({ slug: path.split('/').pop()?.replace('.json', ''), ...content })).sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());
      latestVideo = videoList[0] || null;
    }

    if (profile.featuredContent?.showLatestPodcast) {
      const podcasts = import.meta.glob("../content/podcasts/*.json", { import: 'default', eager: true });
      const podcastList = Object.entries(podcasts).map(([path, content]: any) => ({ slug: path.split('/').pop()?.replace('.json', ''), ...content })).sort((a, b) => (b.episodeNumber || 0) - (a.episodeNumber || 0));
      latestPodcast = podcastList[0] || null;
    }

    if (githubToken) {
      const fetchFileContent = async (path: string) => {
        const res = await fetch(`https://api.github.com/repos/${githubOwner}/${githubRepo}/contents/${path}?ref=main`, {
          headers: { "Authorization": `token ${githubToken}`, "User-Agent": "Samastha-CMS", "Accept": "application/vnd.github.v3+json" }
        });
        if (res.ok) {
          const data = await res.json();
          const base64 = data.content.replace(/\n/g, '');
          const binaryString = atob(base64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
          return new TextDecoder('utf-8').decode(bytes);
        }
        return null;
      };

      const liveProfileStr = await fetchFileContent("app/content/settings/profile.json");
      if (liveProfileStr) {
        profile = JSON.parse(liveProfileStr);
      }
    }
  } catch (e) {
    console.error("Error loading profile data", e);
  }

  return json({ profile, latestVideo, latestPodcast, latestArticle });
};

const getIcon = (name: string, fallback: any = LinkIcon) => {
  if (!name) return fallback;
  const lowerName = name.trim().toLowerCase();

  const iconMap: Record<string, any> = {
    'youtube': FaIcons.FaYoutube,
    'instagram': FaIcons.FaInstagram,
    'spotify': FaIcons.FaSpotify,
    'facebook': FaIcons.FaFacebook,
    'telegram': FaIcons.FaTelegram,
    'whatsapp': FaIcons.FaWhatsapp,
    'whatsapp channel': FaIcons.FaWhatsapp,
    'apple-podcasts': SiIcons.SiApplepodcasts,
    'apple': SiIcons.SiApplepodcasts,
    'jiosaavn': FaIcons.FaHeadphones,
    'jio saavn': FaIcons.FaHeadphones,
    'amazon music': FaIcons.FaAmazon,
    'youtube music': FaIcons.FaYoutube,
    'x': FaXTwitter,
    'twitter': FaXTwitter,
    'link': LinkIcon,
    'file': FileText,
    'play': PlayCircle,
    'mic': Mic,
    'share': Share2
  };

  return iconMap[lowerName] || fallback;
};

export default function ProfileHub() {
  const { profile, latestVideo, latestPodcast, latestArticle } = useLoaderData<typeof loader>();
  const rootData = useRouteLoaderData("root") as any;
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : 'https://samasthagraph.com/profile';
    if (navigator.share) {
      try {
        await navigator.share({
          title: profile?.identity?.name || 'Samastha Graph',
          text: profile?.identity?.subtitle || 'Explore our digital identity',
          url: url,
        });
      } catch (err) { }
    } else {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const identity = profile?.identity || {};
  const featuredCTA = profile?.featuredCTA || {};
  const links = (profile?.links || []).filter((l: any) => l.active !== false).sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
  const socialPlatforms = (rootData?.socialPlatforms?.platforms || []).filter((l: any) => l.active !== false).sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
  const podcastPlatforms = (rootData?.podcastPlatforms?.platforms || []).filter((l: any) => l.active !== false).sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

  return (
    <div className="min-h-screen bg-[#faf9f6] text-[#1a1a1a] font-sans selection:bg-[#15664a]/20 relative overflow-x-hidden flex flex-col">

      {/* Refined Background Texture & Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full lg:w-[60%] h-[80vh] bg-gradient-to-br from-[#15664a]/[0.04] to-transparent rounded-br-[100%]"></div>
        <div className="absolute top-0 right-0 w-[40%] h-[50vh] bg-gradient-to-bl from-[#b8975a]/[0.03] to-transparent rounded-bl-[100%]"></div>
        <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #000 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
      </div>

      <main className="flex-grow w-full max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-10 lg:py-20 flex flex-col lg:flex-row gap-12 lg:gap-24 relative z-10">

        {/* Left Column: Brand Hero (Sticky on Desktop) */}
        <div className="w-full lg:w-5/12 flex flex-col lg:sticky lg:top-24 self-start animate-[fade-in_0.8s_ease-out_forwards]">
          <div className="w-full flex flex-col items-center lg:items-start text-center lg:text-left">

            <div className="w-28 h-28 md:w-32 md:h-32 rounded-[2rem] overflow-hidden mb-8 bg-gradient-to-br from-[#15664a] to-[#0f4d38] border-[4px] border-white shadow-[0_10px_40px_rgba(21,102,74,0.15)] relative group flex-shrink-0">
              {identity.logo ? (
                <OptimizedImage src={identity.logo} alt={identity.name} width={512} height={512} priority={true} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-4xl font-heading font-bold">
                  {identity.name ? identity.name.charAt(0) : 'S'}
                </div>
              )}
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#15664a]/5 border border-[#15664a]/10 rounded-full text-[#15664a] text-xs font-bold tracking-wide uppercase mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#15664a] animate-[pulse_2s_infinite]"></span>
              Digital Media Network
            </div>

            <h1 className="font-heading font-bold text-3xl md:text-4xl lg:text-5xl text-[#1a1a1a] mb-3 tracking-tight">
              {identity.name}
            </h1>

            {identity.subtitle && (
              <p className="font-sans text-[#b8975a] font-semibold text-lg md:text-xl mb-5">
                {identity.subtitle}
              </p>
            )}

            {identity.biography && (
              <p className="font-sans text-gray-500 max-w-md leading-relaxed text-[15px] md:text-base">
                {identity.biography}
              </p>
            )}

            <div className="mt-8">
              <button
                onClick={handleShare}
                className="flex items-center justify-center lg:justify-start gap-2 px-6 py-3 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 shadow-sm hover:shadow hover:border-gray-300 transition-all active:scale-95"
                aria-label="Share Profile"
              >
                {copied ? <Check size={18} className="text-[#15664a]" /> : <Share2 size={18} className="text-[#b8975a]" />}
                <span>{copied ? 'Link Copied' : 'Share Profile'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Links & Content */}
        <div className="w-full lg:w-7/12 flex flex-col gap-12 pb-10 animate-[fade-in_1s_ease-out_forwards]">

          {/* Featured CTA Removed as per instructions */}

          {/* Featured Latest Media (if any) */}
          {(latestVideo || latestPodcast) && (
            <div className="space-y-4 hidden lg:block">
              <h2 className="font-heading font-bold text-[13px] text-gray-400 uppercase tracking-wider ml-2">Latest Releases</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {latestVideo && (
                  <Link to={`/videos/${latestVideo.slug}`} className="block w-full bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md border border-gray-100 transition-all duration-300 group hover:-translate-y-1">
                    <div className="relative aspect-video bg-gray-100 overflow-hidden">
                      {latestVideo.thumbImage ? (
                        <OptimizedImage src={latestVideo.thumbImage} alt={latestVideo.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      ) : (
                        <div className="w-full h-full bg-[#15664a] flex items-center justify-center">
                          <PlayCircle className="text-white/30" size={32} />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                      <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                        <span className="px-2 py-1 bg-black/40 backdrop-blur-sm rounded text-[9px] font-bold text-white uppercase tracking-wider">Video</span>
                        <div className="w-8 h-8 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center group-hover:bg-[#15664a] transition-colors">
                          <PlayCircle size={16} className="text-white" />
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <h4 className="font-heading font-semibold text-[15px] text-[#1a1a1a] line-clamp-2 leading-snug group-hover:text-[#15664a] transition-colors">{latestVideo.title}</h4>
                    </div>
                  </Link>
                )}

                {latestPodcast && (
                  <Link to={`/podcasts/${latestPodcast.slug}`} className="block w-full bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md border border-gray-100 transition-all duration-300 group hover:-translate-y-1">
                    <div className="relative aspect-video bg-gray-100 overflow-hidden">
                      {latestPodcast.customThumbnail ? (
                        <OptimizedImage src={latestPodcast.customThumbnail} alt={latestPodcast.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      ) : (
                        <div className="w-full h-full bg-[#0f4d38] flex items-center justify-center">
                          <Mic className="text-white/30" size={32} />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                      <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                        <span className="px-2 py-1 bg-black/40 backdrop-blur-sm rounded text-[9px] font-bold text-[#b8975a] uppercase tracking-wider">Ep {latestPodcast.episodeNumber}</span>
                        <div className="w-8 h-8 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center group-hover:bg-[#b8975a] transition-colors">
                          <Mic size={16} className="text-white" />
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <h4 className="font-heading font-semibold text-[15px] text-[#1a1a1a] line-clamp-2 leading-snug group-hover:text-[#b8975a] transition-colors">{latestPodcast.title}</h4>
                    </div>
                  </Link>
                )}

              </div>
            </div>
          )}

          {/* Core Links */}
          {links.length > 0 && (
            <div className="space-y-4 hidden lg:block">
              <h2 className="font-heading font-bold text-[13px] text-gray-400 uppercase tracking-wider ml-2">Explore</h2>
              <div className="flex flex-col gap-3">
                {links.map((link: any, idx: number) => {
                  const Icon = getIcon(link.icon, LinkIcon);
                  const isInternal = link.url?.startsWith('/');
                  const LinkComponent = isInternal ? Link : 'a';
                  return (
                    <LinkComponent
                      key={link.id || idx}
                      to={isInternal ? link.url : undefined}
                      href={!isInternal ? link.url : undefined}
                      target={!isInternal ? "_blank" : undefined}
                      rel={!isInternal ? "noopener noreferrer" : undefined}
                      className="group flex items-center p-4 md:p-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#15664a]/20 transition-all duration-300 transform hover:-translate-y-0.5"
                    >
                      <div className="w-12 h-12 md:w-14 md:h-14 flex-shrink-0 bg-gray-50 text-gray-500 group-hover:bg-[#15664a]/5 group-hover:text-[#15664a] rounded-xl flex items-center justify-center transition-colors duration-300">
                        <Icon size={22} className="opacity-80 group-hover:opacity-100" />
                      </div>
                      <div className="ml-4 md:ml-5 flex-grow pr-4">
                        <h3 className="font-heading font-semibold text-[#1a1a1a] text-base group-hover:text-[#15664a] transition-colors">{link.title}</h3>
                        {link.description && (
                          <p className="font-sans text-[13px] text-gray-500 mt-1 line-clamp-1">{link.description}</p>
                        )}
                      </div>
                      <ChevronRight size={20} className="text-gray-300 group-hover:text-[#b8975a] transform group-hover:translate-x-1 transition-all flex-shrink-0" />
                    </LinkComponent>
                  );
                })}
              </div>
            </div>
          )}

          {/* Podcast Platforms (Listen On) */}
          {podcastPlatforms.length > 0 && (
            <div className="space-y-4 mt-2">
              <h2 className="font-heading font-bold text-[13px] text-gray-400 uppercase tracking-wider ml-2">Listen On</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {podcastPlatforms.map((platform: any, idx: number) => {
                  const Icon = getIcon(platform.icon, PlayCircle);
                  return (
                    <a key={platform.id || idx} href={platform.url} target="_blank" rel="noopener noreferrer"
                      className="group flex items-center gap-3 p-3 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-300 hover:-translate-y-1">
                      <div className="w-10 h-10 flex-shrink-0 bg-gray-50 rounded-xl flex items-center justify-center text-gray-500 group-hover:bg-gray-100 group-hover:text-[#1a1a1a] transition-colors">
                        <Icon size={18} />
                      </div>
                      <span className="font-semibold text-[13px] md:text-sm text-gray-600 group-hover:text-[#1a1a1a] truncate leading-tight">
                        {platform.name}
                      </span>
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Social Platforms (Follow Us) */}
          {socialPlatforms.length > 0 && (
            <div className="space-y-4 mt-4">
              <h2 className="font-heading font-bold text-[13px] text-gray-400 uppercase tracking-wider ml-2">Connect</h2>
              <div className="flex flex-wrap gap-3">
                {socialPlatforms.map((platform: any, idx: number) => {
                  const Icon = getIcon(platform.icon, LinkIcon);
                  return (
                    <a key={platform.id || idx} href={platform.url} target="_blank" rel="noopener noreferrer"
                      className="group flex items-center justify-center w-14 h-14 bg-white rounded-[1.25rem] border border-gray-100 shadow-sm hover:shadow-md hover:border-[#b8975a]/30 transition-all duration-300 hover:-translate-y-1"
                      aria-label={platform.name}>
                      <Icon size={22} className="text-gray-500 group-hover:text-[#b8975a] transition-colors" />
                    </a>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </main>


      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        @media (prefers-reduced-motion: reduce) {
          *, ::before, ::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>
    </div>
  );
}
