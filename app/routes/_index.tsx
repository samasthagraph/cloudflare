import { useState } from "react";
import { json, type LoaderFunctionArgs } from "@remix-run/cloudflare";
import { Link, useLoaderData, useRouteLoaderData } from "@remix-run/react";
import { OptimizedImage } from "~/components/OptimizedImage";
import { PodcastPlayer } from "~/components/PodcastPlayer";
import type { MetaFunction } from "@remix-run/cloudflare";

export const meta: MetaFunction = () => {
  return [
    { title: "Samastha Graph" },
  ];
};

import fm from "front-matter";
import { isMalayalam } from "~/utils/language";
import { fetchLiveSpotifyPodcasts } from "~/utils/podcasts.server";
import { fetchLiveYouTubeVideos } from "~/utils/youtube";
import { getDbArticles, getDbVideos, getDbPodcasts, getDbPrograms, getDbSetting } from "~/utils/db.server";

export const loader = async ({ context }: LoaderFunctionArgs) => {
  const env = (context as any)?.cloudflare?.env || (context as any)?.env || (typeof process !== 'undefined' ? process.env : {});

  // 1. Articles
  const [dbArticles, dbVideos, dbPodcasts, dbPrograms, dbHomepage, dbPodcastPlatforms] = await Promise.all([
    getDbArticles(env?.DB),
    getDbVideos(env?.DB),
    getDbPodcasts(env?.DB),
    getDbPrograms(env?.DB),
    getDbSetting(env?.DB, "homepage"),
    getDbSetting(env?.DB, "podcast-platforms")
  ]);

  const mdxArticles = import.meta.glob("../content/articles/*.mdx", { query: '?raw', import: 'default', eager: true });
  const staticArticles = Object.entries(mdxArticles).map(([path, content]) => {
    const slug = path.split('/').pop()?.replace('.mdx', '');
    const { attributes } = fm(content as string);
    return { slug, ...(attributes as any) };
  });

  const articleMap = new Map<string, any>();
  staticArticles.forEach(a => { if (a.slug) articleMap.set(a.slug, a); });
  dbArticles.forEach(a => { if (a.slug) articleMap.set(a.slug, a); });

  const articlesData = Array.from(articleMap.values())
    .filter((a: any) => a.status !== 'draft' && isMalayalam(a))
    .sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());

  // 2. Videos & Programs
  const jsonPrograms = import.meta.glob("../content/programs/*.json", { import: 'default', eager: true });
  const staticPrograms = Object.entries(jsonPrograms).map(([path, content]: any) => ({
    slug: path.split('/').pop()?.replace('.json', ''),
    ...content
  }));
  const programMap = new Map<string, any>();
  staticPrograms.forEach(p => { if (p.slug) programMap.set(p.slug, p); });
  dbPrograms.forEach((p: any) => { if (p.slug) programMap.set(p.slug, p); });
  const allPrograms = Array.from(programMap.values());

  let liveVideos: any[] = [];
  try {
    liveVideos = await fetchLiveYouTubeVideos(allPrograms);
  } catch (e) {
    console.warn("Failed to fetch live YouTube videos:", e);
  }

  const jsonVideos = import.meta.glob("../content/videos/*.json", { import: 'default', eager: true });
  const staticVideos = Object.entries(jsonVideos).map(([path, content]: any) => {
    return { slug: path.split('/').pop()?.replace('.json', ''), ...content };
  });

  const videoMap = new Map<string, any>();
  staticVideos.forEach(v => { if (v.slug) videoMap.set(v.slug, v); });
  dbVideos.forEach(v => { if (v.slug) videoMap.set(v.slug, v); });
  liveVideos.forEach(v => { if (v.slug) videoMap.set(v.slug, v); });

  const videosData = Array.from(videoMap.values())
    .filter((v: any) => v.status !== 'draft' && isMalayalam(v))
    .sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());

  // 3. Podcasts
  let livePodcasts: any[] = [];
  try {
    livePodcasts = await fetchLiveSpotifyPodcasts();
  } catch (e) { }

  const jsonPodcasts = import.meta.glob("../content/podcasts/*.json", { import: 'default', eager: true });
  const localPodcasts = Object.entries(jsonPodcasts).map(([path, content]: any) => {
    return { slug: path.split('/').pop()?.replace('.json', ''), ...content };
  });

  const podcastMap = new Map<string, any>();
  localPodcasts.forEach(ep => podcastMap.set(ep.slug, ep));
  dbPodcasts.forEach(ep => podcastMap.set(ep.slug, ep));
  livePodcasts.forEach(ep => podcastMap.set(ep.slug, ep));

  const podcastsData = Array.from(podcastMap.values())
    .filter((p: any) => p.status !== 'draft' && isMalayalam(p))
    .sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());

  // 4. Settings
  let homepageSettings = dbHomepage;
  if (!homepageSettings) {
    try {
      const settingsFiles = import.meta.glob("../content/settings/homepage.json", { import: 'default', eager: true });
      homepageSettings = Object.values(settingsFiles)[0] || null;
    } catch (e) { }
  }

  let podcastPlatforms = dbPodcastPlatforms;
  if (!podcastPlatforms) {
    try {
      const platformFiles = import.meta.glob("../content/settings/podcast-platforms.json", { import: 'default', eager: true });
      podcastPlatforms = Object.values(platformFiles)[0] || null;
    } catch (e) { }
  }

  const heroSetting = homepageSettings?.hero;
  let resolvedHero = null;
  if (heroSetting && heroSetting.enabled !== false) {
    if (heroSetting.type === 'video') {
      resolvedHero = videosData.find((v: any) => v.slug === heroSetting.slug) || null;
      if (!resolvedHero && videosData.length > 0) resolvedHero = videosData[0]; // Fallback to latest video
    } else if (heroSetting.type === 'article') {
      resolvedHero = articlesData.find((a: any) => a.slug === heroSetting.slug) || null;
      if (!resolvedHero && articlesData.length > 0) resolvedHero = articlesData[0]; // Fallback to latest article
    }
  }

  return json({
    articles: articlesData,
    videos: videosData.slice(0, 10),
    podcasts: podcastsData,
    hero: resolvedHero,
    homepageSettings,
    podcastPlatforms
  }, {
    headers: { "Cache-Control": "public, max-age=0, must-revalidate" }
  });
};

