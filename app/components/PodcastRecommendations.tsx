import React from 'react';
import { Link } from '@remix-run/react';
import { PlayCircle, Calendar, Headphones } from 'lucide-react';

interface PodcastRecommendationsProps {
  upNext: any | null;
  recommended: any[];
  upcoming: any[];
  series: any[];
  activeSlug: string;
}

export function PodcastRecommendations({ upNext, recommended, upcoming, series, activeSlug }: PodcastRecommendationsProps) {
  return (
    <div className="w-full flex flex-col gap-10">
      
      {/* Up Next */}
      {upNext && (
        <section className="flex flex-col gap-4">
          <h3 className="font-heading text-xl font-bold text-[#18181B] border-l-4 border-[#2D5A46] pl-3">Up Next</h3>
          <Link 
            to={`/podcasts/${upNext.slug}`}
            className="group flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-2xl border border-[#E4E4E7] shadow-sm hover:shadow-md hover:border-[#C5A059]/50 transition-all duration-300"
          >
            <div className="w-full sm:w-48 aspect-video sm:aspect-square rounded-xl overflow-hidden bg-[#27272A] relative flex-shrink-0">
              <img 
                src={upNext.customThumbnail || upNext.artwork || '/default-podcast.jpg'} 
                alt={upNext.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <PlayCircle size={40} className="text-white/90 group-hover:scale-110 transition-transform shadow-sm rounded-full" />
              </div>
            </div>
            
            <div className="flex flex-col justify-center flex-grow py-2 gap-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#C5A059]">
                <span>{upNext.programme || 'Next Episode'}</span>
                {upNext.episodeNumber && <span>• Ep {upNext.episodeNumber}</span>}
              </div>
              <h4 className="font-heading text-lg font-bold text-[#18181B] group-hover:text-[#2D5A46] transition-colors leading-snug line-clamp-2">
                {upNext.title}
              </h4>
              <div className="flex items-center gap-4 text-xs font-medium text-[#52525B]">
                <div className="flex items-center gap-1"><Calendar size={14} /> {upNext.date}</div>
                {upNext.duration && <div className="flex items-center gap-1"><Headphones size={14} /> {upNext.duration}</div>}
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* Series Navigator */}
      {series && series.length > 0 && (
        <section className="flex flex-col gap-4">
          <h3 className="font-heading text-xl font-bold text-[#18181B] border-l-4 border-[#C5A059] pl-3">Series Navigation</h3>
          <div className="bg-white rounded-2xl border border-[#E4E4E7] overflow-hidden shadow-sm">
            <div className="p-4 border-b border-[#E4E4E7] bg-[#F7F5F0]">
              <h4 className="font-bold text-[#27272A] uppercase tracking-wider text-sm">{series[0]?.programme || series[0]?.playlist || 'Series'}</h4>
            </div>
            <div className="flex flex-col max-h-[300px] overflow-y-auto custom-scrollbar">
              {series.map((ep, idx) => (
                <Link
                  key={ep.slug}
                  to={`/podcasts/${ep.slug}`}
                  className={`flex items-center justify-between p-4 border-b border-[#E4E4E7] last:border-0 hover:bg-[#F5EFE0] transition-colors ${ep.slug === activeSlug ? 'bg-[#2D5A46]/5' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-[#C5A059] font-bold text-sm w-6">
                      {ep.episodeNumber ? (ep.episodeNumber < 10 ? `0${ep.episodeNumber}` : ep.episodeNumber) : (idx + 1)}
                    </span>
                    <span className={`font-medium text-sm line-clamp-1 ${ep.slug === activeSlug ? 'text-[#2D5A46] font-bold' : 'text-[#18181B]'}`}>
                      {ep.title}
                    </span>
                  </div>
                  {ep.slug === activeSlug && (
                    <div className="flex gap-1 ml-4 items-center h-4">
                      <span className="w-1 h-2 bg-[#2D5A46] rounded-full animate-[bounce_1s_infinite]"></span>
                      <span className="w-1 h-3 bg-[#2D5A46] rounded-full animate-[bounce_1s_infinite_0.2s]"></span>
                      <span className="w-1 h-4 bg-[#2D5A46] rounded-full animate-[bounce_1s_infinite_0.4s]"></span>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Recommended Podcasts */}
      {recommended && recommended.length > 0 && (
        <section className="flex flex-col gap-4">
          <h3 className="font-heading text-xl font-bold text-[#18181B] border-l-4 border-[#2D5A46] pl-3">Recommended Listening</h3>
          <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
            {recommended.map(podcast => (
              <Link 
                key={podcast.slug} 
                to={`/podcasts/${podcast.slug}`}
                className="group flex flex-col gap-3 min-w-[160px] sm:min-w-[200px] max-w-[240px] flex-shrink-0"
              >
                <div className="w-full aspect-square rounded-2xl overflow-hidden bg-[#27272A] border border-[#E4E4E7] shadow-sm relative">
                  <img 
                    src={podcast.customThumbnail || podcast.artwork || '/default-podcast.jpg'} 
                    alt={podcast.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors"></div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#C5A059] mb-1 line-clamp-1">
                    {podcast.category}
                  </div>
                  <h4 className="font-heading text-sm font-bold text-[#27272A] group-hover:text-[#2D5A46] transition-colors leading-snug line-clamp-2">
                    {podcast.title}
                  </h4>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Upcoming Podcasts */}
      {upcoming && upcoming.length > 0 && (
        <section className="flex flex-col gap-4">
          <h3 className="font-heading text-xl font-bold text-[#18181B] border-l-4 border-[#52525B] pl-3">Coming Soon</h3>
          <div className="flex flex-col gap-3">
            {upcoming.map(podcast => (
              <div 
                key={podcast.slug} 
                className="flex items-center gap-4 bg-white/50 p-3 rounded-xl border border-[#E4E4E7] opacity-80"
              >
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-[#27272A] flex-shrink-0 grayscale">
                  <img 
                    src={podcast.customThumbnail || podcast.artwork || '/default-podcast.jpg'} 
                    alt={podcast.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col flex-grow">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#52525B] mb-0.5">
                    {podcast.date || 'Upcoming'}
                  </div>
                  <h4 className="font-heading text-sm font-bold text-[#18181B] line-clamp-1">
                    {podcast.title}
                  </h4>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
