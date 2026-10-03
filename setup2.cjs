const fs = require('fs');
const path = require('path');

const files = {
  "app/sanity/schema.ts": `import { defineType, defineField } from 'sanity'

export const article = defineType({
  name: 'article',
  title: 'Article',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string', title: 'Title' }),
    defineField({ name: 'slug', type: 'slug', title: 'Slug', options: { source: 'title' } }),
    defineField({ name: 'publishedAt', type: 'datetime', title: 'Published At' }),
    defineField({ name: 'excerpt', type: 'text', title: 'Excerpt' }),
    defineField({ name: 'content', type: 'array', of: [{ type: 'block' }], title: 'Content' })
  ]
})

export const video = defineType({
  name: 'video',
  title: 'Video',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string', title: 'Title' }),
    defineField({ name: 'youtubeId', type: 'string', title: 'YouTube Video ID' }),
    defineField({ name: 'publishedAt', type: 'datetime', title: 'Published At' }),
    defineField({ name: 'category', type: 'string', title: 'Category', options: { list: ['Tafsir', 'Documentary', 'Kids', 'Shorts'] } })
  ]
})

export const podcast = defineType({
  name: 'podcast',
  title: 'Podcast',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string', title: 'Title' }),
    defineField({ name: 'episodeNumber', type: 'number', title: 'Episode Number' }),
    defineField({ name: 'audioUrl', type: 'url', title: 'Audio URL' }),
    defineField({ name: 'duration', type: 'string', title: 'Duration (e.g. 45:00)' }),
    defineField({ name: 'description', type: 'text', title: 'Description' })
  ]
})

export const schemaTypes = [article, video, podcast]`,
  
  "app/sanity/sanity.config.ts": `import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './schema'

export default defineConfig({
  name: 'default',
  title: 'Samastha Graph CMS',
  projectId: 'PLACEHOLDER', 
  dataset: 'production',
  basePath: '/admin',
  plugins: [structureTool(), visionTool()],
  schema: {
    types: schemaTypes,
  },
})`,

  "app/routes/admin.$.tsx": `import type { MetaFunction } from "@remix-run/cloudflare";
import { Studio } from "sanity";
import config from "~/sanity/sanity.config";

export const meta: MetaFunction = () => {
  return [
    { title: "Admin - Samastha Graph" },
    { name: "robots", content: "noindex" }
  ];
};

export default function AdminRoute() {
  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      <Studio config={config} />
    </div>
  );
}`,

  "app/components/Header.tsx": `import { Link } from "@remix-run/react";
import { Search, Menu } from "lucide-react";
import { useState } from "react";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-brand-dark text-brand-light sticky top-0 z-50 shadow-lg border-b border-brand-olive/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center gap-3 group">
              <img src="/Logo.png" alt="Samastha Graph" className="h-12 w-auto object-contain transform group-hover:scale-105 transition-transform duration-300" />
            </Link>
          </div>
          
          <div className="hidden md:flex space-x-8 items-center">
            <Link to="/" className="text-brand-light hover:text-brand-gold transition-colors font-medium text-sm uppercase tracking-wide">Home</Link>
            <Link to="/videos" className="text-brand-light hover:text-brand-gold transition-colors font-medium text-sm uppercase tracking-wide">Videos</Link>
            <Link to="/podcasts" className="text-brand-light hover:text-brand-gold transition-colors font-medium text-sm uppercase tracking-wide">Podcasts</Link>
            <Link to="/articles" className="text-brand-light hover:text-brand-gold transition-colors font-medium text-sm uppercase tracking-wide">Articles</Link>
            <Link to="/about" className="text-brand-light hover:text-brand-gold transition-colors font-medium text-sm uppercase tracking-wide">About</Link>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <button className="text-brand-light hover:text-brand-gold transition-colors p-2 rounded-full hover:bg-brand-olive/20">
              <Search size={20} />
            </button>
            <Link to="/contact" className="bg-brand-gold text-brand-dark font-semibold px-5 py-2 rounded-full hover:bg-yellow-500 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
              Contact Us
            </Link>
          </div>

          <div className="md:hidden flex items-center">
            <button onClick={() => setMenuOpen(!menuOpen)} className="text-brand-light hover:text-brand-gold focus:outline-none p-2">
              <Menu size={24} />
            </button>
          </div>
        </div>
      </div>
      
      {menuOpen && (
        <div className="md:hidden bg-brand-dark border-t border-brand-olive">
          <div className="px-4 pt-2 pb-4 space-y-1">
            <Link to="/" className="block px-3 py-2 rounded-md text-base font-medium text-brand-light hover:text-brand-gold hover:bg-brand-olive/20">Home</Link>
            <Link to="/videos" className="block px-3 py-2 rounded-md text-base font-medium text-brand-light hover:text-brand-gold hover:bg-brand-olive/20">Videos</Link>
            <Link to="/podcasts" className="block px-3 py-2 rounded-md text-base font-medium text-brand-light hover:text-brand-gold hover:bg-brand-olive/20">Podcasts</Link>
            <Link to="/articles" className="block px-3 py-2 rounded-md text-base font-medium text-brand-light hover:text-brand-gold hover:bg-brand-olive/20">Articles</Link>
            <Link to="/about" className="block px-3 py-2 rounded-md text-base font-medium text-brand-light hover:text-brand-gold hover:bg-brand-olive/20">About</Link>
          </div>
        </div>
      )}
    </nav>
  );
}`,

  "app/components/Footer.tsx": `import { Link } from "@remix-run/react";

export function Footer() {
  return (
    <footer className="bg-[#0f4a35] text-brand-surface py-12 border-t-4 border-brand-gold">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <img src="/Logo.png" alt="Samastha Graph Logo" className="h-24 w-auto object-contain" />
            </div>
            <p className="text-sm text-brand-muted font-malayalam">ജ്ഞാന സഞ്ചാരത്തിന്റെ ദൃശ്യപ്രപഞ്ചം</p>
            <p className="text-sm">Dedicated to spreading authentic Islamic knowledge through modern media.</p>
          </div>
          <div>
            <h4 className="font-heading font-semibold text-white mb-4">Content</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/videos" className="hover:text-brand-gold transition-colors">Latest Videos</Link></li>
              <li><Link to="/podcasts" className="hover:text-brand-gold transition-colors">Audio Podcasts</Link></li>
              <li><Link to="/articles" className="hover:text-brand-gold transition-colors">Articles</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-heading font-semibold text-white mb-4">Organization</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="hover:text-brand-gold transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-brand-gold transition-colors">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-heading font-semibold text-white mb-4">Contact</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <span>Samastha Centre, Kozhikode 673006</span>
              </li>
              <li className="flex items-center gap-3">
                <span>info@samasthagraph.org</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-brand-dark mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-brand-muted">
          <p>&copy; {new Date().getFullYear()} Samastha Graph. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}`,

  "app/root.tsx": `import type { LinksFunction } from "@remix-run/cloudflare";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import stylesheet from "~/tailwind.css?url";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesheet },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
  { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Poppins:wght@500;600;700&family=Noto+Sans+Malayalam:wght@400;600&display=swap" },
  { rel: "icon", type: "image/png", href: "/Favicon.png" }
];

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {/* Render header and footer for non-admin routes. 
            Since Outlet matches routes, we can conditionally render or just render for all routes. 
            Wait, we don't want header/footer on Sanity Studio. 
            We'll handle it using an error boundary or layout route, but for simplicity we can just render Outlet inside. */}
        <Layout>
          <Outlet />
        </Layout>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  // A simple hack to hide Header/Footer on the admin route by checking window location client-side.
  // The correct Remix way is pathless layout routes, but this works quickly.
  if (typeof window !== "undefined" && window.location.pathname.startsWith('/admin')) {
    return <>{children}</>;
  }
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
}`,

  "app/routes/_index.tsx": `import type { MetaFunction } from "@remix-run/cloudflare";
import { Link } from "@remix-run/react";

export const meta: MetaFunction = () => {
  return [
    { title: "Samastha Graph | The Visual Universe of Knowledge" },
  ];
};

export default function Index() {
  return (
    <div className="bg-brand-light min-h-screen">
      {/* Hero Section */}
      <section className="bg-brand-dark text-white py-20 lg:py-32 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            Explore the <span className="text-brand-gold">Universe</span> of Knowledge.
          </h1>
          <p className="font-malayalam text-xl text-brand-surface font-medium opacity-90 mb-6">
            സമസ്ത ഗ്രാഫ് - ജ്ഞാന സഞ്ചാരത്തിന്റെ ദൃശ്യപ്രപഞ്ചം
          </p>
          <div className="flex justify-center gap-4 pt-4">
            <Link to="/videos" className="bg-brand-gold text-brand-dark font-semibold px-8 py-3 rounded-full hover:bg-yellow-500 transition-all">
              Watch Now
            </Link>
            <Link to="/podcasts" className="bg-transparent border-2 border-brand-surface text-brand-light font-semibold px-8 py-3 rounded-full hover:bg-brand-surface hover:text-brand-dark transition-all">
              Listen to Podcasts
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Section Placeholder */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="font-heading text-3xl font-bold text-brand-dark mb-4">Latest Releases</h2>
        <p className="text-brand-muted mb-8">Fresh content uploaded this week</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           {[1, 2, 3].map(i => (
             <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-brand-surface h-64 flex items-center justify-center">
                <span className="text-brand-muted">Video {i}</span>
             </div>
           ))}
        </div>
      </section>
    </div>
  );
}`,

  "app/routes/videos.tsx": `export default function Videos() { return <div className="p-12 text-center"><h1 className="text-3xl font-heading font-bold text-brand-dark">Video Archive</h1></div>; }`,
  "app/routes/podcasts.tsx": `export default function Podcasts() { return <div className="p-12 text-center"><h1 className="text-3xl font-heading font-bold text-brand-dark">Podcasts</h1></div>; }`,
  "app/routes/articles.tsx": `export default function Articles() { return <div className="p-12 text-center"><h1 className="text-3xl font-heading font-bold text-brand-dark">Articles</h1></div>; }`,
  "app/routes/about.tsx": `export default function About() { return <div className="p-12 text-center"><h1 className="text-3xl font-heading font-bold text-brand-dark">About Us</h1></div>; }`,
  "app/routes/contact.tsx": `export default function Contact() { return <div className="p-12 text-center"><h1 className="text-3xl font-heading font-bold text-brand-dark">Contact Us</h1></div>; }`
};

for (const [filepath, content] of Object.entries(files)) {
  const dirname = path.dirname(filepath);
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname, { recursive: true });
  }
  fs.writeFileSync(filepath, content);
}
console.log("UI components created.");
