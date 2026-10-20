import React, { useState, useEffect } from 'react';
import { useLoaderData, Link, useLocation } from "@remix-run/react";
import { json, type LoaderFunctionArgs, type MetaFunction } from "@remix-run/cloudflare";
import { Calendar, ArrowLeft } from 'lucide-react';
import { OptimizedImage } from "~/components/OptimizedImage";

const themeMap: Record<string, { title: string; body: string; align: string }> = {
  'theme-malayalam-standard': {
    title: 'font-anek-malayalam text-3xl sm:text-4xl md:text-[42px] lg:text-[46px]',
    body: 'font-anek-malayalam',
    align: 'text-left'
  },
  'theme-cinematic': {
    title: 'font-poppins text-3xl sm:text-4xl md:text-[42px] lg:text-[46px]',
    body: 'font-inter',
    align: 'text-left'
  },
  'theme-english-minimal': {
    title: 'font-inter text-3xl sm:text-4xl md:text-[42px] lg:text-[46px]',
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
  let allArticles: any[] = [];

  if (env?.DB) {
    allArticles = (dbArticles || []).filter((a: any) => a.status !== 'draft');
  } else {
    const mdxFiles = import.meta.glob("../content/articles/*.mdx", { query: '?raw', import: 'default', eager: true });
    allArticles = Object.entries(mdxFiles).map(([path, content]) => {
      const fileSlug = path.split('/').pop()?.replace('.mdx', '');
      const { attributes, body } = fm(content as string);
      return {
        slug: fileSlug,
        ...(attributes as any),
        body
      };
    }).filter((a: any) => a.status !== 'draft');
  }

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
    setTimeout(() => setCopied(false), 2500);
  };

  const handleNativeOrCopyShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.excerpt || article.title,
          url: fullUrl,
        });
        return;
      } catch (err) {
        // Fallback to copy link
      }
    }
    handleCopyLink();
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(fullUrl)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(article.title + ' ' + fullUrl)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(article.title)}`,
    messenger: `https://www.facebook.com/dialog/send?link=${encodeURIComponent(fullUrl)}&app_id=291494419107518&redirect_uri=${encodeURIComponent(fullUrl)}`,
    email: `mailto:?subject=${encodeURIComponent(article.title)}&body=${encodeURIComponent(fullUrl)}`
  };

  const wordCount = (article.body || article.htmlBody || "").replace(/<[^>]*>/g, '').trim().split(/\s+/).filter(Boolean).length;
  const readingMinutes = Math.max(1, Math.ceil(wordCount / 180));
  const readingTimeText = `${readingMinutes} MINUTES`;

  const formatArticleDate = (dateString?: string) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const day = d.getDate();
    const months = [
      "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
      "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
    ];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  };
  const formattedDate = formatArticleDate(article.publishedAt);
  const authorName = authorDetails?.nameMl || authorDetails?.name || article.author;

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
    <div className="article-page-container bg-white font-sans text-gray-900 min-h-screen flex flex-col selection:bg-[#c8a136]/30 selection:text-gray-900">
      {/* GLOBAL STYLES FOR ANIMATIONS & TYPOGRAPHY */}
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Anek+Malayalam:wght@300;400;500;600;700;800&family=Inter:wght@400;500;600;700&family=Noto+Sans+Malayalam:wght@400;500;600;700;800;900&family=Noto+Serif+Malayalam:wght@400;600;700&family=Poppins:wght@500;600;700&display=swap');
        
        :root {
          --font-anek-malayalam: "Anek Malayalam", sans-serif;
        }

        .font-anek-malayalam {
          font-family: "Anek Malayalam", sans-serif;
        }

        .font-poppins { font-family: 'Poppins', sans-serif; }
        .font-inter { font-family: 'Inter', sans-serif; }
        .font-malayalam { font-family: 'Anek Malayalam', 'Noto Sans Malayalam', sans-serif; }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.7s ease-out forwards;
        }

        @media print {
          nav, footer, .no-print {
            display: none !important;
          }
          body, .article-page-container {
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}} />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      {/* Reading Scroll Progress Bar */}
      <div 
        className="fixed top-0 left-0 h-1 bg-[#15664a] z-[60] transition-all duration-150 ease-out no-print"
        style={{ width: `${scrollProgress * 100}%` }}
      />

      <main className="flex-grow pb-20">
        <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-8 md:pt-12">
          
          {/* Back Navigation */}
          <div className="mb-6 no-print">
            <Link to="/articles" className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-400 hover:text-[#15664a] transition-colors font-poppins">
              <ArrowLeft className="w-4 h-4" /> Back to Articles
            </Link>
          </div>

          {/* 1. Article Title */}
          <h1 className={`font-bold text-[#111827] tracking-tight leading-[1.25] mb-4 text-balance font-anek-malayalam ${activeTheme.title}`}>
            {article.title}
          </h1>

          {/* 2. Metadata Line: Author (crimson) | DATE | 📖 X MINUTES */}
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-sm md:text-[15px] font-sans text-gray-600 mb-6">
            {authorName && (
              <>
                {authorDetails?.id ? (
                  <Link to={`/authors/${authorDetails.id}`} className="text-[#c22849] hover:underline font-semibold font-anek-malayalam transition-colors">
                    {authorName}
                  </Link>
                ) : (
                  <span className="text-[#c22849] font-semibold font-anek-malayalam">
                    {authorName}
                  </span>
                )}
                <span className="text-gray-300 font-light select-none">|</span>
              </>
            )}

            {formattedDate && (
              <>
                <span className="uppercase tracking-wider font-medium text-xs sm:text-sm text-gray-500">
                  {formattedDate}
                </span>
                <span className="text-gray-300 font-light select-none">|</span>
              </>
            )}

            <div className="inline-flex items-center gap-1.5 uppercase tracking-wider font-medium text-xs sm:text-sm text-gray-500">
              <i className="fa-solid fa-book-open text-xs text-gray-500"></i>
              <span>{readingTimeText}</span>
            </div>
          </div>

          {/* 3. Featured Cover Image */}
          {article.coverImage && (
            <div className="w-full mb-8">
              <div className="w-full rounded-xl sm:rounded-2xl overflow-hidden shadow-sm border border-gray-100 bg-gray-50">
                <OptimizedImage
                  src={article.coverImage}
                  alt={article.title}
                  priority={true}
                  className="w-full h-auto max-h-[600px] object-cover"
                />
              </div>
            </div>
          )}

          {/* 4. Lead Paragraph / Standfirst (Centered & Italic) */}
          {article.excerpt && (
            <div className="my-6 sm:my-8 px-2 sm:px-6">
              <p className="font-anek-malayalam italic text-center text-gray-700 text-base sm:text-lg md:text-[19px] leading-[1.85] sm:leading-[1.95] max-w-3xl mx-auto">
                {article.excerpt}
              </p>
            </div>
          )}

          {/* 5. Divider & Centered Social Share Buttons Row */}
          <div className="w-full my-6 no-print">
            <div className="w-full border-t border-gray-200/80 mb-6"></div>
            <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
              {/* Share / Plus */}
              <button
                type="button"
                onClick={handleNativeOrCopyShare}
                title="Share"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-[4px] bg-[#0066ff] hover:bg-[#0052cc] text-white flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm"
              >
                <i className="fa-solid fa-share-nodes text-xs sm:text-sm"></i>
              </button>

              {/* Facebook */}
              <a
                href={shareLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                title="Share on Facebook"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-[4px] bg-[#1877F2] hover:bg-[#166fe5] text-white flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm"
              >
                <i className="fa-brands fa-facebook-f text-xs sm:text-sm"></i>
              </a>

              {/* Twitter / X */}
              <a
                href={shareLinks.twitter}
                target="_blank"
                rel="noopener noreferrer"
                title="Share on X (Twitter)"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-[4px] bg-[#1DA1F2] hover:bg-[#0c85d0] text-white flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm"
              >
                <i className="fa-brands fa-x-twitter text-xs sm:text-sm"></i>
              </a>

              {/* Email */}
              <a
                href={shareLinks.email}
                title="Send via Email"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-[4px] bg-[#737373] hover:bg-[#525252] text-white flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm"
              >
                <i className="fa-solid fa-envelope text-xs sm:text-sm"></i>
              </a>

              {/* WhatsApp */}
              <a
                href={shareLinks.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                title="Share on WhatsApp"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-[4px] bg-[#25D366] hover:bg-[#20bd5a] text-white flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm"
              >
                <i className="fa-brands fa-whatsapp text-sm sm:text-base"></i>
              </a>

              {/* Telegram */}
              <a
                href={shareLinks.telegram}
                target="_blank"
                rel="noopener noreferrer"
                title="Share on Telegram"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-[4px] bg-[#229ED9] hover:bg-[#1b8bc2] text-white flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm"
              >
                <i className="fa-brands fa-telegram text-sm sm:text-base"></i>
              </a>

              {/* Messenger */}
              <a
                href={shareLinks.messenger}
                target="_blank"
                rel="noopener noreferrer"
                title="Share on Messenger"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-[4px] bg-[#0084FF] hover:bg-[#0073e6] text-white flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm"
              >
                <i className="fa-brands fa-facebook-messenger text-xs sm:text-sm"></i>
              </a>

              {/* Copy Link */}
              <button
                type="button"
                onClick={handleCopyLink}
                title={copied ? "Link Copied!" : "Copy Link"}
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-[4px] ${copied ? 'bg-emerald-600' : 'bg-[#64748b] hover:bg-[#475569]'} text-white flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm relative`}
              >
                {copied ? <i className="fa-solid fa-check text-xs"></i> : <i className="fa-solid fa-link text-xs sm:text-sm"></i>}
              </button>

              {/* Print */}
              <button
                type="button"
                onClick={handlePrint}
                title="Print Article"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-[4px] bg-[#64748b] hover:bg-[#475569] text-white flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm"
              >
                <i className="fa-solid fa-print text-xs sm:text-sm"></i>
              </button>
            </div>
          </div>

          {/* 6. Main Article Body */}
          <article 
            className="article-body font-anek-malayalam text-[#1f2937] text-[17px] sm:text-[18px] md:text-[19px] leading-[2.05] sm:leading-[2.15] tracking-normal mt-8 prose prose-lg max-w-none text-left [&_p]:mb-6 [&_p]:text-[#1f2937] [&_p]:leading-[2.05] [&_h1]:text-gray-900 [&_h2]:text-gray-900 [&_h2]:font-bold [&_h2]:text-2xl [&_h2]:sm:text-3xl [&_h2]:mt-10 [&_h2]:mb-4 [&_h3]:text-gray-900 [&_h3]:font-bold [&_h3]:text-xl [&_h3]:sm:text-2xl [&_h3]:mt-8 [&_h3]:mb-3 [&_strong]:text-gray-900 [&_strong]:font-bold [&_a]:text-[#15664a] [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-[#c22849] [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-gray-700 [&_blockquote]:my-6 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-6 [&_li]:mb-2"
            dangerouslySetInnerHTML={{ __html: article.htmlBody }}
          />

          {/* 7. Author Card Box */}
          {authorDetails && (
            <div className="mt-14 p-6 sm:p-8 bg-gray-50 rounded-xl border border-gray-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-6 no-print">
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
                <h4 className="text-xl font-bold text-[#15664a] font-anek-malayalam">
                  {authorDetails.nameMl || authorDetails.name}
                </h4>
                {authorDetails.role && (
                  <p className="text-xs text-gray-500 font-medium mt-0.5">{authorDetails.role}</p>
                )}
                {authorDetails.bio && (
                  <p className="text-sm text-gray-600 mt-2.5 leading-relaxed">{authorDetails.bio}</p>
                )}
              </div>
            </div>
          )}

          {/* 8. Related Articles */}
          {relatedArticles && relatedArticles.length > 0 && (
            <section className="w-full mt-16 md:mt-20 pt-12 border-t border-gray-200 no-print">
              <div className="flex items-center gap-4 mb-8">
                <h3 className="text-2xl font-poppins font-bold text-gray-900">Related Articles</h3>
                <div className="h-px bg-gray-200 flex-grow mt-2"></div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedArticles.map((rel: any, i: number) => (
                  <Link key={i} to={`/articles/${rel.slug}`} className="group flex flex-col bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 overflow-hidden">
                    <div className="w-full h-44 overflow-hidden bg-gray-100">
                      {rel.coverImage && (
                        <OptimizedImage src={rel.coverImage} alt={rel.title} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" />
                      )}
                    </div>
                    <div className="p-5 flex flex-col flex-grow">
                      <div className="text-xs font-bold uppercase tracking-wider text-[#c8a136] mb-2">{rel.category || 'Article'}</div>
                      <h4 className="text-base font-semibold text-gray-900 group-hover:text-[#15664a] transition-colors leading-snug mb-3 line-clamp-2 font-anek-malayalam">
                        {rel.title}
                      </h4>
                      {rel.publishedAt && (
                        <div className="mt-auto flex items-center text-xs text-gray-400 font-sans">
                          <Calendar className="w-3.5 h-3.5 mr-1.5" />
                          {formatArticleDate(rel.publishedAt)}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

        </div>
      </main>

      {/* Copy link floating feedback */}
      {copied && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white text-xs font-semibold px-4 py-2.5 rounded-md shadow-lg z-50 flex items-center gap-2 animate-fade-in-up no-print">
          <i className="fa-solid fa-check text-emerald-400"></i>
          <span>Article link copied to clipboard!</span>
        </div>
      )}
    </div>
  );
}
