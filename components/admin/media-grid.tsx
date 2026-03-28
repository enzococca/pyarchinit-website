"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Copy, Check } from "lucide-react";
import { MediaUpload } from "./media-upload";

interface MediaItem {
  id: string;
  filename: string;
  path: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

function CopyUrlButton({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(path);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // fallback: select a temp input
      const input = document.createElement("input");
      input.value = path;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <button
      onClick={handleCopy}
      title="Copia URL"
      className={`absolute top-1 right-1 flex items-center gap-1 px-1.5 py-1 rounded text-xs font-mono transition-all ${
        copied
          ? "bg-teal text-primary"
          : "bg-primary/80 text-sand/60 hover:text-sand hover:bg-primary"
      }`}
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {copied ? "Copiato" : "URL"}
    </button>
  );
}

export function MediaGrid() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [folder] = useState("/");

  const loadMedia = useCallback(async () => {
    const res = await fetch(`/api/media?folder=${folder}`);
    if (res.ok) setMedia(await res.json());
  }, [folder]);

  useEffect(() => { loadMedia(); }, [loadMedia]);

  return (
    <div className="space-y-6">
      <MediaUpload folder={folder} onUploadComplete={loadMedia} />
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {media.map((item) => (
          <div key={item.id} className="bg-code-bg rounded-card overflow-hidden group">
            {item.mimeType.startsWith("image/") ? (
              <div className="aspect-square relative">
                <Image src={item.path} alt={item.filename} fill className="object-cover" sizes="200px" />
                <CopyUrlButton path={item.path} />
              </div>
            ) : (
              <div className="aspect-square flex items-center justify-center text-ochre/50 relative">
                <span className="text-xs">{item.mimeType}</span>
                <CopyUrlButton path={item.path} />
              </div>
            )}
            <div className="p-2">
              <p className="text-xs text-sand/60 truncate">{item.filename}</p>
              <p className="text-xs text-sand/30 truncate font-mono">{item.path}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
