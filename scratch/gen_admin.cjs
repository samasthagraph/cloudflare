const fs = require('fs');

const originalCode = fs.readFileSync('app/routes/admin.tsx', 'utf-8');

// The required changes:
// 1. imports
let newCode = originalCode.replace(
  "import { Menu, X, Edit, Trash2, Eye, Plus, Send, Bold, Italic, List, ListOrdered, Link as LinkIcon, RefreshCw, Calendar as CalendarIcon, Search, LayoutDashboard, FileText, Video, Mic, BarChart2 } from 'lucide-react';",
  "import { Menu, X, Edit, Trash2, Eye, Plus, Send, Bold, Italic, List, ListOrdered, Link as LinkIcon, RefreshCw, Calendar as CalendarIcon, Search, LayoutDashboard, FileText, Video, Mic, BarChart2, ChevronDown } from 'lucide-react';"
);

// 2. Action logic intent === delete return the type
newCode = newCode.replace(
  `await commitToGitHub({ token: githubToken, owner, repo, path, actionType: "DELETE", message: \`delete: \${path}\` });\n      return json({ success: true, message: "Deleted successfully!" });`,
  `await commitToGitHub({ token: githubToken, owner, repo, path, actionType: "DELETE", message: \`delete: \${path}\` });\n      const itemType = path.includes('/articles/') ? 'article' : path.includes('/videos/') ? 'video' : 'podcast';\n      const slug = path.split('/').pop().replace('.mdx', '').replace('.json', '');\n      return json({ success: true, intent: "delete", itemType, slug, message: "Deleted successfully!" });`
);

// saveArticle
newCode = newCode.replace(
  `return json({ success: true, message: \`Article "\${title}" saved successfully!\` });`,
  `const articleData = { slug: finalSlug, title, advancedTitle: advancedTitle || title, excerpt, coverImage, thumbImage, category: category || 'News', author: author || 'admin', seoTitle, seoDescription, themePreset, status, body, publishedAt: date, type: 'article' };\n      return json({ success: true, intent, item: articleData, message: \`Article "\${title}" saved successfully!\` });`
);

// saveVideo
newCode = newCode.replace(
  `return json({ success: true, message: \`Video "\${title}" saved successfully!\` });`,
  `return json({ success: true, intent, item: { slug: finalSlug, type: 'video', ...videoData }, message: \`Video "\${title}" saved successfully!\` });`
);

// savePodcast
newCode = newCode.replace(
  `return json({ success: true, message: \`Podcast "\${title}" saved successfully!\` });`,
  `return json({ success: true, intent, item: { slug: finalSlug, type: 'podcast', ...podcastData }, message: \`Podcast "\${title}" saved successfully!\` });`
);

// 3. State management inside AdminDashboard
const localStateCode = `
  const [articles, setArticles] = useState(useLoaderData<typeof loader>().articles);
  const [videos, setVideos] = useState(useLoaderData<typeof loader>().videos);
  const [podcasts, setPodcasts] = useState(useLoaderData<typeof loader>().podcasts);
  const { platformSettings } = useLoaderData<typeof loader>();

  useEffect(() => {
    if (actionData?.success) {
      if (actionData.intent === "delete") {
        if (actionData.itemType === 'article') setArticles(prev => prev.filter(a => a.slug !== actionData.slug));
        if (actionData.itemType === 'video') setVideos(prev => prev.filter(v => v.slug !== actionData.slug));
        if (actionData.itemType === 'podcast') setPodcasts(prev => prev.filter(p => p.slug !== actionData.slug));
      } else if (actionData.intent === "saveArticle") {
        setArticles(prev => {
          const exists = prev.find(a => a.slug === actionData.item.slug);
          const list = exists ? prev.map(a => a.slug === actionData.item.slug ? actionData.item : a) : [actionData.item, ...prev];
          return list.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
        });
        setView("articles");
      } else if (actionData.intent === "saveVideo") {
        setVideos(prev => {
          const exists = prev.find(v => v.slug === actionData.item.slug);
          const list = exists ? prev.map(v => v.slug === actionData.item.slug ? actionData.item : v) : [actionData.item, ...prev];
          return list.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
        });
        setView("videos");
      } else if (actionData.intent === "savePodcast") {
        setPodcasts(prev => {
          const exists = prev.find(p => p.slug === actionData.item.slug);
          const list = exists ? prev.map(p => p.slug === actionData.item.slug ? actionData.item : p) : [actionData.item, ...prev];
          return list.sort((a, b) => (b.episodeNumber || 0) - (a.episodeNumber || 0));
        });
        setView("podcasts");
      }
    }
  }, [actionData]);

  const [isCreateDropdownOpen, setIsCreateDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCreateDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
`;

