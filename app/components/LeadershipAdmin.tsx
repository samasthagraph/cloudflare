import React, { useState } from 'react';
import { Plus, Trash2, Award, User, Upload } from 'lucide-react';

interface LeadershipAdminProps {
  leadershipSettings: any;
}

export function LeadershipAdmin({ leadershipSettings }: LeadershipAdminProps) {
  const defaultLeadership = {
    headline: "Eminent Leadership",
    headlineMl: "നേതൃത്വം",
    subheadline: "Guided by esteemed scholars leading the intellectual and moral revival of Kerala Muslims.",
    leaders: [
      {
        id: "1",
        name: "Sayyid Muhammad Jifri Muthukkoya Thangal",
        nameMl: "സയ്യിദ് മുഹമ്മദ് ജിഫ്രി മുത്തുക്കോയ തങ്ങൾ",
        role: "President, Samastha Kerala Jam'iyyathul Ulama",
        roleMl: "പ്രസിഡന്റ്, സമസ്ത കേരള ജംഇയ്യത്തുൽ ഉലമാ",
        image: "/images/leaders/jifri-thangal.webp",
        bio: "Distinguished Islamic jurist, educator, and supreme spiritual leader guiding Samastha.",
        order: 1
      },
      {
        id: "2",
        name: "Prof. K. Alikutty Musliyar",
        nameMl: "പ്രൊഫ. കെ. ആലിക്കുട്ടി മുസ്‌ലിയാർ",
        role: "General Secretary, Samastha Kerala Jam'iyyathul Ulama",
        roleMl: "ജനറൽ സെക്രട്ടറി, സമസ്ത കേരള ജംഇയ്യത്തുൽ ഉലമാ",
        image: "/images/leaders/alikutty-musliyar.webp",
        bio: "Renowned international Islamic scholar, academician, and Vice Chancellor of Jamia Nooriya.",
        order: 2
      },
      {
        id: "3",
        name: "M.T. Abdulla Musliyar",
        nameMl: "എം.ടി. അബ്ദുല്ല മുസ്‌ലിയാർ",
        role: "Treasurer & Senior Leader",
        roleMl: "ട്രഷറർ, സമസ്ത കേരള ജംഇയ്യത്തുൽ ഉലമാ",
        image: "/images/leaders/mt-musliyar.webp",
        bio: "Veteran scholar and executive member of Samastha Mushawara.",
        order: 3
      }
    ]
  };

  const [data, setData] = useState(leadershipSettings || defaultLeadership);

  const updateLeader = (index: number, field: string, val: any) => {
    const updated = [...(data.leaders || [])];
    updated[index] = { ...updated[index], [field]: val };
    setData({ ...data, leaders: updated });
  };

  const addLeader = () => {
    const newId = Date.now().toString();
    const updated = [
      ...(data.leaders || []),
      {
        id: newId,
        name: "New Leader",
        nameMl: "പുതിയ നേതാവ്",
        role: "Office Bearer",
        roleMl: "ഭാരവാഹി",
        image: "",
        bio: "",
        order: (data.leaders?.length || 0) + 1
      }
    ];
    setData({ ...data, leaders: updated });
  };

  const removeLeader = (index: number) => {
    const updated = (data.leaders || []).filter((_: any, idx: number) => idx !== index);
    setData({ ...data, leaders: updated });
  };

  return (
    <div className="space-y-6">
      <input type="hidden" name="leadershipData" value={JSON.stringify(data)} />

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
          <div className="p-2.5 bg-[#fdf2f4] text-[#861937] rounded-xl">
            <Award size={22} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Leadership &amp; Supreme Scholars</h3>
            <p className="text-xs text-gray-500">Manage key leaders, titles, photographs, and short biographies.</p>
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
              placeholder="Eminent Leadership"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Section Title (Malayalam)</label>
            <input
              type="text"
              value={data.headlineMl || ""}
              onChange={(e) => setData({ ...data, headlineMl: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm font-malayalam"
              placeholder="നേതൃത്വം"
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
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Scholars &amp; Leaders Directory ({data.leaders?.length || 0})</h3>
            <p className="text-xs text-gray-500">Add or modify scholars presented on the site.</p>
          </div>
          <button
            type="button"
            onClick={addLeader}
            className="flex items-center gap-2 bg-[#861937] hover:bg-[#68132b] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus size={14} /> Add Leader
          </button>
        </div>

        <div className="space-y-6">
          {(data.leaders || []).map((leader: any, index: number) => (
            <div key={leader.id || index} className="p-5 bg-gray-50 border border-gray-200 rounded-xl space-y-4 relative">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-[#861937] bg-[#fdf2f4] px-2.5 py-1 rounded-md">
                  Leader #{index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeLeader(index)}
                  className="text-gray-400 hover:text-red-600 p-1 rounded-md transition-colors"
                  title="Remove Leader"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Scholar Name (English) *</label>
                  <input
                    type="text"
                    value={leader.name || ""}
                    onChange={(e) => updateLeader(index, "name", e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Scholar Name (Malayalam) *</label>
                  <input
                    type="text"
                    value={leader.nameMl || ""}
                    onChange={(e) => updateLeader(index, "nameMl", e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-malayalam"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Designation / Role (English)</label>
                  <input
                    type="text"
                    value={leader.role || ""}
                    onChange={(e) => updateLeader(index, "role", e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Designation / Role (Malayalam)</label>
                  <input
                    type="text"
                    value={leader.roleMl || ""}
                    onChange={(e) => updateLeader(index, "roleMl", e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-malayalam"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Photo / Portrait Image URL</label>
                  <input
                    type="text"
                    value={leader.image || ""}
                    onChange={(e) => updateLeader(index, "image", e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm"
                    placeholder="/images/leaders/... or https://..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Biography / Summary</label>
                  <textarea
                    value={leader.bio || ""}
                    onChange={(e) => updateLeader(index, "bio", e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm"
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
