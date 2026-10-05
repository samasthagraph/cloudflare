import React, { useState } from 'react';
import { Plus, Trash2, Layers, BookOpen, GraduationCap, Radio, HeartHandshake, Shield, Sparkles } from 'lucide-react';

interface PillarsAdminProps {
  pillarsSettings: any;
}

export function PillarsAdmin({ pillarsSettings }: PillarsAdminProps) {
  const defaultPillars = {
    headline: "Core Pillars",
    headlineMl: "പ്രധാന കർമ്മ മേഖലകൾ",
    subheadline: "The guiding foundational branches driving Samastha Graph's mission worldwide.",
    pillars: [
      {
        id: "1",
        title: "Authentic Knowledge",
        titleMl: "ആധികാരിക വിജ്ഞാനം",
        description: "Preserving and propagating pure Ahlussunnah scholarship, classical Shafi'i jurisprudence, and verified prophetic traditions.",
        descriptionMl: "അഹ്ലുസ്സുന്നയുടെ ശുദ്ധമായ ആശയാദർശങ്ങളും കർമ്മശാസ്ത്ര വിജ്ഞാനവും സമൂഹത്തിന് പകർന്നുനൽകുന്നു.",
        icon: "BookOpen",
        order: 1
      },
      {
        id: "2",
        title: "Educational Excellence",
        titleMl: "വിദ്യാഭ്യാസ മുന്നേറ്റം",
        description: "Empowering over 10,000+ primary institutions and world-class universities with comprehensive moral and modern syllabi.",
        descriptionMl: "പതിനായിരത്തിലധികം മദ്റസകളും ഉന്നത കലാലയങ്ങളും വഴി സമ്പൂർണ്ണ ധാർമ്മിക വിദ്യാഭ്യാസ വിപ്ലവം.",
        icon: "GraduationCap",
        order: 2
      },
      {
        id: "3",
        title: "Media & Digital Outreach",
        titleMl: "മാധ്യമ രംഗം",
        description: "Utilizing state-of-the-art multimedia broadcasting, video series, podcasts, and digital publishing to reach the global Malayali diaspora.",
        descriptionMl: "നൂതന സാങ്കേതിക വിദ്യകളും മാധ്യമങ്ങളും ഉപയോഗിച്ച് ലോകമെമ്പാടുമുള്ള പ്രവാസി മലയാളികളിലേക്ക് സന്ദേശമെത്തിക്കുന്നു.",
        icon: "Radio",
        order: 3
      },
      {
        id: "4",
        title: "Community & Social Welfare",
        titleMl: "സാമൂഹിക സേവനം",
        description: "Coordinating relief activities, orphan care, student support funds, and community harmony initiatives across borders.",
        descriptionMl: "സാന്ത്വന സേവനം, അനാഥ സംരക്ഷണം, വിദ്യാർത്ഥി ക്ഷേമം എന്നിവ മുൻനിർത്തിയുള്ള കർമ്മപദ്ധതികൾ.",
        icon: "HeartHandshake",
        order: 4
      }
    ]
  };

  const [data, setData] = useState(pillarsSettings || defaultPillars);

  const updatePillar = (index: number, field: string, val: any) => {
    const updated = [...(data.pillars || [])];
    updated[index] = { ...updated[index], [field]: val };
    setData({ ...data, pillars: updated });
  };

  const addPillar = () => {
    const newId = Date.now().toString();
    const updated = [
      ...(data.pillars || []),
      {
        id: newId,
        title: "New Core Focus",
        titleMl: "പുതിയ മേഖല",
        description: "Description of the pillar...",
        descriptionMl: "വിവരണം...",
        icon: "Shield",
        order: (data.pillars?.length || 0) + 1
      }
    ];
    setData({ ...data, pillars: updated });
  };

  const removePillar = (index: number) => {
    const updated = (data.pillars || []).filter((_: any, idx: number) => idx !== index);
    setData({ ...data, pillars: updated });
  };

  return (
    <div className="space-y-6">
      <input type="hidden" name="pillarsData" value={JSON.stringify(data)} />

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
          <div className="p-2.5 bg-[#fdf2f4] text-[#861937] rounded-xl">
            <Layers size={22} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Core Pillars &amp; Focus Areas</h3>
            <p className="text-xs text-gray-500">Configure organizational focal points, icons, and descriptions.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Section Title (English)</label>
            <input
              type="text"
              value={data.headline || ""}
              onChange={(e) => setData({ ...data, headline: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm"
              placeholder="Core Pillars"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Section Title (Malayalam)</label>
            <input
              type="text"
              value={data.headlineMl || ""}
              onChange={(e) => setData({ ...data, headlineMl: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm font-malayalam"
              placeholder="പ്രധാന കർമ്മ മേഖലകൾ"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Section Subtitle</label>
          <input
            type="text"
            value={data.subheadline || ""}
            onChange={(e) => setData({ ...data, subheadline: e.target.value })}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm"
            placeholder="The guiding foundational branches driving Samastha Graph's mission..."
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Pillars List ({data.pillars?.length || 0})</h3>
            <p className="text-xs text-gray-500">Add, edit, or reorganize pillars.</p>
          </div>
          <button
            type="button"
            onClick={addPillar}
            className="flex items-center gap-2 bg-[#861937] hover:bg-[#68132b] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus size={14} /> Add Pillar
          </button>
        </div>

        <div className="space-y-6">
          {(data.pillars || []).map((pillar: any, index: number) => (
            <div key={pillar.id || index} className="p-5 bg-gray-50 border border-gray-200 rounded-xl space-y-4 relative">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-[#861937] bg-[#fdf2f4] px-2.5 py-1 rounded-md">
                  Pillar #{index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removePillar(index)}
                  className="text-gray-400 hover:text-red-600 p-1 rounded-md transition-colors"
                  title="Remove Pillar"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Title (English) *</label>
                  <input
                    type="text"
                    value={pillar.title || ""}
                    onChange={(e) => updatePillar(index, "title", e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Title (Malayalam) *</label>
                  <input
                    type="text"
                    value={pillar.titleMl || ""}
                    onChange={(e) => updatePillar(index, "titleMl", e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-malayalam"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Icon Identifier</label>
                  <select
                    value={pillar.icon || "BookOpen"}
                    onChange={(e) => updatePillar(index, "icon", e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="BookOpen">BookOpen (Knowledge)</option>
                    <option value="GraduationCap">GraduationCap (Education)</option>
                    <option value="Radio">Radio (Media / Broadcast)</option>
                    <option value="HeartHandshake">HeartHandshake (Community)</option>
                    <option value="Shield">Shield (Preservation)</option>
                    <option value="Users">Users (People)</option>
                    <option value="Globe">Globe (Global Outreach)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Description (English)</label>
                  <textarea
                    value={pillar.description || ""}
                    onChange={(e) => updatePillar(index, "description", e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Description (Malayalam)</label>
                  <textarea
                    value={pillar.descriptionMl || ""}
                    onChange={(e) => updatePillar(index, "descriptionMl", e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-malayalam"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
