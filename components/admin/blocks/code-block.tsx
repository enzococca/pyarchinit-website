"use client";

import { Block } from "@/lib/blocks";

const LANGUAGES = ["python", "sql", "bash", "javascript"] as const;

interface CodeBlockProps {
  block: Block;
  onChange: (data: Record<string, any>) => void;
}

export function CodeBlock({ block, onChange }: CodeBlockProps) {
  const update = (key: string, value: string) =>
    onChange({ ...block.data, [key]: value });

  return (
    <div className="space-y-3">
      <select
        value={block.data.language || "python"}
        onChange={(e) => update("language", e.target.value)}
        className="bg-primary/50 border border-ochre/20 rounded-lg px-3 py-2 text-sm text-sand focus:outline-none focus:border-teal/50"
      >
        {LANGUAGES.map((lang) => (
          <option key={lang} value={lang}>
            {lang}
          </option>
        ))}
      </select>
      <textarea
        value={block.data.code || ""}
        onChange={(e) => update("code", e.target.value)}
        placeholder="// Codice..."
        rows={10}
        className="w-full bg-code-bg border border-ochre/20 rounded-lg px-3 py-2 text-sm text-teal font-mono placeholder-sand/20 focus:outline-none focus:border-teal/50 resize-y"
      />
    </div>
  );
}
