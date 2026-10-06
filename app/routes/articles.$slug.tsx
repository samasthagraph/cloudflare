import React, { useState, useEffect } from 'react';
import { useLoaderData, Link, useLocation } from "@remix-run/react";
import { json, type LoaderFunctionArgs, type MetaFunction } from "@remix-run/cloudflare";
import { Share2, Clock, Calendar, ArrowLeft, Facebook, Twitter, Link as LinkIcon, Check } from 'lucide-react';
import { OptimizedImage } from "~/components/OptimizedImage";

const themeMap: Record<string, { title: string; body: string; align: string }> = {
  'theme-malayalam-standard': {
    title: 'font-malayalam text-3xl md:text-4xl lg:text-5xl',
    body: 'font-malayalam',
    align: 'text-left'
  },
  'theme-cinematic': {
    title: 'font-poppins text-3xl md:text-4xl lg:text-5xl',
    body: 'font-inter',
    align: 'text-center'
  },
  'theme-english-minimal': {
    title: 'font-inter text-2xl md:text-4xl lg:text-5xl',
    body: 'font-inter',
    align: 'text-left'
  }
};

import { marked } from "marked";
import fm from "front-matter";
import { isMalayalam } from "~/utils/language";
import { getDbArticles, getDbAuthors } from "~/utils/db.server";

export const loader = async ({ params, context }: LoaderFunctionArgs) => {
  const { slug } = params;
  const env = context?.cloudflare?.env || context?.env || (typeof process !== 'undefined' ? process.env : {});

  const dbArticles = await getDbArticles(env?.DB);
  const mdxFiles = import.meta.glob("../content/articles/*.mdx", { query: '?raw', import: 'default', eager: true });
  
  const staticArticles = Object.entries(mdxFiles).map(([path, content]) => {
    const fileSlug = path.split('/').pop()?.replace('.mdx', '');
    const { attributes, body } = fm(content as string);
    return {
      slug: fileSlug,
      ...(attributes as any),
      body
    };
  });

  const map = new Map<string, any>();
  staticArticles.forEach(a => { if (a.slug) map.set(a.slug, a); });
  dbArticles.forEach(a => { if (a.slug) map.set(a.slug, a); });

  const allArticles = Array.from(map.values()).filter((a: any) => a.status !== 'draft');
  const articlesData = allArticles.filter((a: any) => isMalayalam(a));

  const article = articlesData.find(a => a.slug === slug);

  if (!article) {
    throw new Response("Not Found", { status: 404 });
  }

  const htmlBody = marked.parse(article.body || "");

  let counterpartSlug = null;
  if (article.translationGroupId) {
    const counterpart = allArticles.find((a: any) => 
      a.translationGroupId === article.translationGroupId && a.slug !== article.slug && !isMalayalam(a)
    );
    if (counterpart) counterpartSlug = counterpart.slug;
  }

  let authorDetails = null;
  try {
    const dbAuthorsData = await getDbAuthors(env?.DB);
    const authorList = dbAuthorsData?.authors || [];
    authorDetails = authorList.find((a: any) => 
      a.id === article.author || 
      a.name?.toLowerCase() === article.author?.toLowerCase() || 
      a.nameMl === article.author
    ) || null;
  } catch (e) {
    console.warn("Error fetching author details:", e);
  }

  return json({
    article: { ...article, htmlBody },
    relatedArticles: articlesData.filter(a => a.slug !== slug).slice(0, 3),
    slug,
    counterpartSlug,
    authorDetails
  }, {
    headers: { "Cache-Control": "public, max-age=0, must-revalidate" }
  });
};

