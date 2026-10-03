import { json } from "@remix-run/cloudflare";
import fm from "front-matter";
import { isEnglish } from "~/utils/language";
import ArticlesIndex from "./articles._index";

export const loader = async () => {
  const mdxFiles = import.meta.glob("../content/articles/*.mdx", { query: '?raw', import: 'default', eager: true });
  
  const articlesData = Object.entries(mdxFiles).map(([path, content]) => {
    const slug = path.split('/').pop()?.replace('.mdx', '');
    const { attributes } = fm(content as string);
    return {
      slug,
      ...(attributes as any)
    };
  }).filter((a: any) => a.status !== 'draft' && isEnglish(a));

  const articles = articlesData.sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());

  return json({ articles });
};

export default ArticlesIndex;
