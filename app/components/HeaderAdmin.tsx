import React, { useState } from 'react';
import { Plus, Trash2, ChevronUp, ChevronDown, Layout, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';

export function HeaderAdmin({ headerSettings }: { headerSettings: any }) {
  const defaultHeader = {
    logo: "/Logo_white.png",
    brandName: "Samastha Graph",
    navLinks: [
      { id: "home", labelMl: "Home", labelEn: "Home", url: "/", active: true, order: 1 },
      { id: "videos", labelMl: "Videos", labelEn: "Videos", url: "/videos", active: true, order: 2 },
      { id: "podcasts", labelMl: "Podcasts", labelEn: "Podcasts", url: "/podcasts", active: true, order: 3 },
      { id: "articles", labelMl: "Articles", labelEn: "Articles", url: "/articles", active: true, order: 4 },
      { id: "about", labelMl: "About", labelEn: "About", url: "/about", active: true, order: 5 },
      { id: "contact", labelMl: "Contact", labelEn: "Contact", url: "/contact", active: true, order: 6 }
    ],
    showSearch: true,
    showLanguageSwitcher: true
  };

  const [header, setHeader] = useState(headerSettings || defaultHeader);

  const updateField = (field: string, value: any) => {
    setHeader((prev: any) => ({ ...prev, [field]: value }));
  };

  const updateNavLink = (index: number, field: string, value: any) => {
    const updated = [...(header.navLinks || [])];
    updated[index] = { ...updated[index], [field]: value };
    setHeader((prev: any) => ({ ...prev, navLinks: updated }));
  };

  const moveNavLink = (index: number, direction: 'up' | 'down') => {
    const list = [...(header.navLinks || [])].sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
    if (direction === 'up' && index > 0) {
      [list[index - 1], list[index]] = [list[index], list[index - 1]];
    } else if (direction === 'down' && index < list.length - 1) {
      [list[index + 1], list[index]] = [list[index], list[index + 1]];
    } else {
      return;
    }
    list.forEach((item, i) => { item.order = i + 1; });
    setHeader((prev: any) => ({ ...prev, navLinks: list }));
  };

  const addNavLink = () => {
    const list = [...(header.navLinks || [])];
    const nextOrder = list.length > 0 ? Math.max(...list.map((l: any) => l.order || 0)) + 1 : 1;
    list.push({
      id: Date.now().toString(),
      labelMl: "New Link",
      labelEn: "New Link",
      url: "/",
      active: true,
      order: nextOrder
    });
    setHeader((prev: any) => ({ ...prev, navLinks: list }));
  };

  const removeNavLink = (index: number) => {
    const list = [...(header.navLinks || [])];
    list.splice(index, 1);
    setHeader((prev: any) => ({ ...prev, navLinks: list }));
  };

  return (
    <div className="space-y-6">
      <input type="hidden" name="headerData" value={JSON.stringify(header)} />

      {/* Brand & Logo */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <Layout size={18} className="text-[#15664a]" /> Brand &amp; Logo Settings
          </h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Brand Name / Title</label>
              <input
                type="text"
                value={header.brandName || ''}
                onChange={(e) => updateField('brandName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#15664a] outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Header Logo URL</label>
              <input
                type="text"
                value={header.logo || ''}
                onChange={(e) => updateField('logo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#15664a] outline-none font-mono text-sm"
                placeholder="/Logo_white.png"
              />
            </div>
          </div>

          <div className="pt-2 flex flex-wrap gap-6 items-center border-t border-gray-100 mt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={header.showSearch !== false}
                onChange={(e) => updateField('showSearch', e.target.checked)}
                className="rounded text-[#15664a] focus:ring-[#15664a] w-4 h-4"
              />
              <span className="text-sm font-medium text-gray-800">Show Search Button</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={header.showLanguageSwitcher !== false}
                onChange={(e) => updateField('showLanguageSwitcher', e.target.checked)}
                className="rounded text-[#15664a] focus:ring-[#15664a] w-4 h-4"
              />
              <span className="text-sm font-medium text-gray-800">Show Language Switcher (ML / EN)</span>
            </label>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
              <LinkIcon size={18} className="text-[#15664a]" /> Navigation Menu Links
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Control top navigation links, ordering, and visibility.</p>
          </div>
          <button
            type="button"
            onClick={addNavLink}
            className="flex items-center gap-1.5 bg-[#15664a] hover:bg-[#0f4d38] text-white text-xs font-semibold px-3 py-1.5 rounded-md shadow-sm transition-colors"
          >
            <Plus size={14} /> Add Nav Link
          </button>
        </div>

        <div className="p-6 space-y-3">
          {(header.navLinks || []).map((link: any, idx: number) => (
            <div
              key={link.id || idx}
              className="p-4 bg-gray-50/70 border border-gray-200 rounded-lg flex flex-col md:flex-row items-start md:items-center gap-3 transition-colors hover:bg-gray-50"
            >
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => moveNavLink(idx, 'up')}
                  className="p-1 hover:bg-white rounded border border-gray-200 text-gray-500 disabled:opacity-30"
                  title="Move Up"
                >
                  <ChevronUp size={16} />
                </button>
                <button
                  type="button"
                  disabled={idx === (header.navLinks || []).length - 1}
                  onClick={() => moveNavLink(idx, 'down')}
                  className="p-1 hover:bg-white rounded border border-gray-200 text-gray-500 disabled:opacity-30"
                  title="Move Down"
                >
                  <ChevronDown size={16} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1 w-full">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Label (English / Default)</label>
                  <input
                    type="text"
                    value={link.labelEn || link.label || ''}
                    onChange={(e) => updateNavLink(idx, 'labelEn', e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded text-sm focus:ring-1 focus:ring-[#15664a] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Label (Malayalam)</label>
                  <input
                    type="text"
                    value={link.labelMl || ''}
                    onChange={(e) => updateNavLink(idx, 'labelMl', e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded text-sm focus:ring-1 focus:ring-[#15664a] outline-none font-malayalam"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">URL / Path</label>
                  <input
                    type="text"
                    value={link.url || ''}
                    onChange={(e) => updateNavLink(idx, 'url', e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded text-sm focus:ring-1 focus:ring-[#15664a] outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 self-end md:self-center">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={link.active !== false}
                    onChange={(e) => updateNavLink(idx, 'active', e.target.checked)}
                    className="rounded text-[#15664a] focus:ring-[#15664a] w-4 h-4"
                  />
                  <span className="text-xs font-medium text-gray-700">Active</span>
                </label>
                <button
                  type="button"
                  onClick={() => removeNavLink(idx)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
