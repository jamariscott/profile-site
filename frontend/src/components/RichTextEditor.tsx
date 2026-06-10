import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect, useRef, useState } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: false, allowBase64: true }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-blue-600 underline' } }),
      Placeholder.configure({ placeholder: placeholder || 'Write your article here...' }),
    ],
    content: value,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  // Sync external value changes (e.g. form reset)
  useEffect(() => {
    if (editor && value === '') {
      editor.commands.clearContent();
    }
  }, [value, editor]);

  if (!editor) return null;

  const addImage = () => {
    if (imageUrl.trim()) {
      editor.chain().focus().setImage({ src: imageUrl.trim() }).run();
      setImageUrl('');
      setShowImageInput(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    const reader = new FileReader();
    reader.onload = () => {
      editor.chain().focus().setImage({ src: reader.result as string }).run();
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const addLink = () => {
    if (linkUrl.trim()) {
      editor.chain().focus().setLink({ href: linkUrl.trim() }).run();
      setLinkUrl('');
      setShowLinkInput(false);
    }
  };

  const ToolbarBtn = ({
    onClick,
    active,
    title,
    children,
  }: {
    onClick: () => void;
    active?: boolean;
    title: string;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        active
          ? 'bg-zinc-900 text-white'
          : 'text-zinc-600 hover:bg-zinc-100'
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="border border-zinc-200 rounded-2xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-zinc-200 bg-zinc-50">
        {/* Text style */}
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold">
          <strong>B</strong>
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic">
          <em>I</em>
        </ToolbarBtn>

        <div className="w-px h-5 bg-zinc-200 mx-1" />

        {/* Headings */}
        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">
          H2
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3">
          H3
        </ToolbarBtn>

        <div className="w-px h-5 bg-zinc-200 mx-1" />

        {/* Lists */}
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list">
          • List
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered list">
          1. List
        </ToolbarBtn>

        <div className="w-px h-5 bg-zinc-200 mx-1" />

        {/* Blockquote */}
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote">
          ❝
        </ToolbarBtn>

        <div className="w-px h-5 bg-zinc-200 mx-1" />

        {/* Link */}
        <ToolbarBtn onClick={() => { setShowLinkInput(!showLinkInput); setShowImageInput(false); }} active={editor.isActive('link')} title="Add link">
          🔗 Link
        </ToolbarBtn>

        {/* Image from URL */}
        <ToolbarBtn onClick={() => { setShowImageInput(!showImageInput); setShowLinkInput(false); }} active={false} title="Add image from URL">
          🖼 Image URL
        </ToolbarBtn>

        {/* Image from device */}
        <ToolbarBtn onClick={() => fileInputRef.current?.click()} active={false} title="Upload image from device">
          📁 Upload
        </ToolbarBtn>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />

        <div className="w-px h-5 bg-zinc-200 mx-1" />

        {/* Clear formatting */}
        <ToolbarBtn onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} active={false} title="Clear formatting">
          ✕ Clear
        </ToolbarBtn>
      </div>

      {/* Image URL input */}
      {showImageInput && (
        <div className="flex gap-2 p-2 border-b border-zinc-200 bg-blue-50">
          <input
            type="url"
            placeholder="Paste image URL..."
            value={imageUrl}
            onChange={e => setImageUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addImage()}
            className="flex-1 px-3 py-1.5 text-sm border border-zinc-200 rounded-lg"
            autoFocus
          />
          <button type="button" onClick={addImage} className="px-3 py-1.5 bg-zinc-900 text-white text-sm rounded-lg">Insert</button>
          <button type="button" onClick={() => setShowImageInput(false)} className="px-3 py-1.5 text-zinc-500 text-sm">Cancel</button>
        </div>
      )}

      {/* Link URL input */}
      {showLinkInput && (
        <div className="flex gap-2 p-2 border-b border-zinc-200 bg-blue-50">
          <input
            type="url"
            placeholder="Paste link URL..."
            value={linkUrl}
            onChange={e => setLinkUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addLink()}
            className="flex-1 px-3 py-1.5 text-sm border border-zinc-200 rounded-lg"
            autoFocus
          />
          <button type="button" onClick={addLink} className="px-3 py-1.5 bg-zinc-900 text-white text-sm rounded-lg">Insert</button>
          <button type="button" onClick={() => setShowLinkInput(false)} className="px-3 py-1.5 text-zinc-500 text-sm">Cancel</button>
        </div>
      )}

      {/* Editor area */}
      <EditorContent
        editor={editor}
        className="prose prose-zinc max-w-none p-4 min-h-64 focus-within:outline-none [&_.tiptap]:outline-none [&_.tiptap]:caret-zinc-900 [&_.tiptap]:cursor-text [&_.tiptap_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.tiptap_p.is-editor-empty:first-child::before]:text-zinc-400 [&_.tiptap_p.is-editor-empty:first-child::before]:float-left [&_.tiptap_p.is-editor-empty:first-child::before]:pointer-events-none"
      />
    </div>
  );
}
