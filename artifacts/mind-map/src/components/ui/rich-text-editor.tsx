import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Color from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import Heading from '@tiptap/extension-heading';
import Bold from '@tiptap/extension-bold';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import { 
  Bold as BoldIcon, 
  Italic as ItalicIcon, 
  Underline as UnderlineIcon, 
  Heading1, 
  Heading2, 
  List, 
  ListOrdered, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Type
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  editable?: boolean;
  className?: string;
}

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) return null;

  const buttons = [
    { 
      icon: <Heading1 className="w-4 h-4" />, 
      action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      isActive: editor.isActive('heading', { level: 1 }),
      label: 'H1'
    },
    { 
      icon: <Heading2 className="w-4 h-4" />, 
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: editor.isActive('heading', { level: 2 }),
      label: 'H2'
    },
    { 
      icon: <BoldIcon className="w-4 h-4" />, 
      action: () => editor.chain().focus().toggleBold().run(),
      isActive: editor.isActive('bold'),
      label: 'Bold'
    },
    { 
      icon: <ItalicIcon className="w-4 h-4" />, 
      action: () => editor.chain().focus().toggleItalic().run(),
      isActive: editor.isActive('italic'),
      label: 'Italic'
    },
    { 
      icon: <UnderlineIcon className="w-4 h-4" />, 
      action: () => editor.chain().focus().toggleUnderline().run(),
      isActive: editor.isActive('underline'),
      label: 'Underline'
    },
    { 
      icon: <List className="w-4 h-4" />, 
      action: () => editor.chain().focus().toggleBulletList().run(),
      isActive: editor.isActive('bulletList'),
      label: 'Bullet List'
    },
    { 
      icon: <ListOrdered className="w-4 h-4" />, 
      action: () => editor.chain().focus().toggleOrderedList().run(),
      isActive: editor.isActive('orderedList'),
      label: 'Ordered List'
    },
    { 
      icon: <AlignLeft className="w-4 h-4" />, 
      action: () => editor.chain().focus().setTextAlign('left').run(),
      isActive: editor.isActive({ textAlign: 'left' }),
      label: 'Left'
    },
    { 
      icon: <AlignCenter className="w-4 h-4" />, 
      action: () => editor.chain().focus().setTextAlign('center').run(),
      isActive: editor.isActive({ textAlign: 'center' }),
      label: 'Center'
    },
    { 
      icon: <AlignRight className="w-4 h-4" />, 
      action: () => editor.chain().focus().setTextAlign('right').run(),
      isActive: editor.isActive({ textAlign: 'right' }),
      label: 'Right'
    },
  ];

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b border-border bg-muted/30 sticky top-0 z-10 backdrop-blur-sm">
      {buttons.map((btn, i) => (
        <button
          key={i}
          onClick={(e) => {
            e.preventDefault();
            btn.action();
          }}
          className={cn(
            "p-2 rounded-md transition-colors flex items-center gap-1",
            btn.isActive 
              ? "bg-primary text-primary-foreground shadow-sm" 
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
          title={btn.label}
        >
          {btn.icon}
        </button>
      ))}
      <div className="w-px h-6 bg-border mx-1 self-center" />
      <input
        type="color"
        onInput={(e) => editor.chain().focus().setColor((e.target as HTMLInputElement).value).run()}
        value={editor.getAttributes('textStyle').color || '#000000'}
        className="w-8 h-8 p-1 rounded cursor-pointer bg-transparent border-none"
        title="Text Color"
      />
    </div>
  );
};

export const RichTextEditor = ({ content, onChange, editable = true, className }: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Color,
      TextStyle,
      FontFamily,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: content,
    editable: editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Update content if it changes externally
  React.useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  return (
    <div className={cn(
      "border border-border rounded-xl overflow-hidden bg-card transition-all",
      editable && "focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary",
      className
    )}>
      {editable && <MenuBar editor={editor} />}
      <EditorContent 
        editor={editor} 
        className={cn(
          "prose prose-slate dark:prose-invert max-w-none p-6 min-h-[200px] outline-none",
          editable ? "cursor-text" : "cursor-default"
        )} 
      />
    </div>
  );
};
