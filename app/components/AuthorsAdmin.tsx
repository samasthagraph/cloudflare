import React, { useState } from 'react';
import { Plus, Trash2, Edit3, User, Image, CheckCircle, ExternalLink, Globe, Sparkles } from 'lucide-react';

export interface Author {
  id: string;
  name: string;
  nameMl?: string;
  role?: string;
  avatar?: string;
  bio?: string;
  twitter?: string;
  website?: string;
}

interface AuthorsAdminProps {
  authorsSettings: { authors: Author[] };
}

export function AuthorsAdmin({ authorsSettings }: AuthorsAdminProps) {
  const [authors, setAuthors] = useState<Author[]>(authorsSettings?.authors || []);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formState, setFormState] = useState<Author>({
    id: '',
    name: '',
    nameMl: '',
    role: '',
    avatar: '',
    bio: '',
    twitter: '',
    website: ''
  });

  const openAddModal = () => {
    setEditingIndex(null);
    setFormState({
      id: `author-${Date.now()}`,
      name: '',
      nameMl: '',
      role: '',
      avatar: '',
      bio: '',
      twitter: '',
      website: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (index: number) => {
    setEditingIndex(index);
    setFormState({ ...authors[index] });
    setIsModalOpen(true);
  };

  const saveAuthor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name.trim() && !formState.nameMl?.trim()) {
      alert('Please enter at least an English or Malayalam author name.');
      return;
    }

    const updated = [...authors];
    const authorPayload: Author = {
      ...formState,
      name: formState.name || formState.nameMl || 'Author',
      id: formState.id || `author-${Date.now()}`
    };

    if (editingIndex !== null) {
      updated[editingIndex] = authorPayload;
    } else {
      updated.push(authorPayload);
    }

    setAuthors(updated);
    setIsModalOpen(false);
  };

  const deleteAuthor = (index: number) => {
    if (confirm(`Are you sure you want to delete "${authors[index].name || authors[index].nameMl}"?`)) {
      setAuthors(authors.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Hidden Form Payload */}
      <input type="hidden" name="authorsData" value={JSON.stringify({ authors })} />

      {/* Header Banner */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-emerald-950 via-[#15664a] to-emerald-800 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <User size={24} className="text-[#c8a136]" />
            <h2 className="text-xl font-bold">Author & Scholar Management</h2>
          </div>
          <p className="text-emerald-100 text-sm max-w-2xl">
            Add and manage authors, scholars, and writers. Authors added here will be immediately available in the Article, Video, and Podcast author selectors.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-2 bg-[#c8a136] hover:bg-yellow-500 text-gray-900 font-bold px-5 py-2.5 rounded-lg shadow-sm text-sm transition-all"
        >
          <Plus size={18} /> Add New Author
        </button>
      </div>

      {/* Authors Grid */}
      <div className="p-6">
        {authors.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <User size={48} className="mx-auto text-gray-400 mb-3 opacity-60" />
            <h3 className="text-lg font-bold text-gray-700">No authors added yet</h3>
            <p className="text-gray-500 text-sm mt-1 max-w-sm mx-auto">
              Create authors to attribute articles, scholars, and guest writers across the platform.
            </p>
            <button
              type="button"
              onClick={openAddModal}
              className="mt-4 inline-flex items-center gap-2 bg-[#15664a] text-white px-4 py-2 rounded-md font-semibold text-sm hover:bg-[#0f4d38] transition-colors"
            >
              <Plus size={16} /> Add First Author
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {authors.map((author, index) => (
              <div
                key={author.id || index}
                className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 rounded-full bg-emerald-50 border-2 border-[#15664a]/20 overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {author.avatar ? (
                        <img src={author.avatar} alt={author.name} className="w-full h-full object-cover" />
                      ) : (
                        <User size={24} className="text-[#15664a]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-base leading-tight truncate">
                        {author.name}
                      </h3>
                      {author.nameMl && (
                        <p className="text-xs text-[#15664a] font-medium font-malayalam truncate mt-0.5">
                          {author.nameMl}
                        </p>
                      )}
                      {author.role && (
                        <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded mt-1.5 font-medium">
                          {author.role}
                        </span>
                      )}
                    </div>
                  </div>

                  {author.bio && (
                    <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed mb-4 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                      {author.bio}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-2">
                  <span className="text-[11px] text-gray-400 font-mono">
                    ID: {author.id}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(index)}
                      className="p-1.5 text-gray-500 hover:text-[#15664a] hover:bg-gray-100 rounded transition-colors"
                      title="Edit Author"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteAuthor(index)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Delete Author"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Author Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 animate-fade-in-up">
            <div className="px-6 py-4 bg-gradient-to-r from-emerald-950 to-[#15664a] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User size={20} className="text-[#c8a136]" />
                <h3 className="font-bold text-lg">
                  {editingIndex !== null ? 'Edit Author' : 'Add New Author'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-white/80 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={saveAuthor} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Author Name (English) *
                  </label>
                  <input
                    type="text"
                    value={formState.name}
                    onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                    placeholder="e.g. Moulana Jalaluddin Rumi"
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#15664a] outline-none text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Author Name (Malayalam)
                  </label>
                  <input
                    type="text"
                    value={formState.nameMl || ''}
                    onChange={(e) => setFormState({ ...formState, nameMl: e.target.value })}
                    placeholder="e.g. മൗലാനാ ജലാലുദ്ദീൻ റൂമി"
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#15664a] outline-none text-sm font-malayalam"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Role / Title / Designation
                  </label>
                  <input
                    type="text"
                    value={formState.role || ''}
                    onChange={(e) => setFormState({ ...formState, role: e.target.value })}
                    placeholder="e.g. Islamic Scholar, Columnist"
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#15664a] outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Unique Author ID (Slug)
                  </label>
                  <input
                    type="text"
                    value={formState.id}
                    onChange={(e) => setFormState({ ...formState, id: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '') })}
                    placeholder="e.g. moulana-rumi"
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#15664a] outline-none text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Avatar / Profile Photo URL
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={formState.avatar || ''}
                    onChange={(e) => setFormState({ ...formState, avatar: e.target.value })}
                    placeholder="https://.../photo.jpg or /Logo.png"
                    className="flex-1 px-3.5 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#15664a] outline-none text-sm"
                  />
                  {formState.avatar && (
                    <div className="w-9 h-9 rounded-full overflow-hidden border border-gray-200 flex-shrink-0">
                      <img src={formState.avatar} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Author Biography
                </label>
                <textarea
                  value={formState.bio || ''}
                  onChange={(e) => setFormState({ ...formState, bio: e.target.value })}
                  rows={3}
                  placeholder="Short bio or description of the author / scholar..."
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#15664a] outline-none text-sm leading-relaxed"
                />
              </div>

              <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#15664a] hover:bg-[#0f4d38] text-white px-6 py-2 rounded-lg text-sm font-bold shadow-md transition-colors"
                >
                  {editingIndex !== null ? 'Save Changes' : 'Add Author'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
