import React, { useState } from 'react';
import { Plus, Trash2, BookOpenCheck, ExternalLink } from 'lucide-react';

interface FatwaAdminProps {
  fatwaSettings: any;
}

export function FatwaAdmin({ fatwaSettings }: FatwaAdminProps) {
  const defaultFatwa = {
    headline: "Ideology & Fatwa Guidance",
    headlineMl: "ആദർശവും ഫത്‌വകളും",
    subheadline: "Clear theological positions and juridical responses on contemporary challenges adhering to authentic Sunni tradition.",
    bannerImageUrl: "/images/cms/fatwa/banner.webp",
    officialStance: "Samastha upholds the orthodox Sunni-Shafi'i methodology, safeguarding spiritual traditions, sufi tariqas, and traditional Islamic sciences against deviation and modernism.",
    officialStanceMl: "അഹ്ലുസ്സുന്നത്തി വൽ ജമാഅത്തിന്റെ യഥാർത്ഥ ആശയാദർശങ്ങൾ സംരക്ഷിച്ചും പാരമ്പര്യ പണ്ഡിത സരണിയെ മുറുകെ പിടിച്ചും സമസ്ത സമൂഹത്തെ നയിക്കുന്നു.",
    externalCmsUrl: "https://fiqhfiles.samasthagraph.com",
    recentFatwas: [
      {
        id: "1",
        title: "On Islamic Finance and Digital Currencies",
        titleMl: "ഡിജിറ്റൽ കറൻസികളും ഇസ്ലാമിക സാമ്പത്തിക വീക്ഷണവും",
        date: "2024-05-10",
        category: "Economy & Trade",
        summary: "Clarification on halal commercial transactions and volatile digital token trading under Shafi'i law."
      },
      {
        id: "2",
        title: "Sighting of the Crescent and Uniformity Guidelines",
        titleMl: "മാസപ്പിറവി നിർണ്ണയവും ഐക്യരൂപ മാനദണ്ഡങ്ങളും",
        date: "2024-03-01",
        category: "Worship / Ibadah",
        summary: "Authentic jurisprudential protocol regarding astronomical calculations versus eyewitness evidence."
      }
    ]
  };

  const [data, setData] = useState(fatwaSettings || defaultFatwa);

  const updateFatwa = (index: number, field: string, val: string) => {
    const updated = [...(data.recentFatwas || [])];
    updated[index] = { ...updated[index], [field]: val };
    setData({ ...data, recentFatwas: updated });
  };

  const addFatwa = () => {
    const newId = Date.now().toString();
    const updated = [
      ...(data.recentFatwas || []),
      {
        id: newId,
        title: "New Clarification / Fatwa Title",
        titleMl: "പുതിയ ഫത്‌വ / വിധി",
        date: new Date().toISOString().split('T')[0],
        category: "General Jurisprudence",
        summary: "Summary of the juridical verdict..."
      }
    ];
    setData({ ...data, recentFatwas: updated });
  };

  const removeFatwa = (index: number) => {
    const updated = (data.recentFatwas || []).filter((_: any, idx: number) => idx !== index);
    setData({ ...data, recentFatwas: updated });
  };

  return (
    <div className="space-y-6">
      <input type="hidden" name="fatwaData" value={JSON.stringify(data)} />

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
          <div className="p-2.5 bg-[#fdf2f4] text-[#861937] rounded-xl">
            <BookOpenCheck size={22} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Ideology, Jurisprudence &amp; Fatwa Settings</h3>
            <p className="text-xs text-gray-500">Configure theological positions, banner image, and recent juridical edicts.</p>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Banner Image URL</label>
            <input
              type="text"
              value={data.bannerImageUrl || ""}
              onChange={(e) => setData({ ...data, bannerImageUrl: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm"
              placeholder="/images/cms/fatwa/banner.webp"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">External Fiqh Files CMS URL</label>
            <input
              type="text"
              value={data.externalCmsUrl || ""}
              onChange={(e) => setData({ ...data, externalCmsUrl: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm"
              placeholder="https://fiqhfiles.samasthagraph.com"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Official Stance (English)</label>
            <textarea
              value={data.officialStance || ""}
              onChange={(e) => setData({ ...data, officialStance: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Official Stance (Malayalam)</label>
            <textarea
              value={data.officialStanceMl || ""}
              onChange={(e) => setData({ ...data, officialStanceMl: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm font-malayalam"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Recent Fatwas &amp; Resolutions ({data.recentFatwas?.length || 0})</h3>
          </div>
          <button
            type="button"
            onClick={addFatwa}
            className="flex items-center gap-2 bg-[#861937] hover:bg-[#68132b] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus size={14} /> Add Fatwa
          </button>
        </div>

        <div className="space-y-4">
          {(data.recentFatwas || []).map((fatwa: any, index: number) => (
            <div key={fatwa.id || index} className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3 relative">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-[#861937]">#{index + 1} • {fatwa.category || 'Jurisprudence'}</span>
                <button
                  type="button"
                  onClick={() => removeFatwa(index)}
                  className="text-gray-400 hover:text-red-600 p-1"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Title (English)</label>
                  <input
                    type="text"
                    value={fatwa.title || ""}
                    onChange={(e) => updateFatwa(index, "title", e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Title (Malayalam)</label>
                  <input
                    type="text"
                    value={fatwa.titleMl || ""}
                    onChange={(e) => updateFatwa(index, "titleMl", e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm font-malayalam"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Category</label>
                  <input
                    type="text"
                    value={fatwa.category || ""}
                    onChange={(e) => updateFatwa(index, "category", e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-md text-xs"
                    placeholder="e.g. Worship / Finance / Family"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Issued Date</label>
                  <input
                    type="date"
                    value={fatwa.date || ""}
                    onChange={(e) => updateFatwa(index, "date", e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-md text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">Summary / Verdict Details</label>
                <textarea
                  value={fatwa.summary || ""}
                  onChange={(e) => updateFatwa(index, "summary", e.target.value)}
                  rows={2}
                  className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-md text-xs"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
