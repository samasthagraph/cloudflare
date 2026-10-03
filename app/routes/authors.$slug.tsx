import React, { useState } from 'react';
import { useLoaderData, Link } from "@remix-run/react";
import { json, type LoaderFunctionArgs, type MetaFunction } from "@remix-run/cloudflare";
import { User, Calendar, FileText, Video, Mic, ArrowLeft, Globe, ExternalLink, Share2, Sparkles, BookOpen } from 'lucide-react';
import { FaXTwitter } from 'react-icons/fa6';
import * as FaIcons from 'react-icons/fa';
import fm from "front-matter";
import { OptimizedImage } from "~/components/OptimizedImage";
import { CompactHero } from "~/components/CompactHero";
import { getDbArticles, getDbVideos, getDbPodcasts, getDbAuthors } from "~/utils/db.server";
import { isMalayalam } from "~/utils/language";

export const loader = async ({ params, context }: LoaderFunctionArgs) => {
  const { slug } = params;
  const env = context?.cloudflare?.env || context?.env || (typeof process !== 'undefined' ? process.env : {});

  // 1. Fetch Authors from DB / Settings
  const dbAuthorsData = await getDbAuthors(env?.DB);
  const authorsList = dbAuthorsData?.authors || [];

  const author = authorsList.find((a: any) => 
    a.id === slug ||
    a.id?.toLowerCase() === slug?.toLowerCase() ||
    a.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') === slug?.toLowerCase() ||
    a.name?.toLowerCase() === slug?.toLowerCase()
  );

  if (!author) {
    throw new Response("Author Not Found", { status: 404 });
  }

  // 2. Fetch all content associated with this author from DB + static files
  const [dbArticles, dbVideos, dbPodcasts] = await Promise.all([
    getDbArticles(env?.DB),
    getDbVideos(env?.DB),
    getDbPodcasts(env?.DB)
  ]);

  // Static articles
  const mdxFiles = import.meta.glob("../content/articles/*.mdx", { query: '?raw', import: 'default', eager: true });
  const staticArticles = Object.entries(mdxFiles).map(([path, content]) => {
    const fileSlug = path.split('/').pop()?.replace('.mdx', '');
    const { attributes } = fm(content as string);
    return { slug: fileSlug, ...(attributes as any) };
  });

  const articleMap = new Map<string, any>();
  staticArticles.forEach(a => { if (a.slug) articleMap.set(a.slug, a); });
  dbArticles.forEach(a => { if (a.slug) articleMap.set(a.slug, a); });

  const allArticles = Array.from(articleMap.values())
    .filter((a: any) => a.status !== 'draft')
    .filter((a: any) => {
      const match = a.author === author.id || 
                    a.author?.toLowerCase() === author.name?.toLowerCase() ||
                    a.author === author.nameMl;
      return match;
    })
    .sort((a: any, b: any) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());

  // Static videos
  const videosJson = import.meta.glob("../content/videos/*.json", { import: 'default', eager: true });
  const staticVideos = Object.entries(videosJson).map(([path, content]: any) => ({
    slug: path.split('/').pop()?.replace('.json', ''),
    ...content
  }));

  const videoMap = new Map<string, any>();
  staticVideos.forEach(v => { if (v.slug) videoMap.set(v.slug, v); });
  dbVideos.forEach(v => { if (v.slug) videoMap.set(v.slug, v); });

  const allVideos = Array.from(videoMap.values())
    .filter((v: any) => v.status !== 'draft')
    .filter((v: any) => {
      const match = v.author === author.id || 
                    v.author?.toLowerCase() === author.name?.toLowerCase() ||
                    v.author === author.nameMl;
      return match;
    })
    .sort((a: any, b: any) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());

  // Static podcasts
  const podcastsJson = import.meta.glob("../content/podcasts/*.json", { import: 'default', eager: true });
  const staticPodcasts = Object.entries(podcastsJson).map(([path, content]: any) => ({
    slug: path.split('/').pop()?.replace('.json', ''),
    ...content
  }));

  const podcastMap = new Map<string, any>();
  staticPodcasts.forEach(p => { if (p.slug) podcastMap.set(p.slug, p); });
  dbPodcasts.forEach(p => { if (p.slug) podcastMap.set(p.slug, p); });

  const allPodcasts = Array.from(podcastMap.values())
    .filter((p: any) => p.status !== 'draft')
    .filter((p: any) => {
      const match = p.author === author.id || 
                    p.author?.toLowerCase() === author.name?.toLowerCase() ||
                    p.host === author.name ||
                    p.host === author.nameMl;
      return match;
    })
    .sort((a: any, b: any) => (b.episodeNumber || 0) - (a.episodeNumber || 0));

  return json({
    author,
    articles: allArticles,
    videos: allVideos,
    podcasts: allPodcasts
  });
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data || !data.author) {
    return [{ title: "Author Not Found | Samastha Graph" }];
  }
  const author = data.author;
  const title = `${author.nameMl || author.name} | Authors & Scholars | Samastha Graph`;
  const description = author.bio || `${author.name} is a contributing scholar and author on Samastha Graph.`;
  return [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    ...(author.avatar ? [{ property: "og:image", content: author.avatar }] : [])
  ];
};