export const meta: MetaFunction<typeof loader> = ({ data, location }) => {
  if (!data || !data.article) {
    return [{ title: "Article Not Found • Samastha Graph" }];
  }
  const article = data.article;
  const url = `https://samasthagraph.pages.dev${location.pathname}`;
  
  const absoluteImageUrl = article.coverImage
    ? (article.coverImage.startsWith('http') 
        ? article.coverImage 
        : `https://samasthagraph.pages.dev${article.coverImage}`)
    : 'https://samasthagraph.pages.dev/Logo.png';

  return [
    { title: `${article.seoTitle || article.title} • Samastha Graph` },
    { name: "description", content: article.seoDescription || article.excerpt },
    { property: "og:title", content: article.seoTitle || article.title },
    { property: "og:description", content: article.seoDescription || article.excerpt },
    { property: "og:image", content: absoluteImageUrl },
    { property: "og:url", content: url },
    { property: "og:type", content: "article" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: article.seoTitle || article.title },
    { name: "twitter:description", content: article.seoDescription || article.excerpt },
    { name: "twitter:image", content: absoluteImageUrl },
    { tagName: "link", rel: "canonical", href: url },
    ...(data.counterpartSlug ? [
      { tagName: "link", rel: "alternate", hreflang: "ml", href: `https://samasthagraph.pages.dev/articles/${location.pathname.startsWith('/en') ? data.counterpartSlug : article.slug}` },
      { tagName: "link", rel: "alternate", hreflang: "en", href: `https://samasthagraph.pages.dev/en/articles/${location.pathname.startsWith('/en') ? article.slug : data.counterpartSlug}` }
    ] : [])
  ] as any;
};

