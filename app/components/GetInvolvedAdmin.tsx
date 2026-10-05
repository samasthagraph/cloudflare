import React, { useState } from 'react';
import { MessageSquare, HeartHandshake, Send, Users } from 'lucide-react';

interface GetInvolvedAdminProps {
  getInvolvedSettings: any;
}

export function GetInvolvedAdmin({ getInvolvedSettings }: GetInvolvedAdminProps) {
  const defaultInvolved = {
    headline: "Join the Community",
    headlineMl: "ഞങ്ങളോടൊപ്പം ചേരൂ",
    subheadline: "Connect directly with our broadcasting channels and community groups.",
    whatsappGroupTitle: "Official Samastha Graph WhatsApp Community",
    whatsappGroupTitleMl: "സമസ്ത ഗ്രാഫ് വാട്സാപ്പ് കമ്മ്യൂണിറ്റി",
    whatsappGroupUrl: "https://chat.whatsapp.com/sample-group-invite",
    whatsappGroupButtonText: "Join WhatsApp Community",
    whatsappGroupDetails: "Get breaking official notices, daily videos, and weekly scholarly podcast alerts.",
    telegramChannelUrl: "https://t.me/samasthagraph",
    volunteerTitle: "Become a Digital Volunteer",
    volunteerDescription: "Contribute articles, translation, video editing, or spread authentic knowledge.",
    donationUrl: "https://samasthagraph.com/support"
  };

  const [data, setData] = useState(getInvolvedSettings || defaultInvolved);

  return (
    <div className="space-y-6">
      <input type="hidden" name="getInvolvedData" value={JSON.stringify(data)} />

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
          <div className="p-2.5 bg-[#fdf2f4] text-[#861937] rounded-xl">
            <MessageSquare size={22} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">WhatsApp Community &amp; Get Involved Settings</h3>
            <p className="text-xs text-gray-500">Manage WhatsApp invite link, channel buttons, volunteer invitations, and community widgets.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">WhatsApp Group Title (English)</label>
            <input
              type="text"
              value={data.whatsappGroupTitle || ""}
              onChange={(e) => setData({ ...data, whatsappGroupTitle: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm"
              placeholder="Official Samastha Graph WhatsApp Community"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">WhatsApp Group Title (Malayalam)</label>
            <input
              type="text"
              value={data.whatsappGroupTitleMl || ""}
              onChange={(e) => setData({ ...data, whatsappGroupTitleMl: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm font-malayalam"
              placeholder="സമസ്ത ഗ്രാഫ് വാട്സാപ്പ് കമ്മ്യൂണിറ്റി"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">WhatsApp Invite Link / URL *</label>
            <input
              type="text"
              value={data.whatsappGroupUrl || ""}
              onChange={(e) => setData({ ...data, whatsappGroupUrl: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm"
              placeholder="https://chat.whatsapp.com/..."
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">WhatsApp Button Text</label>
            <input
              type="text"
              value={data.whatsappGroupButtonText || ""}
              onChange={(e) => setData({ ...data, whatsappGroupButtonText: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm"
              placeholder="Join WhatsApp Community"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">WhatsApp Community Details / Description</label>
          <textarea
            value={data.whatsappGroupDetails || ""}
            onChange={(e) => setData({ ...data, whatsappGroupDetails: e.target.value })}
            rows={2}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm"
            placeholder="Get breaking official notices, daily videos, and weekly scholarly podcast alerts."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Telegram Channel URL</label>
            <input
              type="text"
              value={data.telegramChannelUrl || ""}
              onChange={(e) => setData({ ...data, telegramChannelUrl: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm"
              placeholder="https://t.me/samasthagraph"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Donation / Support URL</label>
            <input
              type="text"
              value={data.donationUrl || ""}
              onChange={(e) => setData({ ...data, donationUrl: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm"
              placeholder="https://samasthagraph.com/support"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 space-y-4">
          <h4 className="text-sm font-bold text-gray-900">Volunteer Opportunities</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Volunteer Heading</label>
              <input
                type="text"
                value={data.volunteerTitle || ""}
                onChange={(e) => setData({ ...data, volunteerTitle: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Volunteer Description</label>
              <input
                type="text"
                value={data.volunteerDescription || ""}
                onChange={(e) => setData({ ...data, volunteerDescription: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
