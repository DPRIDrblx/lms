"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { Bold, Italic, List, ListOrdered, Quote, Heading1, Heading2, Heading3, Code, Undo, Redo } from 'lucide-react';
import { useEffect } from 'react';

interface SmartEditorProps {
  content: string;
  onChange: (content: string) => void;
  editable?: boolean;
}

export function SmartEditor({ content, onChange, editable = true }: SmartEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Image,
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-slate max-w-none focus:outline-none min-h-[300px] px-4 py-6',
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) return null;

  return (
    <div className="flex flex-col h-full bg-white">
      {editable && (
        <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-2 mb-4 flex flex-wrap gap-1 sticky top-0 z-10">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 rounded-lg transition-colors ${editor.isActive('bold') ? 'bg-slate-200 text-slate-900' : 'text-slate-600 hover:bg-slate-200'}`}
          >
            <Bold className="w-5 h-5" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 rounded-lg transition-colors ${editor.isActive('italic') ? 'bg-slate-200 text-slate-900' : 'text-slate-600 hover:bg-slate-200'}`}
          >
            <Italic className="w-5 h-5" />
          </button>
          
          <div className="w-px h-6 bg-slate-300 mx-2 self-center" />
          
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-2 rounded-lg transition-colors font-bold ${editor.isActive('heading', { level: 1 }) ? 'bg-slate-200 text-slate-900' : 'text-slate-600 hover:bg-slate-200'}`}
          >
            <Heading1 className="w-5 h-5" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-2 rounded-lg transition-colors font-bold ${editor.isActive('heading', { level: 2 }) ? 'bg-slate-200 text-slate-900' : 'text-slate-600 hover:bg-slate-200'}`}
          >
            <Heading2 className="w-5 h-5" />
          </button>
          
          <div className="w-px h-6 bg-slate-300 mx-2 self-center" />
          
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded-lg transition-colors ${editor.isActive('bulletList') ? 'bg-slate-200 text-slate-900' : 'text-slate-600 hover:bg-slate-200'}`}
          >
            <List className="w-5 h-5" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-2 rounded-lg transition-colors ${editor.isActive('orderedList') ? 'bg-slate-200 text-slate-900' : 'text-slate-600 hover:bg-slate-200'}`}
          >
            <ListOrdered className="w-5 h-5" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-2 rounded-lg transition-colors ${editor.isActive('blockquote') ? 'bg-slate-200 text-slate-900' : 'text-slate-600 hover:bg-slate-200'}`}
          >
            <Quote className="w-5 h-5" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`p-2 rounded-lg transition-colors ${editor.isActive('codeBlock') ? 'bg-slate-200 text-slate-900' : 'text-slate-600 hover:bg-slate-200'}`}
          >
            <Code className="w-5 h-5" />
          </button>

          <div className="flex-1" />

          <button
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-2 rounded-lg transition-colors text-slate-600 hover:bg-slate-200 disabled:opacity-50"
          >
            <Undo className="w-5 h-5" />
          </button>
          <button
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-2 rounded-lg transition-colors text-slate-600 hover:bg-slate-200 disabled:opacity-50"
          >
            <Redo className="w-5 h-5" />
          </button>
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto cursor-text bg-white" onClick={() => editor.commands.focus()}>
        <EditorContent editor={editor} className="h-full prose-headings:font-black prose-p:leading-relaxed" />
      </div>
    </div>
  );
}
