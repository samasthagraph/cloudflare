import React, { useState } from 'react';
import { Plus, Trash2, Globe, Map } from 'lucide-react';

interface GlobalNetworkAdminProps {
  globalNetworkSettings: any;
}

export function GlobalNetworkAdmin({ globalNetworkSettings }: GlobalNetworkAdminProps) {
  const defaultNetwork = {
    headline: "Global Presence & Diaspora Network",
    headlineMl: "ആഗോള ശൃംഖല",
    subheadline: "Connecting millions of believers through affiliated councils and national committees worldwide.",
    mapImageUrl: "/images/cms/network/global-map.webp",
    countriesCount: "25+",
    nationalCouncilsCount: "12+",
    centersCount: "1,200+",
    regions: [
      { id: "1", name: "GCC & Middle East", description: "UAE, Saudi Arabia, Qatar, Oman, Kuwait, Bahrain National Committees" },
      { id: "2", name: "Europe & UK", description: "London, Dublin, Manchester, Germany cultural centers" },
      { id: "3", name: "Asia Pacific", description: "Malaysia, Singapore, Australia diaspora associations" },
      { id: "4", name: "North America", description: "United States and Canada community hubs" }
    ]
  };

  const [data, setData] = useState(globalNetworkSettings || defaultNetwork);

  const updateRegion = (index: number, field: string, val: string) => {
    const updated = [...(data.regions || [])];
    updated[index] = { ...updated[index], [field]: val };
    setData({ ...data, regions: updated });
  };

  const addRegion = () => {
    const newId = Date.now().toString();
    const updated = [...(data.regions || []), { id: newId, name: "New Regional Hub", description: "Regional chapters and branches" }];
    setData({ ...data, regions: updated });
  };

  const removeRegion = (index: number) => {
    const updated = (data.regions || []).filter((_: any, idx: number) => idx !== index);
    setData({ ...data, regions: updated });
  };

  return (
    <div className="space-y-6">
      <input type="hidden" name="globalNetworkData" value={JSON.stringify(data)} />

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
          <div className="p-2.5 bg-[#fdf2f4] text-[#861937] rounded-xl">
            <Globe size={22} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Global Network &amp; Diaspora Settings</h3>
            <p className="text-xs text-gray-500">Configure map visuals, reach metrics, and global chapter listings.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Headline (English)</label>
            <input
              type="text"
              value={data.headline || ""}
              onChange={(e) => setData({ ...data, headline: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Headline (Malayalam)</label>
            <input
              type="text"
              value={data.headlineMl || ""}
              onChange={(e) => setData({ ...data, headlineMl: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm font-malayalam"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Global Map Image URL</label>
          <input
            type="text"
            value={data.mapImageUrl || ""}
            onChange={(e) => setData({ ...data, mapImageUrl: e.target.value })}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm"
            placeholder="/images/cms/network/global-map.webp or https://..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-100">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Countries Count</label>
            <input
              type="text"
              value={data.countriesCount || ""}
              onChange={(e) => setData({ ...data, countriesCount: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm"
              placeholder="25+"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">National Councils</label>
            <input
              type="text"
              value={data.nationalCouncilsCount || ""}
              onChange={(e) => setData({ ...data, nationalCouncilsCount: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm"
              placeholder="12+"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Affiliated Centers</label>
            <input
              type="text"
              value={data.centersCount || ""}
              onChange={(e) => setData({ ...data, centersCount: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm"
              placeholder="1,200+"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Regional Chapters &amp; Committees</h3>
          </div>
          <button
            type="button"
            onClick={addRegion}
            className="flex items-center gap-2 bg-[#861937] hover:bg-[#68132b] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus size={14} /> Add Region
          </button>
        </div>

        <div className="space-y-4">
          {(data.regions || []).map((region: any, index: number) => (
            <div key={region.id || index} className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex flex-col md:flex-row gap-4 items-start md:items-center">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Region Name</label>
                  <input
                    type="text"
                    value={region.name || ""}
                    onChange={(e) => updateRegion(index, "name", e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Branches / Coverage</label>
                  <input
                    type="text"
                    value={region.description || ""}
                    onChange={(e) => updateRegion(index, "description", e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeRegion(index)}
                className="text-gray-400 hover:text-red-600 p-2 rounded-md hover:bg-red-50 transition-colors self-end md:self-center"
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
