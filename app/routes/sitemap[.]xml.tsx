import { type LoaderFunctionArgs } from "@remix-run/cloudflare";
import fm from "front-matter";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const origin = "https://samasthagraph.pages.dev"; // Approved canonical origin

  // Static routes (Malayalam)
  const staticMl = ["", "/about", "/contact", "/profile", "/videos", "/videos/programs", "/podcasts", "/articles"];
  
  // Static routes (English)
  const staticEn = ["/en", "/en/about", "/en/contact", "/en/profile", "/en/videos", "/en/videos/programs", "/en/podcasts", "/en/articles"];


  // Dynamic content
  const videosGlob = import.meta.glob("../content/videos/*.json", { eager: true, import: 'default' });
  const podcastsGlob = import.meta.glob("../content/podcasts/*.json", { eager: true, import: 'default' });
  
  // MDX content
  const articlesGlob = import.meta.glob("../content/articles/*.mdx", { query: '?raw', eager: true, import: 'default' });
  const mdxVideosGlob = import.meta.glob("../content/videos/*.mdx", { query: '?raw', eager: true, import: 'default' });

  // Programs (Phase 2)
  const programsGlob = import.meta.glob("../content/programs/*.json", { eager: true, import: 'default' });


  const extractJsonSlugs = (glob: any) => {
    return Object.entries(glob)
      .filter(([_, content]: any) => content && content.status !== "draft")
      .map(([path, content]: any) => {
        const slug = path.split('/').pop()?.replace('.json', '');
        const isEn = content.language === 'en';
        return { slug, isEn };
      });
  };

  const extractMdxSlugs = (glob: any) => {
    return Object.entries(glob)
      .map(([path, content]: any) => {
        const slug = path.split('/').pop()?.replace('.mdx', '');
        const { attributes } = fm(content as string);
        return { slug, attributes };
      })
      .filter(({ attributes }: any) => attributes && attributes.status !== "draft")
      .map(({ slug, attributes }: any) => {
        const isEn = attributes.language === 'en';
        return { slug, isEn };
      });
  };

  const videoRecords = [...extractJsonSlugs(videosGlob), ...extractMdxSlugs(mdxVideosGlob)];
  const podcastRecords = extractJsonSlugs(podcastsGlob);
  const articleRecords = extractMdxSlugs(articlesGlob);

  const programRecords = Object.entries(programsGlob)
    .filter(([_, c]: any) => c && c.status !== 'draft' && c.status !== 'scheduled')
    .map(([path, c]: any) => ({
      slug: path.split('/').pop()?.replace('.json', ''),
      isEn: c.language === 'en'
    }));


  const generateDynamicUrls = (records: any[], basePath: string) => {
    return records.map(record => {
      const prefix = record.isEn ? "/en" : "";
      return `${origin}${prefix}/${basePath}/${record.slug}`;
    });
  };

  const allUrls = [
    ...staticMl.map(path => `${origin}${path}`),
    ...staticEn.map(path => `${origin}${path}`),
    ...generateDynamicUrls(videoRecords, "videos"),
    ...generateDynamicUrls(podcastRecords, "podcasts"),
    ...generateDynamicUrls(articleRecords, "articles"),
    ...generateDynamicUrls(programRecords, "videos/programs"),
  ];


  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
  ${allUrls
    .map(
      url => `
  <url>
    <loc>${url}</loc>
  </url>`
    )
    .join("")}
</urlset>
`;

  return new Response(sitemap, {
    status: 200,
    headers: {
      "Content-Type": "application/xml",
      "xml-version": "1.0",
      "encoding": "UTF-8"
    }
  });
};
