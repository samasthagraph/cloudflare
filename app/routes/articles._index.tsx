import { useLoaderData, Link } from "@remix-run/react";
import { json, type LoaderFunctionArgs, type MetaFunction } from "@remix-run/cloudflare";
import { useState } from "react";
import fm from "front-matter";
import { OptimizedImage } from "~/components/OptimizedImage";
import { isMalayalam } from "~/utils/language";
import { getDbArticles } from "~/utils/db.server";

export const meta: MetaFunction = () => {
  return [
    { title: "Articles • Samastha Graph" },
    { name: "description", content: "Read scholarly articles, essays, research papers, and analyses on Samastha Graph." },
    { property: "og:title", content: "Articles • Samastha Graph" },
    { property: "og:description", content: "Read scholarly articles, essays, research papers, and analyses on Samastha Graph." },
  ];
};

export const loader = async ({ context }: LoaderFunctionArgs) => {
  const ctx = context as any;
  const env = ctx?.cloudflare?.env || ctx?.env || (typeof process !== 'undefined' ? process.env : {});
  const dbArticles = await getDbArticles(env?.DB);

  const mdxFiles = import.meta.glob("../content/articles/*.mdx", { query: '?raw', import: 'default', eager: true });
  const staticArticles = Object.entries(mdxFiles).map(([path, content]) => {
    const slug = path.split('/').pop()?.replace('.mdx', '');
    const { attributes } = fm(content as string);
    return {
      slug,
      ...(attributes as any)
    };
  });

  const map = new Map<string, any>();
  staticArticles.forEach(a => { if (a.slug) map.set(a.slug, a); });
  dbArticles.forEach(a => { if (a.slug) map.set(a.slug, a); });

  const articlesData = Array.from(map.values())
    .filter((a: any) => a.status !== 'draft' && isMalayalam(a));

  const articles = articlesData.sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());

  return json({ articles });
};


