import React, { useState } from 'react';
import { Plus, Trash2, GripVertical, Radio, Rss, ExternalLink, Image, RefreshCw, CheckCircle } from 'lucide-react';

interface PodcastShowsAdminProps {
  podcastShowsSettings: any;
}

export function PodcastShowsAdmin({ podcastShowsSettings }: PodcastShowsAdminProps) {
  const [shows, setShows] = useState(
    (podcastShowsSettings?.shows || []).sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
  );
  const [testingIndex, setTestingIndex] = useState<number | null>(null);
  const [feedStatus, setFeedStatus] = useState<Record<number, string>>({});

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...shows];
    newItems[index] = { ...newItems[index], [field]: value };
    setShows(newItems);
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === shows.length - 1)) return;
    const newItems = [...shows];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newItems[index], newItems[swapIndex]] = [newItems[swapIndex], newItems[index]];
    newItems.forEach((item, idx) => { item.order = idx + 1; });
    setShows(newItems);
  };

  const addItem = () => {
    const newId = `show-${Date.now()}`;
    setShows([...shows, {
      id: newId,
      title: 'New Podcast Show',
      subtitle: '',
      feedUrl: 'https://anchor.fm/s/xxxxxxxx/podcast/rss',
      image: 'https://d3t3ozftmdmh3i.cloudfront.net/staging/podcast_uploaded_nologo/46535697/46535697-1786530965061-a1e35ade3abba.jpg',
      description: '',
      active: true,
      order: shows.length + 1
    }]);
  };

  const removeItem = (index: number) => {
    if (confirm('Are you sure you want to remove this podcast show?')) {
      const newItems = shows.filter((_, i) => i !== index);
      newItems.forEach((item, idx) => { item.order = idx + 1; });
      setShows(newItems);
    }
  };

  const testFeed = async (index: number, url: string) => {
    if (!url) return;
    setTestingIndex(index);
    setFeedStatus(prev => ({ ...prev, [index]: 'Checking feed...' }));
    try {
      const res = await fetch(url);
      if (res.ok) {
        const text = await res.text();
        const epCount = (text.match(/<item>/g) || []).length;
        const channelTitleMatch = text.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || text.match(/<title>(.*?)<\/title>/);
        const titleFound = channelTitleMatch ? channelTitleMatch[1] : '';
        setFeedStatus(prev => ({ ...prev, [index]: `✓ Active: ${epCount} episodes found${titleFound ? ` ("${titleFound}")` : ''}` }));
      } else {
        setFeedStatus(prev => ({ ...prev, [index]: `✗ Error: HTTP ${res.status}` }));
      }
    } catch (e: any) {
      setFeedStatus(prev => ({ ...prev, [index]: `✗ Error: ${e.message || 'Failed to fetch'}` }));
    } finally {
      setTestingIndex(null);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <input type="hidden" name="podcastShowsData" value={JSON.stringify({ shows })} />
      
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-emerald-900 to-[#15664a] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Radio size={22} className="text-[#c8a136]" />
            <h2 className="text-xl font-bold">Podcast Shows & Spotify RSS Feeds</h2>
          </div>
          <p className="text-emerald-100 text-sm max-w-2xl">
            Add and manage multiple Spotify / Anchor RSS feeds. Each show will be automatically synchronized with episodes, custom artwork, and audio streams.
          </p>
        </div>
        <button
          type="button"
          onClick={addItem}
          className="inline-flex items-center gap-2 bg-[#c8a136] hover:bg-yellow-500 text-gray-900 font-bold px-4 py-2.5 rounded-lg shadow-sm text-sm transition-all"
        >
          <Plus size={16} /> Add New Show / Feed
        </button>
      </div>
      
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between text-xs text-gray-500 font-medium px-2">
          <span>Configured Shows ({shows.length})</span>
          <span>Order & Status</span>
        </div>

        <div className="space-y-4">
          {shows.map((item: any, idx: number) => (
            <div 
              key={item.id || idx} 
              className={`rounded-xl border transition-all ${
                item.active 
                  ? 'border-gray-200 bg-white shadow-sm hover:border-[#15664a]' 
                  : 'border-gray-200 bg-gray-50 opacity-70'
              }`}
            >
              <div className="p-5 flex flex-col md:flex-row gap-5 items-start">
                {/* Reorder and Cover Image preview */}
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-1 text-gray-400">
                    <button 
                      type="button" 
                      onClick={() => moveItem(idx, 'up')} 
                      disabled={idx === 0} 
                      className="p-1 hover:text-gray-700 disabled:opacity-20"
                      title="Move Up"
                    >
                      <GripVertical size={16} />
                    </button>
                    <button 
                      type="button" 
                      onClick={() => moveItem(idx, 'down')} 
                      disabled={idx === shows.length - 1} 
                      className="p-1 hover:text-gray-700 disabled:opacity-20"
                      title="Move Down"
                    >
                      <GripVertical size={16} />
                    </button>
                  </div>

                  <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                    {item.image ? (
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Image size={24} />
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Form Fields */}
                <div className="flex-grow grid grid-cols-1 md:grid-cols-12 gap-4 w-full">
                  {/* Show Title */}
                  <div className="md:col-span-4">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Show Title (English / Malayalam)</label>
                    <input 
                      type="text" 
                      value={item.title || ''} 
                      onChange={(e) => updateItem(idx, 'title', e.target.value)} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#15664a] text-sm font-medium" 
                      placeholder="e.g. Fiqh Files | ഫിഖ്ഹ് ഫയൽസ്" 
                    />
                  </div>

                  {/* Malayalam Subtitle / Badge Name */}
                  <div className="md:col-span-3">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Malayalam Label / Tag</label>
                    <input 
                      type="text" 
                      value={item.subtitle || ''} 
                      onChange={(e) => updateItem(idx, 'subtitle', e.target.value)} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#15664a] text-sm" 
                      placeholder="e.g. ഫിഖ്ഹ് ഫയൽസ്" 
                    />
                  </div>

                  {/* Slug / Unique ID */}
                  <div className="md:col-span-3">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Show ID / Slug</label>
                    <input 
                      type="text" 
                      value={item.id || ''} 
                      onChange={(e) => updateItem(idx, 'id', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#15664a] text-xs font-mono bg-gray-50" 
                      placeholder="e.g. fiqh-files" 
                    />
                  </div>

                  {/* Active Toggle */}
                  <div className="md:col-span-2 flex items-center justify-end">
                    <label className="inline-flex items-center gap-2 cursor-pointer mt-5">
                      <input 
                        type="checkbox" 
                        checked={item.active !== false} 
                        onChange={(e) => updateItem(idx, 'active', e.target.checked)} 
                        className="w-4 h-4 text-[#15664a] focus:ring-[#15664a] rounded" 
                      />
                      <span className="text-xs font-bold text-gray-700">Active</span>
                    </label>
                  </div>

                  {/* RSS Feed URL */}
                  <div className="md:col-span-7">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-gray-600 flex items-center gap-1">
                        <Rss size={12} className="text-orange-500" /> Spotify / Anchor RSS Feed URL
                      </label>
                      <button
                        type="button"
                        onClick={() => testFeed(idx, item.feedUrl)}
                        disabled={testingIndex === idx || !item.feedUrl}
                        className="text-[11px] font-semibold text-[#15664a] hover:underline flex items-center gap-1 disabled:opacity-50"
                      >
                        <RefreshCw size={10} className={testingIndex === idx ? "animate-spin" : ""} />
                        Test Feed
                      </button>
                    </div>
                    <input 
                      type="url" 
                      value={item.feedUrl || ''} 
                      onChange={(e) => updateItem(idx, 'feedUrl', e.target.value)} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#15664a] text-xs font-mono" 
                      placeholder="https://anchor.fm/s/.../podcast/rss" 
                    />
                    {feedStatus[idx] && (
                      <p className={`text-[11px] mt-1 font-medium ${feedStatus[idx].startsWith('✓') ? 'text-emerald-700' : 'text-red-600'}`}>
                        {feedStatus[idx]}
                      </p>
                    )}
                  </div>

                  {/* Cover Image URL */}
                  <div className="md:col-span-5">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Cover Artwork URL</label>
                    <input 
                      type="url" 
                      value={item.image || ''} 
                      onChange={(e) => updateItem(idx, 'image', e.target.value)} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#15664a] text-xs font-mono" 
                      placeholder="https://...jpg" 
                    />
                  </div>

                  {/* Description */}
                  <div className="md:col-span-11">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Description (Mal / Eng)</label>
                    <textarea 
                      rows={2}
                      value={item.description || ''} 
                      onChange={(e) => updateItem(idx, 'description', e.target.value)} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#15664a] text-sm" 
                      placeholder="Brief overview of this podcast show..." 
                    />
                  </div>

                  {/* Delete Button */}
                  <div className="md:col-span-1 flex items-end justify-end">
                    <button 
                      type="button" 
                      onClick={() => removeItem(idx)} 
                      className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Show"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {shows.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <Radio size={40} className="mx-auto text-gray-400 mb-2" />
            <p className="text-gray-600 font-medium">No podcast shows configured</p>
            <p className="text-gray-400 text-xs mt-1">Click the button above to add your first Spotify RSS feed.</p>
          </div>
        )}
      </div>
    </div>
  );
}
