import React, { useState } from 'react';
import { Plus, Trash2, GraduationCap, Building2 } from 'lucide-react';

interface EducationAdminProps {
  educationSettings: any;
}

export function EducationAdmin({ educationSettings }: EducationAdminProps) {
  const defaultEducation = {
    headline: "Educational Ecosystem",
    headlineMl: "വിദ്യാഭ്യാസ സംവിധാനം",
    subheadline: "The world's largest non-governmental religious education network.",
    boardName: "Samastha Kerala Islam Matha Vidyabhyasa Board (SKIMVB)",
    establishedYear: "1951",
    institutionsCount: "10,850+",
    syllabusOverview: "Structured 12-tier moral curriculum with textbooks published in multiple languages including Malayalam, English, Urdu, and Arabic.",
    wings: [
      { id: "1", name: "Jamia Nooriya Arabic College", type: "Premier Postgraduate Seminary", location: "Pattikkad, Malappuram" },
      { id: "2", name: "Darul Huda Islamic University", type: "Integrated Dual-Degree System", location: "Chemmad, Malappuram" },
      { id: "3", name: "Samastha National Education Council", type: "National Curriculum Board", location: "Chelari" }
    ]
  };

  const [data, setData] = useState(educationSettings || defaultEducation);

  const updateWing = (index: number, field: string, val: string) => {
    const updated = [...(data.wings || [])];
    updated[index] = { ...updated[index], [field]: val };
    setData({ ...data, wings: updated });
  };

  const addWing = () => {
    const newId = Date.now().toString();
    const updated = [
      ...(data.wings || []),
      { id: newId, name: "New College / University", type: "Academy", location: "Location" }
    ];
    setData({ ...data, wings: updated });
  };

  const removeWing = (index: number) => {
    const updated = (data.wings || []).filter((_: any, idx: number) => idx !== index);
    setData({ ...data, wings: updated });
  };

  return (
    <div className="space-y-6">
      <input type="hidden" name="educationData" value={JSON.stringify(data)} />

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
          <div className="p-2.5 bg-[#fdf2f4] text-[#861937] rounded-xl">
            <GraduationCap size={22} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Education Board &amp; Institutions</h3>
            <p className="text-xs text-gray-500">Configure education board facts, syllabus descriptions, and major universities.</p>
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Board Name</label>
            <input
              type="text"
              value={data.boardName || ""}
              onChange={(e) => setData({ ...data, boardName: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Established Year</label>
            <input
              type="text"
              value={data.establishedYear || ""}
              onChange={(e) => setData({ ...data, establishedYear: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Madrasas Count</label>
            <input
              type="text"
              value={data.institutionsCount || ""}
              onChange={(e) => setData({ ...data, institutionsCount: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Syllabus &amp; Curriculum Overview</label>
          <textarea
            value={data.syllabusOverview || ""}
            onChange={(e) => setData({ ...data, syllabusOverview: e.target.value })}
            rows={3}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Affiliated Universities &amp; Seminaries ({data.wings?.length || 0})</h3>
          </div>
          <button
            type="button"
            onClick={addWing}
            className="flex items-center gap-2 bg-[#861937] hover:bg-[#68132b] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus size={14} /> Add Institution
          </button>
        </div>

        <div className="space-y-4">
          {(data.wings || []).map((wing: any, index: number) => (
            <div key={wing.id || index} className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex flex-col md:flex-row gap-3 items-start md:items-center">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Institution Name</label>
                  <input
                    type="text"
                    value={wing.name || ""}
                    onChange={(e) => updateWing(index, "name", e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Type / Category</label>
                  <input
                    type="text"
                    value={wing.type || ""}
                    onChange={(e) => updateWing(index, "type", e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Location</label>
                  <input
                    type="text"
                    value={wing.location || ""}
                    onChange={(e) => updateWing(index, "location", e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeWing(index)}
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
