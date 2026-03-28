"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { MediaUpload } from "./media-upload";

interface MediaPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (path: string) => void;
}

interface MediaItem {
  id: string;
  path: string;
  filename: string;
  mimeType: string;
}

export function MediaPicker({ open, onClose, onSelect }: MediaPickerProps) {
  const [media, setMedia] = useState<MediaItem[]>([]);

  const loadMedia = useCallback(async () => {
    const res = await fetch("/api/media");
    if (res.ok) setMedia(await res.json());
  }, []);

  useEffect(() => { if (open) loadMedia(); }, [open, loadMedia]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-primary rounded-card w-full max-w-4xl max-h-[80vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-mono text-teal">Seleziona media</h2>
          <button onClick={onClose} className="text-sand/40 hover:text-sand"><X size={20} /></button>
        </div>
        <MediaUpload folder="/" onUploadComplete={loadMedia} />
        <div className="grid grid-cols-4 gap-3 mt-4">
          {media.filter((m) => m.mimeType.startsWith("image/")).map((item) => (
            <button
              key={item.id}
              onClick={() => { onSelect(item.path); onClose(); }}
              className="aspect-square relative rounded-lg overflow-hidden ring-2 ring-transparent hover:ring-teal transition"
            >
              <Image src={item.path} alt={item.filename} fill className="object-cover" sizes="200px" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
