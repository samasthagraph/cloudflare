import React, { useState } from 'react';
import { Mail, CheckCircle, Clock, Trash2, Reply, Search, User, Phone, Calendar } from 'lucide-react';
import { Form } from '@remix-run/react';

interface ContactMessagesAdminProps {
  messages: any[];
}

export function ContactMessagesAdmin({ messages = [] }: ContactMessagesAdminProps) {
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [search, setSearch] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<any>(messages[0] || null);

  const filtered = messages.filter((m: any) => {
    const matchesFilter = filter === 'all' || (filter === 'unread' ? m.status === 'unread' : m.status !== 'unread');
    const matchesSearch = 
      (m.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (m.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (m.subject || '').toLowerCase().includes(search.toLowerCase()) ||
      (m.message || '').toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 font-heading">Contact Messages Inbox</h2>
          <p className="text-xs text-gray-500">Read and manage form submissions and inquiries from website visitors.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-rose-50 text-[#861937] text-xs font-bold rounded-full border border-rose-200">
            {messages.filter(m => m.status === 'unread').length} Unread
          </span>
          <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded-full">
            {messages.length} Total
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Messages List Column */}
        <div className="lg:col-span-5 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100 space-y-3 bg-gray-50/50">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search messages..."
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#861937]"
              />
            </div>
            <div className="flex gap-2 text-xs">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded-md font-semibold transition-colors ${filter === 'all' ? 'bg-[#861937] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setFilter('unread')}
                className={`px-3 py-1 rounded-md font-semibold transition-colors ${filter === 'unread' ? 'bg-[#861937] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                Unread
              </button>
              <button
                type="button"
                onClick={() => setFilter('read')}
                className={`px-3 py-1 rounded-md font-semibold transition-colors ${filter === 'read' ? 'bg-[#861937] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                Read
              </button>
            </div>
          </div>

          <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-xs">
                No messages found.
              </div>
            ) : (
              filtered.map((msg: any) => {
                const isSelected = selectedMessage?.id === msg.id;
                const isUnread = msg.status === 'unread';
                return (
                  <div
                    key={msg.id}
                    onClick={() => setSelectedMessage(msg)}
                    className={`p-4 cursor-pointer transition-colors ${isSelected ? 'bg-rose-50/70 border-l-4 border-[#861937]' : isUnread ? 'bg-white font-semibold' : 'bg-gray-50/30 text-gray-600 hover:bg-gray-50'}`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className={`text-xs truncate ${isUnread ? 'text-gray-900 font-bold' : 'text-gray-700'}`}>
                        {msg.name || 'Anonymous'}
                      </span>
                      <span className="text-[10px] text-gray-400 whitespace-nowrap">
                        {msg.createdAt ? new Date(msg.createdAt).toLocaleDateString() : ''}
                      </span>
                    </div>
                    <div className="text-xs text-gray-800 truncate mb-1">
                      {msg.subject || 'No Subject'}
                    </div>
                    <div className="text-[11px] text-gray-500 truncate">
                      {msg.message}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Selected Message Detail Column */}
        <div className="lg:col-span-7 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {selectedMessage ? (
            <div className="space-y-6">
              <div className="flex items-start justify-between border-b border-gray-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{selectedMessage.subject || 'General Enquiry'}</h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1 font-semibold text-gray-800"><User size={13} /> {selectedMessage.name}</span>
                    {selectedMessage.email && <span className="flex items-center gap-1 text-[#861937]"><Mail size={13} /> {selectedMessage.email}</span>}
                    {selectedMessage.phone && <span className="flex items-center gap-1"><Phone size={13} /> {selectedMessage.phone}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Form method="post">
                    <input type="hidden" name="intent" value="updateMessageStatus" />
                    <input type="hidden" name="messageId" value={selectedMessage.id} />
                    <input type="hidden" name="newStatus" value={selectedMessage.status === 'unread' ? 'read' : 'unread'} />
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition-colors"
                    >
                      Mark as {selectedMessage.status === 'unread' ? 'Read' : 'Unread'}
                    </button>
                  </Form>
                  <Form method="post" onSubmit={(e) => { if (!confirm('Delete this message?')) e.preventDefault(); }}>
                    <input type="hidden" name="intent" value="deleteMessage" />
                    <input type="hidden" name="messageId" value={selectedMessage.id} />
                    <button
                      type="submit"
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </Form>
                </div>
              </div>

              <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                {selectedMessage.message}
              </div>

              {selectedMessage.email && (
                <div className="pt-4 border-t border-gray-100 flex justify-end">
                  <a
                    href={`mailto:${selectedMessage.email}?subject=Re: ${encodeURIComponent(selectedMessage.subject || 'Enquiry via Samastha Graph')}`}
                    className="flex items-center gap-2 bg-[#861937] hover:bg-[#68132b] text-white px-5 py-2 rounded-lg text-xs font-semibold shadow-sm transition-colors"
                  >
                    <Reply size={15} /> Reply via Email
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center text-gray-400 text-xs">
              Select a message from the list to view details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
