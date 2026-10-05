import React, { useState } from 'react';
import { PlayCircle, Image as ImageIcon, Sparkles, Sliders } from 'lucide-react';

interface HeroAdminProps {
  heroSettings: any;
  videos?: any[];
  articles?: any[];
}

export function HeroAdmin({ heroSettings, videos = [], articles = [] }: HeroAdminProps) {
  const defaultHero = {
    eyebrow: "SAMASTHA DIGITAL BROADCASTING",
    eyebrowMl: "സമസ്ത ഡിജിറ്റൽ ബ്രോഡ്കാസ്റ്റിംഗ്",
    title: "The Visual Universe of Islamic Knowledge",
    titleMl: "വിജ്ഞാനത്തിന്റെ ദൃശ്യ പ്രപഞ്ചം",
    description: "Authentic scholarship, educational series, thought-provoking articles, and multi-platform digital media curated under the auspices of Samastha Kerala Jam'iyyathul Ulama.",
    descriptionMl: "സമസ്ത കേരള ജംഇയ്യത്തുൽ ഉലമയുടെ ആഭിമുഖ്യത്തിൽ ആധികാരികമായ ഇസ്ലാമിക വിജ്ഞാനം, ഡോക്യുമെന്ററികൾ, പോഡ്‌കാസ്റ്റുകൾ, ലേഖനങ്ങൾ.",
    ctaPrimaryText: "Explore Videos",
    ctaPrimaryUrl: "/videos",
    ctaSecondaryText: "Listen to Podcasts",
    ctaSecondaryUrl: "/podcasts",
    badgeText: "100 Years of Scholarly Guidance",
    bgMediaUrl: "/images/cms/hero/hero-bg.webp",
    heroType: "video",
    videoSlug: "minal-qalb-episode-01"
  };

  const [hero, setHero] = useState(heroSettings || defaultHero);

  return (
    <div className="space-y-6">
      <input type="hidden" name="heroData" value={JSON.stringify(hero)} />

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
          <div className="p-2.5 bg-[#fdf2f4] text-[#861937] rounded-xl">
            <Sliders size={22} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Hero Section &amp; Main Banner Settings</h3>
            <p className="text-xs text-gray-500">Configure titles, bilingual descriptions, buttons, and featured background media.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Eyebrow / Tagline (English)</label>
            <input
              type="text"
              value={hero.eyebrow || ""}
              onChange={(e) => setHero({ ...hero, eyebrow: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#861937] outline-none text-sm"
              placeholder="e.g. SAMASTHA DIGITAL BROADCASTING"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Eyebrow / Tagline (Malayalam)</label>
            <input
              type="text"
              value={hero.eyebrowMl || ""}
              onChange={(e) => setHero({ ...hero, eyebrowMl: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#861937] outline-none text-sm font-malayalam"
              placeholder="സമസ്ത ഡിജിറ്റൽ ബ്രോഡ്കാസ്റ്റിംഗ്"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Main Headline (English) *</label>
            <input
              type="text"
              value={hero.title || ""}
              onChange={(e) => setHero({ ...hero, title: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#861937] outline-none text-sm font-medium"
              placeholder="The Visual Universe of Islamic Knowledge"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Main Headline (Malayalam) *</label>
            <input
              type="text"
              value={hero.titleMl || ""}
              onChange={(e) => setHero({ ...hero, titleMl: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#861937] outline-none text-sm font-malayalam font-medium"
              placeholder="വിജ്ഞാനത്തിന്റെ ദൃശ്യ പ്രപഞ്ചം"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Description (English)</label>
            <textarea
              value={hero.description || ""}
              onChange={(e) => setHero({ ...hero, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#861937] outline-none text-sm"
              placeholder="Detailed introduction..."
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Description (Malayalam)</label>
            <textarea
              value={hero.descriptionMl || ""}
              onChange={(e) => setHero({ ...hero, descriptionMl: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#861937] outline-none text-sm font-malayalam"
              placeholder="വിശദമായ ആമുഖം..."
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Primary CTA Button</h4>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Button Text</label>
              <input
                type="text"
                value={hero.ctaPrimaryText || ""}
                onChange={(e) => setHero({ ...hero, ctaPrimaryText: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm"
                placeholder="Explore Videos"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Button URL</label>
              <input
                type="text"
                value={hero.ctaPrimaryUrl || ""}
                onChange={(e) => setHero({ ...hero, ctaPrimaryUrl: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm"
                placeholder="/videos"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Secondary CTA Button</h4>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Button Text</label>
              <input
                type="text"
                value={hero.ctaSecondaryText || ""}
                onChange={(e) => setHero({ ...hero, ctaSecondaryText: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm"
                placeholder="Listen to Podcasts"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Button URL</label>
              <input
                type="text"
                value={hero.ctaSecondaryUrl || ""}
                onChange={(e) => setHero({ ...hero, ctaSecondaryUrl: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm"
                placeholder="/podcasts"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Highlight Badge Text</label>
            <input
              type="text"
              value={hero.badgeText || ""}
              onChange={(e) => setHero({ ...hero, badgeText: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#861937] outline-none text-sm"
              placeholder="e.g. 100 Years of Scholarly Guidance"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Background Image / Poster URL</label>
            <input
              type="text"
              value={hero.bgMediaUrl || ""}
              onChange={(e) => setHero({ ...hero, bgMediaUrl: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#861937] outline-none text-sm"
              placeholder="/images/cms/hero/hero-bg.webp"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
