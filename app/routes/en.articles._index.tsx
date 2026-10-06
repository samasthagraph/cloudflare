import { json, type LoaderFunctionArgs, type MetaFunction } from "@remix-run/cloudflare";
import fm from "front-matter";
import { isEnglish } from "~/utils/language";
import ArticlesIndex, { meta as originalMeta } from "./articles._index";
import { getDbArticles } from "~/utils/db.server";

export const meta: MetaFunction = originalMeta;

export const loader = async ({ context }: LoaderFunctionArgs) => {
  const env = (context as any)?.cloudflare?.env || (context as any)?.env || (typeof process !== 'undefined' ? process.env : {});
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
    .filter((a: any) => a.status !== 'draft' && isEnglish(a))
    .sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());

  return json({ articles: articlesData }, {
    headers: { "Cache-Control": "public, max-age=0, must-revalidate" }
  });
};

export default ArticlesIndex;

