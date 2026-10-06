import React, { useState } from 'react';
import { useLoaderData, Link } from "@remix-run/react";
import { json, type LoaderFunctionArgs, type MetaFunction } from "@remix-run/cloudflare";
import { User, Search, BookOpen, Sparkles, ArrowRight, ExternalLink, Globe } from 'lucide-react';
import { CompactHero } from "~/components/CompactHero";
import { OptimizedImage } from "~/components/OptimizedImage";
import { getDbAuthors, getDbArticles, getDbVideos, getDbPodcasts } from "~/utils/db.server";
import fm from "front-matter";

export const loader = async ({ context }: LoaderFunctionArgs) => {
  const env = context?.cloudflare?.env || context?.env || (typeof process !== 'undefined' ? process.env : {});

  const [dbAuthorsData, dbArticles, dbVideos, dbPodcasts] = await Promise.all([
    getDbAuthors(env?.DB),
    getDbArticles(env?.DB),
    getDbVideos(env?.DB),
    getDbPodcasts(env?.DB)
  ]);

  const authors = dbAuthorsData?.authors || [];

  let allArticles: any[] = [];
  if (env?.DB) {
    allArticles = (dbArticles || []).filter((a: any) => a.status !== 'draft');
  } else {
    const mdxFiles = import.meta.glob("../content/articles/*.mdx", { query: '?raw', import: 'default', eager: true });
    allArticles = Object.entries(mdxFiles).map(([path, content]) => {
      const fileSlug = path.split('/').pop()?.replace('.mdx', '');
      const { attributes } = fm(content as string);
      return { slug: fileSlug, ...(attributes as any) };
    }).filter((a: any) => a.status !== 'draft');
  }

  // Compute counts for each author
  const authorsWithCounts = authors.map((author: any) => {
    const articleCount = allArticles.filter((a: any) => 
      a.author === author.id || a.author?.toLowerCase() === author.name?.toLowerCase() || a.author === author.nameMl
    ).length;
    const videoCount = (dbVideos || []).filter((v: any) => 
      v.author === author.id || v.author?.toLowerCase() === author.name?.toLowerCase() || v.author === author.nameMl
    ).length;
    const podcastCount = (dbPodcasts || []).filter((p: any) => 
      p.author === author.id || p.author?.toLowerCase() === author.name?.toLowerCase() || p.host === author.name || p.host === author.nameMl
    ).length;

    return {
      ...author,
      articleCount,
      videoCount,
      podcastCount,
      totalCount: articleCount + videoCount + podcastCount
    };
  });

  return json({ authors: authorsWithCounts }, {
    headers: { "Cache-Control": "public, max-age=0, must-revalidate" }
  });
};

export const meta: MetaFunction = () => {
  return [
    { title: "Authors & Scholars • Samastha Graph" },
    { name: "description", content: "Explore scholars, writers, researchers, and thought leaders contributing to Samastha Graph." },
    { property: "og:title", content: "Authors & Scholars • Samastha Graph" },
    { property: "og:description", content: "Explore scholars, writers, researchers, and thought leaders contributing to Samastha Graph." }
  ];
};

export default function AuthorsIndex() {
  const { authors } = useLoaderData<typeof loader>();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAuthors = authors.filter((a: any) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      a.name?.toLowerCase().includes(query) ||
      a.nameMl?.toLowerCase().includes(query) ||
      a.role?.toLowerCase().includes(query) ||
      a.bio?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="bg-[#fcfbf9] min-h-screen pb-24 text-gray-900 font-sans">
      <CompactHero
        eyebrow="Scholarly Contributors & Writers"
        title={<>Authors &amp; <span className="text-[#c8a136]">Scholars</span></>}
        subtitle="Voices of Knowledge &amp; Research"
        description="Discover the scholars, researchers, and editorial voices creating thoughtful articles, discourses, and media across Samastha Graph."
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        {/* Search Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-12">
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search authors by name, designation, or topic..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#15664a] outline-none text-sm font-medium transition-all"
            />
          </div>
        </div>

        {/* Authors Grid */}
        {filteredAuthors.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center shadow-sm">
            <User size={48} className="mx-auto text-gray-400 mb-3 opacity-60" />
            <h3 className="text-xl font-bold text-gray-800">No authors match your search</h3>
            <p className="text-gray-500 text-sm mt-1">Try a different keyword or clear the search field.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredAuthors.map((author: any) => (
              <Link
                key={author.id}
                to={`/authors/${author.id}`}
                className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-xl hover:border-[#15664a]/40 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-50 to-transparent rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform"></div>

                <div>
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-emerald-50 border-2 border-[#15664a]/20 overflow-hidden flex-shrink-0 flex items-center justify-center shadow-sm group-hover:border-[#15664a] transition-colors">
                      {author.avatar ? (
                        <OptimizedImage src={author.avatar} alt={author.name} className="w-full h-full object-cover" />
                      ) : (
                        <User size={32} className="text-[#15664a]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-lg sm:text-xl leading-tight group-hover:text-[#15664a] transition-colors">
                        {author.name}
                      </h3>
                      {author.nameMl && (
                        <p className="text-sm text-[#15664a] font-medium font-malayalam mt-0.5">
                          {author.nameMl}
                        </p>
                      )}
                      {author.role && (
                        <span className="inline-block bg-emerald-50 text-[#15664a] text-xs px-2.5 py-0.5 rounded-full mt-2 font-semibold">
                          {author.role}
                        </span>
                      )}
                    </div>
                  </div>

                  {author.bio && (
                    <p className="text-xs sm:text-sm text-gray-600 line-clamp-3 leading-relaxed mb-4 bg-gray-50/70 p-3 rounded-xl border border-gray-100">
                      {author.bio}
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-100 flex items-center justify-between mt-2">
                  <span className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
                    <BookOpen size={14} className="text-[#c8a136]" />
                    {author.totalCount || 0} {author.totalCount === 1 ? 'Publication' : 'Publications'}
                  </span>
                  <span className="text-xs font-bold text-[#15664a] inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    View Profile <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
