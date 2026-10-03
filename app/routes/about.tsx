import { useLoaderData, Link, useRouteLoaderData } from "@remix-run/react";
import { json, type MetaFunction } from "@remix-run/cloudflare";
import { ArrowRight, ExternalLink } from "lucide-react";
import * as FaIcons from "react-icons/fa";
import { OptimizedImage } from "~/components/OptimizedImage";
import { CompactHero } from "~/components/CompactHero";

const renderIcon = (iconName: string) => {
  if (!iconName) return <FaIcons.FaGlobe size={24} />;
  const IconComponent = (FaIcons as any)[iconName];
  return IconComponent ? <IconComponent size={24} /> : <FaIcons.FaGlobe size={24} />;
};

export const meta: MetaFunction = ({ location }) => {
  const url = `https://samasthagraph.pages.dev${location.pathname}`;
  return [
    { title: "About Samastha Graph" },
    { name: "description", content: "The collective voice of Samastha" },
    { property: "og:title", content: "About Samastha Graph" },
    { property: "og:url", content: url },
    { tagName: "link", rel: "canonical", href: url },
    { tagName: "link", rel: "alternate", hreflang: "ml", href: "https://samasthagraph.pages.dev/about" },
    { tagName: "link", rel: "alternate", hreflang: "en", href: "https://samasthagraph.pages.dev/en/about" }
  ];
};

export const loader = async () => {
  let aboutData = null;
  try {
    const aboutFiles = import.meta.glob("../content/settings/about.json", { import: 'default', eager: true });
    aboutData = Object.values(aboutFiles)[0] || null;
  } catch (e) {}

  const data = aboutData || {
    hero: {
      eyebrow: "About Samastha Graph",
      statement: "The collective voice of Samastha",
      introText: "Samastha Graph is the official digital broadcasting network.",
      image: "https://images.unsplash.com/photo-1577563908411-5077b6dc7624?q=80&w=2070&auto=format&fit=crop"
    },
    story: {
      text: "Samastha Kerala Jam'iyyathul Ulama, established in 1926...",
      image: "https://images.unsplash.com/photo-1584697964400-2af6a2f6204c?q=80&w=1974&auto=format&fit=crop"
    },
    mission: [],
    gallery: {
      large: "https://images.unsplash.com/photo-1542810634-71277d95dcbb?q=80&w=2070&auto=format&fit=crop",
      portrait: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=2070&auto=format&fit=crop",
      square: "https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?q=80&w=1974&auto=format&fit=crop",
      secondary: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=2070&auto=format&fit=crop"
    },
    work: [],
    cta: {
      title: "Join Our Mission",
      description: "Become a part of the Samastha Graph community. Explore our latest articles or reach out to collaborate with us."
    }
  };

  const localAbout = import.meta.glob("../content/settings/about.json", { import: 'default', eager: true });
  for (const path in localAbout) {
    aboutData = localAbout[path] as any;
  }

  return json({ data: aboutData });
};

