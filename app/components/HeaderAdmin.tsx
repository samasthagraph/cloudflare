import React, { useState } from 'react';
import { Plus, Trash2, Globe, Link as LinkIcon, Compass, Sparkles } from 'lucide-react';

interface HeaderAdminProps {
  headerSettings: any;
}

export function HeaderAdmin({ headerSettings }: HeaderAdminProps) {
  const defaultHeader = {
    brandName: "Samastha Graph",
    logo: "/Logo_white.png",
    navLinks: [
      { id: "1", label: "Home", labelMl: "പ്രധാനം", url: "/" },
      { id: "2", label: "Videos", labelMl: "വീഡിയോകൾ", url: "/videos" },
      { id: "3", label: "Podcasts", labelMl: "പോഡ്‌കാസ്റ്റുകൾ", url: "/podcasts" },
      { id: "4", label: "Articles", labelMl: "ലേഖനങ്ങൾ", url: "/articles" },
      { id: "5", label: "About", labelMl: "ഞങ്ങളെക്കുറിച്ച്", url: "/about" },
      { id: "6", label: "Contact", labelMl: "ബന്ധപ്പെടുക", url: "/contact" }
    ],
    enableSearch: true,
    enableLanguageSwitcher: true
  };

  const [header, setHeader] = useState(headerSettings || defaultHeader);

  const updateNavLink = (index: number, field: string, val: string) => {
    const updated = [...(header.navLinks || [])];
    updated[index] = { ...updated[index], [field]: val };
    setHeader({ ...header, navLinks: updated });
  };

  const addNavLink = () => {
    const newId = Date.now().toString();
    const updated = [...(header.navLinks || []), { id: newId, label: "New Link", labelMl: "പുതിയ ലിങ്ക്", url: "/" }];
    setHeader({ ...header, navLinks: updated });
  };

  const removeNavLink = (index: number) => {
    const updated = (header.navLinks || []).filter((_: any, idx: number) => idx !== index);
    setHeader({ ...header, navLinks: updated });
  };

  return (
    <div className="space-y-6">
      <input type="hidden" name="headerData" value={JSON.stringify(header)} />

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
          <div className="p-2.5 bg-[#fdf2f4] text-[#861937] rounded-xl">
            <Compass size={22} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Header Branding &amp; Navbar Configuration</h3>
            <p className="text-xs text-gray-500">Manage site branding, top navbar menu items, and feature toggles.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Brand Name / Site Title</label>
            <input
              type="text"
              value={header.brandName || ""}
              onChange={(e) => setHeader({ ...header, brandName: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#861937] outline-none text-sm"
              placeholder="Samastha Graph"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Logo Image URL</label>
            <input
              type="text"
              value={header.logo || ""}
              onChange={(e) => setHeader({ ...header, logo: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#861937] outline-none text-sm"
              placeholder="/Logo_white.png or https://..."
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
          <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer">
            <div>
              <span className="font-semibold text-sm text-gray-800">Enable Search Icon</span>
              <p className="text-xs text-gray-500">Show search modal / button in desktop header</p>
            </div>
            <input
              type="checkbox"
              checked={header.enableSearch !== false}
              onChange={(e) => setHeader({ ...header, enableSearch: e.target.checked })}
              className="w-5 h-5 accent-[#861937] rounded"
            />
          </label>

          <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer">
            <div>
              <span className="font-semibold text-sm text-gray-800">Language Switcher</span>
              <p className="text-xs text-gray-500">Toggle Malayalam / English switcher in header</p>
            </div>
            <input
              type="checkbox"
              checked={header.enableLanguageSwitcher !== false}
              onChange={(e) => setHeader({ ...header, enableLanguageSwitcher: e.target.checked })}
              className="w-5 h-5 accent-[#861937] rounded"
            />
          </label>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Header Navigation Menu</h3>
            <p className="text-xs text-gray-500">Custom labels and links for main navigation</p>
          </div>
          <button
            type="button"
            onClick={addNavLink}
            className="flex items-center gap-2 bg-[#861937] hover:bg-[#68132b] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus size={14} /> Add Menu Item
          </button>
        </div>

        <div className="space-y-4">
          {(header.navLinks || []).map((link: any, index: number) => (
            <div key={link.id || index} className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex flex-col md:flex-row gap-4 items-start md:items-center">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">English Label</label>
                  <input
                    type="text"
                    value={link.label || ""}
                    onChange={(e) => updateNavLink(index, "label", e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm outline-none focus:ring-1 focus:ring-[#861937]"
                    placeholder="e.g. Articles"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Malayalam Label</label>
                  <input
                    type="text"
                    value={link.labelMl || ""}
                    onChange={(e) => updateNavLink(index, "labelMl", e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm outline-none focus:ring-1 focus:ring-[#861937]"
                    placeholder="e.g. ലേഖനങ്ങൾ"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Target URL</label>
                  <input
                    type="text"
                    value={link.url || ""}
                    onChange={(e) => updateNavLink(index, "url", e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm outline-none focus:ring-1 focus:ring-[#861937]"
                    placeholder="/articles"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeNavLink(index)}
                className="text-gray-400 hover:text-red-600 p-2 rounded-md hover:bg-red-50 transition-colors self-end md:self-center"
                title="Delete Link"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
