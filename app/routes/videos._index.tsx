import React, { useState } from 'react';
import { OptimizedImage } from "~/components/OptimizedImage";
import { useLoaderData, Link } from "@remix-run/react";
import { json, type LoaderFunctionArgs, type MetaFunction } from "@remix-run/cloudflare";
import { isMalayalam } from "~/utils/language";
import { extractYouTubeId, getYouTubeThumbnail, fetchYouTubePlaylistVideos } from "~/utils/youtube";
import { Disc, Play, Calendar, ChevronRight, Layers, X, ExternalLink, Sparkles } from "lucide-react";
import { getDbVideos, getDbPrograms } from "~/utils/db.server";

export const meta: MetaFunction = () => {
  return [
    { title: "Videos • Samastha Graph" },
    { name: "description", content: "Watch insightful videos, lectures, and series on Samastha Graph." },
    { property: "og:title", content: "Videos • Samastha Graph" },
    { property: "og:description", content: "Watch insightful videos, lectures, and series on Samastha Graph." },
  ];
};

const themeMap: Record<string, { title: string; body: string; align: string }> = {
  'theme-malayalam-standard': {
    title: 'font-heading text-2xl md:text-3xl',
    body: 'font-sans',
    align: 'text-left'
  },
  'theme-cinematic': {
    title: 'font-poppins text-3xl md:text-4xl',
    body: 'font-inter',
    align: 'text-center'
  },
  'theme-english-minimal': {
    title: 'font-inter text-xl md:text-2xl',
    body: 'font-inter',
    align: 'text-left'
  }
};

export const loader = async ({ context }: LoaderFunctionArgs) => {
  const ctx = context as any;
  const env = ctx?.cloudflare?.env || ctx?.env || (typeof process !== 'undefined' ? process.env : {});
  const { getDbSetting } = await import("~/utils/db.server");
  const [dbVideos, dbPrograms, dbSpotlight] = await Promise.all([
    getDbVideos(env?.DB),
    getDbPrograms(env?.DB),
    getDbSetting(env?.DB, "spotlight")
  ]);

  // Load and merge static programs with D1 programs
  const programsGlob = import.meta.glob("../content/programs/*.json", { import: 'default', eager: true });
  const staticPrograms = Object.entries(programsGlob)
    .map(([path, content]: any) => ({
      slug: path.split('/').pop()?.replace('.json', ''),
      ...content,
    }));

  const progMap = new Map();
  staticPrograms.forEach((p: any) => progMap.set(p.slug, p));
  (dbPrograms || []).forEach((p: any) => progMap.set(p.slug, p));
  let programs: any[] = Array.from(progMap.values())
    .filter(isMalayalam)
    .filter((p: any) => p.status === 'published' || !p.status);

  // Load and merge static videos with D1 videos
  const jsonVideos = import.meta.glob("../content/videos/*.json", { import: 'default', eager: true });
  const mdxVideos = import.meta.glob("../content/videos/*.mdx", { query: '?raw', import: 'default', eager: true });
  const staticVideos = [
    ...Object.entries(jsonVideos).map(([path, content]: any) => ({
      slug: path.split('/').pop()?.replace('.json', ''),
      ...content
    })),
    ...Object.entries(mdxVideos).map(([path, content]: any) => ({
      slug: path.split('/').pop()?.replace('.mdx', ''),
      ...content
    }))
  ];

  const videoMap = new Map();
  staticVideos.forEach((v: any) => videoMap.set(v.slug, v));
  (dbVideos || []).forEach((v: any) => videoMap.set(v.slug, v));
  let videosData: any[] = Array.from(videoMap.values()).filter(isMalayalam);

  programs.sort((a: any, b: any) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());

  if (programs.length > 0) {
    try {
      const liveVideos = await fetchLiveYouTubeVideos(programs);
      if (liveVideos.length > 0) {
        const videoMap = new Map<string, any>();
        videosData.forEach(v => videoMap.set(v.slug, v));
        liveVideos.forEach(v => {
          if (!videoMap.has(v.slug) && isMalayalam(v) && v.status !== 'draft') {
            videoMap.set(v.slug, v);
          }
        });
        videosData = Array.from(videoMap.values());
      }
    } catch (e) {
      console.warn("Failed to fetch live YouTube videos in videos._index:", e);
    }
  }
  videosData.sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());

  // Calculate episode counts per program
  const programCounts: Record<string, number> = {};
  programs.forEach((p: any) => {
    programCounts[p.slug] = videosData.filter((v: any) => 
      (v.programId === p.slug || v.programName === p.title || v.program === p.slug || v.program === p.title) &&
      (v.status === 'published' || !v.status)
    ).length;
  });

  // Load spotlight settings
  let spotlight: any = dbSpotlight;
  if (!spotlight) {
    const spotlightGlob = import.meta.glob("../content/settings/spotlight.json", { import: 'default', eager: true });
    for (const content of Object.values(spotlightGlob)) {
      spotlight = content as any;
      break;
    }
  }

  return json({ videos: videosData, programs, programCounts, spotlight }, {
    headers: { "Cache-Control": "public, max-age=0, must-revalidate" }
  });
};

