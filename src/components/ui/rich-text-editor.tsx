import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { Bold, Italic, List, ListOrdered, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[150px] p-4 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-b-lg text-[var(--text-primary)]',
      },
    },
  });

  if (!editor) {
    return null;
  }

  const addImage = () => {
    const url = window.prompt('URL Image:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  return (
    <div className="w-full flex flex-col border border-[var(--border)] rounded-lg overflow-hidden">
      <div className="flex items-center gap-1 p-2 border-b border-[var(--border)] bg-[var(--bg-tertiary)] flex-wrap">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-secondary)]'}
          type="button"
        >
          <Bold className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-secondary)]'}
          type="button"
        >
          <Italic className="w-4 h-4" />
        </Button>
        <div className="w-px h-4 bg-[var(--border)] mx-1" />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-secondary)]'}
          type="button"
        >
          <List className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-secondary)]'}
          type="button"
        >
          <ListOrdered className="w-4 h-4" />
        </Button>
        <div className="w-px h-4 bg-[var(--border)] mx-1" />
        <Button
          variant="ghost"
          size="sm"
          onClick={addImage}
          className="text-[var(--text-secondary)]"
          type="button"
        >
          <ImageIcon className="w-4 h-4" />
        </Button>
      </div>
      <EditorContent editor={editor} />
      <style dangerouslySetInnerHTML={{__html: `
        .ProseMirror p {
          margin-bottom: 0.5em;
        }
        .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
        }
        .ProseMirror ul {
          list-style-type: disc;
          padding-left: 1.5em;
        }
        .ProseMirror ol {
          list-style-type: decimal;
          padding-left: 1.5em;
        }
      `}} />
    </div>
  );
}