export default function ArticlesIndex() {
  const { articles } = useLoaderData<typeof loader>();

  const [activeCategory, setActiveCategory] = useState("All");
  const [visibleCount, setVisibleCount] = useState(7); 

  if (!articles || articles.length === 0) {
    return (
      <div className="min-h-screen bg-brand-light flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-newspaper text-6xl text-brand-olive mb-4"></i>
          <h1 className="text-2xl font-heading font-bold text-brand-dark">No Articles Found</h1>
          <p className="text-brand-muted mt-2">Check back later for new updates.</p>
        </div>
      </div>
    );
  }

  const categories = ["All", ...Array.from(new Set(articles.map((a: any) => a.category || "News").filter(Boolean)))];
  
  const filteredArticles = activeCategory === "All" 
    ? articles 
    : articles.filter((a: any) => (a.category || "News") === activeCategory);

  const featuredArticle = filteredArticles[0];
  const gridArticles = filteredArticles.slice(1, visibleCount);

  return (
    <div className="bg-brand-light min-h-screen pb-20">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 relative z-20">
        
        <div className="flex overflow-x-auto no-scrollbar gap-3 pb-8 items-center justify-center sm:justify-center">
          {categories.map((category: unknown) => (
            <button
              key={category as string}
              onClick={() => {
                setActiveCategory(category as string);
                setVisibleCount(7); 
              }}
              className={`whitespace-nowrap px-6 py-2.5 rounded-full font-body font-medium transition-all duration-300 shadow-sm ${
                activeCategory === category 
                  ? 'bg-brand-gold text-brand-dark shadow-brand-gold/30' 
                  : 'bg-white text-brand-dark hover:bg-brand-surface/50 border border-brand-surface'
              }`}
            >
              {category as string}
            </button>
          ))}
        </div>

        {featuredArticle && (
          <Link to={`/articles/${featuredArticle.slug}`} className="block group mb-16">
            <article className="relative bg-brand-dark rounded-3xl overflow-hidden shadow-2xl flex flex-col lg:flex-row min-h-[500px]">
              
              <div className="lg:w-2/3 relative">
                {featuredArticle.coverImage ? (
                  <OptimizedImage 
                    src={featuredArticle.coverImage} 
                    alt={featuredArticle.title} 
                    priority={true}
                    className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out" 
                  />
                ) : (
                  <div className="absolute inset-0 w-full h-full bg-brand-dark flex flex-col items-center justify-center pattern-dots-sm text-brand-surface/20">
                    <i className="fas fa-newspaper text-7xl mb-4"></i>
                    <span className="font-heading font-bold text-xl tracking-widest uppercase">Samastha Graph</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/40 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-brand-dark"></div>
              </div>

              <div className="lg:w-1/3 relative z-10 p-8 lg:p-12 flex flex-col justify-center bg-gradient-to-t from-brand-dark to-transparent lg:bg-none">
                <div className="flex items-center gap-3 mb-6">
                  <span className="bg-brand-gold text-brand-dark text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    {featuredArticle.category || 'News'}
                  </span>
                  <span className="text-brand-surface text-sm font-medium flex items-center gap-2">
                    <i className="far fa-calendar-alt"></i>
                    {featuredArticle.publishDate || featuredArticle.publishedAt}
                  </span>
                </div>
                
                <h2 className="text-3xl md:text-4xl font-heading font-malayalam font-bold text-white mb-6 leading-tight group-hover:text-brand-gold transition-colors duration-300 line-clamp-3 md:line-clamp-2">
                  {featuredArticle.title}
                </h2>
                
                <p className="text-brand-surface/90 text-lg mb-8 line-clamp-3 font-body">
                  {featuredArticle.excerpt || "Dive into our latest featured story and explore the insights shared by our community leaders."}
                </p>
                
                <div className="inline-flex items-center text-brand-gold font-bold text-lg group-hover:text-white transition-colors duration-300">
                  Read Story <i className="fas fa-arrow-right ml-3 transform group-hover:translate-x-2 transition-transform"></i>
                </div>
              </div>
            </article>
          </Link>
        )}

        {gridArticles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {gridArticles.map((article: any) => (
              <Link key={article.slug} to={`/articles/${article.slug}`} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-brand-surface group flex flex-col">
                
                <div className="relative aspect-[16/10] overflow-hidden bg-brand-dark">
                  {article.coverImage ? (
                    <OptimizedImage 
                      src={article.coverImage} 
                      alt={article.title} 
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-brand-dark">
                      <i className="fas fa-file-alt text-5xl text-brand-surface/30"></i>
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                    <span className="bg-brand-light/90 backdrop-blur-sm text-brand-dark text-xs font-bold px-3 py-1 rounded-full border border-white/50">
                      {article.category || 'News'}
                    </span>
                  </div>
                </div>

                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs text-brand-muted font-medium flex items-center gap-1.5">
                      <i className="far fa-clock"></i>
                      {article.publishDate || article.publishedAt}
                    </span>
                    {article.readTime && (
                      <span className="text-xs font-medium text-brand-olive bg-brand-olive/10 px-2 py-0.5 rounded">
                        {article.readTime}
                      </span>
                    )}
                  </div>
                  
                  <h3 className="font-heading font-malayalam font-bold text-xl text-brand-dark mb-3 line-clamp-2 group-hover:text-brand-gold transition-colors leading-snug">
                    {article.title}
                  </h3>
                  
                  <p className="text-sm text-gray-600 line-clamp-3 mb-6 flex-grow font-body">
                    {article.excerpt || "Read the full article to discover more about this topic."}
                  </p>
                  
                  <div className="flex items-center text-brand-olive font-bold text-sm group-hover:text-brand-gold transition-colors mt-auto border-t border-brand-surface/50 pt-4">
                    Read Article <i className="fas fa-long-arrow-alt-right ml-2 transform group-hover:translate-x-1 transition-transform"></i>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {filteredArticles.length > visibleCount && (
          <div className="mt-16 text-center">
            <button 
              onClick={() => setVisibleCount(prev => prev + 6)}
              className="inline-flex items-center gap-3 bg-transparent border-2 border-brand-olive text-brand-dark font-bold px-8 py-3.5 rounded-full hover:bg-brand-olive hover:text-white transition-all duration-300 group shadow-sm hover:shadow-md"
            >
              Load More Articles 
              <i className="fas fa-sync-alt group-hover:animate-spin-slow"></i>
            </button>
          </div>
        )}

      </main>
    </div>
  );
}