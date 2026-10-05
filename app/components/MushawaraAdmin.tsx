import React, { useState } from 'react';
import { Plus, Trash2, Users, MapPin } from 'lucide-react';

interface MushawaraAdminProps {
  mushawaraSettings: any;
}

export function MushawaraAdmin({ mushawaraSettings }: MushawaraAdminProps) {
  const defaultMushawara = {
    headline: "Supreme Mushawara Council",
    headlineMl: "കേന്ദ്ര മുശാവറ അംഗങ്ങൾ",
    subheadline: "The supreme 40-member decision-making religious council of Sunni scholars.",
    members: [
      {
        id: "1",
        name: "Sayyid Muhammad Jifri Muthukkoya Thangal",
        nameMl: "സയ്യിദ് മുഹമ്മദ് ജിഫ്രി മുത്തുക്കോയ തങ്ങൾ",
        title: "President",
        district: "Kozhikode",
        image: "/images/leaders/jifri-thangal.webp"
      },
      {
        id: "2",
        name: "Prof. K. Alikutty Musliyar",
        nameMl: "പ്രൊഫ. കെ. ആലിക്കുട്ടി മുസ്‌ലിയാർ",
        title: "General Secretary",
        district: "Malappuram",
        image: "/images/leaders/alikutty-musliyar.webp"
      },
      {
        id: "3",
        name: "Sayyid Sadiq Ali Shihab Thangal",
        nameMl: "സയ്യിദ് സാദിഖലി ശിഹാബ് തങ്ങൾ",
        title: "Vice President",
        district: "Malappuram",
        image: ""
      },
      {
        id: "4",
        name: "K. Ummer Faizy Mukkam",
        nameMl: "ഉമർ ഫൈസി മുക്കം",
        title: "Secretary",
        district: "Kozhikode",
        image: ""
      }
    ]
  };

  const [data, setData] = useState(mushawaraSettings || defaultMushawara);

  const updateMember = (index: number, field: string, val: string) => {
    const updated = [...(data.members || [])];
    updated[index] = { ...updated[index], [field]: val };
    setData({ ...data, members: updated });
  };

  const addMember = () => {
    const newId = Date.now().toString();
    const updated = [
      ...(data.members || []),
      {
        id: newId,
        name: "Scholar Name",
        nameMl: "പണ്ഡിതന്റെ പേര്",
        title: "Member",
        district: "District",
        image: ""
      }
    ];
    setData({ ...data, members: updated });
  };

  const removeMember = (index: number) => {
    const updated = (data.members || []).filter((_: any, idx: number) => idx !== index);
    setData({ ...data, members: updated });
  };

  return (
    <div className="space-y-6">
      <input type="hidden" name="mushawaraData" value={JSON.stringify(data)} />

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
          <div className="p-2.5 bg-[#fdf2f4] text-[#861937] rounded-xl">
            <Users size={22} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Supreme Mushawara Members</h3>
            <p className="text-xs text-gray-500">Manage the roster of Samastha Kerala Jam'iyyathul Ulama central committee scholars.</p>
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
            <h3 className="text-lg font-bold text-gray-900">Council Members ({data.members?.length || 0})</h3>
          </div>
          <button
            type="button"
            onClick={addMember}
            className="flex items-center gap-2 bg-[#861937] hover:bg-[#68132b] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus size={14} /> Add Member
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(data.members || []).map((member: any, index: number) => (
            <div key={member.id || index} className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3 relative">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-[#861937]">#{index + 1}</span>
                <button
                  type="button"
                  onClick={() => removeMember(index)}
                  className="text-gray-400 hover:text-red-600 p-1"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">Name (English)</label>
                <input
                  type="text"
                  value={member.name || ""}
                  onChange={(e) => updateMember(index, "name", e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">Name (Malayalam)</label>
                <input
                  type="text"
                  value={member.nameMl || ""}
                  onChange={(e) => updateMember(index, "nameMl", e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm font-malayalam"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Designation</label>
                  <input
                    type="text"
                    value={member.title || ""}
                    onChange={(e) => updateMember(index, "title", e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-md text-xs"
                    placeholder="e.g. Member / Secretary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">District / Region</label>
                  <input
                    type="text"
                    value={member.district || ""}
                    onChange={(e) => updateMember(index, "district", e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-md text-xs"
                    placeholder="e.g. Kozhikode"
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
