"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { MediaPicker } from "@/components/admin/media-picker";
import { Block } from "@/lib/blocks";

interface ImageBlockProps {
  block: Block;
  onChange: (data: Record<string, any>) => void;
}

export function ImageBlock({ block, onChange }: ImageBlockProps) {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div className="space-y-3">
      <div
        className="border border-ochre/20 rounded-lg bg-primary/50 overflow-hidden cursor-pointer hover:border-teal/40 transition"
        onClick={() => setPickerOpen(true)}
      >
        {block.data.src ? (
          <div className="relative aspect-video">
            <Image
              src={block.data.src}
              alt={block.data.alt || ""}
              fill
              className="object-cover"
              sizes="600px"
            />
          </div>
        ) : (
          <div className="aspect-video flex flex-col items-center justify-center gap-2 text-ochre/40">
            <ImageIcon size={32} />
            <span className="text-sm">Clicca per selezionare un&apos;immagine</span>
          </div>
        )}
      </div>

      <input
        type="text"
        value={block.data.alt || ""}
        onChange={(e) => onChange({ ...block.data, alt: e.target.value })}
        placeholder="Testo alternativo (alt)"
        className="w-full bg-primary/50 border border-ochre/20 rounded-lg px-3 py-2 text-sm text-sand placeholder-sand/30 focus:outline-none focus:border-teal/50"
      />

      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(path) => onChange({ ...block.data, src: path })}
      />
    </div>
  );
}
