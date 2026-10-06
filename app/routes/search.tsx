import React from 'react';
import { json, type LoaderFunctionArgs, type MetaFunction } from "@remix-run/cloudflare";
import { useLoaderData, useSearchParams, Link } from "@remix-run/react";

export const meta: MetaFunction = () => {
  return [
    { title: "Search • Samastha Graph" },
    { name: "description", content: "Search for articles, videos, podcasts, and programs across Samastha Graph." },
  ];
};
import fm from "front-matter";
import { Search as SearchIcon, FileText, Video, Mic, LayoutDashboard, ChevronRight } from "lucide-react";
import { OptimizedImage } from "~/components/OptimizedImage";
import { CompactHero } from "~/components/CompactHero";

interface SearchResult {
  title: string;
  excerpt: string;
  type: "article" | "video" | "program" | "podcast";
  slug: string;
  url: string;
  thumbnail?: string;
  publishedAt?: string;
  language?: string;
}

function parseMdx(content: string) {
  try {
    return fm(content).attributes as any;
  } catch (e) {
    return {};
  }
}

import { getDbArticles, getDbVideos, getDbPodcasts, getDbPrograms } from "~/utils/db.server";

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
  const env = (context as any)?.cloudflare?.env || (context as any)?.env || (typeof process !== 'undefined' ? process.env : {});
  const url = new URL(request.url);
  const q = url.searchParams.get("q") || "";
  const query = q.toLowerCase().trim();

  const results: SearchResult[] = [];

  if (!query) {
    return json({ q, results });
  }

  // Load Content from D1
  const [dbArticles, dbVideos, dbPodcasts, dbPrograms] = await Promise.all([
    getDbArticles(env?.DB),
    getDbVideos(env?.DB),
    getDbPodcasts(env?.DB),
    getDbPrograms(env?.DB)
  ]);

  // Load Static Files
  const articlesJson = import.meta.glob("../content/articles/*.json", { import: 'default', eager: true });
  const articlesMdx = import.meta.glob("../content/articles/*.mdx", { query: '?raw', import: 'default', eager: true });
  
  const videosJson = import.meta.glob("../content/videos/*.json", { import: 'default', eager: true });
  const videosMdx = import.meta.glob("../content/videos/*.mdx", { query: '?raw', import: 'default', eager: true });
  
  const programsJson = import.meta.glob("../content/programs/*.json", { import: 'default', eager: true });
  
  const podcastsJson = import.meta.glob("../content/podcasts/*.json", { import: 'default', eager: true });
  const podcastsMdx = import.meta.glob("../content/podcasts/*.mdx", { query: '?raw', import: 'default', eager: true });

  const articleMap = new Map<string, any>();
  const videoMap = new Map<string, any>();
  const programMap = new Map<string, any>();
  const podcastMap = new Map<string, any>();

  Object.entries(articlesJson).forEach(([path, content]) => {
    const slug = path.split('/').pop()?.replace('.json', '') || '';
    articleMap.set(slug, content);
  });
  Object.entries(articlesMdx).forEach(([path, content]) => {
    const slug = path.split('/').pop()?.replace('.mdx', '') || '';
    articleMap.set(slug, parseMdx(content as string));
  });
  dbArticles.forEach((a: any) => { if (a.slug) articleMap.set(a.slug, a); });

  Object.entries(videosJson).forEach(([path, content]: any) => {
    const slug = path.split('/').pop()?.replace('.json', '') || '';
    videoMap.set(slug, content);
  });
  Object.entries(videosMdx).forEach(([path, content]) => {
    const slug = path.split('/').pop()?.replace('.mdx', '') || '';
    videoMap.set(slug, parseMdx(content as string));
  });
  dbVideos.forEach((v: any) => { if (v.slug) videoMap.set(v.slug, v); });

  Object.entries(programsJson).forEach(([path, content]: any) => {
    const slug = path.split('/').pop()?.replace('.json', '') || '';
    programMap.set(slug, content);
  });
  dbPrograms.forEach((p: any) => { if (p.slug) programMap.set(p.slug, p); });

  Object.entries(podcastsJson).forEach(([path, content]: any) => {
    const slug = path.split('/').pop()?.replace('.json', '') || '';
    podcastMap.set(slug, content);
  });
  Object.entries(podcastsMdx).forEach(([path, content]) => {
    const slug = path.split('/').pop()?.replace('.mdx', '') || '';
    podcastMap.set(slug, parseMdx(content as string));
  });
  dbPodcasts.forEach((p: any) => { if (p.slug) podcastMap.set(p.slug, p); });

  const processEntries = (map: Map<string, any>, type: SearchResult['type'], urlPrefix: string) => {
    map.forEach((data, slug) => {
      if (data.status === "draft") return;

      const title = data.title || "";
      const excerpt = data.excerpt || data.description || "";
      const author = data.author || data.host || "";
      
      const searchContent = `${title} ${excerpt} ${slug} ${author}`.toLowerCase();
      
      if (searchContent.includes(query)) {
        let thumbnail = data.coverImage || data.thumbnail || data.image || data.thumbnailUrl;
        if (type === 'video' && !thumbnail && data.youtubeId) {
          thumbnail = `https://img.youtube.com/vi/${data.youtubeId}/hqdefault.jpg`;
        }

        results.push({
          title,
          excerpt,
          type,
          slug,
          url: `${data.language === 'en' ? '/en' : ''}${urlPrefix}${slug}`,
          thumbnail,
          publishedAt: data.publishedAt,
          language: data.language || 'ml'
        });
      }
    });
  };

  processEntries(articleMap, 'article', '/articles/');
  processEntries(videoMap, 'video', '/videos/');
  processEntries(programMap, 'program', '/videos/programs/');
  processEntries(podcastMap, 'podcast', '/podcasts/');

  // Sort by date descending
  results.sort((a, b) => {
    const timeA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const timeB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return timeB - timeA;
  });

  return json({ q, results });
};

