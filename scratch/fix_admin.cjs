const fs = require('fs');
let c = fs.readFileSync('app/routes/admin.tsx', 'utf-8');

// 1. Fix loader
c = c.replace(
  `export const loader = async () => {`,
  `export const loader = async ({ request, context }: any) => {\n  const env = context?.cloudflare?.env || context?.env || (typeof process !== 'undefined' ? process.env : {});\n  const { getSession } = getSessionStorage(env);\n  const session = await getSession(request.headers.get("Cookie"));\n  if (!session.get("adminAuthenticated")) {\n    throw redirect("/admin/login");\n  }`
);

// 2. Fix Header UI
c = c.replace(
  `<img src="/Logo.png" alt="Logo" className="h-10 w-auto hidden sm:block" />\n          <span className="font-poppins font-bold text-xl text-[#15664a]">CMS Admin</span>`,
  `<img src="/Logo.png" alt="Samastha Graph Logo" className="h-14 w-auto sm:h-16" />`
);

// 3. Add state and handlers
c = c.replace(
  `const [searchQuery, setSearchQuery] = useState("");`,
  `const [searchQuery, setSearchQuery] = useState("");\n  const [expandedSection, setExpandedSection] = useState<string | null>(null);\n\n  const handleCategoryClick = (category: string) => {\n    setView(category);\n    setPage(1);\n    setSearchQuery("");\n    setExpandedSection(prev => prev === category ? null : category);\n  };`
);

// 4. Remove old state
c = c.replace(
  /  const \[isCreateDropdownOpen, setIsCreateDropdownOpen\] = useState\(false\);\n  const dropdownRef = useRef<HTMLDivElement>\(null\);\n  \n  useEffect\(\(\) => \{\n    const handleClickOutside = \(event: MouseEvent\) => \{\n      if \(dropdownRef\.current && !dropdownRef\.current\.contains\(event\.target as Node\)\) \{\n        setIsCreateDropdownOpen\(false\);\n      \}\n    \};\n    document\.addEventListener\("mousedown", handleClickOutside\);\n    return \(\) => document\.removeEventListener\("mousedown", handleClickOutside\);\n  \}, \[\]\);\n/g,
  ""
);

// 5. Replace Sidebar navigation
const oldSidebar = `            <div>
              <h4 className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Content</h4>
              <button onClick={() => { setView("articles"); setPage(1); setSearchQuery(""); }} className={\`w-full flex items-center gap-3 text-left px-4 py-2.5 rounded-sm font-medium transition-colors \${view === "articles" ? "bg-[#15664a] text-white" : "text-gray-700 hover:bg-gray-100"}\`}>
                <FileText size={18} /> Articles
              </button>
              <button onClick={() => { setView("videos"); setPage(1); setSearchQuery(""); }} className={\`w-full flex items-center gap-3 text-left px-4 py-2.5 rounded-sm font-medium transition-colors \${view === "videos" ? "bg-[#15664a] text-white" : "text-gray-700 hover:bg-gray-100"}\`}>
                <Video size={18} /> Videos
              </button>
              <button onClick={() => { setView("podcasts"); setPage(1); setSearchQuery(""); }} className={\`w-full flex items-center gap-3 text-left px-4 py-2.5 rounded-sm font-medium transition-colors \${view === "podcasts" ? "bg-[#15664a] text-white" : "text-gray-700 hover:bg-gray-100"}\`}>
                <Mic size={18} /> Podcasts
              </button>
            </div>
            
            <div>
              <h4 className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 mt-6">Quick Actions</h4>
              <div className="relative px-4" ref={dropdownRef}>
                <button 
                  onClick={() => setIsCreateDropdownOpen(!isCreateDropdownOpen)} 
                  className="w-full flex items-center justify-center gap-2 bg-[#15664a] text-white py-2.5 rounded-sm font-bold shadow-sm hover:bg-[#0f4d38] transition-colors"
                >
                  <Plus size={18} /> Create New <ChevronDown size={16} />
                </button>
                {isCreateDropdownOpen && (
                  <div className="absolute top-full left-4 right-4 mt-1 bg-white border border-gray-200 shadow-lg rounded-sm z-50 overflow-hidden">
                    <button onClick={() => { openArticleEditor(); setIsCreateDropdownOpen(false); }} className="w-full text-left px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2 border-b border-gray-100">
                      <FileText size={16} className="text-[#c8a136]" /> Article
                    </button>
                    <button onClick={() => { openVideoEditor(); setIsCreateDropdownOpen(false); }} className="w-full text-left px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2 border-b border-gray-100">
                      <Video size={16} className="text-[#c8a136]" /> Video
                    </button>
                    <button onClick={() => { openPodcastEditor(); setIsCreateDropdownOpen(false); }} className="w-full text-left px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                      <Mic size={16} className="text-[#c8a136]" /> Podcast
                    </button>
                  </div>
                )}
              </div>
            </div>`;