export default function About() {
  const { data } = useLoaderData<typeof loader>();
  const rootData = useRouteLoaderData("root") as any;
  const socialPlatforms = (rootData?.socialPlatforms?.platforms || []).filter((l: any) => l.active !== false).sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
  const podcastPlatforms = (rootData?.podcastPlatforms?.platforms || []).filter((l: any) => l.active !== false).sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

  return (
    <div className="bg-brand-light min-h-screen font-sans text-gray-800">
      
      <CompactHero
        eyebrow={data.hero?.eyebrow || 'About Samastha Graph'}
        title={<>The Collective <span className="text-[#c8a136]">Voice</span> of Samastha.</>}
        subtitle={data.hero?.statement || "A Century of Scholarly Heritage, Broadcasting in the Digital Age"}
        description={data.hero?.introText || data.hero?.intro || "Samastha Graph is the official digital broadcasting network of Samastha Kerala Jam'iyyathul Ulama, bringing timeless Islamic scholarship to contemporary platforms."}
        actions={
          <div className="flex flex-wrap gap-4 pt-2">
            <a href="#our-story" className="bg-[#c8a136] text-[#15664a] font-bold px-8 py-3.5 rounded-full hover:bg-yellow-500 transition-all shadow-lg shadow-[#c8a136]/20 inline-flex items-center gap-2 text-sm uppercase tracking-wider">
              Explore Our Story →
            </a>
            <Link to="/profile" className="bg-transparent border-2 border-white/60 text-white font-semibold px-8 py-3.5 rounded-full hover:bg-white hover:text-[#15664a] transition-all inline-flex items-center gap-2 text-sm uppercase tracking-wider">
              Official Profile
            </Link>
          </div>
        }
        align="left"
        sideContent={
          <div className="relative group cursor-pointer block w-full text-left">
            <div className="absolute inset-0 bg-[#c8a136] rounded-2xl transform rotate-3 scale-105 opacity-20 transition-transform group-hover:rotate-6"></div>
            <div className="relative bg-black border border-[#2D5A46] rounded-2xl overflow-hidden shadow-2xl aspect-video flex items-center justify-center">
              {data.hero?.image ? (
                <OptimizedImage src={data.hero.image} alt="Samastha Graph Institution" priority={true} className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity" />
              ) : (
                <div className="w-full h-full bg-[#133022] flex flex-col items-center justify-center">
                  <span className="text-[#c8a136] opacity-70 font-heading font-bold text-2xl">Samastha Graph</span>
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/40 to-transparent">
                <span className="bg-[#15664a] text-white text-xs font-bold px-2.5 py-1 rounded mb-2 inline-block uppercase">
                  Heritage &amp; Broadcasting
                </span>
                <h3 className="font-heading font-bold text-lg text-white line-clamp-1">Since 1926 • Connecting Generations</h3>
              </div>
            </div>
          </div>
        }
      />

      <section className="py-24 bg-white relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-16">
          <h2 className="text-sm font-bold tracking-[0.2em] text-brand-olive uppercase mb-4">Our Story</h2>
          <p className="text-2xl md:text-3xl leading-relaxed text-brand-dark font-heading font-medium">
            "{data.story?.text}"
          </p>
        </div>
        
        {data.story?.image && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="aspect-[21/9] rounded-3xl overflow-hidden shadow-lg relative">
              <OptimizedImage src={data.story.image} alt="Our Journey" priority={true} className="w-full h-full object-cover" />
            </div>
          </div>
        )}
      </section>

      <section className="py-24 bg-brand-surface/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-brand-dark">Our Pillars</h2>
            <div className="w-24 h-1 bg-brand-gold mx-auto mt-6 rounded-full"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {data.mission?.map((item: any, idx: number) => (
              <div key={idx} className="bg-white p-10 rounded-3xl shadow-sm border border-brand-surface hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
                <div className="w-16 h-16 bg-brand-light rounded-2xl flex items-center justify-center mb-6 text-brand-olive">
                  <FaIcons.FaStar size={28} />
                </div>
                <h3 className="text-2xl font-bold font-heading text-brand-dark mb-4">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {data.gallery && (
        <section className="py-24 bg-brand-dark text-white overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 text-center">
             <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mb-4">A Visual Journey</h2>
             <p className="text-brand-surface max-w-2xl mx-auto">Glimpses into our events, community gatherings, and history.</p>
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[250px]">
              {data.gallery.large && (
                <div className="relative rounded-2xl overflow-hidden group md:col-span-2 md:row-span-2">
                  <div className="absolute inset-0 bg-brand-dark/20 group-hover:bg-transparent transition-colors duration-500 z-10"></div>
                  <OptimizedImage src={data.gallery.large} alt="Gallery Large" className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-in-out" />
                </div>
              )}
              {data.gallery.portrait && (
                <div className="relative rounded-2xl overflow-hidden group md:col-span-1 md:row-span-2">
                  <div className="absolute inset-0 bg-brand-dark/20 group-hover:bg-transparent transition-colors duration-500 z-10"></div>
                  <OptimizedImage src={data.gallery.portrait} alt="Gallery Portrait" className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-in-out" />
                </div>
              )}
              {data.gallery.square && (
                <div className="relative rounded-2xl overflow-hidden group md:col-span-1 md:row-span-1">
                  <div className="absolute inset-0 bg-brand-dark/20 group-hover:bg-transparent transition-colors duration-500 z-10"></div>
                  <OptimizedImage src={data.gallery.square} alt="Gallery Square" className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-in-out" />
                </div>
              )}
              {data.gallery.secondary && (
                <div className="relative rounded-2xl overflow-hidden group md:col-span-1 md:row-span-1">
                  <div className="absolute inset-0 bg-brand-dark/20 group-hover:bg-transparent transition-colors duration-500 z-10"></div>
                  <OptimizedImage src={data.gallery.secondary} alt="Gallery Secondary" className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-in-out" />
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      <section className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="mb-16">
            <span className="text-sm font-bold tracking-[0.2em] text-brand-olive uppercase mb-4 block">Connect</span>
            <h2 className="text-4xl font-heading font-bold text-brand-dark">Our Digital Identity</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {socialPlatforms.map((platform: any) => (
              <a 
                key={platform.id} 
                href={platform.url} 
                target="_blank" 
                rel="noreferrer"
                className={`group relative overflow-hidden rounded-3xl p-8 border transition-all duration-500 flex flex-col ${
                  platform.featured 
                    ? 'bg-brand-dark border-brand-dark shadow-xl hover:shadow-2xl hover:shadow-brand-dark/20 text-white' 
                    : 'bg-brand-light border-brand-surface hover:bg-white hover:border-brand-olive/30 hover:shadow-xl text-brand-dark'
                }`}
              >
                <div className="flex justify-between items-start mb-12">
                  <div className={`p-4 rounded-2xl ${platform.featured ? 'bg-white/10 text-brand-gold' : 'bg-white shadow-sm text-brand-olive group-hover:bg-brand-olive group-hover:text-white transition-colors duration-300'}`}>
                    {renderIcon(platform.icon)}
                  </div>
                  <ExternalLink size={20} className={platform.featured ? 'text-white/40 group-hover:text-white/80 transition-colors' : 'text-gray-400 group-hover:text-brand-olive transition-colors'} />
                </div>
                
                <div className="mt-auto">
                  <h3 className="font-heading font-bold text-2xl mb-1">{platform.name}</h3>
                  <div className={`text-sm font-medium mb-3 ${platform.featured ? 'text-brand-gold' : 'text-brand-olive'}`}>
                    {platform.username}
                  </div>
                  <p className={`text-sm ${platform.featured ? 'text-brand-surface' : 'text-gray-600'}`}>
                    {platform.description}
                  </p>
                </div>
              </a>
            ))}
          </div>

          {podcastPlatforms && podcastPlatforms.length > 0 && (
            <div className="mt-16 border-t border-brand-surface/50 pt-16">
              <h3 className="text-2xl font-heading font-bold text-brand-dark mb-8">Listen to Our Podcasts</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {podcastPlatforms.map((podcast: any, idx: number) => (
                  <a 
                    key={idx}
                    href={podcast.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-4 p-4 rounded-2xl border border-brand-surface bg-white hover:border-brand-olive/50 hover:shadow-md transition-all group"
                  >
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-brand-light flex-shrink-0 relative">
                      {podcast.artwork ? (
                        <OptimizedImage src={podcast.artwork} alt={podcast.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-brand-olive"><FaIcons.FaHeadphones /></div>
                      )}
                      <div className="absolute inset-0 bg-brand-dark/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                         <FaIcons.FaPlay className="text-white text-xs" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-brand-dark text-sm leading-tight group-hover:text-brand-olive transition-colors">{podcast.title}</h4>
                      <p className="text-xs text-brand-muted mt-1 capitalize">{podcast.platform}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

        </div>
      </section>

      <section className="bg-[#c1d5cd] py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-brand-olive" style={{ maskImage: 'linear-gradient(to bottom, transparent, black)' }}></div>
        <div className="mx-auto max-w-4xl px-6 text-center relative z-10">
          <span className="text-xs font-bold tracking-[0.2em] text-[#15664a] uppercase">
            Stay With Us
          </span>
          <h2 className="mt-4 font-heading font-bold text-4xl text-[#15664a] sm:text-5xl">
            {data.cta?.title || "Join Our Journey"}
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-700 leading-relaxed font-body">
            {data.cta?.description || "Become a part of the Samastha Graph community. Explore our latest articles or reach out to collaborate with us."}
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              to="/articles"
              className="inline-flex items-center gap-2 rounded-full bg-[#15664a] px-8 py-4 font-bold text-white transition hover:bg-[#60834f] hover:-translate-y-1 shadow-lg hover:shadow-xl"
            >
              Explore Articles
              <ArrowRight size={18} />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-full border-2 border-[#15664a] bg-transparent px-8 py-4 font-bold text-[#15664a] transition hover:bg-white hover:-translate-y-1 shadow-sm hover:shadow-md"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}