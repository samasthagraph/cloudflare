import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useLoaderData, Link, useRouteLoaderData } from "@remix-run/react";
import { json, type LoaderFunctionArgs, type MetaFunction } from "@remix-run/cloudflare";

export const meta: MetaFunction = () => {
  return [
    { title: "Podcasts • Samastha Graph" },
    { name: "description", content: "Listen to inspiring podcasts, talks, and discussions on Samastha Graph." },
    { property: "og:title", content: "Podcasts • Samastha Graph" },
    { property: "og:description", content: "Listen to inspiring podcasts, talks, and discussions on Samastha Graph." },
  ];
};
import {
  Play, Pause, Clock, Search, Headphones,
  ChevronRight, ChevronDown, SkipBack, SkipForward, Sparkles, Filter, Radio, Disc, Volume2, VolumeX, X, Maximize2,
  Heart, MoreHorizontal, MoreVertical
} from 'lucide-react';
import { SiSpotify, SiApplepodcasts } from "react-icons/si";
import { FaAmazon, FaMusic, FaYoutube } from "react-icons/fa";
import { isMalayalam } from "~/utils/language";
import { getCleanAudioUrl } from "~/utils/audio";
import { fetchLiveSpotifyPodcasts, getPodcastShows, type PodcastShow, type PodcastEpisode } from "~/utils/podcasts.server";
import podcastShowsConfig from "../content/settings/podcast-shows.json";
import { getDbPodcasts, getDbSetting } from "~/utils/db.server";

const DEFAULT_ARTWORK = "https://d3t3ozftmdmh3i.cloudfront.net/staging/podcast_uploaded_nologo/46535697/46535697-1786530965061-a1e35ade3abba.jpg";

const renderPlatformIcon = (platformName: string, size: number = 24) => {
  const name = platformName?.toLowerCase() || '';
  if (name.includes('spotify')) return <SiSpotify size={size} />;
  if (name.includes('apple')) return <SiApplepodcasts size={size} />;
  if (name.includes('amazon')) return <FaAmazon size={size} />;
  if (name.includes('youtube')) return <FaYoutube size={size} />;
  if (name.includes('jio')) return <FaMusic size={size} />;
  return <Headphones size={size} />;
};

const formatTime = (seconds: number) => {
  if (isNaN(seconds) || seconds === 0) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
};

export const loader = async ({ context }: LoaderFunctionArgs) => {
  const ctx = context as any;
  const env = ctx?.cloudflare?.env || ctx?.env || (typeof process !== 'undefined' ? process.env : {});
  
  const [dbPodcasts, dbShowsSetting] = await Promise.all([
    getDbPodcasts(env?.DB),
    getDbSetting(env?.DB, "podcast-shows")
  ]);

  const showsSource = dbShowsSetting?.shows || (podcastShowsConfig as any)?.shows;
  const shows: PodcastShow[] = getPodcastShows(showsSource);

  let liveEpisodes: PodcastEpisode[] = [];
  if (shows && shows.length > 0) {
    try {
      liveEpisodes = await fetchLiveSpotifyPodcasts(shows);
    } catch (e) {
      console.error("Failed to fetch live Spotify podcasts in loader:", e);
    }
  }

  let podcastsData: any[] = [];
  if (env?.DB) {
    const map = new Map<string, any>();
    (dbPodcasts || []).forEach(ep => map.set(ep.slug, ep));
    liveEpisodes.forEach(ep => {
      if (!map.has(ep.slug)) map.set(ep.slug, ep);
    });
    podcastsData = Array.from(map.values()).filter((p: any) => p.status !== 'draft' && isMalayalam(p));
  } else {
    const jsonPodcasts = import.meta.glob("../content/podcasts/*.json", { import: 'default', eager: true });
    const localData = Object.entries(jsonPodcasts).map(([path, content]: any) => {
      return { slug: path.split('/').pop()?.replace('.json', ''), ...content };
    });
    const map = new Map<string, any>();
    localData.forEach(ep => map.set(ep.slug, ep));
    liveEpisodes.forEach(ep => {
      if (!map.has(ep.slug)) map.set(ep.slug, ep);
    });
    podcastsData = Array.from(map.values()).filter((p: any) => p.status !== 'draft' && isMalayalam(p));
  }

  podcastsData.sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());

  return json({ podcasts: podcastsData, shows }, {
    headers: { "Cache-Control": "public, max-age=0, must-revalidate" }
  });
};


