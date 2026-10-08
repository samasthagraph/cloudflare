import React, { useState } from "react";
import { json, type MetaFunction } from "@remix-run/cloudflare";
import { useLoaderData, Link, useRouteError, isRouteErrorResponse } from "@remix-run/react";
import { isMalayalam } from "~/utils/language";
import { Layers, ChevronRight, Play, Calendar, ExternalLink, X } from "lucide-react";
import { extractYouTubeId, extractYouTubePlaylistId, getYouTubeThumbnail, fetchYouTubePlaylistVideos } from "~/utils/youtube";

export const meta: MetaFunction<typeof loader> = ({ data }: any) => {
  if (!data || !data.program) {
    return [{ title: "Program Not Found • Samastha Graph" }];
  }
  const { program, enCounterpartSlug } = data;
  const canonical = `https://samasthagraph.pages.dev/videos/programs/${program.slug}`;
  return [
    { title: `${program.title} • Samastha Graph` },
    { name: "description", content: program.description?.substring(0, 160) || `Watch the ${program.title} series on Samastha Graph.` },
    { tagName: "link", rel: "canonical", href: canonical },
    { tagName: "link", rel: "alternate", hreflang: "ml", href: canonical },
    { tagName: "link", rel: "alternate", hreflang: "x-default", href: canonical },
    ...(enCounterpartSlug ? [
      { tagName: "link", rel: "alternate", hreflang: "en", href: `https://samasthagraph.pages.dev/en/videos/programs/${enCounterpartSlug}` }
    ] : []),
  ] as any;
};

import { getDbPrograms, getDbVideos } from "~/utils/db.server";

export const loader = async ({ params, context }: any) => {
  const { slug } = params;
  const env = context?.cloudflare?.env || context?.env || (typeof process !== 'undefined' ? process.env : {});
  const [dbPrograms, dbVideos] = await Promise.all([
    getDbPrograms(env?.DB),
    getDbVideos(env?.DB)
  ]);

  // Load and merge static programs with D1 programs
  const programsGlob = import.meta.glob("../content/programs/*.json", { import: "default", eager: true });
  const staticPrograms = Object.entries(programsGlob).map(([path, content]: any) => ({
    slug: path.split("/").pop()?.replace(".json", ""),
    ...content,
  }));

  const progMap = new Map();
  staticPrograms.forEach((p: any) => progMap.set(p.slug, p));
  (dbPrograms || []).forEach((p: any) => progMap.set(p.slug, p));
  const allPrograms = Array.from(progMap.values());

  // Load and merge static videos with D1 videos
  const videosGlob = import.meta.glob("../content/videos/*.json", { import: "default", eager: true });
  const staticVideos = Object.entries(videosGlob).map(([path, content]: any) => ({
    slug: path.split("/").pop()?.replace(".json", ""),
    ...content,
  }));

  const videoMap = new Map();
  staticVideos.forEach((v: any) => videoMap.set(v.slug, v));
  (dbVideos || []).forEach((v: any) => videoMap.set(v.slug, v));
  const allVideos = Array.from(videoMap.values());

  // Find the matching Malayalam published program
  const program = allPrograms.find((p: any) => 
    p.slug === slug && 
    isMalayalam(p) && 
    (p.status === "published" || !p.status)
  );

  if (!program) {
    throw new Response(null, { status: 404 });
  }

  // Load videos belonging to this program
  let episodeVideos = allVideos
    .filter((v: any) => 
      isMalayalam(v) && 
      (v.status === "published" || !v.status) && 
      (v.programId === program.slug || v.programName === program.title || v.program === program.slug || v.program === program.title)
    );

  // If program has a YouTube playlist ID, dynamically fetch any additional videos from the YouTube playlist feed
  if (program.youtubePlaylistId) {
    try {
      const feedVideos = await fetchYouTubePlaylistVideos(
        program.youtubePlaylistId,
        program.slug,
        program.category,
        program.language || 'ml'
      );
      if (feedVideos.length > 0) {
        const existingYtIds = new Set(episodeVideos.map((v: any) => extractYouTubeId(v.youtubeId)));
        for (const fv of feedVideos) {
          if (!existingYtIds.has(fv.youtubeId)) {
            episodeVideos.push(fv);
            existingYtIds.add(fv.youtubeId);
          }
        }
      }
    } catch (e) {
      console.warn("Could not fetch real-time YouTube playlist feed:", e);
    }
  }

  // Episode ordering: episodeNumber asc → publishedAt asc → slug alpha
  episodeVideos.sort((a: any, b: any) => {
    const epA = typeof a.episodeNumber === "number" ? a.episodeNumber : Infinity;
    const epB = typeof b.episodeNumber === "number" ? b.episodeNumber : Infinity;
    if (epA !== epB) return epA - epB;
    const dateA = new Date(a.publishedAt || "1970-01-01").getTime();
    const dateB = new Date(b.publishedAt || "1970-01-01").getTime();
    if (dateA !== dateB) return dateA - dateB;
    return (a.slug || "").localeCompare(b.slug || "");
  });

  // Find English counterpart via translationGroupId
  let enCounterpartSlug: string | null = null;
  if (program.translationGroupId) {
    const enCounterpart = allPrograms.find((p: any) =>
      p.translationGroupId === program.translationGroupId &&
      p.slug !== program.slug &&
      !isMalayalam(p) &&
      (p.status === "published" || !p.status)
    );
    if (enCounterpart) enCounterpartSlug = enCounterpart.slug;
  }

  return json(
    { program, episodes: episodeVideos, enCounterpartSlug },
    {
      headers: {
        "Cache-Control": "public, max-age=0, must-revalidate",
      },
    }
  );
};

