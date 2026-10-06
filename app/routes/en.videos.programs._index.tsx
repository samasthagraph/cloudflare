import { json, type LoaderFunctionArgs, type MetaFunction } from "@remix-run/cloudflare";
import { useLoaderData, Link } from "@remix-run/react";
import { isEnglish } from "~/utils/language";
import { Layers, ChevronRight } from "lucide-react";
import { getYouTubeThumbnail } from "~/utils/youtube";
import { CompactHero } from "~/components/CompactHero";
import { getDbPrograms, getDbVideos } from "~/utils/db.server";

export const meta: MetaFunction = () => [
  { title: "Programs & Series • Samastha Graph" },
  { name: "description", content: "Browse all English video programs and series on Samastha Graph." },
  { tagName: "link", rel: "canonical", href: "https://samasthagraph.pages.dev/en/videos/programs" },
  { tagName: "link", rel: "alternate", hreflang: "en", href: "https://samasthagraph.pages.dev/en/videos/programs" },
  { tagName: "link", rel: "alternate", hreflang: "ml", href: "https://samasthagraph.pages.dev/videos/programs" },
];

export const loader = async ({ context }: LoaderFunctionArgs) => {
  const env = (context as any)?.cloudflare?.env || (context as any)?.env || (typeof process !== 'undefined' ? process.env : {});
  const [dbPrograms, dbVideos] = await Promise.all([
    getDbPrograms(env?.DB),
    getDbVideos(env?.DB)
  ]);

  const programsGlob = import.meta.glob("../content/programs/*.json", { import: "default", eager: true });
  const staticPrograms = Object.entries(programsGlob).map(([path, content]: any) => ({
    slug: path.split("/").pop()?.replace(".json", ""),
    ...content,
  }));

  const programMap = new Map<string, any>();
  staticPrograms.forEach(p => { if (p.slug) programMap.set(p.slug, p); });
  dbPrograms.forEach(p => { if (p.slug) programMap.set(p.slug, p); });

  const programs = Array.from(programMap.values())
    .filter(isEnglish)
    .filter((p: any) => p.status === "published")
    .sort((a: any, b: any) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());

  const videosGlob = import.meta.glob("../content/videos/*.json", { import: "default", eager: true });
  const staticVideos = Object.entries(videosGlob).map(([path, content]: any) => ({
    slug: path.split("/").pop()?.replace(".json", ""),
    ...content,
  }));

  const videoMap = new Map<string, any>();
  staticVideos.forEach(v => { if (v.slug) videoMap.set(v.slug, v); });
  dbVideos.forEach(v => { if (v.slug) videoMap.set(v.slug, v); });

  const videos = Array.from(videoMap.values()).filter((v: any) => v.status === "published");

  return json({ programs, videos }, {
    headers: { "Cache-Control": "public, max-age=0, must-revalidate" }
  });
};

export default function EnProgramsIndex() {
  const { programs, videos } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-[#F7F5F0] font-sans text-[#18181B]">
      {/* Home-styled Programs & Series Hero */}
      <CompactHero
        eyebrow="English Video Collections"
        title={<>Programs &amp; <span className="text-[#c8a136]">Series</span>.</>}
        subtitle="Curated Series, Thematic Playlists, and Comprehensive Educational Content"
        description="Explore structured video learning series and YouTube playlist collections from Samastha Graph in English."
        actions={
          <div className="flex flex-wrap gap-4 pt-2">
            <Link to="/en/videos" className="bg-[#c8a136] text-[#15664a] font-bold px-8 py-3.5 rounded-full hover:bg-yellow-500 transition-all shadow-lg shadow-[#c8a136]/20 inline-flex items-center gap-2 text-sm uppercase tracking-wider">
              ← Back to All Videos
            </Link>
            <Link
              to="/videos/programs"
              className="bg-transparent border border-white/40 text-white font-bold px-6 py-3.5 rounded-full hover:bg-white/10 transition-colors inline-flex items-center text-sm"
            >
              View Malayalam Programs
            </Link>
          </div>
        }
        align="left"
        sideContent={
          programs.length > 0 ? (
            <Link to={`/en/videos/programs/${programs[0].slug}`} className="relative group cursor-pointer block w-full text-left">
              <div className="absolute inset-0 bg-[#c8a136] rounded-2xl transform rotate-3 scale-105 opacity-20 transition-transform group-hover:rotate-6"></div>
              <div className="relative bg-black border border-[#2D5A46] rounded-2xl overflow-hidden shadow-2xl aspect-video flex items-center justify-center">
                {programs[0].coverImage || programs[0].youtubeThumbnail ? (
                  <img src={programs[0].coverImage || programs[0].youtubeThumbnail} alt={programs[0].title} className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity" />
                ) : (
                  <div className="w-full h-full bg-[#133022] flex items-center justify-center">
                    <span className="text-[#c8a136] text-xl font-bold">Featured Playlist</span>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/40 to-transparent">
                  <span className="bg-[#15664a] text-white text-xs font-bold px-2.5 py-1 rounded mb-2 inline-block uppercase">Featured Series</span>
                  <h3 className="font-heading font-bold text-lg text-white line-clamp-1">{programs[0].title}</h3>
                </div>
              </div>
            </Link>
          ) : null
        }
      />

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {programs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Layers size={48} className="text-[#2D5A46] opacity-30 mb-4" />
            <h2 className="text-xl font-heading font-bold text-[#27272A] mb-2">No English programs yet</h2>
            <p className="text-[#52525B] max-w-sm mb-6">
              English programs and series will appear here once published.
            </p>
            <Link
              to="/videos/programs"
              className="inline-flex items-center gap-2 text-[#2D5A46] font-semibold hover:underline"
            >
              <ChevronRight className="rotate-180" size={16} /> Browse Malayalam Programs
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {(programs as any[]).map((program: any) => {
              const firstVideo = (videos as any[]).find((v: any) => v.programId === program.slug);
              const fallbackThumbnail = firstVideo?.youtubeId ? getYouTubeThumbnail(firstVideo.youtubeId) : null;
              const displayThumbnail = program.coverImage || program.youtubeThumbnail || fallbackThumbnail;

              return (
              <Link
                key={program.slug}
                to={`/en/videos/programs/${program.slug}`}
                className="group bg-white rounded-2xl overflow-hidden border border-[#E4E4E7] shadow-sm hover:shadow-lg hover:border-[#2D5A46]/40 transition-all duration-300"
              >
                {/* Cover Image */}
                <div className="aspect-video bg-[#2D5A46]/10 relative overflow-hidden">
                  {displayThumbnail ? (
                    <img
                      src={displayThumbnail}
                      alt={program.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#2D5A46] to-[#15664a]">
                      <Layers size={36} className="text-white/40" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  {program.category && (
                    <span className="inline-block text-xs font-semibold px-2 py-1 bg-[#2D5A46]/10 text-[#2D5A46] rounded-full mb-2">
                      {program.category}
                    </span>
                  )}
                  <h2 className="font-heading font-bold text-[#18181B] text-base leading-snug break-words group-hover:text-[#2D5A46] transition-colors line-clamp-2">
                    {program.title}
                  </h2>
                  {program.description && (
                    <p className="text-sm text-[#52525B] mt-2 line-clamp-2 leading-relaxed">
                      {program.description}
                    </p>
                  )}
                  <div className="mt-3 flex items-center gap-1 text-sm font-semibold text-[#2D5A46] group-hover:gap-2 transition-all">
                    <span>Watch Series</span>
                    <ChevronRight size={16} />
                  </div>
                </div>
              </Link>
            );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
