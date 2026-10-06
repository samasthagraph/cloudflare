import { json, type LoaderFunctionArgs, type MetaFunction } from "@remix-run/cloudflare";
import fm from "front-matter";
import { isEnglish } from "~/utils/language";
import ArticlesIndex, { meta as originalMeta } from "./articles._index";
import { getDbArticles } from "~/utils/db.server";

export const meta: MetaFunction = originalMeta;

export const loader = async ({ context }: LoaderFunctionArgs) => {
  const env = (context as any)?.cloudflare?.env || (context as any)?.env || (typeof process !== 'undefined' ? process.env : {});
  const dbArticles = await getDbArticles(env?.DB);

  let articlesData: any[] = [];
  if (env?.DB) {
    articlesData = (dbArticles || []).filter((a: any) => a.status !== 'draft' && isEnglish(a));
  } else {
    const mdxFiles = import.meta.glob("../content/articles/*.mdx", { query: '?raw', import: 'default', eager: true });
    articlesData = Object.entries(mdxFiles).map(([path, content]) => {
      const slug = path.split('/').pop()?.replace('.mdx', '');
      const { attributes } = fm(content as string);
      return {
        slug,
        ...(attributes as any)
      };
    }).filter((a: any) => a.status !== 'draft' && isEnglish(a));
  }

  articlesData.sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());

  return json({ articles: articlesData }, {
    headers: { "Cache-Control": "public, max-age=0, must-revalidate" }
  });
};

export default ArticlesIndex;