newCode = newCode.replace(
  `const { articles, videos, podcasts, platformSettings } = useLoaderData<typeof loader>();\n  const actionData = useActionData<typeof action>();`,
  `const actionData = useActionData<typeof action>();\n${localStateCode}`
);

// 4. openPodcastEditor
const openPodcastEditor = `
  const openPodcastEditor = (podcast?: any) => {
    if (podcast) {
      setEditingItem(podcast);
      setEditorContent(podcast.description || "");
      setView("editPodcast");
    } else {
      setEditingItem({ status: 'draft', category: 'General', series: '' });
      setEditorContent("");
      setView("newPodcast");
    }
    setIsMobileMenuOpen(false);
  };
`;
newCode = newCode.replace(`const activeList = view === "articles" ? articles : (view === "videos" ? videos : []);`, `${openPodcastEditor}\n  const activeList = view === "articles" ? articles : (view === "videos" ? videos : view === "podcasts" ? podcasts : []);`);

// 5. Sidebar replace Quick Actions
const oldSidebarQuickActions = `            <div>
              <h4 className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Quick Actions</h4>
              <button onClick={() => openArticleEditor()} className={\`w-full flex items-center gap-3 text-left px-4 py-2.5 rounded-sm font-medium transition-colors \${view === "newArticle" || view === "editArticle" ? "bg-[#15664a] text-white" : "text-gray-700 hover:bg-gray-100"}\`}>
                <Plus size={18} /> New Article
              </button>
              <button onClick={() => openVideoEditor()} className={\`w-full flex items-center gap-3 text-left px-4 py-2.5 rounded-sm font-medium transition-colors \${view === "newVideo" || view === "editVideo" ? "bg-[#15664a] text-white" : "text-gray-700 hover:bg-gray-100"}\`}>
                <Plus size={18} /> New Video
              </button>
            </div>`;

const newSidebarQuickActions = `            <div>
              <h4 className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Quick Actions</h4>
              <div className="relative px-4" ref={dropdownRef}>
                <button 
                  onClick={() => setIsCreateDropdownOpen(!isCreateDropdownOpen)} 
                  className="w-full flex items-center justify-between bg-[#15664a] text-white px-4 py-2.5 rounded-sm font-medium hover:bg-[#0f4d38] transition-colors shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <Plus size={18} /> Create New
                  </div>
                  <ChevronDown size={16} className={\`transform transition-transform \${isCreateDropdownOpen ? 'rotate-180' : ''}\`} />
                </button>
                {isCreateDropdownOpen && (
                  <div className="absolute top-full left-4 right-4 mt-2 bg-white border border-gray-200 rounded-sm shadow-lg overflow-hidden z-50">
                    <button onClick={() => { openArticleEditor(); setIsCreateDropdownOpen(false); }} className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100">
                      <FileText size={16} className="text-blue-600" /> New Article
                    </button>
                    <button onClick={() => { openVideoEditor(); setIsCreateDropdownOpen(false); }} className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100">
                      <Video size={16} className="text-red-600" /> New Video
                    </button>
                    <button onClick={() => { openPodcastEditor(); setIsCreateDropdownOpen(false); }} className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                      <Mic size={16} className="text-purple-600" /> New Podcast
                    </button>
                  </div>
                )}
              </div>
            </div>`;
newCode = newCode.replace(oldSidebarQuickActions, newSidebarQuickActions);

// 6. Fix "handleDelete" params
newCode = newCode.replace(
  `const handleDelete = (slug: string, type: 'article' | 'video') => {`,
  `const handleDelete = (slug: string, type: 'article' | 'video' | 'podcast') => {`
);
newCode = newCode.replace(
  `const ext = type === 'article' ? '.mdx' : '.json';
      const folder = type === 'article' ? 'articles' : 'videos';`,
  `const ext = type === 'article' ? '.mdx' : '.json';
      const folder = type === 'article' ? 'articles' : type === 'video' ? 'videos' : 'podcasts';`
);

// 7. Update Tables display condition and buttons
newCode = newCode.replace(`(view === "articles" || view === "videos")`, `(view === "articles" || view === "videos" || view === "podcasts")`);
// Wait, we need to replace it in two places, first is the view title and search box
newCode = newCode.replace(`(view === "articles" || view === "videos")`, `(view === "articles" || view === "videos" || view === "podcasts")`);

newCode = newCode.replace(
  `onClick={() => view === "articles" ? openArticleEditor() : openVideoEditor()}`,
  `onClick={() => view === "articles" ? openArticleEditor() : view === "videos" ? openVideoEditor() : openPodcastEditor()}`
);

