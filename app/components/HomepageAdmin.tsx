import React, { useState, useMemo } from 'react';
import { Search, Image as ImageIcon, PlayCircle, FileText, ChevronDown } from 'lucide-react';

interface HomepageAdminProps {
  homepageSettings: any;
  articles: any[];
  videos: any[];
}

export function HomepageAdmin({ homepageSettings, articles, videos }: HomepageAdminProps) {
  const defaultSettings = {
    hero: {
      enabled: false,
      type: "video",
      slug: "",
      layout: "cinematic",
      eyebrow: "",
      displayTitle: "",
      displayDescription: "",
      ctaText: ""
    }
  };

  const [hero, setHero] = useState(homepageSettings?.hero || defaultSettings.hero);
  const [searchTerm, setSearchTerm] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

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
      if (item.thumbImage) return item.thumbImage;
      let id = item.youtubeId;
      if (id && (id.includes('/') || id.includes('youtu'))) {
        try {
          const url = new URL(id.startsWith('http') ? id : `https://${id}`);
          if (url.hostname.includes('youtu.be')) id = url.pathname.slice(1);
          else if (url.searchParams.has('v')) id = url.searchParams.get('v');
        } catch(e){}
      }
      return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
    } else {
      return item.image || null;
    }
  };

  const selectedThumbnail = getThumbnail(selectedItem);

  return (
    <div className="space-y-8 animate-[fade-in_0.3s_ease-out]">
      <input type="hidden" name="homepageData" value={JSON.stringify({ hero })} />

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 font-heading">Homepage Settings</h2>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Hero Section</h3>
              <p className="text-sm text-gray-500">Enable or disable the main featured hero at the top of the homepage.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={hero.enabled !== false} onChange={(e) => setHero({ ...hero, enabled: e.target.checked })} />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#15664a]"></div>
            </label>
          </div>

          {hero.enabled !== false && (
            <div className="space-y-6 pt-4 border-t border-gray-100">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Content Type</label>
                  <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button 
                      type="button"
                      onClick={() => { setHero({ ...hero, type: 'video', slug: '' }); setSearchTerm(""); }}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${hero.type === 'video' ? 'bg-white shadow-sm text-[#15664a]' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      <PlayCircle size={16} /> Video
                    </button>
                    <button 
                      type="button"
                      onClick={() => { setHero({ ...hero, type: 'article', slug: '' }); setSearchTerm(""); }}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${hero.type === 'article' ? 'bg-white shadow-sm text-[#15664a]' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      <FileText size={16} /> Article
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Layout Pattern</label>
                  <select 
                    value={hero.layout || 'cinematic'}
                    onChange={(e) => setHero({ ...hero, layout: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-[#15664a] focus:border-[#15664a] outline-none"
                  >
                    <option value="cinematic">Cinematic (Editorial)</option>
                    <option value="standard" disabled>Standard (Coming Soon)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Content</label>
                <div className="relative">
                  {/* Searchable Dropdown Button */}
                  <button 
                    type="button" 
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="w-full bg-white border border-gray-300 rounded-lg shadow-sm pl-3 pr-10 py-3 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-[#15664a] focus:border-[#15664a]"
                  >
                    {selectedItem ? (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden flex-shrink-0 flex items-center justify-center">
                           {selectedThumbnail ? (
                             <img src={selectedThumbnail} className="w-full h-full object-cover" alt="" />
                           ) : (
                             <ImageIcon size={16} className="text-gray-400" />
                           )}
                        </div>
                        <div className="flex flex-col truncate">
                          <span className="text-sm font-medium text-gray-900 truncate">{selectedItem.title}</span>
                          <span className="text-xs text-gray-500 truncate">{selectedItem.slug}</span>
                        </div>
                      </div>
                    ) : (
                      <span className="block truncate text-gray-500 py-2">Select a {hero.type}...</span>
                    )}
                    <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    </span>
                  </button>

                  {/* Dropdown Menu */}
                  {dropdownOpen && (
                    <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-80 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                      <div className="sticky top-0 bg-white px-3 py-2 border-b border-gray-100">
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-[#15664a] focus:border-[#15664a] sm:text-sm"
                            placeholder={`Search ${hero.type}s...`}
                            autoFocus
                          />
                        </div>
                      </div>
                      
                      <div className="max-h-60 overflow-y-auto">
                        {filteredItems.length === 0 ? (
                          <div className="px-4 py-4 text-sm text-gray-500 text-center">No {hero.type}s found.</div>
                        ) : (
                          filteredItems.map((item: any) => {
                            const thumb = getThumbnail(item);
                            return (
                              <div
                                key={item.slug}
                                onClick={() => {
                                  setHero({ ...hero, slug: item.slug });
                                  setDropdownOpen(false);
                                  setSearchTerm("");
                                }}
                                className="cursor-default select-none relative py-2 pl-3 pr-9 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                              >
                                <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden flex-shrink-0 flex items-center justify-center">
                                  {thumb ? (
                                    <img src={thumb} className="w-full h-full object-cover" alt="" />
                                  ) : (
                                    <ImageIcon size={16} className="text-gray-400" />
                                  )}
                                </div>
                                <div className="flex flex-col truncate">
                                  <span className="font-medium text-gray-900 truncate">{item.title}</span>
                                  <span className="text-xs text-gray-500 truncate">{item.slug}</span>
                                </div>
                              </div>
                            )
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Overrides */}
              <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl space-y-4">
                <h4 className="text-sm font-semibold text-blue-900 flex items-center gap-2">
                   Presentation Overrides
                </h4>
                <p className="text-xs text-blue-700">Leave these blank to automatically use the selected item's default title and description. You only need to fill these if you want to display something different on the homepage.</p>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Eyebrow (e.g., "FEATURED VIDEO")</label>
                  <input type="text" value={hero.eyebrow || ""} onChange={e => setHero({ ...hero, eyebrow: e.target.value })} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-[#15664a] focus:border-[#15664a]" placeholder="Optional eyebrow text" />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Custom Title</label>
                  <input type="text" value={hero.displayTitle || ""} onChange={e => setHero({ ...hero, displayTitle: e.target.value })} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-[#15664a] focus:border-[#15664a]" placeholder="Optional override" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Custom Description</label>
                  <textarea value={hero.displayDescription || ""} onChange={e => setHero({ ...hero, displayDescription: e.target.value })} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-[#15664a] focus:border-[#15664a] resize-none h-20" placeholder="Optional override"></textarea>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">CTA Text</label>
                  <input type="text" value={hero.ctaText || ""} onChange={e => setHero({ ...hero, ctaText: e.target.value })} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-[#15664a] focus:border-[#15664a]" placeholder={hero.type === 'video' ? 'Watch Now' : 'Read Article'} />
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
