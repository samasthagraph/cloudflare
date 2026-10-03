import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, FastForward, Rewind, Volume2, VolumeX 
} from 'lucide-react';
import { Link } from '@remix-run/react';
import { PodcastWaveform } from './PodcastWaveform';
import { OptimizedImage } from './OptimizedImage';

interface PodcastPlayerProps {
  slug: string;
  audioUrl: string;
  title: string;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  onEnded?: () => void;
  variant?: 'compact' | 'expanded';
  podcast?: any;
}

function getCleanAudioUrl(url: string) {
  if (!url) return '';
  if (url.includes('/https%3A%2F%2F')) {
    const parts = url.split('/https%3A%2F%2F');
    return 'https://' + decodeURIComponent(parts[1]);
  }
  if (url.includes('/http%3A%2F%2F')) {
    const parts = url.split('/http%3A%2F%2F');
    return 'http://' + decodeURIComponent(parts[1]);
  }
  return url;
}

export function PodcastPlayer({ 
  slug, 
  audioUrl, 
  title, 
  isPlaying, 
  setIsPlaying, 
  onEnded,
  variant = 'expanded',
  podcast
}: PodcastPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const cleanAudioSrc = getCleanAudioUrl(audioUrl);
  
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  
  const [hasResumed, setHasResumed] = useState(true);
  const [savedTime, setSavedTime] = useState(0);

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds === 0) return "00:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  useEffect(() => {
    const saved = localStorage.getItem(`podcast_progress_${slug}`);
    if (saved) {
      const parsed = parseFloat(saved);
      if (parsed > 5) {
        setSavedTime(parsed);
        setHasResumed(false);
      }
    }
  }, [slug]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isPlaying && currentTime > 0) {
        if (duration > 0 && currentTime > duration - 5) {
          localStorage.removeItem(`podcast_progress_${slug}`);
        } else {
          localStorage.setItem(`podcast_progress_${slug}`, currentTime.toString());
        }
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [isPlaying, currentTime, duration, slug]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(e => {
            console.error("Playback failed:", e);
            setIsPlaying(false);
          });
        }
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, setIsPlaying]);

  const togglePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const dur = audioRef.current.duration;
      setCurrentTime(current);
      if (dur > 0) {
        setProgress((current / dur) * 100);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      if (hasResumed && savedTime > 0) {
        audioRef.current.currentTime = savedTime;
      }
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

  const handleRewind = (e: React.MouseEvent) => {
    e.preventDefault();
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
    }
  };

  const handleForward = (e: React.MouseEvent) => {
    e.preventDefault();
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 10);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.preventDefault();
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
      if (val === 0) {
        setIsMuted(true);
        audioRef.current.muted = true;
      } else if (isMuted) {
        setIsMuted(false);
        audioRef.current.muted = false;
      }
    }
  };

  const cycleSpeed = (e: React.MouseEvent) => {
    e.preventDefault();
    const speeds = [0.75, 1, 1.25, 1.5, 2];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    setPlaybackSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const handleResumeChoice = (resume: boolean) => {
    setHasResumed(true);
    if (resume && audioRef.current) {
      audioRef.current.currentTime = savedTime;
      setIsPlaying(true);
    } else {
      localStorage.removeItem(`podcast_progress_${slug}`);
      setSavedTime(0);
      setIsPlaying(true);
    }
  };

  const defaultOnEnded = () => setIsPlaying(false);

  const isCompact = variant === 'compact';

  return (
    <div className={`w-full bg-[#0a1f15] relative overflow-hidden text-[#eef3f1] border border-[#1e3f30] ${isCompact ? 'rounded-2xl p-6 md:p-8 shadow-2xl' : 'rounded-3xl p-6 md:p-10 lg:p-12 shadow-[0_20px_50px_rgba(10,31,21,0.25)]'}`}>
      
      {/* Subtle Islamic architectural pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\\"60\\" height=\\"60\\" viewBox=\\"0 0 60 60\\" xmlns=\\"http://www.w3.org/2000/svg\\"%3E%3Cpath d=\\"M30 0l30 30-30 30L0 30z\\" fill=\\"%23c8a136\\" fill-opacity=\\"1\\" fill-rule=\\"evenodd\\"/%3E%3C/svg%3E")' }}></div>

      <audio 
        ref={audioRef} 
        src={cleanAudioSrc} 
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={onEnded || defaultOnEnded}
      />

      {!hasResumed && savedTime > 0 && (
        <div className="mb-6 bg-[#1a3828] border border-[#2D5A46] rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in relative z-20">
          <div className="text-sm font-medium text-[#eef3f1]">
            You left off at <span className="font-bold text-[#c8a136]">{formatTime(savedTime)}</span>
          </div>
          <div className="flex gap-3">
            <button onClick={() => handleResumeChoice(false)} className="px-4 py-2 text-sm text-[#7ea99a] hover:text-[#eef3f1] transition-colors">
              Start Over
            </button>
            <button onClick={() => handleResumeChoice(true)} className="px-4 py-2 text-sm bg-[#c8a136] text-[#0a1f15] rounded-full hover:bg-white transition-colors font-bold tracking-wide">
              Resume
            </button>
          </div>
        </div>
      )}

      {isCompact ? (
        // COMPACT VARIANT (Homepage)
        <div className="relative z-10 flex flex-col gap-6 md:gap-8">
          <div className="flex flex-col sm:flex-row gap-6 sm:items-center justify-between">
            <div className="flex items-center gap-5">
              {podcast?.customThumbnail || podcast?.artwork ? (
                <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-[#2D5A46] relative shadow-lg">
                  <OptimizedImage src={podcast.customThumbnail || podcast.artwork} alt={title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a1f15]/80 to-transparent"></div>
                </div>
              ) : null}
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#c8a136]">
                  <span>{podcast?.category || 'Podcast'}</span>
                  {podcast?.episodeNumber && <span>• EP {podcast.episodeNumber}</span>}
                </div>
                <Link to={`/podcasts/${slug}`} className="hover:text-[#c8a136] transition-colors focus:outline-none focus:text-[#c8a136]">
                  <h3 className="font-heading font-bold text-2xl line-clamp-1 text-white">{title}</h3>
                </Link>
              </div>
            </div>
          </div>
          
          <div className="w-full">
            <div className="relative w-full h-8 flex items-center group mb-1">
              <div className="absolute inset-x-0 h-px bg-[#1e3f30]"></div>
              <div className="absolute left-0 h-px bg-[#c8a136]" style={{ width: `${progress}%` }}></div>
              <div className="absolute h-3 w-3 bg-[#c8a136] rounded-full transform -translate-x-1/2 shadow-[0_0_10px_rgba(200,161,54,0.5)] group-hover:scale-125 transition-transform pointer-events-none" style={{ left: `${progress}%` }}></div>
              <input type="range" min="0" max="100" value={progress || 0} onChange={handleSeek} className="absolute inset-0 w-full opacity-0 cursor-pointer" aria-label="Seek podcast" />
            </div>
            <div className="flex justify-between text-[10px] font-bold tracking-wider text-[#60834f] uppercase tabular-nums">
              <span className="text-[#c8a136]">{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="w-1/3">
               <button onClick={cycleSpeed} className="text-[#60834f] hover:text-[#c8a136] transition-colors font-bold tracking-widest text-[11px] uppercase focus:outline-none" aria-label="Playback speed">
                 {playbackSpeed}× SPD
               </button>
            </div>
            <div className="w-1/3 flex justify-center items-center gap-6">
              <button onClick={handleRewind} className="text-[#60834f] hover:text-[#eef3f1] transition-colors hidden sm:block focus:outline-none" aria-label="Rewind 10 seconds"><Rewind size={20} /></button>
              <button onClick={togglePlay} className="relative group w-16 h-16 flex items-center justify-center focus:outline-none" aria-label={isPlaying ? "Pause" : "Play"}>
                <div className="absolute inset-0 rounded-full border border-[#2D5A46] group-hover:border-[#c8a136]/50 transition-colors duration-500"></div>
                <div className="w-12 h-12 bg-white text-[#0a1f15] rounded-full flex items-center justify-center group-hover:shadow-[0_0_20px_rgba(200,161,54,0.4)] group-hover:bg-[#c8a136] transition-all z-10">
                  {isPlaying ? <Pause size={20} className="fill-current" /> : <Play size={20} className="fill-current ml-1" />}
                </div>
              </button>
              <button onClick={handleForward} className="text-[#60834f] hover:text-[#eef3f1] transition-colors hidden sm:block focus:outline-none" aria-label="Forward 10 seconds"><FastForward size={20} /></button>
            </div>
            <div className="w-1/3 flex justify-end items-center gap-2 group">
               <button onClick={toggleMute} className="text-[#60834f] hover:text-[#c8a136] transition-colors focus:outline-none" aria-label="Toggle mute">
                 {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
               </button>
               <input type="range" min="0" max="1" step="0.01" value={isMuted ? 0 : volume} onChange={handleVolumeChange} className="w-16 h-1 bg-[#1e3f30] appearance-none cursor-pointer accent-[#c8a136] opacity-0 group-hover:opacity-100 transition-opacity hidden md:block" aria-label="Volume" />
            </div>
          </div>
        </div>
      ) : (
        // EXPANDED VARIANT (Dedicated Episode Page)
        <div className="relative z-10 flex flex-col gap-10">
          <div className="w-full flex flex-col gap-6">
             <div className="flex justify-between items-end text-[#60834f] tabular-nums font-medium px-1">
               <span className="text-[#c8a136] text-3xl font-light tracking-tight">{formatTime(currentTime)}</span>
               <span className="text-lg">{formatTime(duration)}</span>
             </div>
             
             <div className="relative w-full h-16 flex items-center group">
               {/* Decorative architectural waveform in background */}
               <div className="absolute inset-0 opacity-15 pointer-events-none overflow-hidden flex items-center justify-center">
                  <PodcastWaveform audioRef={audioRef} isPlaying={isPlaying} />
               </div>

               <div className="absolute inset-x-0 h-px bg-[#1e3f30]"></div>
               <div className="absolute left-0 h-[2px] bg-[#c8a136]" style={{ width: `${progress}%` }}></div>
               <div className="absolute h-8 w-1 bg-[#c8a136] transform -translate-x-1/2 shadow-[0_0_20px_rgba(200,161,54,1)] group-hover:scale-y-125 transition-transform pointer-events-none" style={{ left: `${progress}%` }}></div>
               
               <input type="range" min="0" max="100" value={progress || 0} onChange={handleSeek} className="absolute inset-0 w-full opacity-0 cursor-pointer z-10" aria-label="Seek podcast" />
             </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="w-1/4">
               <button onClick={cycleSpeed} className="text-[#60834f] hover:text-[#c8a136] transition-colors font-bold tracking-widest text-xs uppercase focus:outline-none" aria-label="Playback speed">
                 {playbackSpeed}× Speed
               </button>
            </div>
            
            <div className="w-2/4 flex items-center justify-center gap-8 md:gap-12">
               <button onClick={handleRewind} className="text-[#60834f] hover:text-white transition-colors transform hover:-translate-x-1 focus:outline-none" aria-label="Rewind 10 seconds"><Rewind size={24} /></button>
               <button onClick={togglePlay} className="relative group w-24 h-24 flex items-center justify-center focus:outline-none" aria-label={isPlaying ? "Pause" : "Play"}>
                 <div className="absolute inset-0 rounded-full border border-[#c8a136]/30 group-hover:border-[#c8a136] group-hover:scale-105 transition-all duration-500"></div>
                 <div className={`absolute inset-3 rounded-full border border-dashed border-[#60834f] opacity-50 ${isPlaying ? 'animate-[spin_8s_linear_infinite]' : ''}`}></div>
                 <div className="w-16 h-16 bg-[#c8a136] text-[#0a1f15] rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(200,161,54,0.3)] group-hover:bg-white transition-colors z-10">
                    {isPlaying ? <Pause size={28} className="fill-current" /> : <Play size={28} className="fill-current ml-1" />}
                 </div>
               </button>
               <button onClick={handleForward} className="text-[#60834f] hover:text-white transition-colors transform hover:translate-x-1 focus:outline-none" aria-label="Forward 10 seconds"><FastForward size={24} /></button>
            </div>

            <div className="w-1/4 flex justify-end items-center gap-3 group">
               <button onClick={toggleMute} className="text-[#60834f] hover:text-[#c8a136] transition-colors focus:outline-none" aria-label="Toggle mute">
                 {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
               </button>
               <input type="range" min="0" max="1" step="0.01" value={isMuted ? 0 : volume} onChange={handleVolumeChange} className="w-24 h-[2px] bg-[#1e3f30] appearance-none cursor-pointer accent-[#c8a136] opacity-0 group-hover:opacity-100 transition-opacity hidden md:block" aria-label="Volume" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
