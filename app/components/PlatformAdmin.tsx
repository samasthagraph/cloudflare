import React, { useState } from 'react';
import { Save, Plus, Trash2, GripVertical, Check, Globe } from 'lucide-react';
import * as FaIcons from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import * as SiIcons from 'react-icons/si';

interface PlatformAdminProps {
  platformSettings: any;
  platformType: "social" | "podcast";
}

export function PlatformAdmin({ platformSettings, platformType }: PlatformAdminProps) {
  const [platforms, setPlatforms] = useState(
    (platformSettings?.platforms || []).sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
  );

  const title = platformType === "social" ? "Canonical Social Platforms" : "Canonical Podcast Platforms";
  const desc = platformType === "social" 
    ? "Manage the organization-wide social media presence. These links are consumed globally by the Profile, About, Contact, and Footer components."
    : "Manage the organization-wide audio presence. These links are consumed globally by the Profile, About, Footer, and Podcast pages.";

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...platforms];
    newItems[index] = { ...newItems[index], [field]: value };
    setPlatforms(newItems);
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === platforms.length - 1)) return;
    const newItems = [...platforms];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newItems[index], newItems[swapIndex]] = [newItems[swapIndex], newItems[index]];
    // Update order values
    newItems.forEach((item, idx) => { item.order = idx + 1; });
    setPlatforms(newItems);
  };

  const addItem = () => {
    setPlatforms([...platforms, {
      id: Date.now().toString(),
      name: 'New Platform',
      url: '#',
      icon: platformType === "social" ? 'Facebook' : 'Spotify',
      active: true,
      order: platforms.length + 1
    }]);
  };

  const removeItem = (index: number) => {
    const newItems = platforms.filter((_, i) => i !== index);
    newItems.forEach((item, idx) => { item.order = idx + 1; });
    setPlatforms(newItems);
  };

  const renderIconPreview = (iconName: string) => {
    if (!iconName) return <Globe size={20} className="text-gray-400" />;
    
    const lowerName = iconName.toLowerCase().trim();
    if (lowerName === "x" || lowerName === "twitter") return <FaXTwitter size={20} className="text-gray-600" />;
    if (lowerName === "jiosaavn" || lowerName === "jio saavn") return <FaIcons.FaHeadphones size={20} className="text-gray-600" />;
    if (lowerName === "amazon music" || lowerName === "amazon") return <FaIcons.FaAmazon size={20} className="text-gray-600" />;
    if (lowerName === "youtube music" || lowerName === "youtube") return <FaIcons.FaYoutube size={20} className="text-gray-600" />;
    if (lowerName === "apple-podcasts" || lowerName === "apple") return <SiIcons.SiApplepodcasts size={20} className="text-gray-600" />;
    
    const FaComponent = (FaIcons as any)[`Fa${iconName}`] || (FaIcons as any)[iconName];
    if (FaComponent) return <FaComponent size={20} className="text-gray-600" />;
    
    const SiComponent = (SiIcons as any)[`Si${iconName}`] || (SiIcons as any)[iconName];
    if (SiComponent) return <SiComponent size={20} className="text-gray-600" />;

    return <Globe size={20} className="text-gray-400" />;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <input type="hidden" name={platformType === "social" ? "socialPlatformData" : "podcastPlatformData"} value={JSON.stringify({ platforms })} />
      
      <div className="p-6 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          <p className="text-gray-500 mt-1 text-sm max-w-2xl">{desc}</p>
        </div>
      </div>
      
      <div className="p-6">
        <div className="space-y-4">
          {platforms.map((item: any, idx: number) => (
            <div key={item.id || idx} className={`flex items-start gap-4 p-4 rounded-lg border ${item.active ? 'border-gray-200 bg-white' : 'border-gray-200 bg-gray-50 opacity-75'} transition-all`}>
              <div className="flex flex-col gap-1 mt-2 text-gray-400 cursor-ns-resize">
                <button type="button" onClick={() => moveItem(idx, 'up')} disabled={idx === 0} className="hover:text-gray-600 disabled:opacity-30"><GripVertical size={16} /></button>
                <button type="button" onClick={() => moveItem(idx, 'down')} disabled={idx === platforms.length - 1} className="hover:text-gray-600 disabled:opacity-30"><GripVertical size={16} /></button>
              </div>
              
              <div className="flex-grow grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-3">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Platform Name</label>
                  <input type="text" value={item.name || ''} onChange={(e) => updateItem(idx, 'name', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#15664a] text-sm" placeholder="e.g. YouTube" />
                </div>
                
                <div className="md:col-span-6">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">URL / Destination</label>
                  <input type="text" value={item.url || ''} onChange={(e) => updateItem(idx, 'url', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#15664a] text-sm font-mono text-gray-600" placeholder="https://" />
                </div>
                
                <div className="md:col-span-3">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Icon Identifier</label>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 shrink-0 bg-gray-100 rounded-sm flex items-center justify-center border border-gray-200">
                      {renderIconPreview(item.icon)}
                    </div>
                    <input type="text" value={item.icon || ''} onChange={(e) => updateItem(idx, 'icon', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#15664a] text-sm" placeholder="e.g. Youtube" />
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-2 shrink-0 border-l border-gray-200 pl-4 h-full py-1">
                <button type="button" onClick={() => updateItem(idx, 'active', !item.active)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-medium transition-colors ${item.active ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  <Check size={14} className={item.active ? 'opacity-100' : 'opacity-30'} /> {item.active ? 'Active' : 'Inactive'}
                </button>
                <button type="button" onClick={() => removeItem(idx)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-medium text-red-600 hover:bg-red-50 transition-colors">
                  <Trash2 size={14} /> Remove
                </button>
              </div>
            </div>
          ))}
          
          <button type="button" onClick={addItem} className="w-full py-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 font-medium hover:border-[#15664a] hover:text-[#15664a] hover:bg-[#15664a]/5 transition-all flex items-center justify-center gap-2">
            <Plus size={18} /> Add Platform
          </button>
        </div>
      </div>
    </div>
  );
}
