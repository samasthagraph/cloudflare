import React, { useState } from 'react';
import { Save, Image as ImageIcon } from 'lucide-react';

export function ContactAdmin({ contactSettings }: { contactSettings: any }) {
  const [data, setData] = useState(() => {
    return contactSettings || {
      hero: {
        eyebrow: "Contact Us",
        supportTag: "24/7 Support",
        headline: "Get in Touch",
        description: "We're here to help and answer any question you might have.",
        image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop"
      },
      details: {
        title: "Contact Details",
        description: "Reach out to us through any of these channels.",
        addressTitle: "Head Office",
        email: "info@samasthagraph.com",
        addressDetails: "Samastha Kerala Jam'iyyathul Ulama\nChelari, Malappuram\nKerala, India"
      },
      location: {
        title: "Visit Our Office",
        description: "Experience the center of our digital broadcasting network.",
        image: "https://images.unsplash.com/photo-1584697964328-b1e7f63dca95?q=80&w=2070&auto=format&fit=crop"
      },
      communicationNote: {
        heading: "Every message matters.",
        description: "Whether you have a question, suggestion, collaboration proposal, or feedback, we value your communication with Samastha Graph."
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

  return (
    <div className="space-y-6">
      <input type="hidden" name="contactData" value={JSON.stringify(data)} />

      {/* Hero Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-800">Hero Banner</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Eyebrow</label>
              <input type="text" value={data.hero.eyebrow || ''} onChange={(e) => updateSection('hero', 'eyebrow', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Support Tag</label>
              <input type="text" value={data.hero.supportTag || ''} onChange={(e) => updateSection('hero', 'supportTag', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-sm" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Headline</label>
              <input type="text" value={data.hero.headline || ''} onChange={(e) => updateSection('hero', 'headline', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-sm" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
              <textarea value={data.hero.description || ''} onChange={(e) => updateSection('hero', 'description', e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-sm" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Background Image URL</label>
              <p className="text-xs text-gray-500 mb-2">Recommended: 1920 × 1080 px · 16:9</p>
              <input type="text" value={data.hero.image || ''} onChange={(e) => updateSection('hero', 'image', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-sm font-mono text-sm" />
            </div>
          </div>
        </div>
      </div>

      {/* Contact Details */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-800">Contact Details</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Section Title</label>
              <input type="text" value={data.details.title || ''} onChange={(e) => updateSection('details', 'title', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Section Description</label>
              <input type="text" value={data.details.description || ''} onChange={(e) => updateSection('details', 'description', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Address Label</label>
              <input type="text" value={data.details.addressTitle || ''} onChange={(e) => updateSection('details', 'addressTitle', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
              <input type="email" value={data.details.email || ''} onChange={(e) => updateSection('details', 'email', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-sm" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Address Details (multiline)</label>
              <textarea value={data.details.addressDetails || ''} onChange={(e) => updateSection('details', 'addressDetails', e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-sm" />
            </div>
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-800">Location Area</h3>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
            <input type="text" value={data.location.title || ''} onChange={(e) => updateSection('location', 'title', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-sm" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
            <textarea value={data.location.description || ''} onChange={(e) => updateSection('location', 'description', e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-sm" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Location Image URL</label>
            <p className="text-xs text-gray-500 mb-2">Recommended: 1200 × 900 px · 4:3</p>
            <input type="text" value={data.location.image || ''} onChange={(e) => updateSection('location', 'image', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-sm font-mono text-sm" />
          </div>
        </div>
      </div>

      {/* Form Note */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-800">Form Note</h3>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Heading</label>
            <input type="text" value={data.communicationNote.heading || ''} onChange={(e) => updateSection('communicationNote', 'heading', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-sm" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
            <textarea value={data.communicationNote.description || ''} onChange={(e) => updateSection('communicationNote', 'description', e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-sm" />
          </div>
        </div>
      </div>
    </div>
  );
}
