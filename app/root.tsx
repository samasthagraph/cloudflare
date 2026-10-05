import { json, type LinksFunction } from "@remix-run/cloudflare";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
} from "@remix-run/react";
import stylesheet from "~/tailwind.css?url";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";

export const loader = async ({ context }: any) => {
  let socialPlatforms = null;
  let podcastPlatforms = null;
  let headerSettings = null;
  let footerSettings = null;

  try {
    const socialFiles = import.meta.glob("./content/settings/social-platforms.json", { import: 'default', eager: true });
    socialPlatforms = Object.values(socialFiles)[0] || null;
  } catch (e) {
    console.error("Error loading social platforms in root loader:", e);
  }

  try {
    const podcastFiles = import.meta.glob("./content/settings/podcast-platforms.json", { import: 'default', eager: true });
    podcastPlatforms = Object.values(podcastFiles)[0] || null;
  } catch (e) {
    console.error("Error loading podcast platforms in root loader:", e);
  }

  try {
    const headerFiles = import.meta.glob("./content/settings/header.json", { import: 'default', eager: true });
    headerSettings = Object.values(headerFiles)[0] || null;
  } catch (e) {
    console.error("Error loading header settings in root loader:", e);
  }

  try {
    const footerFiles = import.meta.glob("./content/settings/footer.json", { import: 'default', eager: true });
    footerSettings = Object.values(footerFiles)[0] || null;
  } catch (e) {
    console.error("Error loading footer settings in root loader:", e);
  }

  const env = context?.cloudflare?.env || context?.env || (typeof process !== 'undefined' ? process.env : {});
  if (env?.DB) {
    try {
      const { getDbSetting } = await import("./utils/db.server");
      const [dbSocial, dbPod, dbHeader, dbFooter] = await Promise.all([
        getDbSetting(env.DB, "social-platforms").catch(() => null),
        getDbSetting(env.DB, "podcast-platforms").catch(() => null),
        getDbSetting(env.DB, "header").catch(() => null),
        getDbSetting(env.DB, "footer").catch(() => null)
      ]);
      if (dbSocial) socialPlatforms = dbSocial;
      if (dbPod) podcastPlatforms = dbPod;
      if (dbHeader) headerSettings = dbHeader;
      if (dbFooter) footerSettings = dbFooter;
    } catch (e) {
      console.warn("D1 root loader fetch warning:", e);
    }
  }

  return json({ socialPlatforms, podcastPlatforms, headerSettings, footerSettings });
};

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesheet },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
  { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+Malayalam:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap" },
  { rel: "stylesheet", href: "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" },
  { rel: "icon", type: "image/png", href: "/Favicon.png" },
  { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32x32.png" },
  { rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon-16x16.png" },
  { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" }
];

export default function App() {
  const location = useLocation();
  const isKeystatic = location.pathname.startsWith('/admin') || location.pathname.startsWith('/keystatic');
  const lang = location.pathname.startsWith('/en') ? "en" : "ml";

  return (
    <html lang={lang}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
        <Meta />
        <Links />
      </head>
      <body className="font-sans antialiased text-gray-900">
        {isKeystatic ? (
          <Outlet />
        ) : (
          <Layout>
            <Outlet />
          </Layout>
        )}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/keystatic')) {
    return <>{children}</>;
  }
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
}