const newSidebar = `            <div>
              <h4 className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Content</h4>
              
              {/* Articles Accordion */}
              <div>
                <button onClick={() => handleCategoryClick("articles")} className={\`w-full flex items-center justify-between px-4 py-2.5 rounded-sm font-medium transition-colors \${view.includes("article") || view.includes("Article") ? "bg-[#15664a] text-white" : "text-gray-700 hover:bg-gray-100"}\`}>
                  <div className="flex items-center gap-3"><FileText size={18} /> Articles</div>
                  <ChevronDown size={16} className={\`transform transition-transform \${expandedSection === "articles" ? 'rotate-180' : ''}\`} />
                </button>
                {expandedSection === "articles" && (
                  <div className="pl-11 pr-4 py-2 space-y-1 bg-gray-50 border-l-2 border-[#15664a] ml-4 mt-1 rounded-r-sm">
                    <button onClick={() => { setView("articles"); setPage(1); setSearchQuery(""); }} className={\`block w-full text-left py-1.5 text-sm font-medium \${view === "articles" ? "text-[#15664a]" : "text-gray-600 hover:text-gray-900"}\`}>List Articles</button>
                    <button onClick={() => openArticleEditor()} className={\`block w-full text-left py-1.5 text-sm font-medium \${view === "newArticle" ? "text-[#15664a]" : "text-gray-600 hover:text-gray-900"}\`}>+ Create Article</button>
                  </div>
                )}
              </div>

              {/* Videos Accordion */}
              <div className="mt-1">
                <button onClick={() => handleCategoryClick("videos")} className={\`w-full flex items-center justify-between px-4 py-2.5 rounded-sm font-medium transition-colors \${view.includes("video") || view.includes("Video") ? "bg-[#15664a] text-white" : "text-gray-700 hover:bg-gray-100"}\`}>
                  <div className="flex items-center gap-3"><Video size={18} /> Videos</div>
                  <ChevronDown size={16} className={\`transform transition-transform \${expandedSection === "videos" ? 'rotate-180' : ''}\`} />
                </button>
                {expandedSection === "videos" && (
                  <div className="pl-11 pr-4 py-2 space-y-1 bg-gray-50 border-l-2 border-[#15664a] ml-4 mt-1 rounded-r-sm">
                    <button onClick={() => { setView("videos"); setPage(1); setSearchQuery(""); }} className={\`block w-full text-left py-1.5 text-sm font-medium \${view === "videos" ? "text-[#15664a]" : "text-gray-600 hover:text-gray-900"}\`}>List Videos</button>
                    <button onClick={() => openVideoEditor()} className={\`block w-full text-left py-1.5 text-sm font-medium \${view === "newVideo" ? "text-[#15664a]" : "text-gray-600 hover:text-gray-900"}\`}>+ Create Video</button>
                  </div>
                )}
              </div>

              {/* Podcasts Accordion */}
              <div className="mt-1">
                <button onClick={() => handleCategoryClick("podcasts")} className={\`w-full flex items-center justify-between px-4 py-2.5 rounded-sm font-medium transition-colors \${view.includes("podcast") || view.includes("Podcast") ? "bg-[#15664a] text-white" : "text-gray-700 hover:bg-gray-100"}\`}>
                  <div className="flex items-center gap-3"><Mic size={18} /> Podcasts</div>
                  <ChevronDown size={16} className={\`transform transition-transform \${expandedSection === "podcasts" ? 'rotate-180' : ''}\`} />
                </button>
                {expandedSection === "podcasts" && (
                  <div className="pl-11 pr-4 py-2 space-y-1 bg-gray-50 border-l-2 border-[#15664a] ml-4 mt-1 rounded-r-sm">
                    <button onClick={() => { setView("podcasts"); setPage(1); setSearchQuery(""); }} className={\`block w-full text-left py-1.5 text-sm font-medium \${view === "podcasts" ? "text-[#15664a]" : "text-gray-600 hover:text-gray-900"}\`}>List Podcasts</button>
                    <button onClick={() => openPodcastEditor()} className={\`block w-full text-left py-1.5 text-sm font-medium \${view === "newPodcast" ? "text-[#15664a]" : "text-gray-600 hover:text-gray-900"}\`}>+ Create Podcast</button>
                  </div>
                )}
              </div>
            </div>`;

c = c.replace(oldSidebar, newSidebar);

fs.writeFileSync('app/routes/admin.tsx', c);