export default function Videos() {
  const { videos, programs, programCounts, spotlight } = useLoaderData<typeof loader>();

  const allVideos = (videos || []).map((v: any, index: number) => {
    const ytId = extractYouTubeId(v.youtubeId);
    const activeTheme = themeMap[v.themePreset] || themeMap['theme-malayalam-standard'];

    return {
      id: v.slug || v.id || `video-${index}`,
      youtubeId: ytId,
      title: v.title,
      theme: activeTheme,
      description: v.description || v.body || "Join us for an exclusive deep dive into the historical milestones of Samastha.",
      category: v.category || (v.programId ? (v.programId === 'minal-qalb' ? 'Minal Qalb' : v.programId === 'noorul-hira' ? 'Noorul Hira' : v.programId === 'ananthapporul' ? 'Ananthapporul' : v.programId) : "General"),
      date: v.publishedAt ? new Date(v.publishedAt).toLocaleDateString() : "Recent",
      rawDate: v.publishedAt || "1970-01-01",
      status: v.status || "published",
      customThumbnail: v.customThumbnail || null,
      slug: v.slug || v.id || `video-${index}`
    };
  });

  allVideos.sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime());

  const publishedVideos = allVideos.filter(v => v.status === 'published');
  const upcomingVideos = allVideos.filter(v => v.status === 'scheduled');

  const [activeVideoPopup, setActiveVideoPopup] = useState<any>(null);

  // Display the 8 most recent videos (arranged 4 per row)
  const recentEightVideos = publishedVideos.slice(0, 8);

  return (
    <div className="min-h-screen bg-[#eef3f1] font-sans text-gray-800 selection:bg-[#c8a136] selection:text-[#15664a]">
      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-16">

        {/* SECTION 1: 8 Most Recent Videos (4 Per Row) */}
        <section>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#c1d5cd] pb-6 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold text-[#c8a136] uppercase tracking-widest mb-2">
                <Sparkles size={16} /> Recent Releases
              </div>
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-[#15664a]">
                Recent Videos <span className="text-[#60834f] font-normal text-2xl md:text-3xl"></span>
              </h2>
              <p className="font-body text-[#60834f] mt-1">Explore our 8 most recent video podcasts and episodes.</p>
            </div>
            <div className="text-xs font-semibold text-[#15664a] bg-[#15664a]/10 px-3.5 py-1.5 rounded-full self-start md:self-auto">
              Latest {recentEightVideos.length} Episodes
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {recentEightVideos.length > 0 ? (
              recentEightVideos.map((video: any) => (
                <div
                  key={video.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-[#eef3f1] flex flex-col group block"
                >
                  {/* Video Thumbnail */}
                  <div
                    className="aspect-video relative bg-black border-b border-[#c1d5cd] overflow-hidden cursor-pointer"
                    onClick={() => setActiveVideoPopup(video)}
                  >
                    <OptimizedImage
                      src={video.customThumbnail || getYouTubeThumbnail(video.youtubeId)}
                      alt={video.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center pointer-events-none">
                      <div className="w-12 h-12 rounded-full bg-white/25 backdrop-blur-sm border border-white/60 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300 shadow-md">
                        <Play size={20} className="text-white ml-0.5" fill="currentColor" />
                      </div>
                    </div>
                  </div>

                  {/* Video Details */}
                  <div className="p-5 flex flex-col flex-grow justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2.5">
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#15664a]/5 text-[#15664a] text-xs font-semibold uppercase tracking-wider border border-[#15664a]/10">
                          {video.category}
                        </span>
                        <span className="text-[11px] text-[#7ea99a] font-body">{video.date}</span>
                      </div>
                      <Link to={`/videos/${video.slug}`} className="block mt-1">
                        <h3 className="font-heading text-base font-bold text-[#15664a] leading-snug group-hover:text-[#c8a136] transition-colors line-clamp-2">
                          {video.title}
                        </h3>
                      </Link>
                    </div>

                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-[#eef3f1]">
                      <button
                        onClick={() => setActiveVideoPopup(video)}
                        className="inline-flex items-center gap-1.5 text-xs text-[#60834f] group-hover:text-[#c8a136] font-bold transition-colors"
                      >
                        <Play size={12} fill="currentColor" /> Watch Episode
                      </button>
                      <Link
                        to={`/videos/${video.slug}`}
                        className="text-xs text-[#7ea99a] hover:text-[#15664a] font-medium transition-colors"
                      >
                        Details →
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-[#c1d5cd]">
                <Play size={40} className="text-[#15664a] opacity-30 mx-auto mb-3" />
                <h4 className="text-xl font-heading font-bold text-[#15664a]">No episodes found</h4>
                <p className="text-[#60834f] mt-1 text-sm">Published videos will appear here.</p>
              </div>
            )}
          </div>
        </section>

        {/* SECTION 2: Shows & Playlists Showcase (Same style as Podcast page shows) */}
        {programs && programs.length > 0 && (
          <section id="shows-section" className="pt-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 border-b border-[#c1d5cd] pb-6">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-bold text-[#c8a136] uppercase tracking-widest mb-2">
                  <Disc size={16} /> Shows &amp; Playlists
                </div>
                <h2 className="font-heading text-3xl md:text-4xl font-bold text-[#15664a]">
                  Featured Playlists <span className="text-[#60834f] font-normal text-2xl md:text-3xl"></span>
                </h2>
                <p className="text-[#60834f] text-sm mt-1">Browse our curated video series, YouTube playlists, and structured learning collections.</p>
              </div>
              <Link
                to="/videos/programs"
                className="self-start md:self-auto text-xs font-bold uppercase tracking-wider text-[#15664a] bg-white border border-[#c1d5cd] px-5 py-2.5 rounded-full hover:border-[#c8a136] hover:text-[#c8a136] hover:shadow-sm transition-all inline-flex items-center gap-1.5"
              >
                <Layers size={14} /> View All Playlists ({programs.length})
              </Link>
            </div>

            {/* Playlists Grid (Matching Podcast Shows Card Style) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {programs.map((program: any) => {
                const count = programCounts?.[program.slug] || 0;
                const firstVideo = videos.find((v: any) => 
                  (v.programId === program.slug || v.programName === program.title || v.program === program.slug || v.program === program.title) && 
                  (v.status === "published" || !v.status)
                );
                const fallbackThumbnail = firstVideo?.youtubeId ? getYouTubeThumbnail(firstVideo.youtubeId) : null;
                const displayThumbnail = program.coverImage || program.youtubeThumbnail || fallbackThumbnail;

                return (
                  <Link
                    key={program.slug}
                    to={`/videos/programs/${program.slug}`}
                    className="group text-left rounded-2xl p-3.5 transition-all duration-300 flex flex-col bg-white hover:bg-[#f8faf9] text-[#15664a] border border-[#c1d5cd]/60 hover:border-[#c8a136] hover:shadow-lg hover:-translate-y-1 block"
                  >
                    <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-3 bg-black/5 shadow-inner">
                      {displayThumbnail ? (
                        <img
                          src={displayThumbnail}
                          alt={program.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#15664a] to-[#0f4d38]">
                          <Play size={28} className="text-white/40" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-md bg-black/60 text-white">
                          {count > 0 ? `${count} ${count === 1 ? 'ep' : 'eps'}` : 'playlist'}
                        </span>
                      </div>
                    </div>
                    <h3 className="font-heading font-bold text-sm text-[#15664a] group-hover:text-[#c8a136] line-clamp-1 leading-snug transition-colors">
                      {program.title}
                    </h3>
                    <p className="text-[11px] text-[#7ea99a] line-clamp-1 mt-0.5">
                      {program.description || program.category || 'Curated Series'}
                    </p>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Coming Soon / Teasers if any */}
        {upcomingVideos && upcomingVideos.length > 0 && (
          <section className="pt-6">
            <div className="flex items-center justify-between border-b border-[#c1d5cd] pb-4 mb-6">
              <h3 className="font-heading text-2xl font-bold text-[#c8a136]">Coming Soon</h3>
              <span className="text-xs font-bold tracking-widest text-[#15664a] uppercase bg-[#15664a]/10 px-3 py-1 rounded-full">
                Teaser
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingVideos.map((video: any) => (
                <div
                  key={video.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[#eef3f1] flex flex-col relative opacity-90 transition-transform duration-300 hover:scale-[1.02]"
                >
                  <div className="absolute top-4 right-4 z-20 bg-[#c8a136] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg tracking-widest uppercase pointer-events-none">
                    Upcoming
                  </div>

                  <div className="aspect-video relative bg-black border-b border-[#c1d5cd]">
                    <OptimizedImage
                      src={video.customThumbnail || getYouTubeThumbnail(video.youtubeId)}
                      alt={video.title}
                      className="w-full h-full object-cover grayscale-[20%]"
                    />
                  </div>

                  <div className="p-5 flex flex-col flex-grow bg-slate-50">
                    <div className="flex justify-between items-start mb-2">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#15664a]/5 text-[#15664a] text-xs font-semibold uppercase tracking-wider">
                        {video.category}
                      </span>
                    </div>
                    <Link to={`/videos/${video.slug}`} className="block mt-1">
                      <h4 className="font-heading text-base font-bold text-[#15664a] leading-snug line-clamp-2 hover:text-[#c8a136] transition-colors">
                        {video.title}
                      </h4>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      </main>

      {/* Video Popup Modal */}
      {activeVideoPopup && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 sm:p-6 lg:p-8"
          onClick={() => setActiveVideoPopup(null)}
        >
          <div
            className="w-full max-w-5xl bg-black rounded-2xl overflow-hidden shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveVideoPopup(null)}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 hover:bg-[#c8a136] text-white rounded-full flex items-center justify-center transition-colors shadow-lg backdrop-blur"
              aria-label="Close video"
            >
              <X size={20} />
            </button>
            <div className="aspect-video w-full">
              <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${activeVideoPopup.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
                title={activeVideoPopup.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            <div className="p-4 bg-gray-900 border-t border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-white font-bold line-clamp-1 text-sm sm:text-base">{activeVideoPopup.title}</h3>
              <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap justify-end">
                <a
                  href={`https://www.youtube.com/watch?v=${activeVideoPopup.youtubeId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 bg-white/10 text-white rounded font-semibold text-xs sm:text-sm hover:bg-white/20 transition-colors whitespace-nowrap inline-flex items-center gap-1.5"
                >
                  <ExternalLink size={14} /> YouTube
                </a>
                <Link
                  to={`/videos/${activeVideoPopup.slug}`}
                  className="px-4 py-2 bg-[#c8a136] text-white rounded font-bold text-xs sm:text-sm hover:bg-yellow-600 transition-colors whitespace-nowrap"
                  onClick={() => setActiveVideoPopup(null)}
                >
                  View Details
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}