// Table Actions
newCode = newCode.replace(
  `onClick={() => handleMove(item, view === "articles" ? "article" : "video")}`,
  `onClick={() => handleMove(item, view === "articles" ? "article" : view === "videos" ? "video" : "podcast")}`
);
newCode = newCode.replace(
  `onClick={() => view === "articles" ? openArticleEditor(item) : openVideoEditor(item)}`,
  `onClick={() => view === "articles" ? openArticleEditor(item) : view === "videos" ? openVideoEditor(item) : openPodcastEditor(item)}`
);
newCode = newCode.replace(
  `onClick={() => handleDelete(item.slug, view === "articles" ? "article" : "video")}`,
  `onClick={() => handleDelete(item.slug, view === "articles" ? "article" : view === "videos" ? "video" : "podcast")}`
);

// 8. Form Condition
newCode = newCode.replace(
  `(view === "newArticle" || view === "editArticle" || view === "newVideo" || view === "editVideo")`,
  `(view === "newArticle" || view === "editArticle" || view === "newVideo" || view === "editVideo" || view === "newPodcast" || view === "editPodcast")`
);
newCode = newCode.replace(
  `(view === "newArticle" || view === "editArticle" || view === "newVideo" || view === "editVideo")`,
  `(view === "newArticle" || view === "editArticle" || view === "newVideo" || view === "editVideo" || view === "newPodcast" || view === "editPodcast")`
);

newCode = newCode.replace(
  `{view === "editVideo" && "Edit Video"}`,
  `{view === "editVideo" && "Edit Video"}\n                  {view === "newPodcast" && "Create New Podcast"}\n                  {view === "editPodcast" && "Edit Podcast"}`
);

newCode = newCode.replace(
  `value={view.includes("Video") ? "saveVideo" : "saveArticle"}`,
  `value={view.includes("Video") ? "saveVideo" : view.includes("Podcast") ? "savePodcast" : "saveArticle"}`
);

// Form Fields for Podcast
const podcastFields = `
                {view.includes("Podcast") && (
                  <div className="space-y-4 bg-purple-50/50 p-6 rounded-sm border border-purple-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Audio URL *</label>
                        <input 
                          type="text" 
                          name="audioUrl"
                          defaultValue={editingItem?.audioUrl}
                          placeholder="https://.../audio.mp3"
                          required={view.includes("Podcast")} 
                          className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-purple-500 outline-none" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Duration (e.g. 45:30)</label>
                        <input 
                          type="text" 
                          name="duration"
                          defaultValue={editingItem?.duration}
                          placeholder="00:00"
                          className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-purple-500 outline-none" 
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Series Name</label>
                        <input 
                          type="text" 
                          name="series"
                          defaultValue={editingItem?.series}
                          placeholder="e.g. The Weekly Tafsir"
                          className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-purple-500 outline-none" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Episode Number</label>
                        <input 
                          type="number" 
                          name="episodeNumber"
                          defaultValue={editingItem?.episodeNumber || 0}
                          className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-purple-500 outline-none" 
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Custom Artwork URL (Optional)</label>
                      <input 
                        type="text" 
                        name="customThumbnail" 
                        defaultValue={editingItem?.customThumbnail} 
                        className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-purple-500 outline-none text-sm" 
                        placeholder="https://..." 
                      />
                    </div>
                  </div>
                )}
`;

newCode = newCode.replace(
  `{view.includes("Video") && (`,
  podcastFields + `\n\n                {view.includes("Video") && (`
);

newCode = newCode.replace(
  `{view.includes("Video") ? "Short Description (Optional)" : "Excerpt (Short Summary) *"}`,
  `{view.includes("Article") ? "Excerpt (Short Summary) *" : "Short Description (Optional)"}`
);

newCode = newCode.replace(
  `{view.includes("Video") ? "Video Notes / Full Description (Rich Text)" : "Article Body (Rich Text) *"}`,
  `{view.includes("Video") ? "Video Notes / Full Description (Rich Text)" : view.includes("Podcast") ? "Podcast Description (Rich Text) *" : "Article Body (Rich Text) *"}`
);

newCode = newCode.replace(
  `Save \${view.includes("Video") ? "Video" : "Article"}`,
  `Save \${view.includes("Video") ? "Video" : view.includes("Podcast") ? "Podcast" : "Article"}`
);


fs.writeFileSync('scratch/admin_final_generation_v2.js', 'ready');
fs.writeFileSync('app/routes/admin.tsx.final', newCode);
