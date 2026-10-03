import { Link, useLocation } from "@remix-run/react";
import { Search } from "lucide-react";
import { useState } from "react";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const prefix = location.pathname.startsWith("/en") ? "/en/" : "/";

  return (
    <nav className="bg-brand-dark text-brand-light sticky top-0 z-50 shadow-lg border-b border-brand-olive/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center space-x-3">
            <Link to={prefix} className="flex items-center gap-3">
              <img src="/Logo_white.png" alt="Samastha Graph Logo" className="h-14 w-auto object-contain" />
            </Link>
          </div>
          
          <div className="hidden md:flex space-x-8 items-center">
            <Link to={prefix} className="text-brand-light hover:text-brand-gold transition-colors font-medium text-sm uppercase tracking-wide">Home</Link>
            <Link to={`${prefix}videos`.replace('//', '/')} className="text-brand-light hover:text-brand-gold transition-colors font-medium text-sm uppercase tracking-wide">Videos</Link>
            <Link to={`${prefix}podcasts`.replace('//', '/')} className="text-brand-light hover:text-brand-gold transition-colors font-medium text-sm uppercase tracking-wide">Podcasts</Link>
            <Link to={`${prefix}articles`.replace('//', '/')} className="text-brand-light hover:text-brand-gold transition-colors font-medium text-sm uppercase tracking-wide">Articles</Link>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <Link to="/search" className="text-brand-light hover:text-brand-gold transition-colors p-2 rounded-full hover:bg-brand-olive/20">
              <Search size={20} />
            </Link>
            <LanguageSwitcher />
          </div>

          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="relative w-8 h-8 flex flex-col justify-center items-center z-50 focus:outline-none text-brand-light hover:text-brand-gold transition-colors"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
              {/* Top Line */}
              <span 
                className={`absolute h-0.5 w-6 bg-current transform transition-all duration-300 ease-in-out ${
                  menuOpen ? 'rotate-45' : '-translate-y-1.5'
                }`} 
              />
              
              {/* Bottom Line */}
              <span 
                className={`absolute h-0.5 w-6 bg-current transform transition-all duration-300 ease-in-out ${
                  menuOpen ? '-rotate-45' : 'translate-y-1.5'
                }`} 
              />
            </button>
          </div>
        </div>
      </div>
      
      {menuOpen && (
        <div className="md:hidden bg-brand-dark border-t border-brand-olive">
          <div className="px-4 pt-2 pb-4 space-y-1">
            <Link onClick={() => setMenuOpen(false)} to={prefix} className="block px-3 py-2 rounded-md text-base font-medium text-brand-light hover:text-brand-gold hover:bg-brand-olive/20">Home</Link>
            <Link onClick={() => setMenuOpen(false)} to={`${prefix}videos`.replace('//', '/')} className="block px-3 py-2 rounded-md text-base font-medium text-brand-light hover:text-brand-gold hover:bg-brand-olive/20">Videos</Link>
            <Link onClick={() => setMenuOpen(false)} to={`${prefix}podcasts`.replace('//', '/')} className="block px-3 py-2 rounded-md text-base font-medium text-brand-light hover:text-brand-gold hover:bg-brand-olive/20">Podcasts</Link>
            <Link onClick={() => setMenuOpen(false)} to={`${prefix}articles`.replace('//', '/')} className="block px-3 py-2 rounded-md text-base font-medium text-brand-light hover:text-brand-gold hover:bg-brand-olive/20">Articles</Link>
            
            <div className="px-3 py-6 mt-4 border-t border-brand-olive">
              <form action="/search" method="get" className="relative group">
                <Search size={20} className="absolute left-0 top-1/2 transform -translate-y-1/2 text-brand-gold transition-colors duration-300 pointer-events-none" />
                <input 
                  type="search" 
                  name="q"
                  placeholder="SEARCH" 
                  className="w-full bg-transparent text-brand-light placeholder-brand-olive px-2 py-3 pl-10 text-sm tracking-widest uppercase font-medium focus:outline-none transition-colors duration-300 rounded-none"
                />
              </form>
            </div>
            
            <div className="px-3 py-2 flex items-center border-t border-brand-olive mt-2 pt-4">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}