export default function ProgramDetail() {
  const { program, episodes, enCounterpartSlug } = useLoaderData<typeof loader>() as any;
  const [activeVideoPopup, setActiveVideoPopup] = useState<any>(null);

  const playlistId = extractYouTubePlaylistId(program.youtubePlaylistId);
  const fallbackThumbnail = episodes.length > 0 && episodes[0].youtubeId ? getYouTubeThumbnail(episodes[0].youtubeId) : null;
  const displayThumbnail = program.coverImage || program.youtubeThumbnail || fallbackThumbnail;

  return (
    <div className="min-h-screen bg-[#F7F5F0] font-sans text-[#18181B]">
      {/* Hero */}
      <div className="bg-[#18181B] text-white pt-10 pb-14 relative overflow-hidden">
        {displayThumbnail ? (
          <>
            <div
              className="absolute inset-0 bg-center bg-cover bg-no-repeat opacity-25 blur-sm scale-105 pointer-events-none"
              style={{ backgroundImage: `url(${displayThumbnail})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#18181B]/60 to-[#18181B]/90 pointer-events-none" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#2D5A46] to-[#18181B] pointer-events-none" />
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm font-semibold text-white/50 uppercase tracking-wider mb-6">
            <Link to="/videos" className="hover:text-white transition-colors">Videos</Link>
            <ChevronRight size={14} />
            <Link to="/videos/programs" className="hover:text-white transition-colors">Programs</Link>
            <ChevronRight size={14} />
            <span className="text-white/80 truncate max-w-[200px]">{program.title}</span>
          </div>

          <div className="flex flex-col lg:flex-row gap-10 items-start">
            {/* Cover / Interactive Player */}
            <div className="w-full lg:w-96 flex-shrink-0">
              {episodes.length > 0 && episodes[0].youtubeId ? (
                <div className="w-full aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black relative group">
                  <iframe
                    className="w-full h-full"
                    src={playlistId ? `https://www.youtube.com/embed?listType=playlist&list=${playlistId}` : `https://www.youtube.com/embed/${episodes[0].youtubeId}`}
                    title={program.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : displayThumbnail ? (
                <div className="aspect-video lg:aspect-square rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                  <img src={displayThumbnail} alt={program.title} className="w-full h-full object-cover" />
                </div>
              ) : null}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              {program.category && (
                <span className="inline-block text-xs font-semibold px-3 py-1 bg-[#2D5A46]/80 text-white rounded-full mb-4">
                  {program.category}
                </span>
              )}
              <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight break-words mb-4">
                {program.title}
              </h1>
              {program.description && (
                <p className="text-white/70 text-lg max-w-2xl leading-relaxed">{program.description}</p>
              )}
              
              {/* Hero Action Buttons */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                {episodes.length > 0 && (
                  <Link
                    to={`/videos/${episodes[0].slug}`}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#c8a136] hover:bg-[#b08d2b] text-[#18181B] font-bold rounded-xl shadow-lg hover:shadow-xl transition-all text-sm group"
                  >
                    <Play size={18} fill="currentColor" className="group-hover:scale-110 transition-transform" />
                    <span>Watch Series (Start Episode 1)</span>
                  </Link>
                )}
                {playlistId && (
                  <a
                    href={`https://www.youtube.com/playlist?list=${playlistId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-sm font-medium transition-colors"
                  >
                    <ExternalLink size={15} /> Open YouTube Playlist
                  </a>
                )}
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-white/60 border-t border-white/10 pt-4">
                <span className="flex items-center gap-1.5 font-medium text-white/90">
                  <Layers size={16} /> {episodes.length} {episodes.length === 1 ? "Episode" : "Episodes"}
                </span>
                {program.publishedAt && (
                  <span className="flex items-center gap-1.5">
                    <Calendar size={14} /> {new Date(program.publishedAt).toLocaleDateString()}
                  </span>
                )}
                {/* Language switcher */}
                {enCounterpartSlug ? (
                  <Link
                    to={`/en/videos/programs/${enCounterpartSlug}`}
                    className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full text-white/80 hover:text-white transition-colors font-medium text-xs"
                  >
                    View in English
                  </Link>
                ) : (
                  <Link
                    to="/en/videos/programs"
                    className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full text-white/80 hover:text-white transition-colors font-medium text-xs"
                  >
                    English Programs
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Episodes List */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8 border-l-4 border-[#2D5A46] pl-4">
          <h2 className="font-heading text-2xl font-bold text-[#18181B]">
            All Episodes &amp; Playlist Videos
          </h2>
          <span className="text-sm font-semibold text-[#2D5A46] bg-[#2D5A46]/10 px-3 py-1 rounded-full">
            {episodes.length} Available
          </span>
        </div>

        {episodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-[#E4E4E7]">
            <Play size={40} className="text-[#2D5A46] opacity-30 mb-4" />
            <h3 className="text-lg font-heading font-bold text-[#27272A] mb-2">No episodes found</h3>
            <p className="text-[#52525B] max-w-sm">
              Please check back soon or verify that the YouTube playlist is set to public.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(episodes as any[]).map((episode: any, idx: number) => {
              const ytId = extractYouTubeId(episode.youtubeId);
              const thumbUrl = episode.customThumbnail || (ytId ? getYouTubeThumbnail(ytId) : null);

              return (
                <div
                  key={episode.slug || episode.youtubeId || idx}
                  className="group bg-white rounded-2xl border border-[#E4E4E7] shadow-sm hover:shadow-xl hover:border-[#2D5A46]/40 transition-all duration-300 flex flex-col overflow-hidden"
                >
                  {/* Thumbnail / Link */}
                  <Link
                    to={`/videos/${episode.slug}`}
                    className="aspect-video relative bg-black overflow-hidden block"
                  >
                    {thumbUrl ? (
                      <img
                        src={thumbUrl}
                        alt={episode.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#2D5A46]/20 to-[#15664a]/20">
                        <Play size={32} className="text-[#2D5A46]/40" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/60 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                        <Play size={20} className="text-white ml-0.5" fill="currentColor" />
                      </div>
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="p-5 flex flex-col flex-grow justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        {typeof episode.episodeNumber === "number" && (
                          <span className="text-xs font-bold px-2 py-0.5 bg-[#2D5A46] text-white rounded-full">
                            Ep {episode.episodeNumber}
                          </span>
                        )}
                        {episode.category && (
                          <span className="text-xs font-semibold px-2 py-0.5 bg-[#2D5A46]/10 text-[#2D5A46] rounded-full">
                            {episode.category}
                          </span>
                        )}
                      </div>
                      <Link
                        to={`/videos/${episode.slug}`}
                        className="block font-heading font-bold text-[#18181B] text-base leading-snug line-clamp-2 hover:text-[#2D5A46] transition-colors"
                      >
                        {episode.title}
                      </Link>
                    </div>

                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-[#E4E4E7] text-xs text-[#52525B]">
                      {episode.publishedAt && (
                        <div className="flex items-center gap-1">
                          <Calendar size={12} />
                          {new Date(episode.publishedAt).toLocaleDateString()}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setActiveVideoPopup(episode)}
                          className="text-xs text-[#71717A] hover:text-[#18181B] underline transition-colors"
                          title="Quick preview in popup"
                        >
                          Quick Watch
                        </button>
                        <Link
                          to={`/videos/${episode.slug}`}
                          className="inline-flex items-center gap-1 font-bold text-[#2D5A46] hover:text-[#15664a] transition-colors"
                        >
                          <Play size={12} fill="currentColor" /> Watch
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
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
                src={`https://www.youtube.com/embed/${extractYouTubeId(activeVideoPopup.youtubeId)}?autoplay=1&rel=0&modestbranding=1`}
                title={activeVideoPopup.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="p-4 bg-gray-900 border-t border-gray-800 flex justify-between items-center">
              <h3 className="text-white font-bold line-clamp-1">{activeVideoPopup.title}</h3>
              <a
                href={`https://www.youtube.com/watch?v=${extractYouTubeId(activeVideoPopup.youtubeId)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-[#c8a136] text-white rounded font-bold text-sm hover:bg-yellow-600 transition-colors whitespace-nowrap ml-4 flex items-center gap-1.5"
              >
                <ExternalLink size={14} /> Open in YouTube
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  const is404 = isRouteErrorResponse(error) && error.status === 404;

  return (
    <div className="min-h-screen bg-[#F7F5F0] flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
        <Layers size={40} className="text-[#2D5A46] opacity-40 mx-auto mb-4" />
        <h2 className="text-2xl font-heading font-bold text-[#15664a] mb-4">
          {is404 ? "Program Not Found" : "Error"}
        </h2>
        <p className="text-[#52525B] mb-8">
          {is404 ? "This program does not exist or is not yet published." : "An unexpected error occurred."}
        </p>
        <Link
          to="/videos/programs"
          className="inline-flex items-center gap-2 bg-[#15664a] text-white px-6 py-3 rounded-full hover:bg-[#0f4d38] transition-colors"
        >
          <ChevronRight className="rotate-180" size={18} /> Back to Programs
        </Link>
      </div>
    </div>
  );
}
