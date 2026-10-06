import { json, type LoaderFunctionArgs, type MetaFunction } from "@remix-run/cloudflare";
import { useLoaderData, Link } from "@remix-run/react";
import { isMalayalam } from "~/utils/language";
import { Layers, ChevronRight } from "lucide-react";
import { getYouTubeThumbnail } from "~/utils/youtube";
import { getDbPrograms, getDbVideos } from "~/utils/db.server";

export const meta: MetaFunction = () => [
  { title: "Programs & Series • Samastha Graph" },
  { name: "description", content: "Browse all video programs and series on Samastha Graph — an editorial video platform for Islamic knowledge." },
  { tagName: "link", rel: "canonical", href: "https://samasthagraph.pages.dev/videos/programs" },
  { tagName: "link", rel: "alternate", hreflang: "ml", href: "https://samasthagraph.pages.dev/videos/programs" },
  { tagName: "link", rel: "alternate", hreflang: "en", href: "https://samasthagraph.pages.dev/en/videos/programs" },
];

export const loader = async ({ context }: LoaderFunctionArgs) => {
  const env = (context as any)?.cloudflare?.env || (context as any)?.env || (typeof process !== 'undefined' ? process.env : {});
  const [dbPrograms, dbVideos] = await Promise.all([
    getDbPrograms(env?.DB),
    getDbVideos(env?.DB)
  ]);

  let programs: any[] = [];
  let videos: any[] = [];

  if (env?.DB) {
    programs = (dbPrograms || [])
      .filter(isMalayalam)
      .filter((p: any) => p.status === "published" || !p.status);
    videos = (dbVideos || []).filter((v: any) => v.status === "published" || !v.status);
  } else {
    const programsGlob = import.meta.glob("../content/programs/*.json", { import: "default", eager: true });
    programs = Object.entries(programsGlob).map(([path, content]: any) => ({
      slug: path.split("/").pop()?.replace(".json", ""),
      ...content,
    }))
      .filter(isMalayalam)
      .filter((p: any) => p.status === "published" || !p.status);

    const videosGlob = import.meta.glob("../content/videos/*.json", { import: "default", eager: true });
    videos = Object.entries(videosGlob).map(([path, content]: any) => ({
      slug: path.split("/").pop()?.replace(".json", ""),
      ...content,
    })).filter((v: any) => v.status === "published" || !v.status);
  }

  programs.sort((a: any, b: any) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());

  if (programs.length > 0) {
    try {
      const { fetchLiveYouTubeVideos } = await import("~/utils/youtube");
      const liveVideos = await fetchLiveYouTubeVideos(programs);
      if (liveVideos.length > 0) {
        const videoMap = new Map<string, any>();
        videos.forEach(v => videoMap.set(v.slug, v));
        liveVideos.forEach(v => {
          if (!videoMap.has(v.slug) && (v.status === "published" || !v.status)) {
            videoMap.set(v.slug, v);
          }
        });
        videos = Array.from(videoMap.values());
      }
    } catch (e) {
      console.warn("Failed to fetch live YouTube playlist videos:", e);
    }
  }

  return json({ programs, videos }, {
    headers: { "Cache-Control": "public, max-age=0, must-revalidate" }
  });
};

export default function ProgramsIndex() {
  const { programs, videos } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-[#F7F5F0] font-sans text-[#18181B]">
      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E4E4E7] pb-6 mb-8">
          <div>
            <h1 className="font-heading text-3xl sm:text-4xl font-bold text-[#2D5A46]">Programs &amp; Playlists</h1>
            <p className="text-[#52525B] text-sm mt-1">Browse all curated video series, YouTube playlists, and educational series.</p>
          </div>
          <Link to="/videos" className="self-start sm:self-auto text-xs font-bold uppercase tracking-wider text-[#2D5A46] bg-white border border-[#E4E4E7] px-5 py-2.5 rounded-full hover:border-[#c8a136] hover:text-[#c8a136] transition-all inline-flex items-center gap-1.5">
            ← Back to All Videos
          </Link>
        </div>
        {programs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Layers size={48} className="text-[#2D5A46] opacity-30 mb-4" />
            <h2 className="text-xl font-heading font-bold text-[#27272A] mb-2">No programs yet</h2>
            <p className="text-[#52525B] max-w-sm">
              Published programs and series will appear here. Check back soon.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {(programs as any[]).map((program: any) => {
              const firstVideo = (videos as any[]).find((v: any) => 
                (v.programId === program.slug || v.programName === program.title || v.program === program.slug || v.program === program.title) &&
                (v.status === "published" || !v.status)
              );
              const fallbackThumbnail = firstVideo?.youtubeId ? getYouTubeThumbnail(firstVideo.youtubeId) : null;
              const displayThumbnail = program.coverImage || program.youtubeThumbnail || fallbackThumbnail;


              return (
              <Link
                key={program.slug}
                to={`/videos/programs/${program.slug}`}
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
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
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
