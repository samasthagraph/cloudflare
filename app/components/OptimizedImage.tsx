import { useState, useEffect } from "react";
import { Image as ImageIcon } from "lucide-react";

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  priority?: boolean;
  fallbackSrc?: string;
}

export function OptimizedImage({ 
  src, 
  alt = "", 
  className = "", 
  priority = false, 
  width, 
  height, 
  fallbackSrc,
  referrerPolicy = "no-referrer",
  ...props 
}: OptimizedImageProps) {
  const [currentSrc, setCurrentSrc] = useState<string | undefined>(src);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setCurrentSrc(src);
    setError(false);
    setAttempt(0);
  }, [src]);

  const handleError = () => {
    if (!currentSrc) {
      setError(true);
      return;
    }

    // Attempt fallbacks for YouTube URLs
    if (currentSrc.includes("youtube.com") || currentSrc.includes("ytimg.com")) {
      if (currentSrc.includes("maxresdefault.jpg")) {
        // Fallback from maxres to hq
        setCurrentSrc(currentSrc.replace("maxresdefault.jpg", "hqdefault.jpg"));
        setAttempt((prev) => prev + 1);
        return;
      }
      if (currentSrc.includes("hqdefault.jpg")) {
        // Fallback from hq to mq
        setCurrentSrc(currentSrc.replace("hqdefault.jpg", "mqdefault.jpg"));
        setAttempt((prev) => prev + 1);
        return;
      }
      if (currentSrc.includes("img.youtube.com")) {
        // Fallback domain to i.ytimg.com
        setCurrentSrc(currentSrc.replace("img.youtube.com", "i.ytimg.com"));
        setAttempt((prev) => prev + 1);
        return;
      }
    }

    // If a fallbackSrc was provided and hasn't been tried yet
    if (fallbackSrc && currentSrc !== fallbackSrc && attempt < 3) {
      setCurrentSrc(fallbackSrc);
      setAttempt((prev) => prev + 1);
      return;
    }

    setError(true);
  };

  if (!currentSrc || error) {
    return (
      <div 
        className={`bg-brand-surface/20 flex flex-col items-center justify-center text-brand-muted ${className}`} 
        style={{ width, height }}
      >
        <ImageIcon className="opacity-50 mb-2" size={24} />
        <span className="text-[10px] uppercase font-bold tracking-wider opacity-60 px-2 text-center">
          {!src ? 'Missing' : 'Unavailable'}
        </span>
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchpriority={priority ? "high" : "auto"}
      referrerPolicy={referrerPolicy}
      className={className}
      onError={handleError}
      {...props}
    />
  );
}
