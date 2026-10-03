import { useLocation, useMatches, Link } from "@remix-run/react";
import { Globe } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export function LanguageSwitcher() {
  const location = useLocation();
  const matches = useMatches();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Determine current language namespace
  const isEnglish = location.pathname.startsWith("/en");

  // Find counterpart slug if provided by the leaf route loader
  const leafMatch = matches[matches.length - 1];
  const counterpartSlug = leafMatch?.data && typeof leafMatch.data === 'object' && 'counterpartSlug' in leafMatch.data 
    ? (leafMatch.data as any).counterpartSlug 
    : null;

  const determineTargetUrl = (targetLang: "ml" | "en") => {
    if (targetLang === "en" && isEnglish) return location.pathname + location.search;
    if (targetLang === "ml" && !isEnglish) return location.pathname + location.search;

    const isDetailRoute = /^\/(en\/)?(articles|videos|podcasts)\/[^\/]+$/.test(location.pathname);
    const basePath = location.pathname.replace(/^\/en/, "") || "/";

    if (isDetailRoute) {
      if (counterpartSlug) {
        // Paired translation exists
        const section = basePath.split("/")[1]; // articles, videos, or podcasts
        return targetLang === "en" ? `/en/${section}/${counterpartSlug}` : `/${section}/${counterpartSlug}`;
      } else {
        // No counterpart exists, redirect to index
        const section = basePath.split("/")[1];
        return targetLang === "en" ? `/en/${section}` : `/${section}`;
      }
    }

    // Static mapping
    return targetLang === "en" ? `/en${basePath === "/" ? "/" : basePath}` : basePath;
  };

  const englishUrl = determineTargetUrl("en");
  const malayalamUrl = determineTargetUrl("ml");

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-brand-light hover:text-brand-gold transition-colors p-2 rounded-full hover:bg-brand-olive/20 text-sm font-medium uppercase tracking-wide"
        aria-label="Change language"
      >
        <Globe size={20} />
        <span className="hidden sm:inline">{isEnglish ? "EN" : "ML"}</span>
      </button>

      {isOpen && (
        <div className="absolute left-0 md:left-auto md:right-0 mt-2 w-36 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 overflow-hidden">
          <div className="py-1" role="menu" aria-orientation="vertical">
            <Link
              to={malayalamUrl}
              onClick={() => setIsOpen(false)}
              className={`block px-4 py-2 text-sm ${!isEnglish ? "bg-brand-olive/10 text-brand-dark font-bold" : "text-gray-700 hover:bg-gray-100"}`}
              role="menuitem"
            >
              മലയാളം
            </Link>
            <Link
              to={englishUrl}
              onClick={() => setIsOpen(false)}
              className={`block px-4 py-2 text-sm ${isEnglish ? "bg-brand-olive/10 text-brand-dark font-bold" : "text-gray-700 hover:bg-gray-100"}`}
              role="menuitem"
            >
              English
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