export default function AuthorProfilePage() {
  const { author, articles, videos, podcasts } = useLoaderData<typeof loader>();
  const [activeTab, setActiveTab] = useState<'all' | 'articles' | 'videos' | 'podcasts'>('all');

  const totalItems = (articles?.length || 0) + (videos?.length || 0) + (podcasts?.length || 0);

  return (
    <div className="bg-[#fcfbf9] min-h-screen pb-24 text-gray-900 font-sans">
      {/* Hero / Header */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0c3929] via-[#15664a] to-[#1e4e3d] text-white pt-24 pb-16 md:pt-32 md:pb-24 shadow-inner">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#c8a136_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Link
            to="/authors"
            className="inline-flex items-center gap-2 text-emerald-200 hover:text-white text-sm font-medium mb-8 transition-colors group"
          >
            <ArrowLeft size={16} className="transform group-hover:-translate-x-1 transition-transform" />
            All Authors &amp; Scholars
          </Link>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 lg:gap-12">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-2xl overflow-hidden bg-emerald-900/50 border-4 border-[#c8a136]/60 shadow-2xl flex items-center justify-center">
                {author.avatar ? (
                  <OptimizedImage
                    src={author.avatar}
                    alt={author.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={64} className="text-emerald-300 opacity-60" />
                )}
              </div>
              <div className="absolute -bottom-3 -right-3 bg-[#c8a136] text-gray-900 p-2 rounded-xl shadow-lg">
                <Sparkles size={18} />
              </div>
            </div>

            {/* Author Information */}
            <div className="flex-1 text-center md:text-left">
              <div className="inline-block bg-white/10 backdrop-blur-md border border-white/20 text-[#c8a136] text-xs uppercase tracking-widest font-bold px-3.5 py-1 rounded-full mb-3">
                Author &amp; Scholar Profile
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-2">
                {author.name}
              </h1>
              {author.nameMl && (
                <p className="text-xl sm:text-2xl text-emerald-200 font-malayalam mb-4 font-semibold">
                  {author.nameMl}
                </p>
              )}
              {author.role && (
                <p className="text-base sm:text-lg text-emerald-100/90 font-medium mb-4">
                  {author.role}
                </p>
              )}
              {author.bio && (
                <p className="text-sm sm:text-base text-white/80 max-w-2xl leading-relaxed mb-6">
                  {author.bio}
                </p>
              )}

              {/* Social & Links */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                {author.website && (
                  <a
                    href={author.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-xs px-3.5 py-2 rounded-lg border border-white/15 transition-colors font-medium"
                  >
                    <Globe size={14} className="text-[#c8a136]" /> Website
                  </a>
                )}
                {author.twitter && (
                  <a
                    href={author.twitter.startsWith('http') ? author.twitter : `https://x.com/${author.twitter.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-xs px-3.5 py-2 rounded-lg border border-white/15 transition-colors font-medium"
                  >
                    <FaXTwitter size={14} /> X / Twitter
                  </a>
                )}
                <div className="inline-flex items-center gap-2 bg-black/20 text-emerald-100 text-xs px-3.5 py-2 rounded-lg border border-white/10 font-semibold">
                  <BookOpen size={14} className="text-[#c8a136]" /> {totalItems} Published Works
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-2 flex flex-wrap gap-2 mb-10">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 sm:flex-none px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'all'
                ? 'bg-[#15664a] text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            All Works ({totalItems})
          </button>
          {articles?.length > 0 && (
            <button
              onClick={() => setActiveTab('articles')}
              className={`flex-1 sm:flex-none px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'articles'
                  ? 'bg-[#15664a] text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FileText size={16} /> Articles ({articles.length})
            </button>
          )}
          {videos?.length > 0 && (
            <button
              onClick={() => setActiveTab('videos')}
              className={`flex-1 sm:flex-none px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'videos'
                  ? 'bg-[#15664a] text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Video size={16} /> Videos ({videos.length})
            </button>
          )}
          {podcasts?.length > 0 && (
            <button
              onClick={() => setActiveTab('podcasts')}
              className={`flex-1 sm:flex-none px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'podcasts'
                  ? 'bg-[#15664a] text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Mic size={16} /> Podcasts ({podcasts.length})
            </button>
          )}
        </div>

        {/* Empty state */}
        {totalItems === 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center my-8 shadow-sm">
            <BookOpen size={48} className="mx-auto text-gray-400 mb-3 opacity-60" />
            <h3 className="text-xl font-bold text-gray-800">No published works yet</h3>
            <p className="text-gray-500 text-sm mt-1 max-w-md mx-auto">
              Articles, videos, and podcast episodes published by this author will appear here.
            </p>
          </div>
        )}

        {/* Articles Section */}
        {(activeTab === 'all' || activeTab === 'articles') && articles?.length > 0 && (
          <div className="mb-14">
            <div className="flex items-center justify-between mb-6 pb-2 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
                <FileText className="text-[#15664a]" size={22} /> Articles by {author.name}
              </h2>
              <span className="text-xs font-semibold text-gray-500">{articles.length} articles</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((item: any) => (
                <Link
                  key={item.slug}
                  to={`/articles/${item.slug}`}
                  className="bg-white rounded-xl overflow-hidden border border-gray-200 hover:border-[#15664a]/50 hover:shadow-lg transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="h-44 bg-gray-100 overflow-hidden relative">
                      {item.coverImage ? (
                        <OptimizedImage
                          src={item.coverImage}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-emerald-950 text-[#c8a136]">
                          <FileText size={40} />
                        </div>
                      )}
                      {item.category && (
                        <span className="absolute top-3 left-3 bg-[#15664a] text-white text-[11px] font-bold px-2.5 py-0.5 rounded-md shadow">
                          {item.category}
                        </span>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="font-bold text-gray-900 text-lg leading-snug group-hover:text-[#15664a] transition-colors line-clamp-2 mb-2 font-malayalam">
                        {item.title}
                      </h3>
                      {item.excerpt && (
                        <p className="text-gray-600 text-xs line-clamp-3 leading-relaxed">
                          {item.excerpt}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-[#c8a136]" />
                      {item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : 'Recent'}
                    </span>
                    <span className="text-[#15664a] font-bold group-hover:underline">Read Article →</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Videos Section */}
        {(activeTab === 'all' || activeTab === 'videos') && videos?.length > 0 && (
          <div className="mb-14">
            <div className="flex items-center justify-between mb-6 pb-2 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
                <Video className="text-[#15664a]" size={22} /> Videos &amp; Discourses
              </h2>
              <span className="text-xs font-semibold text-gray-500">{videos.length} videos</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((item: any) => (
                <Link
                  key={item.slug}
                  to={`/videos/${item.slug}`}
                  className="bg-white rounded-xl overflow-hidden border border-gray-200 hover:border-[#15664a]/50 hover:shadow-lg transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="h-44 bg-gray-900 overflow-hidden relative">
                      <OptimizedImage
                        src={item.thumbnailUrl || (item.youtubeId ? `https://img.youtube.com/vi/${item.youtubeId}/hqdefault.jpg` : '/Logo.png')}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {item.duration && (
                        <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-mono px-2 py-0.5 rounded">
                          {item.duration}
                        </span>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="font-bold text-gray-900 text-base leading-snug group-hover:text-[#15664a] transition-colors line-clamp-2 mb-2 font-malayalam">
                        {item.title}
                      </h3>
                      {item.description && (
                        <p className="text-gray-600 text-xs line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-[#c8a136]" />
                      {item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : 'Recent'}
                    </span>
                    <span className="text-[#15664a] font-bold group-hover:underline">Watch Video →</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Podcasts Section */}
        {(activeTab === 'all' || activeTab === 'podcasts') && podcasts?.length > 0 && (
          <div className="mb-14">
            <div className="flex items-center justify-between mb-6 pb-2 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
                <Mic className="text-[#15664a]" size={22} /> Podcasts &amp; Audio
              </h2>
              <span className="text-xs font-semibold text-gray-500">{podcasts.length} episodes</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {podcasts.map((item: any) => (
                <Link
                  key={item.slug}
                  to={`/podcasts/${item.slug}`}
                  className="bg-white rounded-xl overflow-hidden border border-gray-200 hover:border-[#15664a]/50 hover:shadow-lg transition-all group p-5 flex flex-col justify-between"
                >
                  <div className="flex gap-4 items-start">
                    <div className="w-16 h-16 rounded-lg bg-emerald-950 flex-shrink-0 overflow-hidden">
                      {item.coverImage ? (
                        <OptimizedImage src={item.coverImage} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#c8a136]">
                          <Mic size={24} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[11px] font-bold text-[#c8a136] uppercase tracking-wider">
                        {item.showName || 'Podcast'} {item.episodeNumber ? `• Ep ${item.episodeNumber}` : ''}
                      </span>
                      <h3 className="font-bold text-gray-900 text-base leading-snug group-hover:text-[#15664a] transition-colors line-clamp-2 mt-1 font-malayalam">
                        {item.title}
                      </h3>
                    </div>
                  </div>
                  <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-medium">
                    <span>{item.duration || 'Audio'}</span>
                    <span className="text-[#15664a] font-bold group-hover:underline">Listen Now →</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
