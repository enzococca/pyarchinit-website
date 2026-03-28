"use client";

import { Block } from "@/lib/blocks";

interface VideoBlockProps {
  block: Block;
  onChange: (data: Record<string, any>) => void;
}

export function VideoBlock({ block, onChange }: VideoBlockProps) {
  const update = (key: string, value: string) =>
    onChange({ ...block.data, [key]: value });

  return (
    <div className="space-y-3">
      <input
        type="url"
        value={block.data.url || ""}
        onChange={(e) => update("url", e.target.value)}
        placeholder="URL video (YouTube, Vimeo, ecc.)"
        className="w-full bg-primary/50 border border-ochre/20 rounded-lg px-3 py-2 text-sm text-sand placeholder-sand/30 focus:outline-none focus:border-teal/50"
      />
      <input
        type="text"
        value={block.data.caption || ""}
        onChange={(e) => update("caption", e.target.value)}
        placeholder="Didascalia (opzionale)"
        className="w-full bg-primary/50 border border-ochre/20 rounded-lg px-3 py-2 text-sm text-sand placeholder-sand/30 focus:outline-none focus:border-teal/50"
      />
    </div>
  );
}
