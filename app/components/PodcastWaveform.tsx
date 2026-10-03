import React, { useEffect, useRef } from 'react';

interface PodcastWaveformProps {
  audioRef?: React.RefObject<HTMLAudioElement>;
  isPlaying: boolean;
}

export function PodcastWaveform({ isPlaying }: PodcastWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const barWidth = 4;
      const gap = 4;
      const numBars = Math.floor(width / (barWidth + gap));
      const isReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      for (let i = 0; i < numBars; i++) {
        let barHeight = 4; // minimum height

        if (!isReducedMotion && isPlaying) {
          const time = timeRef.current * 0.06;
          const val1 = Math.sin(time + i * 0.25);
          const val2 = Math.sin(time * 1.6 + i * 0.45);
          const val3 = Math.cos(time * 0.9 + i * 0.15);
          const combined = Math.abs((val1 + val2 + val3) / 3);
          barHeight = 4 + combined * height * 0.7;
        } else {
          // Static visual rhythm when paused
          const staticVal = Math.abs(Math.sin(i * 0.3)) * 0.3 + 0.1;
          barHeight = 4 + staticVal * height * 0.5;
        }

        const x = i * (barWidth + gap);
        const y = (height - barHeight) / 2;

        ctx.fillStyle = '#C5A059'; // Accent Gold
        ctx.globalAlpha = isPlaying ? 0.85 : 0.4;
        
        ctx.beginPath();
        if (typeof (ctx as any).roundRect === 'function') {
          (ctx as any).roundRect(x, y, barWidth, barHeight, 2);
        } else {
          ctx.rect(x, y, barWidth, barHeight);
        }
        ctx.fill();
      }

      if (isPlaying) {
        timeRef.current += 1;
      }
      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying]);

  return (
    <canvas 
      ref={canvasRef} 
      width={600} 
      height={64} 
      className="w-full h-full max-w-2xl"
    />
  );
}