function formatRelativeTime(dateStr?: string) {
  if (!dateStr) return "RECENT";
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    if (isNaN(diffInMs)) return dateStr;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    if (diffInDays <= 0) return "TODAY";
    if (diffInDays === 1) return "A DAY AGO";
    if (diffInDays < 7) return `${diffInDays} DAYS AGO`;
    if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return weeks === 1 ? "1 WEEK AGO" : `${weeks} WEEKS AGO`;
    }
    const months = Math.floor(diffInDays / 30);
    return months === 1 ? "1 MONTH AGO" : `${months} MONTHS AGO`;
  } catch {
    return dateStr;
  }
}

import { extractYouTubeId, getYouTubeThumbnail } from "~/utils/youtube";

export default function Index() {
  const { articles, videos, podcasts, hero, homepageSettings, podcastPlatforms } = useLoaderData<typeof loader>();

  const heroSetting = homepageSettings?.hero;
  const articlesSetting = homepageSettings?.articlesSection;
  const videosSetting = homepageSettings?.videosSection;
  const podcastsSetting = homepageSettings?.podcastsSection;
  const fiqhSetting = homepageSettings?.fiqhSection;
  const exploreSetting = homepageSettings?.exploreSection;

  const mainVideos = videos.slice(0, 4);
  const sideVideos = videos.slice(4, 9);

  const platforms = (podcastPlatforms?.platforms || []).filter((p: any) => p.active !== false).sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
  const spotifyPlatform = platforms.find((p: any) => p.id === 'spotify' || p.name?.toLowerCase() === 'spotify');

  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [playingPodcastSlug, setPlayingPodcastSlug] = useState<string | null>(null);

  return (
    <div className="bg-brand-light min-h-screen">
      <section id="home" className="relative hero-pattern text-white py-20 lg:py-32 overflow-hidden">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-brand-olive rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-72 h-72 bg-brand-muted rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            <div className="space-y-6">
              {heroSetting?.badgeText && heroSetting.badgeText.trim() !== "" && (
                <div className="inline-block bg-brand-gold/20 border border-brand-gold text-brand-gold px-4 py-1.5 rounded-full text-sm font-semibold tracking-wide backdrop-blur-sm">
                  <i className="fas fa-broadcast-tower mr-2"></i> {heroSetting.badgeText}
                </div>
              )}
              <h1
                className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight"
                dangerouslySetInnerHTML={{ __html: heroSetting?.title || 'Explore the <span class="text-brand-gold">Universe</span> of Knowledge.' }}
              />
              <p className="font-sans text-xl text-brand-surface font-medium opacity-90">
                {heroSetting?.subtitle || "Samastha Graph — Exploring the Universe of Knowledge"}
              </p>
              <p className="text-lg text-brand-light/80 max-w-lg">
                {heroSetting?.description || "Dive into premium Islamic content, thought-provoking podcasts, and enlightening documentaries designed to inspire your spiritual journey."}
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <a href={heroSetting?.primaryButtonLink || "#videos"} className="bg-brand-gold text-brand-dark font-semibold px-8 py-3 rounded-full hover:bg-yellow-500 transition-all shadow-lg shadow-brand-gold/20 flex items-center gap-2">
                  <i className="fas fa-play"></i> {heroSetting?.primaryButtonText || "Watch Now"}
                </a>
                <a href={heroSetting?.secondaryButtonLink || "#podcasts"} className="bg-transparent border-2 border-brand-surface text-brand-light font-semibold px-8 py-3 rounded-full hover:bg-brand-surface hover:text-brand-dark transition-all flex items-center gap-2">
                  <i className="fas fa-headphones"></i> {heroSetting?.secondaryButtonText || "Listen to Podcasts"}
                </a>
              </div>
            </div>

            {hero && heroSetting?.enabled !== false && (
              heroSetting?.type === 'video' ? (
                <button onClick={() => setSelectedVideo(extractYouTubeId(hero.youtubeId))} className="relative group cursor-pointer block w-full text-left mt-12 md:mt-0">
                  <div className="absolute inset-0 bg-brand-gold rounded-2xl transform rotate-3 scale-105 opacity-20 transition-transform group-hover:rotate-6"></div>
                  <div className="relative bg-brand-dark border border-brand-olive rounded-2xl overflow-hidden shadow-2xl aspect-video flex items-center justify-center">
                    <OptimizedImage src={getYouTubeThumbnail(hero.youtubeId)} alt={hero.title} priority={true} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
                    <div className="relative z-10 w-20 h-20 bg-brand-gold rounded-full flex items-center justify-center text-brand-dark text-3xl shadow-[0_0_30px_rgba(200,161,54,0.5)] transform group-hover:scale-110 transition-transform duration-300">
                      <i className="fas fa-play ml-1"></i>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-brand-dark to-transparent">
                      <span className="bg-brand-olive text-white text-xs font-bold px-2 py-1 rounded mb-2 inline-block uppercase">
                        {heroSetting?.eyebrow || hero.category || 'Featured Video'}
                      </span>
                      <Link to={`/videos/${hero.slug}`} onClick={(e) => e.stopPropagation()} className="block hover:text-brand-gold transition-colors">
                        <h3 className="font-heading font-bold text-xl text-white line-clamp-2">{heroSetting?.displayTitle || hero.title}</h3>
                      </Link>
                      {(heroSetting?.displayDescription || hero.description) && (
                        <p className="text-sm text-gray-300 mt-2 line-clamp-2">{heroSetting?.displayDescription || hero.description}</p>
                      )}
                    </div>
                  </div>
                </button>
              ) : (
                <Link to={`/articles/${hero.slug}`} className="relative group cursor-pointer block w-full text-left mt-12 md:mt-0">
                  <div className="absolute inset-0 bg-brand-gold rounded-2xl transform rotate-3 scale-105 opacity-20 transition-transform group-hover:rotate-6"></div>
                  <div className="relative bg-brand-dark border border-brand-olive rounded-2xl overflow-hidden shadow-2xl aspect-video flex items-center justify-center">
                    {hero.image ? (
                      <OptimizedImage src={hero.image} alt={hero.title} priority={true} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
                    ) : (
                      <div className="absolute inset-0 w-full h-full bg-[#133022] overflow-hidden flex items-center justify-center opacity-80 group-hover:opacity-60 transition-opacity">
                        <div className="absolute inset-0 opacity-10 bg-[url('/islamic-pattern.png')] bg-repeat"></div>
                        <OptimizedImage src="/Logo_white.png" alt="Samastha Graph Logo" priority={true} className="h-16 w-auto opacity-50 mb-4 relative z-10" />
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-brand-dark to-transparent">
                      <span className="bg-brand-olive text-white text-xs font-bold px-2 py-1 rounded mb-2 inline-block uppercase">
                        {heroSetting?.eyebrow || hero.category || 'Featured Article'}
                      </span>
                      <h3 className="font-heading font-bold text-xl text-white line-clamp-2 group-hover:text-brand-gold transition-colors">{heroSetting?.displayTitle || hero.title}</h3>
                      {(heroSetting?.displayDescription || hero.excerpt || hero.description) && (
                        <p className="text-sm text-gray-300 mt-2 line-clamp-2">{heroSetting?.displayDescription || hero.excerpt || hero.description}</p>
                      )}
                    </div>
                  </div>
                </Link>
              )
            )}

          </div>
        </div>
      </section>

      <section id="articles" className="py-20 bg-brand-surface/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="font-heading text-3xl font-bold text-brand-dark mb-2">
                {articlesSetting?.title || "Articles"}
              </h2>
              <p className="text-brand-muted">
                {articlesSetting?.subtitle || "Latest updates and heritage stories"}
              </p>
            </div>
            <Link to="/articles" className="hidden sm:inline-flex items-center font-semibold text-brand-olive hover:text-brand-dark transition-colors">
              {articlesSetting?.viewAllText || "View All Articles"} <i className="fas fa-arrow-right ml-2"></i>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article: any) => (
              <Link key={article.slug} to={`/articles/${article.slug}`} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-brand-surface group flex flex-col">
                <div className="relative aspect-video overflow-hidden bg-brand-dark">
                  {article.coverImage ? (
                    <OptimizedImage src={article.coverImage} alt={article.title} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <i className="fas fa-newspaper text-5xl text-brand-surface/30"></i>
                    </div>
                  )}
                  <div className="absolute top-4 right-4">
                    <span className="bg-brand-gold text-brand-dark text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
                      {article.category || 'News'}
                    </span>
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex items-center gap-2 mb-3 text-xs text-brand-muted font-medium">
                    <i className="far fa-calendar-alt"></i>
                    <span>{article.publishDate || article.publishedAt}</span>
                    {article.readTime && (
                      <>
                        <span className="mx-1">•</span>
                        <span>{article.readTime}</span>
                      </>
                    )}
                  </div>
                  <h3 className="font-heading font-bold text-xl text-brand-dark mb-3 line-clamp-2 group-hover:text-brand-gold transition-colors">{article.title}</h3>
                  <p className="font-sans text-sm text-gray-600 line-clamp-3 mb-4 flex-grow">{article.excerpt || "Read the full story to learn more."}</p>
                  <div className="flex items-center text-brand-olive font-semibold text-sm group-hover:text-brand-gold transition-colors mt-auto">
                    {articlesSetting?.readStoryText || "Read Story"} <i className="fas fa-arrow-right ml-2 transform group-hover:translate-x-1 transition-transform"></i>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-10 text-center sm:hidden">
            <Link to="/articles" className="inline-block border-2 border-brand-olive text-brand-dark font-semibold px-8 py-3 rounded-full hover:bg-brand-olive hover:text-white transition-colors">
              {articlesSetting?.viewAllText || "View All Articles"}
            </Link>
          </div>
        </div>
      </section>

      <section id="videos" className="py-16 sm:py-20 bg-brand-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Section Header */}
          <div className="flex items-center justify-between mb-8 sm:mb-10">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-brand-dark tracking-tight">
              {videosSetting?.title || "Videos"}
            </h2>
          </div>

          {/* Videos Section Layout: 2x2 Grid on Left + Compact Vertical List on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">

            {/* Left Column: 2x2 Featured Grid (4 Cards) */}
            <div className="lg:col-span-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                {mainVideos.map((video: any) => (
                  <button
                    key={video.slug}
                    onClick={() => video.status !== 'scheduled' && setSelectedVideo(extractYouTubeId(video.youtubeId))}
                    className={`group text-left flex flex-col w-full ${video.status === 'scheduled' ? 'cursor-default opacity-90' : 'cursor-pointer'}`}
                  >
                    {/* Thumbnail container */}
                    <div className="relative aspect-video w-full overflow-hidden rounded-xl sm:rounded-2xl bg-black shadow-sm group-hover:shadow-md transition-shadow">
                      <OptimizedImage
                        src={video.customThumbnail || getYouTubeThumbnail(video.youtubeId)}
                        alt={video.title}
                        className={`w-full h-full object-cover transform transition-transform duration-500 ${video.status === 'scheduled' ? 'grayscale-[20%]' : 'group-hover:scale-105'}`}
                      />

                      {/* Top-Right Play Badge */}
                      <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 w-8 h-8 rounded-lg bg-brand-dark/90 backdrop-blur-sm border border-brand-gold/30 text-brand-gold flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-brand-gold group-hover:text-brand-dark transition-all duration-300">
                        <i className="fas fa-play text-xs ml-0.5"></i>
                      </div>

                      {video.status === 'scheduled' && (
                        <div className="absolute bottom-3 left-3">
                          <span className="bg-brand-gold text-brand-dark text-xs font-bold px-2.5 py-1 rounded-full shadow-md uppercase tracking-wider">
                            {videosSetting?.upcomingBadgeText || "Upcoming"}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Title below thumbnail */}
                    <div className="mt-3 flex flex-col">
                      <h3 className={`font-heading font-bold text-base sm:text-lg text-brand-dark line-clamp-2 leading-snug ${video.status !== 'scheduled' ? 'group-hover:text-brand-olive transition-colors' : ''}`}>
                        {video.title}
                      </h3>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column: Vertical List of Compact Items + See All */}
            <div className="lg:col-span-4 flex flex-col justify-between">
              <div className="flex flex-col divide-y divide-brand-surface/40">
                {sideVideos.map((video: any) => (
                  <button
                    key={video.slug}
                    onClick={() => video.status !== 'scheduled' && setSelectedVideo(extractYouTubeId(video.youtubeId))}
                    className={`group text-left flex items-start justify-between gap-4 py-3.5 first:pt-0 last:pb-0 ${video.status === 'scheduled' ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    {/* Left Details */}
                    <div className="flex flex-col flex-grow min-w-0 pr-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-brand-olive mb-1 line-clamp-1">
                        {video.programId ? (video.programId === 'minal-qalb' ? 'Minal Qalb' : video.programId === 'noorul-hira' ? 'Noorul Hira' : video.programId === 'ananthapporul' ? 'Ananthapporul' : video.programId.replace(/-/g, ' ')) : (video.category || 'Explainer')}
                      </span>
                      <h4 className="font-heading font-bold text-xs sm:text-sm text-brand-dark line-clamp-2 leading-snug group-hover:text-brand-olive transition-colors mb-1.5">
                        {video.title}
                      </h4>
                      <span className="text-[10px] sm:text-[11px] font-semibold text-brand-muted uppercase tracking-wider">
                        {formatRelativeTime(video.publishedAt)}
                      </span>
                    </div>

                    {/* Right Thumbnail */}
                    <div className="relative w-24 sm:w-28 aspect-video flex-shrink-0 rounded-lg sm:rounded-xl overflow-hidden bg-black shadow-sm">
                      <OptimizedImage
                        src={video.customThumbnail || getYouTubeThumbnail(video.youtubeId)}
                        alt={video.title}
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                      />
                      {/* Small Top-Right Play Badge */}
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-md bg-brand-dark/90 backdrop-blur-sm border border-brand-gold/30 text-brand-gold flex items-center justify-center text-[8px] shadow group-hover:scale-110 group-hover:bg-brand-gold group-hover:text-brand-dark transition-all duration-300">
                        <i className="fas fa-play ml-0.5"></i>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* See All link at bottom right */}
              <div className="pt-6 text-right">
                <Link
                  to="/videos"
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-brand-dark hover:text-brand-olive uppercase tracking-wider transition-colors group"
                >
                  <span>{videosSetting?.seeAllText || "See all"}</span>
                  <i className="fas fa-chevron-right text-xs group-hover:translate-x-1 transition-transform"></i>
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      <section id="podcasts" className="py-20 lg:py-32 bg-brand-light relative overflow-hidden border-t border-brand-surface/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

          <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-center">
            {/* Left side: Editorial Introduction */}
            <div className="w-full lg:w-5/12">
              <div className="inline-flex items-center gap-3 mb-6">
                <span className="w-8 h-px bg-brand-gold"></span>
                <span className="text-xs font-bold tracking-[0.2em] text-brand-gold uppercase">
                  {podcastsSetting?.badgeText || "PODCAST"}
                </span>
              </div>
              <h2 className="font-heading text-4xl md:text-5xl font-bold text-brand-dark mb-6">
                {podcastsSetting?.title || "Conversations that inform, educate and connect."}
              </h2>
              <p className="text-brand-olive text-lg mb-10 leading-relaxed">
                {podcastsSetting?.description || "Dive into deep discussions, heritage stories, and exclusive reflections from Samastha Graph."}
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/podcasts"
                  className="inline-flex items-center justify-center gap-2 bg-brand-dark text-white font-bold px-8 py-4 rounded-full hover:bg-brand-olive transition-colors shadow-lg hover:shadow-xl"
                >
                  {podcastsSetting?.exploreButtonText || "Explore Podcast"}
                  <i className="fas fa-arrow-right ml-2"></i>
                </Link>

                {spotifyPlatform?.url && (
                  <a
                    href={spotifyPlatform.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 border-2 border-brand-surface text-brand-dark font-bold px-8 py-4 rounded-full hover:border-brand-olive hover:text-brand-olive transition-colors"
                  >
                    <i className="fab fa-spotify text-xl"></i>
                    {podcastsSetting?.spotifyButtonText || "Also on Spotify"}
                  </a>
                )}
              </div>
            </div>

            {/* Right side: Featured Podcast Card */}
            <div className="w-full lg:w-7/12">
              {podcasts && podcasts.length > 0 ? (
                <div className="relative group w-full max-w-xl mx-auto lg:max-w-none">
                  {/* Background decorative elements */}
                  <div className="absolute inset-0 bg-brand-gold rounded-3xl transform rotate-3 scale-105 opacity-10 transition-transform duration-500 group-hover:rotate-6"></div>

                  <div className="relative block rounded-3xl shadow-2xl transition-all duration-300 group-hover:shadow-[0_25px_50px_-12px_rgba(200,161,54,0.25)]">
                    <PodcastPlayer
                      slug={podcasts[0].slug}
                      audioUrl={podcasts[0].audioUrl}
                      title={podcasts[0].title}
                      isPlaying={playingPodcastSlug === podcasts[0].slug}
                      setIsPlaying={(play) => setPlayingPodcastSlug(play ? podcasts[0].slug : null)}
                      variant="compact"
                      podcast={podcasts[0]}
                    />
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-brand-surface rounded-2xl p-12 text-center text-brand-muted">
                  {podcastsSetting?.comingSoonText || "Podcast episodes coming soon."}
                </div>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* FIQH FILES SECTION */}
      <section id="fiqh-files" className="pt-16 pb-20 md:pt-24 md:pb-20 bg-white relative">
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none flex items-start justify-center overflow-hidden">
          <svg width="800" height="800" viewBox="0 0 100 100" fill="none">
            <path d="M50 0 L100 50 L50 100 L0 50 Z" stroke="#2D5A46" strokeWidth="0.5" />
            <circle cx="50" cy="50" r="30" stroke="#2D5A46" strokeWidth="0.5" />
          </svg>
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 relative z-10 text-center">
          <div className="inline-block mb-6">
            <span className="font-sans text-xs tracking-widest uppercase font-bold text-brand-olive border border-brand-olive/30 px-3 py-1 rounded-full bg-brand-olive/5">
              {fiqhSetting?.badgeText || "Facility"}
            </span>
          </div>

          <h2 className="font-heading text-4xl md:text-5xl font-bold text-brand-dark mb-4">
            {fiqhSetting?.title || "FIQH FILES"}
          </h2>

          <h3 className="font-heading text-xl md:text-2xl text-brand-gold font-semibold mb-6">
            {fiqhSetting?.subtitle || "Questions of Fiqh. Clear answers."}
          </h3>

          <p className="text-brand-muted text-lg leading-relaxed mb-10 max-w-xl mx-auto">
            {fiqhSetting?.description || "A dedicated platform for the public to explore Fiqh questions and answers."}
          </p>

          <a
            href={fiqhSetting?.buttonUrl || "https://fiqhfiles.samasthagraph.com/"}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-brand-dark hover:bg-brand-olive text-white font-bold py-3.5 px-8 rounded-full transition-all duration-300 shadow hover:shadow-lg"
          >
            {fiqhSetting?.buttonText || "Explore Fiqh Files"} <i className="fas fa-arrow-up right-0 rotate-45 text-sm ml-1"></i>
          </a>
        </div>
      </section>

      <section className="py-20 relative overflow-hidden bg-brand-dark">
        {/* Subtle architectural background pattern */}
        <div className="absolute inset-0 opacity-5 pointer-events-none flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-full h-full max-w-5xl" preserveAspectRatio="none">
            {/* Simple stylized Islamic arch shape */}
            <path d="M10,100 L10,60 C10,40 30,20 50,10 C70,20 90,40 90,60 L90,100" stroke="#eef3f1" strokeWidth="1" fill="none" />
            <path d="M20,100 L20,65 C20,45 35,30 50,20 C65,30 80,45 80,65 L80,100" stroke="#eef3f1" strokeWidth="0.5" fill="none" />
          </svg>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-brand-gold mb-4">
              {exploreSetting?.title || "Explore Samastha Graph"}
            </h2>
            <p className="text-brand-surface max-w-2xl mx-auto text-sm md:text-base">
              {exploreSetting?.subtitle || "Discover more from Samastha Graph through our latest videos and podcasts."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10">
            {/* Videos Destination Card */}
            <Link
              to="/videos"
              className="group relative bg-white/5 border border-brand-gold/20 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300 hover:shadow-[0_0_25px_rgba(200,161,54,0.15)] flex flex-col items-center text-center overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-brand-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              <div className="w-16 h-16 rounded-full bg-brand-dark border border-brand-gold/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-inner">
                <i className="fas fa-play text-2xl text-brand-gold pl-1"></i>
              </div>

              <h3 className="text-xl md:text-2xl font-bold text-white mb-3 group-hover:text-brand-gold transition-colors">
                {exploreSetting?.videoCardTitle || "Videos"}
              </h3>

              <p className="text-brand-surface/80 text-sm md:text-base">
                {exploreSetting?.videoCardDescription || "Watch our latest programmes, lectures, and series from Samastha Graph."}
              </p>
            </Link>

            {/* Podcasts Destination Card */}
            <Link
              to="/podcasts"
              className="group relative bg-white/5 border border-brand-gold/20 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300 hover:shadow-[0_0_25px_rgba(200,161,54,0.15)] flex flex-col items-center text-center overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-brand-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              <div className="w-16 h-16 rounded-full bg-brand-dark border border-brand-gold/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-inner">
                <i className="fas fa-microphone-alt text-2xl text-brand-gold"></i>
              </div>

              <h3 className="text-xl md:text-2xl font-bold text-white mb-3 group-hover:text-brand-gold transition-colors">
                {exploreSetting?.podcastCardTitle || "Podcasts"}
              </h3>

              <p className="text-brand-surface/80 text-sm md:text-base">
                {exploreSetting?.podcastCardDescription || "Listen to deep-dive audio discussions, stories, and podcast episodes."}
              </p>
            </Link>
          </div>
        </div>
      </section>

      {selectedVideo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 animate-fade-in">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-xl transition-all duration-500"></div>

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-full max-w-4xl aspect-video bg-brand-gold/20 rounded-full blur-[100px] animate-pulse"></div>
          </div>

          <button
            onClick={() => setSelectedVideo(null)}
            className="absolute top-6 right-6 sm:top-10 sm:right-10 z-[110] group flex items-center justify-center w-14 h-14 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-brand-gold/50 rounded-full backdrop-blur-md transition-all duration-300 hover:scale-110 hover:rotate-90 focus:outline-none shadow-2xl"
          >
            <i className="fas fa-times text-2xl text-white group-hover:text-brand-gold transition-colors"></i>
          </button>

          <div className="w-full max-w-6xl aspect-video bg-black rounded-2xl sm:rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] relative border border-white/10 ring-1 ring-white/5 transform transition-all animate-[modal-pop_0.4s_ease-out_forwards]">

            <div className="absolute inset-0 bg-gradient-to-br from-brand-dark/50 to-black flex items-center justify-center animate-pulse">
              <i className="fas fa-circle-notch fa-spin text-4xl text-brand-gold/50"></i>
            </div>

            <iframe
              src={`https://www.youtube.com/embed/${selectedVideo}?autoplay=1&rel=0&modestbranding=1&showinfo=0`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full z-10 opacity-0 animate-[fade-in_1s_ease-in_0.5s_forwards]"
            ></iframe>
          </div>

          <style>{`
            @keyframes modal-pop {
              0% { opacity: 0; transform: scale(0.95) translateY(20px); }
              100% { opacity: 1; transform: scale(1) translateY(0); }
            }
            @keyframes fade-in {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            .animate-fade-in {
              animation: fade-in 0.3s ease-out forwards;
            }
          `}</style>
        </div>
      )}
    </div>
  );
}