export default function ArticlePage() {
  const { article, relatedArticles, authorDetails } = useLoaderData<typeof loader>();
  
  const activeTheme = themeMap[article.themePreset || 'theme-malayalam-standard'] || themeMap['theme-malayalam-standard'];

  const [scrollProgress, setScrollProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const location = useLocation();
  const fullUrl = `https://samasthagraph.pages.dev${location.pathname}`;

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollTop;
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scroll = `${totalScroll / windowHeight}`;
      setScrollProgress(Number(scroll));
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setShowShareMenu(false);
  };

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(fullUrl)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(article.title + ' ' + fullUrl)}`
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": article.title,
    "image": [article.coverImage],
    "datePublished": article.publishedAt,
    "dateModified": article.publishedAt,
    "author": [{
      "@type": "Organization",
      "name": "Samastha Graph",
      "url": "https://samasthagraph.pages.dev"
    }],
    "publisher": {
      "@type": "Organization",
      "name": "Samastha Graph",
      "logo": {
        "@type": "ImageObject",
        "url": "https://samasthagraph.pages.dev/Logo.png"
      }
    },
    "description": article.excerpt
  };

  return (
    <div className="bg-[#eef3f1] font-sans text-gray-800 flex flex-col selection:bg-[#c8a136] selection:text-[#15664a]">
      {/* GLOBAL STYLES FOR ANIMATIONS & TYPOGRAPHY */}
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+Malayalam:wght@400;600;700&family=Poppins:wght@500;600;700&display=swap');
        
        .font-poppins { font-family: 'Poppins', sans-serif; }
        .font-inter { font-family: 'Inter', sans-serif; }
        .font-malayalam { font-family: 'Noto Sans Malayalam', sans-serif; }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 1s ease-out forwards;
          opacity: 0;
        }

        .delay-100 { animation-delay: 100ms; }
        .delay-200 { animation-delay: 200ms; }
        

      `}} />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      <div 
        className="fixed top-0 left-0 h-1 bg-[#c8a136] z-[60] transition-all duration-150 ease-out"
        style={{ width: `${scrollProgress * 100}%` }}
      />

      <main className="flex-grow pb-24 flex flex-col">
        {/* NEW EDITORIAL HEADER */}
        <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-12 md:pt-16 pb-8">
          <div className="max-w-5xl lg:pl-2">
            
            {/* Back Navigation - Normal Flow */}
            <div className="mb-8 animate-fade-in-up">
              <Link to="/articles" className="inline-flex items-center gap-2 text-sm font-semibold text-[#7ea99a] hover:text-[#15664a] transition-colors font-poppins">
                <ArrowLeft className="w-4 h-4" /> Back to Articles
              </Link>
            </div>

            <div className={`animate-fade-in-up delay-100 ${activeTheme.align}`}>
              {/* Category / Label */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-[#15664a]/5 border-l-2 border-[#c8a136] text-[#15664a] font-semibold tracking-widest uppercase text-xs mb-6">
                {article.category || 'Article'}
              </div>
              
              {/* Title */}
              <h1 className={`font-bold text-[#18181B] mb-6 leading-tight text-balance ${activeTheme.title}`}>
                {article.title}
              </h1>
              
              {/* Excerpt */}
              {article.excerpt && (
                <p className={`text-xl md:text-2xl text-[#4A5D54] font-inter leading-relaxed mb-8 max-w-4xl ${activeTheme.align === 'text-center' ? 'mx-auto' : ''}`}>
                  {article.excerpt}
                </p>
              )}
            </div>
          </div>
          
          {/* Metadata & Actions Row (Full Width for Share Alignment) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 py-6 border-y border-[#c1d5cd]/40 mt-8 lg:pl-2 animate-fade-in-up delay-200 max-w-5xl">
            
            <div className="flex flex-wrap items-center gap-6 text-[#4A5D54] text-sm md:text-base font-inter">
              {(authorDetails || article.author) && (
                authorDetails?.id ? (
                  <Link to={`/authors/${authorDetails.id}`} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
                    {authorDetails?.avatar && (
                      <img src={authorDetails.avatar} alt={authorDetails.name} className="w-7 h-7 rounded-full object-cover border border-[#15664a]/30" />
                    )}
                    <span className="font-semibold text-[#15664a] font-malayalam hover:underline">
                      {authorDetails?.nameMl || authorDetails?.name || article.author}
                    </span>
                  </Link>
                ) : (
                  <div className="flex items-center gap-2.5">
                    {authorDetails?.avatar && (
                      <img src={authorDetails.avatar} alt={authorDetails.name} className="w-7 h-7 rounded-full object-cover border border-[#15664a]/30" />
                    )}
                    <span className="font-semibold text-[#15664a] font-malayalam">
                      {authorDetails?.nameMl || authorDetails?.name || article.author}
                    </span>
                  </div>
                )
              )}
              {article.publishedAt && (
                <span className="flex items-center gap-2 font-medium tracking-wide">
                  <Calendar className="w-4 h-4 text-[#c8a136]" /> 
                  {new Date(article.publishedAt).toLocaleDateString()}
                </span>
              )}
            </div>

            {/* Actions (Share) */}
            <div className="flex items-center justify-end">
              <div className="relative">
                <button 
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  className="group flex items-center gap-3 px-6 py-2.5 bg-transparent border border-[#c1d5cd]/50 rounded-sm text-[#4A5D54] hover:text-[#15664a] hover:bg-white hover:border-[#c1d5cd] hover:shadow-sm transition-all duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#15664a]/20"
                >
                  <Share2 className="w-[18px] h-[18px] text-[#7ea99a] group-hover:text-[#15664a] transition-colors duration-300" strokeWidth={1.5} />
                  <span className="text-sm font-medium tracking-wide font-inter">Share</span>
                </button>

                {showShareMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-sm shadow-xl border border-gray-100 p-2 z-50 flex flex-col gap-1">
                    <a href={shareLinks.whatsapp} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-[#eef3f1] hover:text-[#15664a] rounded-sm transition-colors">
                      <span className="text-[#25D366]">W</span> WhatsApp
                    </a>
                    <a href={shareLinks.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-[#eef3f1] hover:text-[#15664a] rounded-sm transition-colors">
                      <Facebook className="w-4 h-4 text-[#1877F2]" /> Facebook
                    </a>
                    <a href={shareLinks.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-[#eef3f1] hover:text-[#15664a] rounded-sm transition-colors">
                      <Twitter className="w-4 h-4 text-[#1DA1F2]" /> Twitter / X
                    </a>
                    <div className="h-px bg-gray-100 my-1"></div>
                    <button onClick={handleCopyLink} className="flex items-center w-full gap-3 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-[#eef3f1] hover:text-[#15664a] rounded-sm transition-colors">
                      {copied ? <Check className="w-4 h-4 text-green-600" /> : <LinkIcon className="w-4 h-4" />}
                      {copied ? 'Link Copied!' : 'Copy Link'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

        </section>

        {/* Featured Image */}
        {article.coverImage && (
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mb-12 lg:mb-16">
            <div className="max-w-5xl w-full aspect-video md:aspect-[21/9] bg-[#c1d5cd] rounded-lg overflow-hidden shadow-sm animate-fade-in-up delay-200">
              <OptimizedImage 
                src={article.coverImage} 
                alt={article.title} 
                priority={true}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {/* Article Body */}
        <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mb-16 lg:mb-24 relative z-20">
          <div className="max-w-5xl lg:pl-2">
            <article 
              className={`text-left [&_p]:!text-left [&_p]:mb-6 [&_p]:leading-[2] [&_h1]:text-left [&_h2]:text-left [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-[#15664a] [&_h3]:text-left [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-[#15664a] [&_h4]:text-left [&_ul]:text-left [&_ol]:text-left [&_blockquote]:text-left article-body text-[#18181B] leading-[2] text-lg md:text-xl ${activeTheme.body} prose prose-lg md:prose-xl max-w-none prose-headings:text-[#15664a] prose-headings:font-bold prose-a:text-[#c8a136] prose-strong:text-[#15664a] prose-p:text-[#18181B]`}
              dangerouslySetInnerHTML={{ __html: article.htmlBody }}
            />

            {/* Author Card Box */}
            {authorDetails && (
              <div className="mt-14 p-6 sm:p-8 bg-white rounded-xl border border-[#c1d5cd]/50 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-50 border-2 border-[#15664a]/20 overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {authorDetails.avatar ? (
                    <img src={authorDetails.avatar} alt={authorDetails.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-[#15664a]">{authorDetails.name.charAt(0)}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#c8a136]">Written By</span>
                    {authorDetails.id && (
                      <Link to={`/authors/${authorDetails.id}`} className="text-xs font-bold text-[#15664a] hover:underline">
                        View Profile →
                      </Link>
                    )}
                  </div>
                  <h4 className="text-xl font-bold text-[#15664a] font-malayalam">
                    {authorDetails.nameMl || authorDetails.name}
                  </h4>
                  {authorDetails.role && (
                    <p className="text-xs text-[#7ea99a] font-medium mt-0.5">{authorDetails.role}</p>
                  )}
                  {authorDetails.bio && (
                    <p className="text-sm text-[#4A5D54] mt-2.5 leading-relaxed">{authorDetails.bio}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {relatedArticles && relatedArticles.length > 0 && (
          <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-16 md:mt-24">
            <div className="flex items-center gap-4 mb-10">
              <h3 className="text-3xl font-poppins font-bold text-[#15664a]">Related Articles</h3>
              <div className="h-px bg-[#c1d5cd] flex-grow mt-2"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {relatedArticles.map((rel: any, i: number) => (
                <Link key={i} to={`/articles/${rel.slug}`} className="group flex flex-col bg-white rounded-sm shadow-sm hover:shadow-xl transition-all duration-300 border border-[#eef3f1] overflow-hidden">
                  <div className="w-full h-48 overflow-hidden bg-[#c1d5cd]">
                    {rel.coverImage && (
                      <OptimizedImage src={rel.coverImage} alt={rel.title} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" />
                    )}
                  </div>
                  <div className="p-6 flex flex-col flex-grow">
                    <div className="text-xs font-bold uppercase tracking-wider text-[#c8a136] mb-3">Article</div>
                    <h4 className="text-xl font-poppins font-semibold text-[#15664a] group-hover:text-[#c8a136] transition-colors leading-snug mb-4 line-clamp-3 font-malayalam">
                      {rel.title}
                    </h4>
                    {rel.publishedAt && (
                      <div className="mt-auto flex items-center text-sm text-[#7ea99a] font-inter font-medium">
                        <Calendar className="w-4 h-4 mr-2" />
                        {new Date(rel.publishedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
