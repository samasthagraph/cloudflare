import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface CompactHeroProps {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  sideContent?: React.ReactNode;
  className?: string;
  align?: 'left' | 'center';
  variant?: 'section' | 'editorial' | 'home';
  onPrev?: () => void;
  onNext?: () => void;
  currentSlide?: number;
  totalSlides?: number;
  onSelectSlide?: (index: number) => void;
}

export function CompactHero({ 
  eyebrow,
  title, 
  subtitle, 
  description,
  actions,
  children, 
  sideContent, 
  className = "", 
  align = 'left',
  variant = 'section',
  onPrev,
  onNext,
  currentSlide = 0,
  totalSlides = 0,
  onSelectSlide
}: CompactHeroProps) {
  const showNav = Boolean(onPrev && onNext && totalSlides > 1);

  return (
    <section className={`relative hero-pattern text-white py-14 sm:py-16 lg:py-24 overflow-hidden bg-[#15664a] ${className}`}>
      {/* Atmospheric glowing orbs */}
      <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-brand-olive rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-72 h-72 bg-brand-muted rounded-full mix-blend-multiply filter blur-3xl opacity-30 pointer-events-none"></div>
      <div className="absolute inset-0 opacity-[0.04] bg-[url('/islamic-pattern.png')] pointer-events-none"></div>

      {/* Left Navigation Chevron */}
      {showNav && (
        <button
          onClick={onPrev}
          type="button"
          aria-label="Previous Slide"
          className="absolute left-1.5 sm:left-4 lg:left-6 top-1/2 -translate-y-1/2 z-30 p-1.5 sm:p-3 text-[#c8a136] hover:text-white bg-black/30 hover:bg-black/50 border border-[#c8a136]/30 hover:border-[#c8a136] rounded-full transition-all duration-300 backdrop-blur-sm group hover:scale-110 active:scale-95 shadow-xl"
        >
          <ChevronLeft className="w-5 h-5 sm:w-8 sm:h-8 stroke-[2.5] transition-transform group-hover:-translate-x-0.5" />
        </button>
      )}

      {/* Right Navigation Chevron */}
      {showNav && (
        <button
          onClick={onNext}
          type="button"
          aria-label="Next Slide"
          className="absolute right-1.5 sm:right-4 lg:right-6 top-1/2 -translate-y-1/2 z-30 p-1.5 sm:p-3 text-[#c8a136] hover:text-white bg-black/30 hover:bg-black/50 border border-[#c8a136]/30 hover:border-[#c8a136] rounded-full transition-all duration-300 backdrop-blur-sm group hover:scale-110 active:scale-95 shadow-xl"
        >
          <ChevronRight className="w-5 h-5 sm:w-8 sm:h-8 stroke-[2.5] transition-transform group-hover:translate-x-0.5" />
        </button>
      )}

      <div className={`max-w-7xl mx-auto ${showNav ? 'px-10 sm:px-14 lg:px-16' : 'px-4 sm:px-6 lg:px-8'} relative z-10`}>
        <div className={`grid grid-cols-1 ${sideContent ? 'lg:grid-cols-2' : ''} gap-8 lg:gap-12 items-center ${align === 'center' ? 'text-center' : 'text-left'}`}>
          
          <div className={`space-y-4 sm:space-y-6 ${align === 'center' ? 'mx-auto flex flex-col items-center' : ''}`}>
            {eyebrow && (
              <div>
                <div className="inline-flex items-center gap-2 bg-brand-gold/20 border border-brand-gold text-brand-gold px-3.5 py-1 sm:px-4 sm:py-1.5 rounded-full text-xs sm:text-sm font-semibold tracking-wide backdrop-blur-sm shadow-sm">
                  {eyebrow}
                </div>
              </div>
            )}

            {children}

            <h1 className="font-heading text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-white transition-all duration-300 break-words">
              {title}
            </h1>

            {subtitle && (
              <p className="font-sans text-sm sm:text-lg md:text-xl text-brand-surface font-medium opacity-90 leading-snug transition-all duration-300 break-words">
                {subtitle}
              </p>
            )}

            {description && (
              <p className="text-xs sm:text-base md:text-lg text-brand-light/80 max-w-xl leading-relaxed transition-all duration-300 break-words">
                {description}
              </p>
            )}

            {actions && (
              <div className={`flex flex-wrap gap-4 pt-2 ${align === 'center' ? 'justify-center' : ''}`}>
                {actions}
              </div>
            )}
          </div>

          {sideContent && (
            <div className="w-full relative mt-6 lg:mt-0 transition-all duration-300">
              {sideContent}
            </div>
          )}

        </div>

        {/* Slide indicators / dots */}
        {showNav && (
          <div className="flex items-center justify-center gap-2 mt-8 sm:mt-10 relative z-20">
            {Array.from({ length: totalSlides }).map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectSlide?.(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`h-2 rounded-full transition-all duration-300 ${
                  currentSlide === idx 
                    ? 'w-8 bg-[#c8a136] shadow-sm shadow-[#c8a136]/50' 
                    : 'w-2 bg-white/30 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
