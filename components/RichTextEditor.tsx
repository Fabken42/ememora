"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { Bold, Italic, Underline as UnderlineIcon, List, ListOrdered } from "lucide-react";
import { useEffect, useState } from "react";

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  maxLength?: number;
}

type Level = 1 | 2 | 3 | 4 | 5 | 6;

export default function RichTextEditor({ value, onChange, placeholder, autoFocus, maxLength }: Props) {
  const [, rerender] = useState(0);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] as Level[] },
        bulletList: {},
        orderedList: {},
      }),
      Underline,
    ],
    content: value,
    autofocus: autoFocus ? "end" : false,
    onTransaction() {
      rerender(n => n + 1);
    },
    onUpdate({ editor }) {
      onChange(editor.isEmpty ? "" : editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "min-h-[80px] max-h-48 overflow-y-auto px-3 py-2 text-sm text-slate-800 dark:text-slate-100 focus:outline-none",
      },
    },
    immediatelyRender: false,
  });

  // sync external value changes (e.g. when editing an existing term)
  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() !== value) {
      editor.commands.setContent(value || "");
    }
  }, [value, editor]);

  if (!editor) return null;

  const toolbarBtn = (active: boolean) =>
    `p-1.5 rounded transition-colors ${
      active
        ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
        : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#243049] hover:text-slate-800 dark:hover:text-slate-200"
    }`;

  return (
    <div className="rounded-lg border border-slate-300 dark:border-[#2f3d5a] bg-white dark:bg-[#1a2336] focus-within:ring-2 focus-within:ring-blue-500 overflow-hidden">
      {/* toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-slate-200 dark:border-[#2f3d5a]">
        <button
          type="button"
          title="Negrito (Ctrl+B)"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={toolbarBtn(editor.isActive("bold"))}
        >
          <Bold size={14} />
        </button>
        <button
          type="button"
          title="Itálico (Ctrl+I)"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={toolbarBtn(editor.isActive("italic"))}
        >
          <Italic size={14} />
        </button>
        <button
          type="button"
          title="Sublinhado (Ctrl+U)"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={toolbarBtn(editor.isActive("underline"))}
        >
          <UnderlineIcon size={14} />
        </button>

        <div className="w-px h-4 bg-slate-200 dark:bg-[#444] mx-1" />

        <button
          type="button"
          title="Lista com marcadores"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={toolbarBtn(editor.isActive("bulletList"))}
        >
          <List size={14} />
        </button>
        <button
          type="button"
          title="Lista numerada"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={toolbarBtn(editor.isActive("orderedList"))}
        >
          <ListOrdered size={14} />
        </button>

        {maxLength && (
          <span className="ml-auto text-xs text-slate-400 dark:text-slate-500 pr-1 select-none">
            max {maxLength}
          </span>
        )}
      </div>

      {/* editor area */}
      <div className="relative">
        {editor.isEmpty && placeholder && (
          <p className="absolute top-2 left-3 text-sm text-slate-400 dark:text-slate-500 pointer-events-none select-none">
            {placeholder}
          </p>
        )}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
