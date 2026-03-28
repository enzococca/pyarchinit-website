"use client";

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Block } from "@/lib/blocks";

interface TextBlockProps {
  block: Block;
  onChange: (data: Record<string, any>) => void;
}

export function TextBlock({ block, onChange }: TextBlockProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: block.data.content || "",
    onUpdate: ({ editor }) => {
      onChange({ content: editor.getHTML() });
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-invert max-w-none min-h-[120px] p-3 focus:outline-none text-sand/80 text-sm",
      },
    },
  });

  useEffect(() => {
    return () => {
      editor?.destroy();
    };
  }, [editor]);

  return (
    <div className="border border-ochre/20 rounded-lg bg-primary/50 overflow-hidden">
      <div className="flex gap-1 p-2 border-b border-ochre/10 bg-code-bg/50">
        {[
          { label: "B", action: () => editor?.chain().focus().toggleBold().run(), mark: "bold" },
          { label: "I", action: () => editor?.chain().focus().toggleItalic().run(), mark: "italic" },
          { label: "H2", action: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(), mark: "heading" },
          { label: "H3", action: () => editor?.chain().focus().toggleHeading({ level: 3 }).run(), mark: "heading" },
          { label: "UL", action: () => editor?.chain().focus().toggleBulletList().run(), mark: "bulletList" },
          { label: "OL", action: () => editor?.chain().focus().toggleOrderedList().run(), mark: "orderedList" },
        ].map((btn) => (
          <button
            key={btn.label}
            type="button"
            onClick={btn.action}
            className="px-2 py-1 text-xs font-mono text-sand/60 hover:text-teal hover:bg-teal/10 rounded transition"
          >
            {btn.label}
          </button>
        ))}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
