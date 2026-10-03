import React from 'react';

interface PodcastArtworkProps {
  imageUrl: string;
  title: string;
  isPlaying: boolean;
}

export function PodcastArtwork({ imageUrl, title, isPlaying }: PodcastArtworkProps) {
  return (
    <div className="relative flex items-center justify-center w-full max-w-sm mx-auto aspect-square">
      {/* Concentric Sound Rings */}
      <div 
        className={`absolute inset-0 rounded-[2.5rem] bg-[#2D5A46]/20 transition-transform duration-1000 ${isPlaying ? 'scale-110 opacity-50 animate-ping' : 'scale-100 opacity-0'} motion-reduce:animate-none`}
        style={{ animationDuration: '4s' }}
      ></div>
      <div 
        className={`absolute inset-0 rounded-[2.5rem] bg-[#2D5A46]/10 transition-transform duration-1000 delay-500 ${isPlaying ? 'scale-125 opacity-30 animate-ping' : 'scale-100 opacity-0'} motion-reduce:animate-none`}
        style={{ animationDuration: '4s' }}
      ></div>
      <div 
        className={`absolute inset-0 rounded-[2.5rem] bg-[#C5A059]/5 transition-transform duration-1000 delay-1000 ${isPlaying ? 'scale-[1.4] opacity-20 animate-ping' : 'scale-100 opacity-0'} motion-reduce:animate-none`}
        style={{ animationDuration: '4s' }}
      ></div>

      {/* Main Artwork */}
      <div 
        className={`relative w-full h-full rounded-[2rem] overflow-hidden shadow-2xl border border-white/10 z-10 bg-[#27272A] flex items-center justify-center transition-transform duration-1000 ease-in-out ${isPlaying ? 'scale-[1.015]' : 'scale-100'} motion-reduce:transform-none`}
      >
        <img 
          src={imageUrl} 
          alt={title} 
          className="w-full h-full object-cover"
        />
        {/* Subtle overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none"></div>
      </div>
    </div>
  );
}
