"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { MediaPicker } from "@/components/admin/media-picker";
import { Block } from "@/lib/blocks";

interface HeroBlockProps {
  block: Block;
  onChange: (data: Record<string, any>) => void;
}

export function HeroBlock({ block, onChange }: HeroBlockProps) {
  const [pickerOpen, setPickerOpen] = useState(false);

  const update = (key: string, value: string) =>
    onChange({ ...block.data, [key]: value });

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={block.data.title || ""}
        onChange={(e) => update("title", e.target.value)}
        placeholder="Titolo hero"
        className="w-full bg-primary/50 border border-ochre/20 rounded-lg px-3 py-2 text-sm text-sand placeholder-sand/30 focus:outline-none focus:border-teal/50"
      />
      <textarea
        value={block.data.subtitle || ""}
        onChange={(e) => update("subtitle", e.target.value)}
        placeholder="Sottotitolo"
        rows={2}
        className="w-full bg-primary/50 border border-ochre/20 rounded-lg px-3 py-2 text-sm text-sand placeholder-sand/30 focus:outline-none focus:border-teal/50 resize-none"
      />
      <div className="grid grid-cols-2 gap-3">
        <input
          type="text"
          value={block.data.ctaLabel || ""}
          onChange={(e) => update("ctaLabel", e.target.value)}
          placeholder="Testo CTA (opzionale)"
          className="bg-primary/50 border border-ochre/20 rounded-lg px-3 py-2 text-sm text-sand placeholder-sand/30 focus:outline-none focus:border-teal/50"
        />
        <input
          type="text"
          value={block.data.ctaHref || ""}
          onChange={(e) => update("ctaHref", e.target.value)}
          placeholder="Link CTA (opzionale)"
          className="bg-primary/50 border border-ochre/20 rounded-lg px-3 py-2 text-sm text-sand placeholder-sand/30 focus:outline-none focus:border-teal/50"
        />
      </div>
      <div>
        <p className="text-xs text-sand/50 mb-1">Immagine di sfondo (opzionale)</p>
        <div
          className="border border-ochre/20 rounded-lg bg-primary/50 overflow-hidden cursor-pointer hover:border-teal/40 transition"
          onClick={() => setPickerOpen(true)}
        >
          {block.data.bg ? (
            <div className="relative h-24">
              <Image src={block.data.bg} alt="" fill className="object-cover" sizes="400px" />
            </div>
          ) : (
            <div className="h-24 flex items-center justify-center gap-2 text-ochre/40">
              <ImageIcon size={20} />
              <span className="text-xs">Seleziona immagine di sfondo</span>
            </div>
          )}
        </div>
      </div>
      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(path) => onChange({ ...block.data, bg: path })}
      />
    </div>
  );
}
