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

    // Check if the URL is obviously an HTML page or known invalid image URL
    if (currentSrc && (/\.(html?|php|asp|aspx)(\?|#|$)/i.test(currentSrc) || currentSrc.includes("fbcdn.net"))) {
      if (fallbackSrc && currentSrc !== fallbackSrc) {
        setCurrentSrc(fallbackSrc);
        return;
      }
      setError(true);
      return;
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
        className={`bg-gradient-to-br from-[#1b3b2e] to-[#0f241c] flex flex-col items-center justify-center text-white/70 relative overflow-hidden select-none ${className}`} 
        style={{ width, height }}
      >
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#c8a136_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-1.5 text-[#c8a136] backdrop-blur-sm border border-white/10">
          <ImageIcon size={20} />
        </div>
        <span className="text-[10px] font-semibold tracking-wider text-white/60 uppercase font-heading">
          Samastha Graph
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