export default function Podcasts() {
  const { podcasts, shows } = useLoaderData<typeof loader>();
  const rootData = useRouteLoaderData("root") as any;
  const platforms = (rootData?.podcastPlatforms?.platforms || []).filter((p: any) => p.active !== false).sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedShowId, setSelectedShowId] = useState<string>("all");
  const [likedEpisodes, setLikedEpisodes] = useState<string[]>([]);
  const [showAllEpisodes, setShowAllEpisodes] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("graph_liked_podcasts");
      if (saved) setLikedEpisodes(JSON.parse(saved));
    } catch (e) { }
  }, []);

  const toggleLikeEpisode = (slug: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setLikedEpisodes(prev => {
      const updated = prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug];
      try {
        localStorage.setItem("graph_liked_podcasts", JSON.stringify(updated));
      } catch (e) { }
      return updated;
    });
  };

  // Inline audio player state
  const [currentPlayingEpisode, setCurrentPlayingEpisode] = useState<any | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Show counts
  const showEpisodeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: podcasts.length };
    for (const p of podcasts) {
      const sId = p.showId || 'samastha-graph';
      counts[sId] = (counts[sId] || 0) + 1;
    }
    return counts;
  }, [podcasts]);

  const activeShow = useMemo(() => {
    if (selectedShowId === "all") return null;
    return shows.find((s: any) => s.id === selectedShowId) || null;
  }, [selectedShowId, shows]);

  const showMap = useMemo(() => {
    const map = new Map<string, any>();
    for (const s of shows) {
      map.set(s.id, s);
    }
    return map;
  }, [shows]);

  const getShowImage = (podcast: any) => {
    if (!podcast) return DEFAULT_ARTWORK;
    const sId = podcast.showId || 'samastha-graph';
    const show = showMap.get(sId);
    return show?.image || podcast.artwork || podcast.image || DEFAULT_ARTWORK;
  };

  const filteredPodcasts = useMemo(() => {
    return podcasts.filter((podcast: any) => {
      const matchesShow = selectedShowId === "all" || (podcast.showId || 'samastha-graph') === selectedShowId;
      const matchesSearch = !searchQuery.trim() ||
        podcast.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        podcast.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        podcast.showTitle?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesShow && matchesSearch;
    });
  }, [podcasts, selectedShowId, searchQuery]);

  const handlePlayEpisode = (ep: any, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (currentPlayingEpisode?.slug === ep.slug) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentPlayingEpisode(ep);
      setIsPlaying(true);
      setProgress(0);
      setCurrentTime(0);
    }
  };

  // Active show episodes for playlist banner
  const activeShowEpisodes = useMemo(() => {
    if (!activeShow) return [];
    return podcasts.filter((p: any) => (p.showId || 'samastha-graph') === activeShow.id);
  }, [activeShow, podcasts]);

  const currentShowEpisodeIndex = useMemo(() => {
    if (!currentPlayingEpisode || activeShowEpisodes.length === 0) return 0;
    const idx = activeShowEpisodes.findIndex((p: any) => p.slug === currentPlayingEpisode.slug);
    return idx === -1 ? 0 : idx;
  }, [activeShowEpisodes, currentPlayingEpisode]);

  const isCurrentShowEpisodePlaying = useMemo(() => {
    return Boolean(
      isPlaying && 
      currentPlayingEpisode && 
      activeShowEpisodes.some((p: any) => p.slug === currentPlayingEpisode.slug)
    );
  }, [isPlaying, currentPlayingEpisode, activeShowEpisodes]);

  const handleActiveShowPlayToggle = () => {
    if (activeShowEpisodes.length === 0) return;
    const targetEp = currentPlayingEpisode && activeShowEpisodes.some((p: any) => p.slug === currentPlayingEpisode.slug)
      ? currentPlayingEpisode
      : activeShowEpisodes[0];
    handlePlayEpisode(targetEp);
  };

  const handleActiveShowPrevEpisode = () => {
    if (activeShowEpisodes.length <= 1) return;
    const prevIdx = (currentShowEpisodeIndex - 1 + activeShowEpisodes.length) % activeShowEpisodes.length;
    handlePlayEpisode(activeShowEpisodes[prevIdx]);
  };

  const handleActiveShowNextEpisode = () => {
    if (activeShowEpisodes.length <= 1) return;
    const nextIdx = (currentShowEpisodeIndex + 1) % activeShowEpisodes.length;
    handlePlayEpisode(activeShowEpisodes[nextIdx]);
  };

  useEffect(() => {
    if (audioRef.current && currentPlayingEpisode) {
      if (isPlaying) {
        audioRef.current.play().catch(err => {
          console.error("Audio playback error:", err);
          setIsPlaying(false);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentPlayingEpisode]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const cur = audioRef.current.currentTime;
      const dur = audioRef.current.duration;
      setCurrentTime(cur);
      if (dur > 0) {
        setProgress((cur / dur) * 100);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = (parseFloat(e.target.value) / 100) * duration;
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      setProgress(parseFloat(e.target.value));
    }
  };

  if (!podcasts || podcasts.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#eef3f1]">
        <div className="text-center p-8 bg-white rounded-3xl shadow-xl border border-[#c1d5cd]">
          <Headphones size={64} className="mx-auto text-[#2D5A46] mb-4 opacity-50" />
          <h2 className="text-2xl font-heading font-bold text-[#2D5A46]">Podcasts Coming Soon</h2>
          <p className="text-[#60834f] mt-2">We are currently producing premium audio content.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="font-sans min-h-screen bg-[#eef3f1] text-[#2D5A46] pb-36 overflow-x-hidden selection:bg-[#c8a136] selection:text-[#2D5A46]">
      {/* Hidden Audio Engine */}
      {currentPlayingEpisode && (
        <audio
          ref={audioRef}
          src={getCleanAudioUrl(currentPlayingEpisode.audioUrl)}
          preload="auto"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
        />
      )}

      {/* Shows & Series Showcase Section (Playlist style) */}
      <section id="shows-section" className="pt-10 sm:pt-14 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold text-[#c8a136] uppercase tracking-widest mb-2">
              <Disc size={16} /> Shows & Playlists
            </div>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-[#2D5A46]">
              Featured Shows <span className="text-[#60834f] font-normal text-2xl md:text-3xl"></span>
            </h2>
            <p className="text-[#60834f] text-sm mt-1">Browse our specialized audio shows on Spotify and enjoy curated episodes.</p>
          </div>
          {selectedShowId !== "all" && (
            <button
              onClick={() => setSelectedShowId("all")}
              className="self-start md:self-auto text-xs font-bold uppercase tracking-wider text-[#2D5A46] bg-white border border-[#c1d5cd] px-4 py-2 rounded-full hover:border-[#c8a136] hover:text-[#c8a136] transition-colors"
            >
              Reset to All Shows
            </button>
          )}
        </div>

        {/* Shows Horizontal Slider / Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {shows.map((show: any) => {
            const count = showEpisodeCounts[show.id] || 0;
            const isSelected = selectedShowId === show.id;
            return (
              <button
                key={show.id}
                onClick={() => setSelectedShowId(isSelected ? "all" : show.id)}
                className={`group text-left rounded-2xl p-3.5 transition-all duration-300 flex flex-col border ${isSelected
                    ? 'bg-[#2D5A46] text-white border-[#2D5A46] shadow-xl scale-[1.03]'
                    : 'bg-white hover:bg-[#f8faf9] text-[#2D5A46] border-[#c1d5cd]/60 hover:border-[#c8a136] hover:shadow-md'
                  }`}
              >
                <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-3 bg-black/5 shadow-inner">
                  <img
                    src={show.image || DEFAULT_ARTWORK}
                    alt={show.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2 right-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-md ${isSelected ? 'bg-black/50 text-[#c8a136]' : 'bg-black/60 text-white'
                      }`}>
                      {count} {count === 1 ? 'ep' : 'eps'}
                    </span>
                  </div>
                </div>
                <h4 className={`font-bold text-sm line-clamp-1 leading-snug ${isSelected ? 'text-[#c8a136]' : 'text-[#2D5A46] group-hover:text-[#c8a136]'}`}>
                  {show.subtitle || show.title}
                </h4>
                <p className={`text-[11px] line-clamp-1 mt-0.5 ${isSelected ? 'text-[#c1d5cd]' : 'text-[#7ea99a]'}`}>
                  {show.title}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Selected Show Highlights Banner with Play & Episode Switcher */}
      {activeShow && (
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-10">
          <div className="bg-gradient-to-r from-[#2D5A46] to-[#1d3d2f] text-white rounded-3xl p-6 md:p-8 flex flex-col lg:flex-row items-center justify-between gap-6 shadow-xl border border-[#c8a136]/30">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 flex-grow text-center sm:text-left w-full">
              <img
                src={activeShow.image || DEFAULT_ARTWORK}
                alt={activeShow.title}
                className="w-24 h-24 md:w-32 md:h-32 rounded-2xl object-cover shadow-lg border border-white/20 flex-shrink-0"
              />
              <div className="flex-grow min-w-0">
                <div className="inline-flex items-center gap-2 text-xs font-bold text-[#c8a136] uppercase tracking-widest mb-1.5">
                  <Radio size={14} /> Current Show Playlist
                </div>
                <h3 className="text-2xl md:text-3xl font-heading font-bold mb-2">
                  {activeShow.title}
                </h3>
                {activeShow.description && (
                  <p className="text-sm md:text-base text-[#c1d5cd] max-w-2xl leading-relaxed mb-4">
                    {activeShow.description}
                  </p>
                )}

                {/* Play and Change Episode Controls */}
                {activeShowEpisodes.length > 0 && (
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2">
                    {/* Play / Pause Toggle Button */}
                    <button
                      type="button"
                      onClick={handleActiveShowPlayToggle}
                      className="bg-[#c8a136] text-[#15664a] font-bold px-6 py-2.5 rounded-full hover:bg-yellow-500 transition-all shadow-lg shadow-[#c8a136]/20 inline-flex items-center gap-2 text-xs md:text-sm uppercase tracking-wider cursor-pointer"
                    >
                      {isCurrentShowEpisodePlaying ? (
                        <>
                          <Pause size={16} className="fill-current" /> Pause Show
                        </>
                      ) : (
                        <>
                          <Play size={16} fill="currentColor" /> Play Show
                        </>
                      )}
                    </button>

                    {/* Step Through Episodes Controls */}
                    <div className="inline-flex items-center gap-1 bg-white/10 backdrop-blur-md rounded-full p-1 border border-white/15">
                      <button
                        type="button"
                        onClick={handleActiveShowPrevEpisode}
                        disabled={activeShowEpisodes.length <= 1}
                        className="p-1.5 rounded-full hover:bg-white/20 text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        title="Previous Episode"
                      >
                        <SkipBack size={16} />
                      </button>
                      
                      <span className="text-xs font-semibold px-2.5 text-[#c8a136] whitespace-nowrap">
                        Ep {currentShowEpisodeIndex + 1} of {activeShowEpisodes.length}
                      </span>

                      <button
                        type="button"
                        onClick={handleActiveShowNextEpisode}
                        disabled={activeShowEpisodes.length <= 1}
                        className="p-1.5 rounded-full hover:bg-white/20 text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        title="Next Episode"
                      >
                        <SkipForward size={16} />
                      </button>
                    </div>

                    {/* Change Episode Select Dropdown */}
                    <div className="relative min-w-[200px] max-w-xs">
                      <select
                        value={activeShowEpisodes[currentShowEpisodeIndex]?.slug || ""}
                        onChange={(e) => {
                          const ep = activeShowEpisodes.find((p: any) => p.slug === e.target.value);
                          if (ep) handlePlayEpisode(ep);
                        }}
                        className="w-full appearance-none bg-black/40 border border-white/25 hover:border-[#c8a136] text-white text-xs font-medium rounded-full pl-3.5 pr-8 py-2 focus:outline-none focus:ring-1 focus:ring-[#c8a136] transition-all cursor-pointer truncate"
                      >
                        {activeShowEpisodes.map((ep: any, idx: number) => (
                          <option key={ep.slug || idx} value={ep.slug} className="bg-[#1d3d2f] text-white">
                            {idx + 1}. {ep.title}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#c8a136] pointer-events-none" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Episode Count on Right */}
            <div className="flex-shrink-0 text-center lg:text-right border-t lg:border-t-0 lg:border-l border-white/10 pt-4 lg:pt-0 lg:pl-8 w-full lg:w-auto">
              <div className="text-3xl font-bold text-[#c8a136]">
                {showEpisodeCounts[activeShow.id] || 0}
              </div>
              <div className="text-xs uppercase tracking-wider text-[#c1d5cd]">
                Episodes Available
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Podcast Archive Grid with Filter Pills & Search */}
      <section id="episodes" className="py-16 bg-white border-t border-[#c1d5cd]/50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-[#2D5A46] tracking-tight">
                {activeShow ? `${activeShow.subtitle || activeShow.title} Episodes` : "Trending podcasts"}
              </h2>
              <p className="text-[#60834f] text-sm mt-1">
                Showing {filteredPodcasts.length} of {podcasts.length} episodes
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Search Bar */}
              <div className="flex items-center gap-2.5 border border-[#c1d5cd] rounded-full px-4 py-2 bg-[#f8faf9] w-full sm:w-64 shadow-sm focus-within:border-[#2D5A46] focus-within:bg-white transition-all">
                <Search size={16} className="text-[#7ea99a]" />
                <input
                  type="text"
                  placeholder="Search episodes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-none text-xs text-[#2D5A46] placeholder:text-[#7ea99a] w-full"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="text-[11px] font-semibold text-[#7ea99a] hover:text-[#2D5A46]">
                    Clear
                  </button>
                )}
              </div>

              {filteredPodcasts.length > 8 && (
                <button
                  onClick={() => setShowAllEpisodes(!showAllEpisodes)}
                  className="text-xs font-bold text-[#2D5A46] hover:text-[#c8a136] px-4 py-2 rounded-full border border-[#c1d5cd] hover:border-[#c8a136] bg-white transition-colors"
                >
                  {showAllEpisodes ? "Show Featured" : "Show All"}
                </button>
              )}
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
            <button
              onClick={() => setSelectedShowId("all")}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${selectedShowId === "all"
                  ? "bg-[#2D5A46] text-white shadow-md"
                  : "bg-[#eef3f1] text-[#2D5A46] hover:bg-[#c1d5cd]/50"
                }`}
            >
              All Shows ({showEpisodeCounts["all"] || podcasts.length})
            </button>
            {shows.map((show: any) => {
              const count = showEpisodeCounts[show.id] || 0;
              const isSelected = selectedShowId === show.id;
              return (
                <button
                  key={show.id}
                  onClick={() => setSelectedShowId(show.id)}
                  className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${isSelected
                      ? "bg-[#2D5A46] text-white shadow-md"
                      : "bg-[#eef3f1] text-[#2D5A46] hover:bg-[#c1d5cd]/50"
                    }`}
                >
                  {show.subtitle || show.title} ({count})
                </button>
              );
            })}
          </div>

          {filteredPodcasts.length > 0 && (() => {
            const primaryEpisodes = filteredPodcasts.slice(0, 2);
            const listEpisodes = filteredPodcasts.slice(2, 8);
            const remainingEpisodes = filteredPodcasts.slice(8);

            return (
              <div className="space-y-8">
                {/* 2-Column Editorial Grid matching reference layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* Left Column: 2 Large Horizontal Featured Cards */}
                  <div className={`flex flex-col gap-6 ${listEpisodes.length > 0 ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
                    {primaryEpisodes.map((podcast: any) => {
                      const isCurrentPlaying = currentPlayingEpisode?.slug === podcast.slug && isPlaying;
                      const episodeThumb = getShowImage(podcast);
                      const isLiked = likedEpisodes.includes(podcast.slug);

                      return (
                        <div
                          key={podcast.slug}
                          className={`group bg-white rounded-3xl p-5 md:p-6 border transition-all duration-300 flex flex-col sm:flex-row gap-5 relative ${isCurrentPlaying
                              ? 'border-[#c8a136] shadow-xl ring-2 ring-[#c8a136]/30'
                              : 'border-[#eef3f1] hover:border-[#c1d5cd] hover:shadow-lg'
                            }`}
                        >
                          {/* Left Thumbnail with Hover Overlay */}
                          <div className="relative w-full sm:w-44 md:w-52 aspect-square rounded-2xl overflow-hidden bg-black flex-shrink-0">
                            <img
                              src={episodeThumb}
                              alt={podcast.title}
                              loading="lazy"
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute top-2.5 left-2.5">
                              <span className="bg-[#2D5A46]/90 text-white backdrop-blur-md text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                                {podcast.showSubtitle || podcast.showTitle || 'Podcast'}
                              </span>
                            </div>
                          </div>

                          {/* Right Details in Card */}
                          <div className="flex flex-col flex-grow min-w-0 justify-between">
                            <div>
                              {/* Eyebrow & Top Actions */}
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[11px] font-extrabold tracking-wider text-[#7ea99a] uppercase">
                                  {podcast.showSubtitle || podcast.showTitle || 'PODCAST'}
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={(e) => toggleLikeEpisode(podcast.slug, e)}
                                    className="text-[#7ea99a] hover:text-[#c8a136] p-1 rounded-full transition-colors"
                                    aria-label="Favorite"
                                  >
                                    <Heart size={16} className={isLiked ? "fill-[#c8a136] text-[#c8a136]" : ""} />
                                  </button>
                                  <Link
                                    to={podcast.slug}
                                    className="text-[#7ea99a] hover:text-[#2D5A46] p-1 rounded-full transition-colors"
                                    title="View episode details"
                                  >
                                    <MoreVertical size={16} />
                                  </Link>
                                </div>
                              </div>

                              {/* Title */}
                              <Link to={podcast.slug} className="block group-hover:text-[#c8a136] transition-colors">
                                <h3 className="font-heading text-lg md:text-xl font-bold text-[#2D5A46] line-clamp-2 leading-snug mb-2">
                                  {podcast.title}
                                </h3>
                              </Link>

                              {/* Host / Author */}
                              <p className="text-xs text-[#60834f] line-clamp-1 mb-2">
                                {podcast.host ? `by ${podcast.host}` : (podcast.showTitle || podcast.author || 'Samastha Graph')}
                              </p>

                              {podcast.description && (
                                <p className="text-xs text-[#7ea99a] line-clamp-2 leading-relaxed hidden sm:block">
                                  {podcast.description}
                                </p>
                              )}
                            </div>

                            {/* Bottom Row: Duration & Big Play Button */}
                            <div className="flex items-center justify-between pt-4 mt-auto border-t border-[#f0f4f2]">
                              <div className="flex items-center gap-1.5 text-xs text-[#7ea99a] font-medium">
                                <Clock size={14} className="text-[#7ea99a]" />
                                <span>{podcast.duration || '25 min'}</span>
                              </div>

                              <button
                                onClick={(e) => handlePlayEpisode(podcast, e)}
                                className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 shadow-md ${isCurrentPlaying
                                    ? 'bg-[#c8a136] text-[#2D5A46] scale-105'
                                    : 'bg-[#2D5A46] text-white hover:bg-[#c8a136] hover:text-[#2D5A46] hover:scale-105'
                                  }`}
                                aria-label={isCurrentPlaying ? "Pause episode" : "Play episode"}
                              >
                                {isCurrentPlaying ? (
                                  <Pause size={18} className="fill-current" />
                                ) : (
                                  <Play size={18} className="fill-current ml-0.5" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Right Column: Numbered Compact Vertical List */}
                  {listEpisodes.length > 0 && (
                    <div className="lg:col-span-5 bg-white rounded-3xl p-4 sm:p-5 border border-[#eef3f1] shadow-sm flex flex-col">
                      <div className="divide-y divide-[#f0f4f2]">
                        {listEpisodes.map((podcast: any, index: number) => {
                          const episodeIndex = String(index + 3).padStart(2, '0');
                          const isCurrentPlaying = currentPlayingEpisode?.slug === podcast.slug && isPlaying;
                          const isLiked = likedEpisodes.includes(podcast.slug);
                          const episodeThumb = getShowImage(podcast);

                          return (
                            <div
                              key={podcast.slug}
                              className={`flex items-center gap-3.5 py-3 px-2 sm:px-3 rounded-2xl transition-all duration-200 group ${isCurrentPlaying
                                  ? 'bg-[#eef3f1] ring-1 ring-[#c8a136]/50'
                                  : 'hover:bg-[#f8faf9]'
                                }`}
                            >
                              {/* Index Number or Active Waveform */}
                              <div className="w-6 flex-shrink-0 text-center">
                                {isCurrentPlaying ? (
                                  <div className="flex items-end justify-center gap-0.5 h-4">
                                    <span className="w-1 bg-[#c8a136] h-full animate-pulse rounded-full"></span>
                                    <span className="w-1 bg-[#c8a136] h-2/3 animate-pulse rounded-full delay-75"></span>
                                    <span className="w-1 bg-[#c8a136] h-4/5 animate-pulse rounded-full delay-150"></span>
                                  </div>
                                ) : (
                                  <span className="text-xs font-bold text-[#7ea99a] group-hover:text-[#2D5A46]">{episodeIndex}</span>
                                )}
                              </div>

                              {/* Thumbnail with Click to Play */}
                              <div
                                onClick={(e) => handlePlayEpisode(podcast, e)}
                                className="relative w-12 h-12 rounded-xl overflow-hidden bg-black flex-shrink-0 cursor-pointer group/thumb shadow-sm"
                                title="Click to play"
                              >
                                <img
                                  src={episodeThumb}
                                  alt={podcast.title}
                                  loading="lazy"
                                  className="w-full h-full object-cover transition-transform duration-300 group-hover/thumb:scale-110"
                                />
                                <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${isCurrentPlaying ? 'opacity-100 bg-black/50' : 'opacity-0 group-hover/thumb:opacity-100'
                                  }`}>
                                  {isCurrentPlaying ? (
                                    <Pause size={15} className="text-[#c8a136] fill-current" />
                                  ) : (
                                    <Play size={15} className="text-white fill-current ml-0.5" />
                                  )}
                                </div>
                              </div>

                              {/* Title & Author */}
                              <div className="flex-grow min-w-0 pr-1">
                                <Link to={podcast.slug} className="block group-hover:text-[#c8a136] transition-colors">
                                  <h4 className="text-xs sm:text-sm font-bold text-[#2D5A46] truncate leading-tight">
                                    {podcast.title}
                                  </h4>
                                </Link>
                                <p className="text-[11px] text-[#7ea99a] truncate mt-0.5">
                                  {podcast.host ? `by ${podcast.host}` : (podcast.showSubtitle || podcast.showTitle || 'Samastha Graph')}
                                </p>
                              </div>

                              {/* Actions: Heart & Options */}
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <button
                                  onClick={(e) => toggleLikeEpisode(podcast.slug, e)}
                                  className="p-1.5 rounded-full hover:bg-white text-[#7ea99a] hover:text-[#c8a136] transition-colors"
                                  aria-label="Favorite"
                                >
                                  <Heart
                                    size={15}
                                    className={isLiked ? "fill-[#c8a136] text-[#c8a136]" : ""}
                                  />
                                </button>
                                <Link
                                  to={podcast.slug}
                                  className="p-1.5 rounded-full hover:bg-white text-[#7ea99a] hover:text-[#2D5A46] transition-colors"
                                  title="Episode info"
                                >
                                  <MoreHorizontal size={15} />
                                </Link>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Expanded Remaining Episodes Grid */}
                {remainingEpisodes.length > 0 && (
                  <div className="pt-8 border-t border-[#eef3f1]">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-heading text-xl font-bold text-[#2D5A46]">
                        {showAllEpisodes ? `All Episodes (${filteredPodcasts.length})` : `More Episodes (${remainingEpisodes.length})`}
                      </h3>
                      <button
                        onClick={() => setShowAllEpisodes(!showAllEpisodes)}
                        className="text-xs font-bold text-[#2D5A46] hover:text-[#c8a136] px-4 py-1.5 rounded-full border border-[#c1d5cd] hover:border-[#c8a136] bg-white transition-colors flex items-center gap-1"
                      >
                        {showAllEpisodes ? "Show Less" : "View All"}
                        <ChevronRight size={14} className={showAllEpisodes ? "-rotate-90" : ""} />
                      </button>
                    </div>

                    {showAllEpisodes && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
                        {remainingEpisodes.map((podcast: any) => {
                          const isCurrentPlaying = currentPlayingEpisode?.slug === podcast.slug && isPlaying;
                          const isLiked = likedEpisodes.includes(podcast.slug);
                          const episodeThumb = getShowImage(podcast);

                          return (
                            <div
                              key={podcast.slug}
                              className={`group bg-white border rounded-2xl p-4 flex gap-4 transition-all duration-300 ${isCurrentPlaying
                                  ? 'border-[#c8a136] shadow-lg ring-1 ring-[#c8a136]/30'
                                  : 'border-[#eef3f1] hover:border-[#c1d5cd] hover:shadow-md'
                                }`}
                            >
                              <div
                                onClick={(e) => handlePlayEpisode(podcast, e)}
                                className="relative w-20 h-20 rounded-xl overflow-hidden bg-black flex-shrink-0 cursor-pointer group/thumb"
                              >
                                <img
                                  src={episodeThumb}
                                  alt={podcast.title}
                                  loading="lazy"
                                  className="w-full h-full object-cover transition-transform duration-300 group-hover/thumb:scale-105"
                                />
                                <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${isCurrentPlaying ? 'opacity-100 bg-black/50' : 'opacity-0 group-hover/thumb:opacity-100'
                                  }`}>
                                  {isCurrentPlaying ? (
                                    <Pause size={16} className="text-[#c8a136] fill-current" />
                                  ) : (
                                    <Play size={16} className="text-white fill-current ml-0.5" />
                                  )}
                                </div>
                              </div>

                              <div className="flex flex-col flex-grow min-w-0 justify-between">
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] font-bold text-[#7ea99a] uppercase tracking-wider">
                                      {podcast.showSubtitle || podcast.showTitle || 'Podcast'}
                                    </span>
                                    <button
                                      onClick={(e) => toggleLikeEpisode(podcast.slug, e)}
                                      className="text-[#7ea99a] hover:text-[#c8a136] p-0.5 transition-colors"
                                    >
                                      <Heart size={14} className={isLiked ? "fill-[#c8a136] text-[#c8a136]" : ""} />
                                    </button>
                                  </div>
                                  <Link to={podcast.slug} className="block group-hover:text-[#c8a136] transition-colors">
                                    <h4 className="font-heading text-sm font-bold text-[#2D5A46] line-clamp-2 leading-tight">
                                      {podcast.title}
                                    </h4>
                                  </Link>
                                </div>

                                <div className="flex items-center justify-between text-[11px] text-[#7ea99a] pt-2 mt-auto border-t border-[#f0f4f2]">
                                  <span className="flex items-center gap-1">
                                    <Clock size={12} /> {podcast.duration || '25 min'}
                                  </span>
                                  <Link
                                    to={podcast.slug}
                                    className="text-[#2D5A46] hover:text-[#c8a136] font-semibold uppercase tracking-wider text-[10px] flex items-center gap-0.5"
                                  >
                                    Details <ChevronRight size={12} />
                                  </Link>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {filteredPodcasts.length === 0 && (
            <div className="text-center py-16 bg-[#f8faf9] rounded-3xl border border-dashed border-[#c1d5cd]">
              <Headphones size={48} className="mx-auto text-[#7ea99a] mb-3 opacity-60" />
              <p className="text-[#2D5A46] font-bold text-lg mb-1">No episodes found</p>
              <p className="text-[#60834f] text-sm">
                {searchQuery
                  ? `No episodes matching "${searchQuery}" in this selection.`
                  : "No episodes available in this show yet."}
              </p>
              <button
                onClick={() => { setSelectedShowId("all"); setSearchQuery(""); }}
                className="mt-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#2D5A46] bg-white border border-[#c1d5cd] px-4 py-2 rounded-full hover:border-[#c8a136] transition-colors"
              >
                View All Episodes
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Floating Interactive Audio Player Dock */}
      {currentPlayingEpisode && (
        <div className="fixed bottom-0 inset-x-0 z-50 bg-[#0a1f15]/95 backdrop-blur-md text-white border-t border-[#1e3f30] px-4 py-2.5 sm:py-3 shadow-[0_-10px_30px_rgba(0,0,0,0.3)] animate-in slide-in-from-bottom duration-300">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2 sm:gap-3">
            {/* Top row on mobile: Episode Info + Quick Action Buttons */}
            <div className="flex items-center justify-between gap-3 w-full md:w-1/3 min-w-0">
              <div className="flex items-center gap-3 min-w-0 flex-grow">
                <img
                  src={getShowImage(currentPlayingEpisode)}
                  alt={currentPlayingEpisode.title}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-cover border border-[#2D5A46] flex-shrink-0"
                />
                <div className="min-w-0 flex-grow">
                  <div className="text-[10px] uppercase font-bold text-[#c8a136] tracking-wider truncate">
                    {currentPlayingEpisode.showSubtitle || currentPlayingEpisode.showTitle || 'Playing Podcast'}
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                    {currentPlayingEpisode.title}
                  </h4>
                </div>
              </div>

              {/* Mobile quick controls */}
              <div className="flex items-center gap-2 md:hidden flex-shrink-0">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-9 h-9 rounded-full bg-[#c8a136] text-[#0a1f15] flex items-center justify-center hover:bg-white transition-colors shadow-md"
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <Pause size={16} className="fill-current" /> : <Play size={16} className="fill-current ml-0.5" />}
                </button>
                <button
                  onClick={() => { setIsPlaying(false); setCurrentPlayingEpisode(null); }}
                  className="text-[#7ea99a] hover:text-white p-1 rounded-full hover:bg-white/10"
                  title="Close player"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Central Controls & Progress */}
            <div className="flex flex-col items-center w-full md:w-1/2 gap-1">
              <div className="hidden md:flex items-center gap-4">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-10 h-10 rounded-full bg-[#c8a136] text-[#0a1f15] flex items-center justify-center hover:bg-white transition-colors shadow-md"
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <Pause size={18} className="fill-current" /> : <Play size={18} className="fill-current ml-0.5" />}
                </button>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 w-full">
                <span className="text-[10px] sm:text-[11px] font-mono text-[#c8a136] w-9 sm:w-10 text-right">{formatTime(currentTime)}</span>
                <div className="relative flex-grow flex items-center h-4">
                  <div className="absolute inset-x-0 h-1 bg-[#1e3f30] rounded-full"></div>
                  <div className="absolute left-0 h-1 bg-[#c8a136] rounded-full" style={{ width: `${progress}%` }}></div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={progress || 0}
                    onChange={handleSeek}
                    className="absolute inset-0 w-full opacity-0 cursor-pointer"
                    aria-label="Seek audio"
                  />
                </div>
                <span className="text-[10px] sm:text-[11px] font-mono text-[#7ea99a] w-9 sm:w-10">{formatTime(duration)}</span>
              </div>
            </div>

            {/* Desktop Actions & Close */}
            <div className="hidden md:flex items-center justify-end gap-3 w-full md:w-1/4">
              <Link
                to={currentPlayingEpisode.slug}
                className="text-xs text-[#c1d5cd] hover:text-[#c8a136] flex items-center gap-1 font-semibold uppercase tracking-wider"
              >
                <Maximize2 size={14} /> Full Page
              </Link>
              <button
                onClick={() => { setIsPlaying(false); setCurrentPlayingEpisode(null); }}
                className="text-[#7ea99a] hover:text-white p-1 rounded-full hover:bg-white/10"
                title="Close player"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Listen Everywhere Section */}
      <section className="py-20 bg-[#eef3f1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="font-heading text-2xl font-bold text-[#2D5A46] mb-2">Listen Everywhere</h3>
          <p className="text-[#60834f] mb-10">Follow Samastha Graph on your preferred podcast platform.</p>
          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
            {platforms.map((platform: any) => (
              <a key={platform.id} href={platform.url} target="_blank" rel="noopener noreferrer" className="group bg-white border border-[#c1d5cd] rounded-2xl px-6 py-4 flex items-center gap-4 hover:-translate-y-1 hover:shadow-xl hover:border-[#c8a136] transition-all duration-300">
                <div className="text-[#2D5A46] group-hover:text-[#c8a136] transition-colors group-hover:scale-110 transform duration-300">
                  {renderPlatformIcon(platform.name, 24)}
                </div>
                <div className="text-left">
                  <p className="text-xs text-[#7ea99a] font-medium uppercase tracking-wider">Listen on</p>
                  <p className="font-bold text-[#2D5A46]">{platform.name}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
