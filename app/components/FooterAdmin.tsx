import React, { useState } from 'react';
import { Plus, Trash2, LayoutTemplate } from 'lucide-react';

interface FooterAdminProps {
  footerSettings: any;
}

export function FooterAdmin({ footerSettings }: FooterAdminProps) {
  const defaultFooter = {
    brandDescription: "Samastha Graph is the official digital broadcasting network representing the collective voice of Samastha Kerala Jam'iyyathul Ulama.",
    copyrightText: "© 2026 Samastha Graph. All rights reserved.",
    emergencyContact: "+91 494 2400000",
    officeLocation: "Samastha Centre, Francis Road, Kozhikode, Kerala 673003",
    showSocialDock: true,
    columns: [
      {
        title: "Content",
        links: [
          { label: "Latest Videos", url: "/videos" },
          { label: "Audio Podcasts", url: "/podcasts" },
          { label: "Articles & News", url: "/articles" },
          { label: "Programs & Series", url: "/videos/programs" }
        ]
      },
      {
        title: "Organization",
        links: [
          { label: "About Us", url: "/about" },
          { label: "Authors & Scholars", url: "/authors" },
          { label: "Contact Us", url: "/contact" }
        ]
      }
    ]
  };

  const [data, setData] = useState(footerSettings || defaultFooter);

  const updateColumnTitle = (colIdx: number, title: string) => {
    const cols = [...(data.columns || [])];
    cols[colIdx] = { ...cols[colIdx], title };
    setData({ ...data, columns: cols });
  };

  const updateLink = (colIdx: number, linkIdx: number, field: string, val: string) => {
    const cols = [...(data.columns || [])];
    const links = [...(cols[colIdx].links || [])];
    links[linkIdx] = { ...links[linkIdx], [field]: val };
    cols[colIdx] = { ...cols[colIdx], links };
    setData({ ...data, columns: cols });
  };

  const addLink = (colIdx: number) => {
    const cols = [...(data.columns || [])];
    const links = [...(cols[colIdx].links || []), { label: "New Link", url: "/" }];
    cols[colIdx] = { ...cols[colIdx], links };
    setData({ ...data, columns: cols });
  };

  const removeLink = (colIdx: number, linkIdx: number) => {
    const cols = [...(data.columns || [])];
    cols[colIdx].links = cols[colIdx].links.filter((_: any, idx: number) => idx !== linkIdx);
    setData({ ...data, columns: cols });
  };

  return (
    <div className="space-y-6">
      <input type="hidden" name="footerData" value={JSON.stringify(data)} />

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
          <div className="p-2.5 bg-[#fdf2f4] text-[#861937] rounded-xl">
            <LayoutTemplate size={22} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Footer Settings</h3>
            <p className="text-xs text-gray-500">Configure brand mission summary, copyright statement, and contact info.</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Brand Description</label>
          <textarea
            value={data.brandDescription || ""}
            onChange={(e) => setData({ ...data, brandDescription: e.target.value })}
            rows={3}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Copyright Notice</label>
            <input
              type="text"
              value={data.copyrightText || ""}
              onChange={(e) => setData({ ...data, copyrightText: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Office Location</label>
            <input
              type="text"
              value={data.officeLocation || ""}
              onChange={(e) => setData({ ...data, officeLocation: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
        <div className="border-b border-gray-100 pb-4">
          <h3 className="text-lg font-bold text-gray-900">Footer Navigation Columns</h3>
          <p className="text-xs text-gray-500">Organize footer column headers and destination links.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(data.columns || []).map((col: any, colIdx: number) => (
            <div key={colIdx} className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <input
                  type="text"
                  value={col.title || ""}
                  onChange={(e) => updateColumnTitle(colIdx, e.target.value)}
                  className="px-3 py-1.5 bg-white border border-gray-300 rounded-md font-bold text-sm text-gray-800"
                  placeholder="Column Title"
                />
                <button
                  type="button"
                  onClick={() => addLink(colIdx)}
                  className="text-xs font-semibold text-[#861937] hover:underline flex items-center gap-1"
                >
                  <Plus size={13} /> Add Link
                </button>
              </div>

              <div className="space-y-2">
                {(col.links || []).map((link: any, linkIdx: number) => (
                  <div key={linkIdx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={link.label || ""}
                      onChange={(e) => updateLink(colIdx, linkIdx, "label", e.target.value)}
                      className="flex-1 px-3 py-1 bg-white border border-gray-300 rounded-md text-xs"
                      placeholder="Label"
                    />
                    <input
                      type="text"
                      value={link.url || ""}
                      onChange={(e) => updateLink(colIdx, linkIdx, "url", e.target.value)}
                      className="flex-1 px-3 py-1 bg-white border border-gray-300 rounded-md text-xs"
                      placeholder="/url"
                    />
                    <button
                      type="button"
                      onClick={() => removeLink(colIdx, linkIdx)}
                      className="text-gray-400 hover:text-red-600 p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
