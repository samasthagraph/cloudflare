import React, { useState } from 'react';
import { Plus, Trash2, Activity, Hash } from 'lucide-react';

interface HighlightsAdminProps {
  highlightsSettings: any;
}

export function HighlightsAdmin({ highlightsSettings }: HighlightsAdminProps) {
  const defaultHighlights = {
    headline: "Impact In Numbers",
    headlineMl: "നാഴികക്കല്ലുകൾ",
    subheadline: "A century of service to society, knowledge, and community development.",
    stats: [
      { id: "1", number: "10,000+", label: "Madrasa Institutions", labelMl: "മദ്റസകൾ", description: "Primary moral academies" },
      { id: "2", number: "1.2M+", label: "Active Students", labelMl: "വിദ്യാർത്ഥികൾ", description: "Enrolled across institutions" },
      { id: "3", number: "150K+", label: "Certified Teachers", labelMl: "അധ്യാപകർ (മുഅല്ലിംകൾ)", description: "Dedicated educators" },
      { id: "4", number: "100 Years", label: "Centennial Legacy", labelMl: "നൂറ്റാണ്ടിന്റെ പാരമ്പര്യം", description: "Founded in 1926" }
    ]
  };

  const [data, setData] = useState(highlightsSettings || defaultHighlights);

  const updateStat = (index: number, field: string, val: string) => {
    const updated = [...(data.stats || [])];
    updated[index] = { ...updated[index], [field]: val };
    setData({ ...data, stats: updated });
  };

  const addStat = () => {
    const newId = Date.now().toString();
    const updated = [
      ...(data.stats || []),
      { id: newId, number: "500+", label: "Metric Label", labelMl: "വിവരണം", description: "Short caption" }
    ];
    setData({ ...data, stats: updated });
  };

  const removeStat = (index: number) => {
    const updated = (data.stats || []).filter((_: any, idx: number) => idx !== index);
    setData({ ...data, stats: updated });
  };

  return (
    <div className="space-y-6">
      <input type="hidden" name="highlightsData" value={JSON.stringify(data)} />

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
          <div className="p-2.5 bg-[#fdf2f4] text-[#861937] rounded-xl">
            <Activity size={22} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Key Highlights &amp; Metrics Counters</h3>
            <p className="text-xs text-gray-500">Live numerical stats, labels, and impact badges displayed across the portal.</p>
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
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Statistics Counters ({data.stats?.length || 0})</h3>
          </div>
          <button
            type="button"
            onClick={addStat}
            className="flex items-center gap-2 bg-[#861937] hover:bg-[#68132b] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus size={14} /> Add Metric
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(data.stats || []).map((stat: any, index: number) => (
            <div key={stat.id || index} className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3 relative">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-[#861937]">Counter #{index + 1}</span>
                <button
                  type="button"
                  onClick={() => removeStat(index)}
                  className="text-gray-400 hover:text-red-600 p-1"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">Number / Stat Value *</label>
                <input
                  type="text"
                  value={stat.number || ""}
                  onChange={(e) => updateStat(index, "number", e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm font-bold text-[#861937]"
                  placeholder="e.g. 10,000+"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Label (English)</label>
                  <input
                    type="text"
                    value={stat.label || ""}
                    onChange={(e) => updateStat(index, "label", e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-md text-xs"
                    placeholder="Madrasas"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Label (Malayalam)</label>
                  <input
                    type="text"
                    value={stat.labelMl || ""}
                    onChange={(e) => updateStat(index, "labelMl", e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-md text-xs font-malayalam"
                    placeholder="മദ്റസകൾ"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">Short Description</label>
                <input
                  type="text"
                  value={stat.description || ""}
                  onChange={(e) => updateStat(index, "description", e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-md text-xs"
                  placeholder="Short note"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
