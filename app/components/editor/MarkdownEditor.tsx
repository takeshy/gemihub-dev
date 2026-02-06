"use client";
import { Editable, useEditor } from "wysimark-lite";

interface MarkdownEditorProps {
  value: string;
  onChange: (md: string) => void;
  placeholder?: string;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "Write your content here...",
}: MarkdownEditorProps) {
  const editor = useEditor({});

  return (
    <div className="wysimark-fill flex-1 min-h-0 flex flex-col overflow-hidden bg-white text-gray-900">
      <Editable
        editor={editor}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    </div>
  );
}
