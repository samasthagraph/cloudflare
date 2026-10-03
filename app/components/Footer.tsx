import { Link, useRouteLoaderData, useLocation } from "@remix-run/react";
import * as FaIcons from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import * as SiIcons from "react-icons/si";
import { Globe } from "lucide-react";

export function Footer() {
  const location = useLocation();
  const prefix = location.pathname.startsWith("/en") ? "/en/" : "/";
  const rootData = useRouteLoaderData("root") as any;
  const socialPlatforms = rootData?.socialPlatforms?.platforms?.filter((p: any) => p.active) || [];
  const podcastPlatforms = rootData?.podcastPlatforms?.platforms?.filter((p: any) => p.active) || [];

  const renderIcon = (iconName: string) => {
    if (!iconName) return <Globe size={18} />;
    if (iconName === "X") return <FaXTwitter size={18} />;
    
    // Explicit mappings for podcast platforms
    const lowerName = iconName.toLowerCase();
    if (lowerName === "spotify") return <SiIcons.SiSpotify size={18} />;
    if (lowerName.includes("jio saavn") || lowerName.includes("jiosaavn")) return <FaIcons.FaMusic size={18} />;
    if (lowerName.includes("apple")) return <SiIcons.SiApplepodcasts size={18} />;
    if (lowerName.includes("amazon")) return <FaIcons.FaAmazon size={18} />;
    if (lowerName.includes("youtube")) return <FaIcons.FaYoutube size={18} />;
    
    const FaComponent = (FaIcons as any)[`Fa${iconName}`] || (FaIcons as any)[iconName];
    if (FaComponent) return <FaComponent size={18} />;
    
    const SiComponent = (SiIcons as any)[`Si${iconName}`] || (SiIcons as any)[iconName];
    if (SiComponent) return <SiComponent size={18} />;

    return <Globe size={18} />;
  };

  return (
    <footer className="bg-[#0f4a35] text-brand-surface py-12 border-t-4 border-[#c8a136]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-6">
            <Link to={prefix} className="block mb-6">
              <img src="/Logo_white.png" alt="Samastha Graph Logo" className="h-20 w-auto object-contain object-left" />
            </Link>
            {/* Premium Social Media Dock */}
            <div className="flex items-center gap-3">
              {socialPlatforms
                .filter((p: any) => ["youtube", "facebook", "instagram"].includes(p.id))
                .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
                .map((platform: any) => (
                <a key={platform.id} href={platform.url} target="_blank" rel="noopener noreferrer"
                   className="w-10 h-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-white/90 hover:border-[#c8a136]/40 hover:bg-[#c8a136]/10 hover:text-[#c8a136] transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5">
                  {renderIcon(platform.icon)}
                </a>
              ))}
            </div>
            <Link
              to={`${prefix}profile`.replace('//', '/')}
              className="mt-4 inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-[#c8a136] transition-colors duration-300"
            >
              View all platforms <span>&rarr;</span>
            </Link>
          </div>
          <div>
            <h4 className="font-heading font-semibold text-white mb-4">Content</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to={`${prefix}videos`.replace('//', '/')} className="hover:text-[#c8a136] transition-colors">Latest Videos</Link></li>
              <li><Link to={`${prefix}podcasts`.replace('//', '/')} className="hover:text-[#c8a136] transition-colors">Audio Podcasts</Link></li>
              <li><Link to={`${prefix}articles`.replace('//', '/')} className="hover:text-[#c8a136] transition-colors">Articles</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-heading font-semibold text-white mb-4">Organization</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to={`${prefix}about`.replace('//', '/')} className="hover:text-[#c8a136] transition-colors">About Us</Link></li>
              <li><Link to={`${prefix}contact`.replace('//', '/')} className="hover:text-[#c8a136] transition-colors">Contact Us</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-heading font-semibold text-white mb-4">Audio Platforms</h4>
            <ul className="space-y-3 text-sm">
              {podcastPlatforms.sort((a: any, b: any) => (a.order || 0) - (b.order || 0)).map((platform: any) => (
                <li key={platform.id} className="flex items-center gap-3">
                  <a href={platform.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-white hover:text-[#c8a136] transition-colors duration-300">
                    {renderIcon(platform.icon)} {platform.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-brand-dark mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-brand-muted">
          <p>&copy; {new Date().getFullYear()} Samastha Graph. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
