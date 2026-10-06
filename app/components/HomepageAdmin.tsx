import React, { useState, useMemo } from 'react';
import {
  Sparkles, FileText, Video, Mic, ExternalLink, Compass,
  Search, PlayCircle, Eye, CheckCircle2, ChevronRight, Layers, Layout
} from 'lucide-react';

interface HomepageAdminProps {
  homepageSettings: any;
  articles: any[];
  videos: any[];
}

export function HomepageAdmin({ homepageSettings, articles, videos }: HomepageAdminProps) {
  const defaultSettings = {
    hero: {
      enabled: true,
      badgeText: "",
      title: "Explore the <span class=\"text-brand-gold\">Universe</span> of Knowledge.",
      subtitle: "Samastha Graph — Exploring the Universe of Knowledge",
      description: "Dive into premium Islamic content, thought-provoking podcasts, and enlightening documentaries designed to inspire your spiritual journey.",
      primaryButtonText: "Watch Now",
      primaryButtonLink: "#videos",
      secondaryButtonText: "Listen to Podcasts",
      secondaryButtonLink: "#podcasts",
      type: "video",
      slug: "",
      layout: "cinematic",
      eyebrow: "FEATURED VIDEO",
      displayTitle: "",
      displayDescription: "",
      ctaText: "Watch Now"
    },
    articlesSection: {
      title: "Articles",
      subtitle: "Latest updates and heritage stories",
      viewAllText: "View All Articles",
      readStoryText: "Read Story"
    },
    videosSection: {
      title: "Videos",
      seeAllText: "See all",
      upcomingBadgeText: "Upcoming"
    },
    podcastsSection: {
      badgeText: "PODCAST",
      title: "Conversations that inform, educate and connect.",
      description: "Dive into deep discussions, heritage stories, and exclusive reflections from Samastha Graph.",
      exploreButtonText: "Explore Podcast",
      spotifyButtonText: "Also on Spotify",
      comingSoonText: "Podcast episodes coming soon."
    },
    fiqhSection: {
      badgeText: "Facility",
      title: "FIQH FILES",
      subtitle: "Questions of Fiqh. Clear answers.",
      description: "A dedicated platform for the public to explore Fiqh questions and answers.",
      buttonText: "Explore Fiqh Files",
      buttonUrl: "https://fiqhfiles.samasthagraph.com/"
    },
    exploreSection: {
      title: "Explore Samastha Graph",
      subtitle: "Discover more from Samastha Graph through our latest videos and podcasts.",
      videoCardTitle: "Videos",
      videoCardDescription: "Watch our latest programmes, lectures, and series from Samastha Graph.",
      podcastCardTitle: "Podcasts",
      podcastCardDescription: "Listen to deep-dive audio discussions, stories, and podcast episodes."
    }
  };

  const [activeTab, setActiveTab] = useState<'hero' | 'articles' | 'videos' | 'podcasts' | 'fiqh' | 'explore'>('hero');

  const [hero, setHero] = useState({ ...defaultSettings.hero, ...(homepageSettings?.hero || {}) });
  const [articlesSection, setArticlesSection] = useState({ ...defaultSettings.articlesSection, ...(homepageSettings?.articlesSection || {}) });
  const [videosSection, setVideosSection] = useState({ ...defaultSettings.videosSection, ...(homepageSettings?.videosSection || {}) });
  const [podcastsSection, setPodcastsSection] = useState({ ...defaultSettings.podcastsSection, ...(homepageSettings?.podcastsSection || {}) });
  const [fiqhSection, setFiqhSection] = useState({ ...defaultSettings.fiqhSection, ...(homepageSettings?.fiqhSection || {}) });
  const [exploreSection, setExploreSection] = useState({ ...defaultSettings.exploreSection, ...(homepageSettings?.exploreSection || {}) });

  const [searchTerm, setSearchTerm] = useState("");
  const availableItems = (hero?.type === 'video' ? videos : articles) || [];

  const filteredItems = useMemo(() => {
    if (!searchTerm) return availableItems;
    return availableItems.filter((item: any) =>
      (item.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.slug || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [availableItems, searchTerm]);

  const selectedItem = useMemo(() => {
    return availableItems.find((i: any) => i.slug === hero.slug);
  }, [availableItems, hero.slug]);

  const getThumbnail = (item: any) => {
    if (!item) return null;
    if (hero.type === 'video') {
      if (item.customThumbnail) return item.customThumbnail;
      let id = item.youtubeId;
      if (id && (id.includes('/') || id.includes('youtu'))) {
        try {
          const url = new URL(id.startsWith('http') ? id : `https://${id}`);
          if (url.hostname.includes('youtu.be')) id = url.pathname.slice(1);
          else if (url.searchParams.has('v')) id = url.searchParams.get('v');
        } catch (e) { }
      }
      return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
    } else {
      return item.coverImage || item.image || null;
    }
  };

  const selectedThumbnail = getThumbnail(selectedItem);

  const fullPayload = {
    hero,
    articlesSection,
    videosSection,
    podcastsSection,
    fiqhSection,
    exploreSection
  };

  return (
    <div className="space-y-6">
      {/* Hidden input storing the complete JSON payload for the form submission */}
      <input type="hidden" name="homepageData" value={JSON.stringify(fullPayload)} />

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('hero')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'hero'
              ? 'bg-[#15664a] text-white shadow-sm'
              : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <Sparkles size={16} /> Hero &amp; Banner
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('articles')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'articles'
              ? 'bg-[#15664a] text-white shadow-sm'
              : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <FileText size={16} /> Articles Section
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('videos')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'videos'
              ? 'bg-[#15664a] text-white shadow-sm'
              : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <Video size={16} /> Videos Section
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('podcasts')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'podcasts'
              ? 'bg-[#15664a] text-white shadow-sm'
              : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <Mic size={16} /> Podcasts Section
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('fiqh')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'fiqh'
              ? 'bg-[#15664a] text-white shadow-sm'
              : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <ExternalLink size={16} /> Fiqh Files Section
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('explore')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'explore'
              ? 'bg-[#15664a] text-white shadow-sm'
              : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <Compass size={16} /> Explore Samastha Graph
        </button>
      </div>

      {/* TAB 1: HERO & BANNER */}
      {activeTab === 'hero' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6 sm:p-8 space-y-6">
            <div className="border-b border-gray-100 pb-4">
              <h2 className="text-lg font-bold text-gray-900 font-heading">Hero Text &amp; Call-to-Action</h2>
              <p className="text-sm text-gray-500 mt-1">Configure the main headline, description, badge, and buttons on the top hero banner.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Hero Badge Text
                </label>
                <input
                  type="text"
                  value={hero.badgeText || ''}
                  onChange={(e) => setHero({ ...hero, badgeText: e.target.value })}
                  placeholder="e.g. Live & On-Demand"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#15664a] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Subtitle
                </label>
                <input
                  type="text"
                  value={hero.subtitle || ''}
                  onChange={(e) => setHero({ ...hero, subtitle: e.target.value })}
                  placeholder="e.g. Samastha Graph — Exploring the Universe of Knowledge"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#15664a] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Main Headline (HTML Allowed)
              </label>
              <input
                type="text"
                value={hero.title || ''}
                onChange={(e) => setHero({ ...hero, title: e.target.value })}
                placeholder="e.g. Explore the <span class='text-brand-gold'>Universe</span> of Knowledge."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-[#15664a] outline-none"
              />
              <p className="text-xs text-gray-400 mt-1.5">
                Tip: Wrap words in <code className="text-amber-700">&lt;span class="text-brand-gold"&gt;Word&lt;/span&gt;</code> to highlight them in gold.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Paragraph Description
              </label>
              <textarea
                rows={3}
                value={hero.description || ''}
                onChange={(e) => setHero({ ...hero, description: e.target.value })}
                placeholder="Dive into premium Islamic content, thought-provoking podcasts..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#15664a] outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Primary Button (Gold CTA)</h4>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Button Label</label>
                  <input
                    type="text"
                    value={hero.primaryButtonText || ''}
                    onChange={(e) => setHero({ ...hero, primaryButtonText: e.target.value })}
                    placeholder="e.g. Watch Now"
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#15664a] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Link URL / Anchor</label>
                  <input
                    type="text"
                    value={hero.primaryButtonLink || ''}
                    onChange={(e) => setHero({ ...hero, primaryButtonLink: e.target.value })}
                    placeholder="e.g. #videos or /videos"
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#15664a] outline-none"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Secondary Button (Outline CTA)</h4>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Button Label</label>
                  <input
                    type="text"
                    value={hero.secondaryButtonText || ''}
                    onChange={(e) => setHero({ ...hero, secondaryButtonText: e.target.value })}
                    placeholder="e.g. Listen to Podcasts"
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#15664a] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Link URL / Anchor</label>
                  <input
                    type="text"
                    value={hero.secondaryButtonLink || ''}
                    onChange={(e) => setHero({ ...hero, secondaryButtonLink: e.target.value })}
                    placeholder="e.g. #podcasts or /podcasts"
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#15664a] outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Featured Hero Media Card */}
          <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900 font-heading">Featured Hero Card (Right Side Showcase)</h2>
                <p className="text-sm text-gray-500 mt-1">Select a featured video or article to highlight in the hero banner.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={hero.enabled !== false}
                  onChange={(e) => setHero({ ...hero, enabled: e.target.checked })}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#15664a]"></div>
              </label>
            </div>

            {hero.enabled !== false && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => { setHero({ ...hero, type: 'video', slug: '' }); setSearchTerm(""); }}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold border transition-all ${
                      hero.type === 'video'
                        ? 'bg-[#15664a]/10 border-[#15664a] text-[#15664a] shadow-xs'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <PlayCircle size={18} /> Featured Video
                  </button>
                  <button
                    type="button"
                    onClick={() => { setHero({ ...hero, type: 'article', slug: '' }); setSearchTerm(""); }}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold border transition-all ${
                      hero.type === 'article'
                        ? 'bg-[#15664a]/10 border-[#15664a] text-[#15664a] shadow-xs'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <FileText size={18} /> Featured Article
                  </button>
                </div>

                {/* Selected Item Preview & Search */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Selected {hero.type === 'video' ? 'Video' : 'Article'}
                  </label>

                  <div className="relative mb-3">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder={`Search ${hero.type === 'video' ? 'videos' : 'articles'} by title or slug...`}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#15664a] outline-none"
                    />
                  </div>

                  <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100 bg-gray-50/50">
                    {filteredItems.map((item: any) => {
                      const isSelected = item.slug === hero.slug;
                      return (
                        <button
                          key={item.slug}
                          type="button"
                          onClick={() => setHero({ ...hero, slug: item.slug })}
                          className={`w-full text-left p-3 flex items-center justify-between hover:bg-white transition-colors ${
                            isSelected ? 'bg-emerald-50/80 font-semibold text-[#15664a]' : 'text-gray-800'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <p className="text-sm truncate">{item.title}</p>
                            <p className="text-[11px] text-gray-400 truncate">{item.slug}</p>
                          </div>
                          {isSelected && <CheckCircle2 size={16} className="text-[#15664a] flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Overrides */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Custom Eyebrow Tag (Optional)</label>
                    <input
                      type="text"
                      value={hero.eyebrow || ''}
                      onChange={(e) => setHero({ ...hero, eyebrow: e.target.value })}
                      placeholder="e.g. FEATURED VIDEO"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#15664a] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Custom Display Title (Optional Override)</label>
                    <input
                      type="text"
                      value={hero.displayTitle || ''}
                      onChange={(e) => setHero({ ...hero, displayTitle: e.target.value })}
                      placeholder="Leave blank to use original title"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#15664a] outline-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ARTICLES SECTION */}
      {activeTab === 'articles' && (
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6 sm:p-8 space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h2 className="text-lg font-bold text-gray-900 font-heading">Articles Section Settings</h2>
            <p className="text-sm text-gray-500 mt-1">Configure section headings and text links for the homepage articles grid.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Section Heading
              </label>
              <input
                type="text"
                value={articlesSection.title || ''}
                onChange={(e) => setArticlesSection({ ...articlesSection, title: e.target.value })}
                placeholder="e.g. Articles"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#15664a] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Section Subtitle
              </label>
              <input
                type="text"
                value={articlesSection.subtitle || ''}
                onChange={(e) => setArticlesSection({ ...articlesSection, subtitle: e.target.value })}
                placeholder="e.g. Latest updates and heritage stories"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#15664a] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                "View All Articles" Link Text
              </label>
              <input
                type="text"
                value={articlesSection.viewAllText || ''}
                onChange={(e) => setArticlesSection({ ...articlesSection, viewAllText: e.target.value })}
                placeholder="e.g. View All Articles"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#15664a] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Card "Read Story" Button Label
              </label>
              <input
                type="text"
                value={articlesSection.readStoryText || ''}
                onChange={(e) => setArticlesSection({ ...articlesSection, readStoryText: e.target.value })}
                placeholder="e.g. Read Story"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#15664a] outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: VIDEOS SECTION */}
      {activeTab === 'videos' && (
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6 sm:p-8 space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h2 className="text-lg font-bold text-gray-900 font-heading">Videos Section Settings</h2>
            <p className="text-sm text-gray-500 mt-1">Configure section title, "See all" link label, and upcoming badge text.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Section Heading
              </label>
              <input
                type="text"
                value={videosSection.title || ''}
                onChange={(e) => setVideosSection({ ...videosSection, title: e.target.value })}
                placeholder="e.g. Videos"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#15664a] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                "See all" Link Text
              </label>
              <input
                type="text"
                value={videosSection.seeAllText || ''}
                onChange={(e) => setVideosSection({ ...videosSection, seeAllText: e.target.value })}
                placeholder="e.g. See all"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#15664a] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                "Upcoming" Badge Label
              </label>
              <input
                type="text"
                value={videosSection.upcomingBadgeText || ''}
                onChange={(e) => setVideosSection({ ...videosSection, upcomingBadgeText: e.target.value })}
                placeholder="e.g. Upcoming"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#15664a] outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PODCASTS SECTION */}
      {activeTab === 'podcasts' && (
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6 sm:p-8 space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h2 className="text-lg font-bold text-gray-900 font-heading">Podcasts Section Settings</h2>
            <p className="text-sm text-gray-500 mt-1">Manage podcast banner text, badge, description, and action button labels.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Badge Label
              </label>
              <input
                type="text"
                value={podcastsSection.badgeText || ''}
                onChange={(e) => setPodcastsSection({ ...podcastsSection, badgeText: e.target.value })}
                placeholder="e.g. PODCAST"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#15664a] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                "Explore Podcast" Button Text
              </label>
              <input
                type="text"
                value={podcastsSection.exploreButtonText || ''}
                onChange={(e) => setPodcastsSection({ ...podcastsSection, exploreButtonText: e.target.value })}
                placeholder="e.g. Explore Podcast"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#15664a] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                "Also on Spotify" Button Text
              </label>
              <input
                type="text"
                value={podcastsSection.spotifyButtonText || ''}
                onChange={(e) => setPodcastsSection({ ...podcastsSection, spotifyButtonText: e.target.value })}
                placeholder="e.g. Also on Spotify"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#15664a] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Empty State Notice Text
              </label>
              <input
                type="text"
                value={podcastsSection.comingSoonText || ''}
                onChange={(e) => setPodcastsSection({ ...podcastsSection, comingSoonText: e.target.value })}
                placeholder="e.g. Podcast episodes coming soon."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#15664a] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Main Section Headline
            </label>
            <input
              type="text"
              value={podcastsSection.title || ''}
              onChange={(e) => setPodcastsSection({ ...podcastsSection, title: e.target.value })}
              placeholder="e.g. Conversations that inform, educate and connect."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#15664a] outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Paragraph Description
            </label>
            <textarea
              rows={3}
              value={podcastsSection.description || ''}
              onChange={(e) => setPodcastsSection({ ...podcastsSection, description: e.target.value })}
              placeholder="Dive into deep discussions, heritage stories..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#15664a] outline-none"
            />
          </div>
        </div>
      )}

      {/* TAB 5: FIQH FILES FACILITY SECTION */}
      {activeTab === 'fiqh' && (
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6 sm:p-8 space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h2 className="text-lg font-bold text-gray-900 font-heading">Fiqh Files Facility Section</h2>
            <p className="text-sm text-gray-500 mt-1">Configure the dedicated Fiqh Files interactive showcase on the homepage.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Badge Label
              </label>
              <input
                type="text"
                value={fiqhSection.badgeText || ''}
                onChange={(e) => setFiqhSection({ ...fiqhSection, badgeText: e.target.value })}
                placeholder="e.g. Facility"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#15664a] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Main Title
              </label>
              <input
                type="text"
                value={fiqhSection.title || ''}
                onChange={(e) => setFiqhSection({ ...fiqhSection, title: e.target.value })}
                placeholder="e.g. FIQH FILES"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#15664a] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Subtitle / Slogan
              </label>
              <input
                type="text"
                value={fiqhSection.subtitle || ''}
                onChange={(e) => setFiqhSection({ ...fiqhSection, subtitle: e.target.value })}
                placeholder="e.g. Questions of Fiqh. Clear answers."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#15664a] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Button Label
              </label>
              <input
                type="text"
                value={fiqhSection.buttonText || ''}
                onChange={(e) => setFiqhSection({ ...fiqhSection, buttonText: e.target.value })}
                placeholder="e.g. Explore Fiqh Files"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#15664a] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              External Link URL
            </label>
            <input
              type="text"
              value={fiqhSection.buttonUrl || ''}
              onChange={(e) => setFiqhSection({ ...fiqhSection, buttonUrl: e.target.value })}
              placeholder="e.g. https://fiqhfiles.samasthagraph.com/"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#15664a] outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Paragraph Description
            </label>
            <textarea
              rows={3}
              value={fiqhSection.description || ''}
              onChange={(e) => setFiqhSection({ ...fiqhSection, description: e.target.value })}
              placeholder="A dedicated platform for the public to explore Fiqh questions..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#15664a] outline-none"
            />
          </div>
        </div>
      )}

      {/* TAB 6: EXPLORE SAMASTHA GRAPH */}
      {activeTab === 'explore' && (
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6 sm:p-8 space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h2 className="text-lg font-bold text-gray-900 font-heading">Explore Samastha Graph Section</h2>
            <p className="text-sm text-gray-500 mt-1">Edit the bottom dark banner promoting Videos and Podcasts channels.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Section Title
              </label>
              <input
                type="text"
                value={exploreSection.title || ''}
                onChange={(e) => setExploreSection({ ...exploreSection, title: e.target.value })}
                placeholder="e.g. Explore Samastha Graph"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#15664a] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Section Subtitle
              </label>
              <input
                type="text"
                value={exploreSection.subtitle || ''}
                onChange={(e) => setExploreSection({ ...exploreSection, subtitle: e.target.value })}
                placeholder="e.g. Discover more from Samastha Graph through our latest videos and podcasts."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#15664a] outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
            <div className="space-y-4 bg-gray-50 p-5 rounded-xl border border-gray-200/80">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                <Video size={16} className="text-[#15664a]" /> Videos Card
              </h4>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Card Title</label>
                <input
                  type="text"
                  value={exploreSection.videoCardTitle || ''}
                  onChange={(e) => setExploreSection({ ...exploreSection, videoCardTitle: e.target.value })}
                  placeholder="e.g. Videos"
                  className="w-full px-3.5 py-2 border border-gray-300 bg-white rounded-lg text-sm focus:ring-2 focus:ring-[#15664a] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Card Description</label>
                <textarea
                  rows={2}
                  value={exploreSection.videoCardDescription || ''}
                  onChange={(e) => setExploreSection({ ...exploreSection, videoCardDescription: e.target.value })}
                  placeholder="Watch our latest programmes, lectures, and series..."
                  className="w-full px-3.5 py-2 border border-gray-300 bg-white rounded-lg text-sm focus:ring-2 focus:ring-[#15664a] outline-none"
                />
              </div>
            </div>

            <div className="space-y-4 bg-gray-50 p-5 rounded-xl border border-gray-200/80">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                <Mic size={16} className="text-[#15664a]" /> Podcasts Card
              </h4>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Card Title</label>
                <input
                  type="text"
                  value={exploreSection.podcastCardTitle || ''}
                  onChange={(e) => setExploreSection({ ...exploreSection, podcastCardTitle: e.target.value })}
                  placeholder="e.g. Podcasts"
                  className="w-full px-3.5 py-2 border border-gray-300 bg-white rounded-lg text-sm focus:ring-2 focus:ring-[#15664a] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Card Description</label>
                <textarea
                  rows={2}
                  value={exploreSection.podcastCardDescription || ''}
                  onChange={(e) => setExploreSection({ ...exploreSection, podcastCardDescription: e.target.value })}
                  placeholder="Listen to deep-dive audio discussions, stories..."
                  className="w-full px-3.5 py-2 border border-gray-300 bg-white rounded-lg text-sm focus:ring-2 focus:ring-[#15664a] outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
