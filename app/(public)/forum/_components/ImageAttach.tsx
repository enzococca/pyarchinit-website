"use client";

import { useState } from "react";
import { ImagePlus, X, Loader2 } from "lucide-react";

interface Item {
  localId: string;
  preview: string;
  id?: string;
  status: "uploading" | "done" | "error";
  scanStatus?: "PENDING" | "CLEAN" | "INFECTED";
}

const MAX = 4;

export function ImageAttach({ onChange }: { onChange: (ids: string[]) => void }) {
  const [items, setItems] = useState<Item[]>([]);

  const sync = (next: Item[]) => {
    setItems(next);
    onChange(next.filter((i) => i.status === "done" && i.id).map((i) => i.id!));
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const room = MAX - items.length;
    const chosen = Array.from(files).slice(0, Math.max(0, room));
    let current = items;
    for (const file of chosen) {
      const localId = `${file.name}-${file.size}-${current.length}`;
      const entry: Item = { localId, preview: URL.createObjectURL(file), status: "uploading" };
      current = [...current, entry];
      sync(current);

      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/forum/attachments", { method: "POST", body: fd });
      if (res.ok) {
        const data = await res.json();
        current = current.map((i) =>
          i.localId === localId ? { ...i, status: "done", id: data.id, scanStatus: data.scanStatus } : i
        );
      } else {
        current = current.map((i) => (i.localId === localId ? { ...i, status: "error" } : i));
      }
      sync(current);
    }
  };

  const remove = (localId: string) => sync(items.filter((i) => i.localId !== localId));

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {items.map((i) => (
          <div key={i.localId} className="relative w-20 h-20 rounded-card overflow-hidden border border-sand/20 bg-code-bg">
            <img src={i.preview} alt="" className="w-full h-full object-cover" />
            {i.status === "uploading" && (
              <div className="absolute inset-0 bg-primary/70 flex items-center justify-center">
                <Loader2 size={16} className="text-teal animate-spin" />
              </div>
            )}
            {i.status === "error" && (
              <div className="absolute inset-0 bg-terracotta/60 flex items-center justify-center text-[10px] text-white text-center px-1">
                errore
              </div>
            )}
            <button
              type="button"
              onClick={() => remove(i.localId)}
              className="absolute top-0.5 right-0.5 bg-primary/80 rounded-full p-0.5 text-sand/80 hover:text-white"
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
      {items.length < MAX && (
        <label className="inline-flex items-center gap-2 text-sm text-teal border border-teal/30 hover:border-teal/60 rounded-card px-3 py-1.5 cursor-pointer transition">
          <ImagePlus size={14} />
          Allega immagini
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="hidden"
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
      )}
      <p className="text-xs text-sand/30 mt-1">Max {MAX} immagini · 8 MB · verifica antivirus</p>
    </div>
  );
}
