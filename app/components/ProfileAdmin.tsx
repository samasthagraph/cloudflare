import React, { useState } from 'react';
import { Form, useNavigation } from "@remix-run/react";
import { User, Plus, Trash2, Link as LinkIcon, Share2, Youtube, Facebook, Instagram, Twitter, Music, PlayCircle, Image as ImageIcon, ChevronUp, ChevronDown } from 'lucide-react';

export function ProfileAdmin({ profileSettings }: { profileSettings: any }) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const defaultProfile = {
    identity: { name: "Samastha Graph", subtitle: "", biography: "", logo: "" },
    featuredCTA: { title: "", url: "", active: true },
    links: [],
    socialPlatforms: [],
    podcastPlatforms: [],
    featuredContent: { showLatestVideo: true, showLatestPodcast: true, showLatestArticle: true }
  };

  const [profile, setProfile] = useState(profileSettings || defaultProfile);

  const updateIdentity = (field: string, value: string) => {
    setProfile({ ...profile, identity: { ...profile.identity, [field]: value } });
  };

  const updateCTA = (field: string, value: any) => {
    setProfile({ ...profile, featuredCTA: { ...profile.featuredCTA, [field]: value } });
  };

  const updateFeatured = (field: string, value: boolean) => {
    setProfile({ ...profile, featuredContent: { ...profile.featuredContent, [field]: value } });
  };

  const updateArray = (arrayName: 'links' | 'socialPlatforms' | 'podcastPlatforms', index: number, field: string, value: any) => {
    const newArr = [...(profile[arrayName] || [])];
    newArr[index] = { ...newArr[index], [field]: value };
    setProfile({ ...profile, [arrayName]: newArr });
  };

  const moveItem = (arrayName: 'links' | 'socialPlatforms' | 'podcastPlatforms', index: number, direction: 'up' | 'down') => {
    let newArr = [...(profile[arrayName] || [])];

    // Ensure array is sorted by order first just in case
    newArr.sort((a, b) => (a.order || 0) - (b.order || 0));

    if (direction === 'up' && index > 0) {
      [newArr[index - 1], newArr[index]] = [newArr[index], newArr[index - 1]];
    } else if (direction === 'down' && index < newArr.length - 1) {
      [newArr[index + 1], newArr[index]] = [newArr[index], newArr[index + 1]];
    } else {
      return;
    }

    newArr.forEach((item, idx) => { item.order = idx + 1; });
    setProfile({ ...profile, [arrayName]: newArr });
  };

  const addToArray = (arrayName: 'links' | 'socialPlatforms' | 'podcastPlatforms') => {
    const newArr = [...(profile[arrayName] || [])];
    newArr.sort((a, b) => (a.order || 0) - (b.order || 0));
    const nextOrder = newArr.length > 0 ? (newArr[newArr.length - 1].order || 0) + 1 : 1;
    const newItem = arrayName === 'links'
      ? { id: Date.now().toString(), title: "New Link", url: "", icon: "LinkIcon", active: true, order: nextOrder }
      : { id: Date.now().toString(), name: "Platform", url: "", icon: "LinkIcon", active: true, order: nextOrder };
    newArr.push(newItem);
    setProfile({ ...profile, [arrayName]: newArr });
  };

  const removeFromArray = (arrayName: 'links' | 'socialPlatforms' | 'podcastPlatforms', index: number) => {
    const newArr = [...(profile[arrayName] || [])];
    newArr.splice(index, 1);
    setProfile({ ...profile, [arrayName]: newArr });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Profile / Link Hub Manager</h2>
          <p className="text-sm text-gray-500 mt-1">Manage your public digital identity at /profile</p>
        </div>
      </div>

      <Form method="post" className="space-y-8 bg-white p-6 md:p-8 rounded-sm shadow-sm border border-gray-100">
        <input type="hidden" name="intent" value="saveProfile" />
        <input type="hidden" name="profileData" value={JSON.stringify(profile)} />

        {/* Identity */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2 flex items-center gap-2">
            <User size={18} /> Public Identity
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Display Name *</label>
              <input type="text" value={profile.identity?.name || ''} onChange={(e) => updateIdentity('name', e.target.value)} required className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-[#15664a] outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Subtitle</label>
              <input type="text" value={profile.identity?.subtitle || ''} onChange={(e) => updateIdentity('subtitle', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-[#15664a] outline-none font-sans" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Biography</label>
              <textarea value={profile.identity?.biography || ''} onChange={(e) => updateIdentity('biography', e.target.value)} rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-[#15664a] outline-none font-sans"></textarea>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Logo/Profile Image URL</label>
              <input type="text" value={profile.identity?.logo || ''} onChange={(e) => updateIdentity('logo', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-[#15664a] outline-none" />
            </div>
          </div>
        </div>

        {/* Featured CTA */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">Featured CTA Button</h3>
          <div className="flex flex-wrap items-end gap-4 p-4 bg-gray-50 border border-gray-200 rounded-sm">
             <div className="flex-grow min-w-[200px]">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Button Title</label>
                <input type="text" value={profile.featuredCTA?.title || ''} onChange={(e) => updateCTA('title', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-[#15664a] outline-none" />
             </div>
             <div className="flex-grow min-w-[200px]">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Destination URL</label>
                <input type="text" value={profile.featuredCTA?.url || ''} onChange={(e) => updateCTA('url', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-[#15664a] outline-none" />
             </div>
             <div className="flex items-center gap-2 mb-2">
                <input type="checkbox" checked={profile.featuredCTA?.active !== false} onChange={(e) => updateCTA('active', e.target.checked)} id="cta-active" />
                <label htmlFor="cta-active" className="text-sm font-semibold text-gray-700">Active</label>
             </div>
          </div>
        </div>

        {/* Links Array Component */}
        {['links', 'socialPlatforms', 'podcastPlatforms'].map((arrName) => {
          const titleMap: any = { links: "Custom Links", socialPlatforms: "Social Platforms", podcastPlatforms: "Podcast Platforms" };
          let items = profile[arrName as keyof typeof profile] || [];
          items = [...items].sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
          return (
            <div key={arrName}>
              <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
                <h3 className="text-lg font-bold text-gray-900">{titleMap[arrName]}</h3>
                <button type="button" onClick={() => addToArray(arrName as any)} className="text-[#15664a] hover:text-[#0f4d38] font-semibold text-sm flex items-center gap-1">
                  <Plus size={16} /> Add New
                </button>
              </div>

              <div className="space-y-3">
                {items.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No items added yet.</p>
                ) : (
                  items.map((item: any, idx: number) => (
                    <div key={item.id || idx} className="flex flex-col md:flex-row gap-4 p-4 bg-gray-50 border border-gray-200 rounded-sm items-start md:items-center">
                      <div className="flex-grow space-y-3 w-full">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                           <div>
                             <label className="block text-xs font-semibold text-gray-500 mb-1">Title/Name</label>
                             <input type="text" value={item.title || item.name || ''} onChange={(e) => updateArray(arrName as any, idx, arrName === 'links' ? 'title' : 'name', e.target.value)} className="w-full px-3 py-1.5 border border-gray-300 rounded-sm text-sm" />
                           </div>
                           <div>
                             <label className="block text-xs font-semibold text-gray-500 mb-1">URL</label>
                             <input type="text" value={item.url || ''} onChange={(e) => updateArray(arrName as any, idx, 'url', e.target.value)} className="w-full px-3 py-1.5 border border-gray-300 rounded-sm text-sm" />
                           </div>
                        </div>
                        {arrName === 'links' && (
                           <div>
                             <label className="block text-xs font-semibold text-gray-500 mb-1">Description (Optional)</label>
                             <input type="text" value={item.description || ''} onChange={(e) => updateArray(arrName as any, idx, 'description', e.target.value)} className="w-full px-3 py-1.5 border border-gray-300 rounded-sm text-sm" />
                           </div>
                        )}
                        <div>
                           <label className="block text-xs font-semibold text-gray-500 mb-1">Icon Name (e.g. Facebook, Youtube, FileText)</label>
                           <input type="text" value={item.icon || ''} onChange={(e) => updateArray(arrName as any, idx, 'icon', e.target.value)} className="w-full px-3 py-1.5 border border-gray-300 rounded-sm text-sm" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between w-full md:w-auto md:flex-col md:gap-4 md:items-end">
                        <div className="flex items-center gap-2">
                          <input type="checkbox" checked={item.active !== false} onChange={(e) => updateArray(arrName as any, idx, 'active', e.target.checked)} />
                          <span className="text-xs font-semibold text-gray-700">Active</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => moveItem(arrName as any, idx, 'up')} disabled={idx === 0} className={`p-1 ${idx === 0 ? 'text-gray-300' : 'text-gray-500 hover:text-[#15664a]'}`}>
                            <ChevronUp size={18} />
                          </button>
                          <button type="button" onClick={() => moveItem(arrName as any, idx, 'down')} disabled={idx === items.length - 1} className={`p-1 ${idx === items.length - 1 ? 'text-gray-300' : 'text-gray-500 hover:text-[#15664a]'}`}>
                            <ChevronDown size={18} />
                          </button>
                          <button type="button" onClick={() => removeFromArray(arrName as any, idx)} className="text-red-500 hover:text-red-700 p-1 ml-2">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}

        {/* Featured Content Toggles */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">Auto-Featured Content</h3>
          <div className="flex flex-wrap gap-6 p-4 bg-gray-50 border border-gray-200 rounded-sm">
             <label className="flex items-center gap-2 cursor-pointer">
               <input type="checkbox" checked={profile.featuredContent?.showLatestArticle !== false} onChange={(e) => updateFeatured('showLatestArticle', e.target.checked)} />
               <span className="text-sm font-semibold text-gray-700">Show Latest Article</span>
             </label>
             <label className="flex items-center gap-2 cursor-pointer">
               <input type="checkbox" checked={profile.featuredContent?.showLatestVideo !== false} onChange={(e) => updateFeatured('showLatestVideo', e.target.checked)} />
               <span className="text-sm font-semibold text-gray-700">Show Latest Video</span>
             </label>
             <label className="flex items-center gap-2 cursor-pointer">
               <input type="checkbox" checked={profile.featuredContent?.showLatestPodcast !== false} onChange={(e) => updateFeatured('showLatestPodcast', e.target.checked)} />
               <span className="text-sm font-semibold text-gray-700">Show Latest Podcast</span>
             </label>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-100 flex justify-end gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-[#15664a] text-white px-8 py-2 rounded-sm font-bold tracking-wide hover:bg-[#0f4d38] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {isSubmitting ? "Saving..." : "Save Profile Configuration"}
          </button>
        </div>
      </Form>
    </div>
  );
}
