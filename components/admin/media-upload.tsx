"use client";

import { useState, useCallback } from "react";
import { Upload } from "lucide-react";

interface MediaUploadProps {
  folder: string;
  onUploadComplete: () => void;
}

export function MediaUpload({ folder, onUploadComplete }: MediaUploadProps) {
  const [uploading, setUploading] = useState(false);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files?.length) return;
      setUploading(true);

      const formData = new FormData();
      Array.from(files).forEach((f) => formData.append("files", f));
      formData.append("folder", folder);

      const res = await fetch("/api/media/upload", { method: "POST", body: formData });
      if (res.ok) onUploadComplete();
      setUploading(false);
    },
    [folder, onUploadComplete]
  );

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
      className="border-2 border-dashed border-ochre/30 rounded-card p-8 text-center hover:border-teal/50 transition cursor-pointer"
    >
      <input type="file" multiple onChange={(e) => handleFiles(e.target.files)} className="hidden" id="media-upload" />
      <label htmlFor="media-upload" className="cursor-pointer">
        <Upload className="mx-auto mb-2 text-ochre/50" size={32} />
        <p className="text-sand/50 text-sm">
          {uploading ? "Caricamento..." : "Trascina file qui o clicca per caricare"}
        </p>
      </label>
    </div>
  );
}
