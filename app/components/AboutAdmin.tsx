import React, { useState } from 'react';
import { Save, Plus, Trash2, GripVertical, Check, Image as ImageIcon } from 'lucide-react';

export function AboutAdmin({ aboutSettings }: { aboutSettings: any }) {
  const [data, setData] = useState(() => {
    return aboutSettings || {
      hero: {
        eyebrow: "About Samastha Graph",
        statement: "The collective voice of Samastha",
        introText: "Samastha Graph is the official digital broadcasting network.",
        image: ""
      },
      story: {
        text: "Samastha Kerala Jam'iyyathul Ulama, established in 1926...",
        image: ""
      },
      mission: [
        { title: "Authentic Knowledge", icon: "BookOpen", description: "Delivering verified Islamic teachings." },
        { title: "Global Reach", icon: "Globe", description: "Connecting the global Malayali community." },
        { title: "Modern Delivery", icon: "MonitorPlay", description: "Embracing contemporary digital platforms." }
      ],
      gallery: {
        large: "",
        portrait: "",
        square: "",
        secondary: ""
      },
      work: [
        { title: "Digital Broadcasting", description: "24/7 online streaming and live coverage." },
        { title: "Content Production", description: "High-quality documentaries and discussions." },
        { title: "Archival", description: "Preserving historical speeches and manuscripts." }
      ],
      cta: {
        title: "Join Our Journey",
        description: "Be part of the digital revolution in Islamic education."
      }
    };
  });

  const updateSection = (section: string, field: string, value: any) => {
    setData((prev: any) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const updateArrayItem = (section: string, index: number, field: string, value: any) => {
    setData((prev: any) => {
      const arr = [...prev[section]];
      arr[index] = { ...arr[index], [field]: value };
      return { ...prev, [section]: arr };
    });
  };

  return (
    <div className="space-y-6">
      <input type="hidden" name="aboutData" value={JSON.stringify(data)} />

      {/* Hero Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-800">Hero Section</h3>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Eyebrow</label>
            <input type="text" value={data.hero.eyebrow || ''} onChange={(e) => updateSection('hero', 'eyebrow', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-sm" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Statement</label>
            <input type="text" value={data.hero.statement || ''} onChange={(e) => updateSection('hero', 'statement', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-sm" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Intro Text</label>
            <textarea value={data.hero.introText || ''} onChange={(e) => updateSection('hero', 'introText', e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-sm" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Hero Image URL</label>
            <p className="text-xs text-gray-500 mb-2">Recommended: 1200 × 900 px · 4:3</p>
            <input type="text" value={data.hero.image || ''} onChange={(e) => updateSection('hero', 'image', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-sm font-mono text-sm" />
          </div>
        </div>
      </div>

      {/* Story Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-800">Our Story</h3>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Story Text</label>
            <textarea value={data.story.text || ''} onChange={(e) => updateSection('story', 'text', e.target.value)} rows={6} className="w-full px-3 py-2 border border-gray-300 rounded-sm" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Story Image URL</label>
            <p className="text-xs text-gray-500 mb-2">Recommended: 800 × 1000 px · 4:5</p>
            <input type="text" value={data.story.image || ''} onChange={(e) => updateSection('story', 'image', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-sm font-mono text-sm" />
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-800">Mission (Fixed 3 Items)</h3>
        </div>
        <div className="p-6 space-y-4">
          {data.mission.map((item: any, idx: number) => (
            <div key={idx} className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Title</label>
                  <input type="text" value={item.title || ''} onChange={(e) => updateArrayItem('mission', idx, 'title', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Lucide Icon</label>
                  <input type="text" value={item.icon || ''} onChange={(e) => updateArrayItem('mission', idx, 'icon', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Description</label>
                  <textarea value={item.description || ''} onChange={(e) => updateArrayItem('mission', idx, 'description', e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gallery Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-800">Gallery</h3>
          <p className="text-sm text-gray-500">Provide URLs for the 4 image slots in the About gallery.</p>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Large Slot</label>
            <p className="text-xs text-gray-500 mb-2">Recommended: 1600 × 900 px · 16:9</p>
            <input type="text" value={data.gallery.large || ''} onChange={(e) => updateSection('gallery', 'large', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-sm font-mono text-sm" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Portrait Slot</label>
            <p className="text-xs text-gray-500 mb-2">Recommended: 900 × 1200 px · 3:4</p>
            <input type="text" value={data.gallery.portrait || ''} onChange={(e) => updateSection('gallery', 'portrait', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-sm font-mono text-sm" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Square Slot</label>
            <p className="text-xs text-gray-500 mb-2">Recommended: 1000 × 1000 px · 1:1</p>
            <input type="text" value={data.gallery.square || ''} onChange={(e) => updateSection('gallery', 'square', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-sm font-mono text-sm" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Secondary Slot</label>
            <p className="text-xs text-gray-500 mb-2">Recommended: 1200 × 900 px · 4:3</p>
            <input type="text" value={data.gallery.secondary || ''} onChange={(e) => updateSection('gallery', 'secondary', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-sm font-mono text-sm" />
          </div>
        </div>
      </div>

      {/* Work Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-800">What We Do (Fixed 3 Items)</h3>
        </div>
        <div className="p-6 space-y-4">
          {data.work.map((item: any, idx: number) => (
            <div key={idx} className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Title</label>
                  <input type="text" value={item.title || ''} onChange={(e) => updateArrayItem('work', idx, 'title', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Description</label>
                  <textarea value={item.description || ''} onChange={(e) => updateArrayItem('work', idx, 'description', e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-800">Call to Action</h3>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
            <input type="text" value={data.cta.title || ''} onChange={(e) => updateSection('cta', 'title', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-sm" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
            <textarea value={data.cta.description || ''} onChange={(e) => updateSection('cta', 'description', e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-sm" />
          </div>
        </div>
      </div>
    </div>
  );
}
