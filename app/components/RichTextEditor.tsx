import React, { useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import LinkExtension from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Superscript from '@tiptap/extension-superscript';
import Subscript from '@tiptap/extension-subscript';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import { Extension } from '@tiptap/core';

const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return { types: ['textStyle'] };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize?.replace(/['"]+/g, ''),
            renderHTML: attributes => {
              if (!attributes.fontSize) return {};
              return { style: `font-size: ${attributes.fontSize}` };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize: fontSize => ({ chain }) => chain().setMark('textStyle', { fontSize }).run(),
      unsetFontSize: () => ({ chain }) => chain().setMark('textStyle', { fontSize: null }).run(),
    };
  },
});

import Highlight from '@tiptap/extension-highlight';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Heading1, Heading2, Heading3, Heading4, Heading5, Heading6,
  AlignLeft, AlignCenter, AlignRight, AlignJustify, List, ListOrdered, CheckSquare, Quote, Image as ImageIcon,
  Table as TableIcon, Undo, Redo, MoreHorizontal, Code, TerminalSquare, Superscript as SuperscriptIcon,
  Subscript as SubscriptIcon, Highlighter, Eraser, Baseline, ChevronDown
} from 'lucide-react';

const RichTextEditor = ({ content, onChange }: { content: string, onChange: (val: string) => void }) => {
  const [showMore, setShowMore] = useState(false);
  const [showFontSize, setShowFontSize] = useState(false);
  const [showFontFamily, setShowFontFamily] = useState(false);
  
  const colorInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] }
      }),
      LinkExtension.configure({ openOnClick: false }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Superscript,
      Subscript,
      TextStyle,
      FontFamily,
      FontSize,
      Color,
      Highlight.configure({ multicolor: true }),
      Image,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-lg md:prose-xl max-w-none w-full focus:outline-none min-h-[450px] p-6 sm:p-8 text-[#18181B] bg-white font-sans leading-[2] [&_p]:mb-6 [&_p]:leading-[2] [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:text-[#15664a] [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-[#15664a] [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-[#15664a] prose-table:block prose-table:overflow-x-auto selection:bg-[#c8a136]/30',
      },
    },
  });

  if (!editor) return null;

  const addImage = () => {
    const url = window.prompt('Enter Image URL:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    editor.chain().focus().setColor(e.target.value).run();
    setShowMore(false);
  };

  const closeDropdowns = () => {
    setShowFontSize(false);
    setShowFontFamily(false);
    setShowMore(false);
  };

  const btnClass = (isActive: boolean) =>
    `p-1.5 rounded flex-shrink-0 flex items-center justify-center transition-colors ` +
    (isActive ? 'bg-[#2D5A46] text-white' : 'text-[#52525B] hover:bg-[#F7F5F0] hover:text-[#2D5A46]');
    
  const divider = <div className="w-px h-6 bg-[#E4E4E7] mx-1 flex-shrink-0 my-auto" />;

  const fontSizes = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px'];
  const fontFamilies = [
    { name: 'Default', value: '' },
    { name: 'Noto Sans Malayalam', value: "'Noto Sans Malayalam', sans-serif" },
    { name: 'Arial', value: 'Arial' },
    { name: 'Georgia', value: 'Georgia' },
    { name: 'Times New Roman', value: 'Times New Roman' },
    { name: 'Verdana', value: 'Verdana' },
    { name: 'Trebuchet MS', value: 'Trebuchet MS' },
    { name: 'Courier New', value: 'Courier New' }
  ];

  return (
    <div className="border border-[#E4E4E7] rounded-md bg-[#FFFFFF] shadow-sm flex flex-col relative z-0">
      
      {/* Sticky Toolbar Container (positioned ancestor for dropdowns) */}
      <div className="sticky top-16 z-10 bg-[#FFFFFF] border-b border-[#E4E4E7] shadow-sm rounded-t-md relative">
        
        {/* Main Swipeable Toolbar */}
        <div className="flex flex-nowrap items-center gap-1 p-2 overflow-x-auto hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className={btnClass(false) + " disabled:opacity-30"} title="Undo"><Undo size={18} /></button>
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className={btnClass(false) + " disabled:opacity-30"} title="Redo"><Redo size={18} /></button>
          
          {divider}
          
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleBold().run()} className={btnClass(editor.isActive('bold'))} title="Bold"><Bold size={18} /></button>
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleItalic().run()} className={btnClass(editor.isActive('italic'))} title="Italic"><Italic size={18} /></button>
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleUnderline().run()} className={btnClass(editor.isActive('underline'))} title="Underline"><UnderlineIcon size={18} /></button>
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleStrike().run()} className={btnClass(editor.isActive('strike'))} title="Strikethrough"><Strikethrough size={18} /></button>
          
          {divider}

          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={btnClass(editor.isActive('heading', { level: 1 }))} title="Heading 1"><Heading1 size={18} /></button>
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btnClass(editor.isActive('heading', { level: 2 }))} title="Heading 2"><Heading2 size={18} /></button>
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={btnClass(editor.isActive('heading', { level: 3 }))} title="Heading 3"><Heading3 size={18} /></button>
          
          {divider}

          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().setTextAlign('left').run()} className={btnClass(editor.isActive({ textAlign: 'left' }))} title="Align Left"><AlignLeft size={18} /></button>
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().setTextAlign('center').run()} className={btnClass(editor.isActive({ textAlign: 'center' }))} title="Align Center"><AlignCenter size={18} /></button>
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().setTextAlign('right').run()} className={btnClass(editor.isActive({ textAlign: 'right' }))} title="Align Right"><AlignRight size={18} /></button>
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().setTextAlign('justify').run()} className={btnClass(editor.isActive({ textAlign: 'justify' }))} title="Justify"><AlignJustify size={18} /></button>

          {divider}

          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleBulletList().run()} className={btnClass(editor.isActive('bulletList'))} title="Bullet List"><List size={18} /></button>
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btnClass(editor.isActive('orderedList'))} title="Ordered List"><ListOrdered size={18} /></button>
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleTaskList().run()} className={btnClass(editor.isActive('taskList'))} title="Task List"><CheckSquare size={18} /></button>
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btnClass(editor.isActive('blockquote'))} title="Blockquote"><Quote size={18} /></button>

          {divider}
          
          {/* Font Family Trigger */}
          <button 
            type="button" 
            onMouseDown={(e) => e.preventDefault()} 
            onClick={() => { closeDropdowns(); setShowFontFamily(!showFontFamily); }} 
            className={`text-xs px-2 py-1.5 rounded border flex-shrink-0 flex items-center gap-1 transition-colors ${showFontFamily ? 'bg-[#F7F5F0] border-[#2D5A46] text-[#2D5A46]' : 'border-[#E4E4E7] bg-white text-[#52525B] hover:bg-[#F7F5F0] hover:text-[#2D5A46]'}`}
            title="Font Family"
          >
            <span className="font-medium whitespace-nowrap">Font Family</span>
            <ChevronDown size={14} className="opacity-70" />
          </button>

          {/* Font Size Trigger */}
          <button 
            type="button" 
            onMouseDown={(e) => e.preventDefault()} 
            onClick={() => { closeDropdowns(); setShowFontSize(!showFontSize); }} 
            className={`text-xs px-2 py-1.5 rounded border flex-shrink-0 flex items-center gap-1 transition-colors ${showFontSize ? 'bg-[#F7F5F0] border-[#2D5A46] text-[#2D5A46]' : 'border-[#E4E4E7] bg-white text-[#52525B] hover:bg-[#F7F5F0] hover:text-[#2D5A46]'}`}
            title="Font Size"
          >
            <span className="font-medium whitespace-nowrap">Font Size</span>
            <ChevronDown size={14} className="opacity-70" />
          </button>

          {divider}

          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={addImage} className={btnClass(false)} title="Insert Image URL"><ImageIcon size={18} /></button>
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} className={btnClass(false)} title="Insert Table"><TableIcon size={18} /></button>

          {divider}

          {/* More Options Trigger */}
          <button 
            type="button" 
            onMouseDown={(e) => e.preventDefault()} 
            onClick={() => { closeDropdowns(); setShowMore(!showMore); }} 
            className={`p-1.5 rounded flex-shrink-0 flex items-center justify-center transition-colors ${showMore ? 'bg-[#F7F5F0] text-[#2D5A46]' : 'text-[#52525B] hover:bg-[#F7F5F0] hover:text-[#2D5A46]'}`} 
            title="More Options"
          >
            <MoreHorizontal size={18} />
          </button>
        </div>

        {/* --- POPOVER LAYER (Rendered outside the overflow-x-auto container to prevent clipping) --- */}

        {/* Global Click-Outside Overlay */}
        {(showFontSize || showFontFamily || showMore) && (
          <div className="fixed inset-0 z-20" onClick={closeDropdowns}></div>
        )}

        {/* Font Family Popover */}
        {showFontFamily && (
          <div className="absolute left-2 md:left-[50%] top-full mt-2 bg-[#FFFFFF] border border-[#E4E4E7] shadow-lg rounded-md w-48 z-30 py-1 max-h-64 overflow-y-auto">
            {fontFamilies.map(font => (
              <button 
                key={font.name} 
                type="button" 
                onMouseDown={(e) => e.preventDefault()} 
                onClick={() => { 
                  if (font.value) { editor.chain().focus().setFontFamily(font.value).run(); }
                  else { editor.chain().focus().unsetFontFamily().run(); }
                  setShowFontFamily(false); 
                }} 
                className={`w-full text-left px-3 py-2 text-sm hover:bg-[#F7F5F0] hover:text-[#2D5A46] ${editor.isActive('textStyle', { fontFamily: font.value }) ? 'bg-[#F7F5F0] text-[#2D5A46] font-bold' : 'text-[#52525B]'}`}
              >
                <span style={{ fontFamily: font.value || 'inherit' }}>{font.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Font Size Popover */}
        {showFontSize && (
          <div className="absolute left-2 md:left-[60%] top-full mt-2 bg-[#FFFFFF] border border-[#E4E4E7] shadow-lg rounded-md w-32 z-30 py-1 max-h-64 overflow-y-auto">
            <button 
              type="button" 
              onMouseDown={(e) => e.preventDefault()} 
              onClick={() => { editor.chain().focus().unsetFontSize().run(); setShowFontSize(false); }} 
              className="w-full text-left px-4 py-2 text-sm text-[#52525B] hover:bg-[#F7F5F0] hover:text-[#2D5A46]"
            >
              Default
            </button>
            {fontSizes.map(size => (
              <button 
                key={size} 
                type="button" 
                onMouseDown={(e) => e.preventDefault()} 
                onClick={() => { editor.chain().focus().setFontSize(size).run(); setShowFontSize(false); }} 
                className={`w-full text-left px-4 py-2 text-sm hover:bg-[#F7F5F0] hover:text-[#2D5A46] ${editor.isActive('textStyle', { fontSize: size }) ? 'bg-[#F7F5F0] text-[#2D5A46] font-bold' : 'text-[#52525B]'}`}
              >
                {size}
              </button>
            ))}
          </div>
        )}

        {/* More Options Popover */}
        {showMore && (
          <div className="absolute right-2 top-full mt-2 bg-[#FFFFFF] border border-[#E4E4E7] shadow-lg rounded-md w-64 z-30 p-3 grid grid-cols-4 gap-2">
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { editor.chain().focus().toggleHeading({ level: 4 }).run(); setShowMore(false); }} className={btnClass(editor.isActive('heading', { level: 4 }))} title="Heading 4"><Heading4 size={18} /></button>
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { editor.chain().focus().toggleHeading({ level: 5 }).run(); setShowMore(false); }} className={btnClass(editor.isActive('heading', { level: 5 }))} title="Heading 5"><Heading5 size={18} /></button>
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { editor.chain().focus().toggleHeading({ level: 6 }).run(); setShowMore(false); }} className={btnClass(editor.isActive('heading', { level: 6 }))} title="Heading 6"><Heading6 size={18} /></button>
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { editor.chain().focus().toggleCode().run(); setShowMore(false); }} className={btnClass(editor.isActive('code'))} title="Inline Code"><Code size={18} /></button>
            
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { editor.chain().focus().toggleCodeBlock().run(); setShowMore(false); }} className={btnClass(editor.isActive('codeBlock'))} title="Code Block"><TerminalSquare size={18} /></button>
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { editor.chain().focus().toggleSuperscript().run(); setShowMore(false); }} className={btnClass(editor.isActive('superscript'))} title="Superscript"><SuperscriptIcon size={18} /></button>
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { editor.chain().focus().toggleSubscript().run(); setShowMore(false); }} className={btnClass(editor.isActive('subscript'))} title="Subscript"><SubscriptIcon size={18} /></button>
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { editor.chain().focus().toggleHighlight().run(); setShowMore(false); }} className={btnClass(editor.isActive('highlight'))} title="Highlight"><Highlighter size={18} /></button>
            
            <div className="col-span-4 border-t border-[#E4E4E7] my-2"></div>
            
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { colorInputRef.current?.click(); }} className={btnClass(false) + " col-span-2 text-xs font-medium flex items-center justify-center gap-1"} title="Text Color"><Baseline size={16} /> Color</button>
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { editor.chain().focus().unsetAllMarks().run(); setShowMore(false); }} className={btnClass(false) + " col-span-2 text-xs font-medium flex items-center justify-center gap-1"} title="Clear Formatting"><Eraser size={16} /> Clear</button>
          </div>
        )}

        {/* Hidden color input */}
        <input type="color" ref={colorInputRef} onChange={handleColorChange} className="hidden" />

        {/* Table secondary toolbar (shows only if a table is active) */}
        {editor.isActive('table') && (
          <div className="flex flex-nowrap items-center gap-1 p-2 bg-[#F7F5F0] border-t border-[#E4E4E7] overflow-x-auto text-xs hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <span className="font-semibold text-[#2D5A46] mr-2 flex-shrink-0">Table Tools</span>
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().addColumnBefore().run()} className="px-2 py-1 rounded bg-[#FFFFFF] border border-[#E4E4E7] hover:bg-gray-50 flex-shrink-0">Add Col Before</button>
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().addColumnAfter().run()} className="px-2 py-1 rounded bg-[#FFFFFF] border border-[#E4E4E7] hover:bg-gray-50 flex-shrink-0">Add Col After</button>
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().deleteColumn().run()} className="px-2 py-1 rounded bg-[#FFFFFF] border border-[#E4E4E7] hover:bg-red-50 text-red-600 flex-shrink-0">Del Col</button>
            {divider}
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().addRowBefore().run()} className="px-2 py-1 rounded bg-[#FFFFFF] border border-[#E4E4E7] hover:bg-gray-50 flex-shrink-0">Add Row Before</button>
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().addRowAfter().run()} className="px-2 py-1 rounded bg-[#FFFFFF] border border-[#E4E4E7] hover:bg-gray-50 flex-shrink-0">Add Row After</button>
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().deleteRow().run()} className="px-2 py-1 rounded bg-[#FFFFFF] border border-[#E4E4E7] hover:bg-red-50 text-red-600 flex-shrink-0">Del Row</button>
            {divider}
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleHeaderRow().run()} className="px-2 py-1 rounded bg-[#FFFFFF] border border-[#E4E4E7] hover:bg-gray-50 flex-shrink-0">Toggle Header</button>
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().deleteTable().run()} className="px-2 py-1 rounded bg-red-100 border border-red-200 hover:bg-red-200 text-red-700 flex-shrink-0 ml-auto font-medium">Delete Table</button>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        /* Hide scrollbar for toolbar */
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        
        /* Table overrides for mobile responsiveness */
        .tiptap table {
          border-collapse: collapse;
          table-layout: fixed;
          width: 100%;
          margin: 0;
          overflow: hidden;
        }
        .tiptap td, .tiptap th {
          min-width: 1em;
          border: 1px solid #E4E4E7;
          padding: 6px 12px;
          vertical-align: top;
          box-sizing: border-box;
          position: relative;
        }
        .tiptap th {
          font-weight: bold;
          text-align: left;
          background-color: #F7F5F0;
        }
        .tiptap .selectedCell:after {
          z-index: 2;
          position: absolute;
          content: "";
          left: 0; right: 0; top: 0; bottom: 0;
          background: rgba(200, 200, 255, 0.4);
          pointer-events: none;
        }
        .tiptap .column-resize-handle {
          position: absolute;
          right: -2px;
          top: 0;
          bottom: -2px;
          width: 4px;
          background-color: #2D5A46;
          pointer-events: none;
        }
        
        /* Image constraints */
        .tiptap img {
          max-width: 100%;
          height: auto;
          border-radius: 4px;
        }
        
        /* Task list styling */
        .tiptap ul[data-type="taskList"] {
          list-style: none;
          padding: 0;
        }
        .tiptap ul[data-type="taskList"] li {
          display: flex;
          align-items: flex-start;
          margin-bottom: 0.5rem;
        }
        .tiptap ul[data-type="taskList"] li > label {
          margin-right: 0.5rem;
          user-select: none;
        }
        .tiptap ul[data-type="taskList"] li > div {
          flex: 1;
        }
        .tiptap ul[data-type="taskList"] input[type="checkbox"] {
          accent-color: #2D5A46;
          width: 16px;
          height: 16px;
          margin-top: 4px;
        }
      `}} />
      
      {/* Horizontally scrollable wrapper for tables within the editor content */}
      <div className="flex-1 w-full overflow-x-auto relative z-0">
        <EditorContent editor={editor} className="min-w-full" />
      </div>
    </div>
  );
};

export default RichTextEditor;
