"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { MediaUpload } from "./media-upload";

interface MediaItem {
  id: string;
  filename: string;
  path: string;
  mimeType: string;
  size: number;
  createdAt: string;
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
          <div key={item.id} className="bg-code-bg rounded-card overflow-hidden">
            {item.mimeType.startsWith("image/") ? (
              <div className="aspect-square relative">
                <Image src={item.path} alt={item.filename} fill className="object-cover" sizes="200px" />
              </div>
            ) : (
              <div className="aspect-square flex items-center justify-center text-ochre/50">
                <span className="text-xs">{item.mimeType}</span>
              </div>
            )}
            <div className="p-2">
              <p className="text-xs text-sand/60 truncate">{item.filename}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