export default function SearchRoute() {
  const { q, results } = useLoaderData<typeof loader>();
  
  return (
    <div className="min-h-screen bg-[#F7F5F0] font-sans text-[#18181B] pb-20 selection:bg-[#c8a136] selection:text-[#15664a]">
      {/* Home-styled Search Hero */}
      <CompactHero
        eyebrow="Knowledge Discovery"
        title={<>Search <span className="text-[#c8a136]">Archives</span>.</>}
        subtitle="Articles, Videos & Podcasts — Complete Knowledge Search"
        description="Search across our complete archives of Islamic scholarly articles, series, audio podcasts, and video discourses."
        actions={
          <form action="/search" method="get" className="relative group max-w-xl w-full pt-2">
            <SearchIcon size={22} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#c8a136] pointer-events-none z-10" />
            <input 
              type="search" 
              name="q"
              defaultValue={q}
              placeholder="Type keywords, topics, authors..." 
              className="w-full bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-white/60 px-4 py-3.5 pl-12 text-base md:text-lg rounded-full focus:outline-none focus:border-[#c8a136] focus:bg-white/20 transition-all duration-300 shadow-inner"
              autoFocus
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#c8a136] hover:bg-yellow-500 text-[#15664a] font-bold px-4 py-2 rounded-full text-xs uppercase tracking-wider transition-colors shadow"
            >
              Search
            </button>
          </form>
        }
        align="left"
        sideContent={
          <div className="relative group cursor-pointer block w-full text-left">
            <div className="absolute inset-0 bg-[#c8a136] rounded-2xl transform rotate-3 scale-105 opacity-20 transition-transform group-hover:rotate-6"></div>
            <div className="relative bg-black/60 backdrop-blur-md border border-[#2D5A46] rounded-2xl p-6 sm:p-8 text-white shadow-2xl flex flex-col justify-center space-y-4">
              <span className="bg-[#15664a] text-[#c8a136] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider self-start border border-[#c8a136]/30">
                Search Tips
              </span>
              <h3 className="font-heading font-bold text-xl text-white">Find Exactly What You Need</h3>
              <ul className="space-y-2 text-sm text-[#c8d9bf]">
                <li className="flex items-center gap-2">✓ Enter Malayalam or English terms</li>
                <li className="flex items-center gap-2">✓ Search by author, speaker, or series name</li>
                <li className="flex items-center gap-2">✓ Browse all articles, podcasts, &amp; videos together</li>
              </ul>
            </div>
          </div>
        }
      />

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-10">

        {/* Search Results */}
        <div className="max-w-4xl">
          {!q ? (
            <div className="py-16 border-t border-[#c1d5cd]/40">
              <p className="text-[#4A5D54] text-lg font-inter">Enter a search term above to begin exploring.</p>
            </div>
          ) : results.length === 0 ? (
            <div className="py-16 border-t border-[#c1d5cd]/40">
              <h2 className="text-2xl md:text-3xl font-poppins font-bold text-[#15664a] mb-4">No results found</h2>
              <p className="text-[#4A5D54] text-lg font-inter">Try adjusting your search term or exploring our categories.</p>
            </div>
          ) : (
            <div className="border-t border-[#c1d5cd]/40 pt-12">
              <p className="text-[#7ea99a] mb-10 uppercase tracking-widest text-sm font-semibold font-poppins">
                Found {results.length} result{results.length === 1 ? '' : 's'} for "{q}"
              </p>
              <div className="space-y-6 md:space-y-8">
                {results.map((result, idx) => (
                  <Link 
                    key={`${result.type}-${result.slug}-${idx}`} 
                    to={result.url}
                    className="group flex flex-col sm:flex-row gap-6 bg-white rounded-sm shadow-sm hover:shadow-xl transition-all duration-300 border border-[#eef3f1] overflow-hidden p-4 sm:p-6"
                  >
                    {result.thumbnail && (
                      <div className="w-full sm:w-48 h-48 sm:h-32 flex-shrink-0 bg-[#c1d5cd] rounded-sm overflow-hidden">
                        <OptimizedImage 
                          src={result.thumbnail} 
                          alt={result.title} 
                          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                        />
                      </div>
                    )}
                    <div className="flex-1 flex flex-col justify-center">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#c8a136]">
                          {result.type === 'article' && <FileText size={14} />}
                          {result.type === 'video' && <Video size={14} />}
                          {result.type === 'program' && <LayoutDashboard size={14} />}
                          {result.type === 'podcast' && <Mic size={14} />}
                          {result.type}
                        </span>
                        {result.language && (
                          <span className="text-xs font-semibold uppercase tracking-widest text-[#7ea99a]">
                            • {result.language === 'en' ? 'EN' : result.language === 'ml' ? 'ML' : result.language}
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl md:text-2xl font-poppins font-semibold text-[#15664a] group-hover:text-[#c8a136] transition-colors leading-snug line-clamp-2">
                        {result.title}
                      </h3>
                      {result.excerpt && (
                        <p className="mt-3 text-[#4A5D54] line-clamp-2 text-sm md:text-base font-inter">
                          {result.excerpt}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}
