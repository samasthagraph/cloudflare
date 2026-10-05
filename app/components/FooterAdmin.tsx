import React, { useState } from 'react';
import { Plus, Trash2, Layout, Link as LinkIcon } from 'lucide-react';

export function FooterAdmin({ footerSettings }: { footerSettings: any }) {
  const defaultFooter = {
    logo: "/Logo_white.png",
    brandTagline: "The collective voice of Samastha Kerala Jam'iyyathul Ulama in the digital media realm.",
    copyrightText: "Samastha Graph. All rights reserved.",
    contentLinks: [
      { label: "Latest Videos", url: "/videos" },
      { label: "Audio Podcasts", url: "/podcasts" },
      { label: "Articles & News", url: "/articles" }
    ],
    organizationLinks: [
      { label: "About Us", url: "/about" },
      { label: "Contact Us", url: "/contact" },
      { label: "Authors & Scholars", url: "/authors" },
      { label: "Link Hub", url: "/profile" }
    ]
  };

  const [footer, setFooter] = useState(footerSettings || defaultFooter);

  const updateField = (field: string, value: any) => {
    setFooter((prev: any) => ({ ...prev, [field]: value }));
  };

  const updateLink = (category: 'contentLinks' | 'organizationLinks', index: number, field: string, value: string) => {
    const list = [...(footer[category] || [])];
    list[index] = { ...list[index], [field]: value };
    setFooter((prev: any) => ({ ...prev, [category]: list }));
  };

  const addLink = (category: 'contentLinks' | 'organizationLinks') => {
    const list = [...(footer[category] || [])];
    list.push({ label: "New Link", url: "/" });
    setFooter((prev: any) => ({ ...prev, [category]: list }));
  };

  const removeLink = (category: 'contentLinks' | 'organizationLinks', index: number) => {
    const list = [...(footer[category] || [])];
    list.splice(index, 1);
    setFooter((prev: any) => ({ ...prev, [category]: list }));
  };

  return (
    <div className="space-y-6">
      <input type="hidden" name="footerData" value={JSON.stringify(footer)} />

      {/* Brand & Slogan */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <Layout size={18} className="text-[#15664a]" /> Footer Brand &amp; Info
          </h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Footer Logo URL</label>
              <input
                type="text"
                value={footer.logo || ''}
                onChange={(e) => updateField('logo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#15664a] outline-none font-mono text-sm"
                placeholder="/Logo_white.png"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Copyright Notice</label>
              <input
                type="text"
                value={footer.copyrightText || ''}
                onChange={(e) => updateField('copyrightText', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#15664a] outline-none text-sm"
                placeholder="Samastha Graph. All rights reserved."
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Brand Tagline / Description</label>
            <textarea
              value={footer.brandTagline || ''}
              onChange={(e) => updateField('brandTagline', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#15664a] outline-none text-sm"
            />
          </div>
        </div>
      </div>

      {/* Footer Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Content Column */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-800">Content Links</h3>
            <button
              type="button"
              onClick={() => addLink('contentLinks')}
              className="flex items-center gap-1 bg-[#15664a] hover:bg-[#0f4d38] text-white text-xs font-semibold px-3 py-1.5 rounded-md shadow-sm transition-colors"
            >
              <Plus size={14} /> Add Link
            </button>
          </div>
          <div className="p-6 space-y-3">
            {(footer.contentLinks || []).map((link: any, idx: number) => (
              <div key={idx} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                <input
                  type="text"
                  placeholder="Label"
                  value={link.label || ''}
                  onChange={(e) => updateLink('contentLinks', idx, 'label', e.target.value)}
                  className="flex-1 px-2.5 py-1.5 bg-white border border-gray-300 rounded text-xs focus:ring-1 focus:ring-[#15664a] outline-none"
                />
                <input
                  type="text"
                  placeholder="URL"
                  value={link.url || ''}
                  onChange={(e) => updateLink('contentLinks', idx, 'url', e.target.value)}
                  className="flex-1 px-2.5 py-1.5 bg-white border border-gray-300 rounded text-xs font-mono focus:ring-1 focus:ring-[#15664a] outline-none"
                />
                <button
                  type="button"
                  onClick={() => removeLink('contentLinks', idx)}
                  className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Organization Column */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-800">Organization Links</h3>
            <button
              type="button"
              onClick={() => addLink('organizationLinks')}
              className="flex items-center gap-1 bg-[#15664a] hover:bg-[#0f4d38] text-white text-xs font-semibold px-3 py-1.5 rounded-md shadow-sm transition-colors"
            >
              <Plus size={14} /> Add Link
            </button>
          </div>
          <div className="p-6 space-y-3">
            {(footer.organizationLinks || []).map((link: any, idx: number) => (
              <div key={idx} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                <input
                  type="text"
                  placeholder="Label"
                  value={link.label || ''}
                  onChange={(e) => updateLink('organizationLinks', idx, 'label', e.target.value)}
                  className="flex-1 px-2.5 py-1.5 bg-white border border-gray-300 rounded text-xs focus:ring-1 focus:ring-[#15664a] outline-none"
                />
                <input
                  type="text"
                  placeholder="URL"
                  value={link.url || ''}
                  onChange={(e) => updateLink('organizationLinks', idx, 'url', e.target.value)}
                  className="flex-1 px-2.5 py-1.5 bg-white border border-gray-300 rounded text-xs font-mono focus:ring-1 focus:ring-[#15664a] outline-none"
                />
                <button
                  type="button"
                  onClick={() => removeLink('organizationLinks', idx)}
                  className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
