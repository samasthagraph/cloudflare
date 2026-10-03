import { json, type LoaderFunctionArgs, type MetaFunction } from "@remix-run/cloudflare";
import { marked } from "marked";
import fm from "front-matter";
import { isEnglish } from "~/utils/language";
import { getDbArticles, getDbAuthors } from "~/utils/db.server";
import ArticlePage, { meta as originalMeta } from "./articles.$slug";

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
  const articlesData = allArticles.filter((a: any) => isEnglish(a));

  const article = articlesData.find(a => a.slug === slug);

  if (!article) {
    throw new Response("Not Found", { status: 404 });
  }

  // Convert markdown body to HTML
  const htmlBody = marked.parse(article.body || "");

  let counterpartSlug = null;
  if (article.translationGroupId) {
    const counterpart = allArticles.find((a: any) => 
      a.translationGroupId === article.translationGroupId && a.slug !== article.slug && !isEnglish(a)
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
  });
};

export const meta: MetaFunction<typeof loader> = originalMeta as any;

export default ArticlePage;
