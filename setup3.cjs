const fs = require('fs');
const path = require('path');

const files = {
  "keystatic.config.ts": `import { config, fields, collection } from '@keystatic/core';

export default config({
  // Use GitHub in production, local in dev
  storage: process.env.NODE_ENV === 'development' 
    ? { kind: 'local' }
    : {
        kind: 'github',
        repo: 'samasthagraph/cloudflare'
      },
  ui: {
    brand: { name: 'Samastha Graph CMS' }
  },
  collections: {
    articles: collection({
      label: 'Articles',
      slugField: 'title',
      path: 'app/content/articles/*',
      format: { data: 'json' },
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        publishedAt: fields.date({ label: 'Published At' }),
        excerpt: fields.text({ label: 'Excerpt', multiline: true }),
        content: fields.text({ label: 'Content (Markdown)', multiline: true }),
      },
    }),
    videos: collection({
      label: 'Videos',
      slugField: 'title',
      path: 'app/content/videos/*',
      format: { data: 'json' },
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        youtubeId: fields.text({ label: 'YouTube Video ID' }),
        publishedAt: fields.date({ label: 'Published At' }),
        category: fields.select({
          label: 'Category',
          options: [
            { label: 'Tafsir', value: 'Tafsir' },
            { label: 'Documentary', value: 'Documentary' },
            { label: 'Kids', value: 'Kids' },
            { label: 'Shorts', value: 'Shorts' }
          ],
          defaultValue: 'Tafsir'
        })
      }
    }),
    podcasts: collection({
      label: 'Podcasts',
      slugField: 'title',
      path: 'app/content/podcasts/*',
      format: { data: 'json' },
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        episodeNumber: fields.integer({ label: 'Episode Number' }),
        audioUrl: fields.url({ label: 'Audio URL' }),
        duration: fields.text({ label: 'Duration (e.g. 45:00)' }),
        description: fields.text({ label: 'Description', multiline: true })
      }
    })
  },
});`,
  "app/routes/keystatic.$.tsx": `import { makePage } from "@keystatic/remix/ui";
import config from "../../keystatic.config";

export default makePage(config);`,
  "app/routes/api.keystatic.$.tsx": `import { handleLoader } from "@keystatic/remix/api";
import config from "../../keystatic.config";

export const loader = (args: any) => handleLoader({ config }, args);
export const action = (args: any) => handleLoader({ config }, args);`,
  "app/routes/videos.tsx": `import { useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/cloudflare";

export const loader = async () => {
  const videoFiles = import.meta.glob('../content/videos/*.json', { eager: true });
  const videos = Object.keys(videoFiles).map((key) => {
    return {
      slug: key.split('/').pop()?.replace('.json', ''),
      ...(videoFiles[key] as any).default
    };
  });
  return json({ videos });
};

export default function Videos() {
  const { videos } = useLoaderData<typeof loader>();
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-heading font-bold text-brand-dark mb-8">Video Archive</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {videos.map((video: any) => (
          <div key={video.slug} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-brand-surface group">
            <div className="relative aspect-video overflow-hidden bg-brand-surface flex items-center justify-center">
               <img src={\`https://img.youtube.com/vi/\${video.youtubeId}/mqdefault.jpg\`} alt={video.title} className="w-full h-full object-cover" />
            </div>
            <div className="p-6">
              <span className="text-xs font-bold text-brand-olive bg-brand-olive/10 px-2 py-1 rounded">{video.category}</span>
              <h3 className="font-heading font-bold text-lg text-brand-dark mt-2 mb-2 line-clamp-2">{video.title}</h3>
              <p className="text-xs text-brand-muted">{video.publishedAt}</p>
            </div>
          </div>
        ))}
        {videos.length === 0 && <p className="text-brand-muted">No videos published yet.</p>}
      </div>
    </div>
  );
}`,
  "app/routes/podcasts.tsx": `import { useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/cloudflare";

export const loader = async () => {
  const files = import.meta.glob('../content/podcasts/*.json', { eager: true });
  const podcasts = Object.keys(files).map((key) => {
    return {
      slug: key.split('/').pop()?.replace('.json', ''),
      ...(files[key] as any).default
    };
  });
  return json({ podcasts });
};

export default function Podcasts() {
  const { podcasts } = useLoaderData<typeof loader>();
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-heading font-bold text-brand-dark mb-8">Podcasts</h1>
      <div className="space-y-4">
        {podcasts.map((podcast: any) => (
          <div key={podcast.slug} className="group flex items-center gap-4 p-4 rounded-xl bg-white border border-brand-surface shadow-sm">
             <div className="flex-grow">
               <h4 className="font-semibold text-brand-dark">Episode {podcast.episodeNumber}: {podcast.title}</h4>
               <p className="text-sm text-brand-muted">{podcast.description}</p>
               <audio controls src={podcast.audioUrl} className="mt-2 w-full h-8" />
             </div>
             <div className="hidden sm:block text-sm text-brand-muted font-medium">{podcast.duration}</div>
          </div>
        ))}
        {podcasts.length === 0 && <p className="text-brand-muted">No podcasts published yet.</p>}
      </div>
    </div>
  );
}`,
  "app/routes/articles.tsx": `import { useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/cloudflare";

export const loader = async () => {
  const files = import.meta.glob('../content/articles/*.json', { eager: true });
  const articles = Object.keys(files).map((key) => {
    return {
      slug: key.split('/').pop()?.replace('.json', ''),
      ...(files[key] as any).default
    };
  });
  return json({ articles });
};

export default function Articles() {
  const { articles } = useLoaderData<typeof loader>();
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-heading font-bold text-brand-dark mb-8">Articles</h1>
      <div className="space-y-6">
        {articles.map((article: any) => (
          <article key={article.slug} className="p-6 bg-white rounded-2xl shadow-sm border border-brand-surface">
            <h2 className="text-2xl font-bold text-brand-dark">{article.title}</h2>
            <p className="text-sm text-brand-muted mb-4">{article.publishedAt}</p>
            <p className="text-gray-600 mb-4">{article.excerpt}</p>
            <div className="prose prose-brand max-w-none whitespace-pre-wrap">{article.content}</div>
          </article>
        ))}
        {articles.length === 0 && <p className="text-brand-muted">No articles published yet.</p>}
      </div>
    </div>
  );
}`
};

for (const [filepath, content] of Object.entries(files)) {
  const dirname = path.dirname(filepath);
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname, { recursive: true });
  }
  fs.writeFileSync(filepath, content);
}
console.log("Keystatic and route updates generated.");
