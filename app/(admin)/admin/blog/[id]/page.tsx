"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Save, ArrowLeft, CheckCircle, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { BlockEditor } from "@/components/admin/block-editor";
import { Block } from "@/lib/blocks";
import { MediaPicker } from "@/components/admin/media-picker";

interface BlogPostData {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  blocks: Block[];
  coverImage: string | null;
  status: "DRAFT" | "SCHEDULED" | "PUBLISHED";
  updatedAt: string;
}

export default function AdminBlogEditorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [post, setPost] = useState<BlogPostData | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [status, setStatus] = useState<"DRAFT" | "SCHEDULED" | "PUBLISHED">("DRAFT");
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const autosaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch(`/api/blog/${id}`)
      .then((r) => r.json())
      .then((data: BlogPostData) => {
        setPost(data);
        setTitle(data.title);
        setSlug(data.slug);
        setExcerpt(data.excerpt ?? "");
        setCoverImage(data.coverImage ?? null);
        setStatus(data.status);
        setBlocks(Array.isArray(data.blocks) ? data.blocks : []);
      });
  }, [id]);

  const save = useCallback(
    async (auto = false) => {
      setSaving(true);
      setSaveError(false);
      try {
        const res = await fetch(`/api/blog/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, slug, excerpt, coverImage, blocks, status }),
        });
        if (res.ok) {
          setLastSaved(new Date());
        } else {
          setSaveError(true);
        }
      } catch {
        setSaveError(true);
      } finally {
        setSaving(false);
      }
    },
    [id, title, slug, excerpt, coverImage, blocks, status]
  );

  // Autosave every 30 seconds
  useEffect(() => {
    if (!post) return;
    if (autosaveRef.current) clearTimeout(autosaveRef.current);
    autosaveRef.current = setTimeout(() => save(true), 30_000);
    return () => {
      if (autosaveRef.current) clearTimeout(autosaveRef.current);
    };
  }, [title, slug, excerpt, coverImage, blocks, status, post, save]);

  if (!post) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-sand/40 text-sm">Caricamento...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/blog" className="text-sand/40 hover:text-sand transition">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-mono text-teal flex-1 truncate">{title || "Articolo senza titolo"}</h1>
        <div className="flex items-center gap-3">
          {lastSaved && !saving && (
            <span className="text-xs text-sand/30 flex items-center gap-1">
              <CheckCircle size={12} className="text-teal/60" />
              Salvato {lastSaved.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          {saveError && (
            <span className="text-xs text-terracotta">Errore nel salvataggio</span>
          )}
          <button
            onClick={() => save(false)}
            disabled={saving}
            className="flex items-center gap-2 bg-teal text-primary px-4 py-2 rounded-card text-sm font-medium hover:bg-teal/90 transition disabled:opacity-50"
          >
            <Save size={15} />
            {saving ? "Salvataggio..." : "Salva"}
          </button>
        </div>
      </div>

      {/* Meta fields */}
      <div className="bg-code-bg rounded-card border border-ochre/10 p-4 mb-6 space-y-3">
        {/* Cover image */}
        <div>
          <label className="block text-xs text-sand/50 mb-1">Immagine di copertina</label>
          <div className="flex items-start gap-3">
            {coverImage ? (
              <div className="relative w-32 h-20 rounded-lg overflow-hidden shrink-0">
                <Image src={coverImage} alt="Cover" fill className="object-cover" sizes="128px" />
              </div>
            ) : (
              <div className="w-32 h-20 rounded-lg bg-primary/50 border border-ochre/20 flex items-center justify-center shrink-0">
                <ImageIcon size={24} className="text-sand/20" />
              </div>
            )}
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setPickerOpen(true)}
                className="text-xs bg-primary/50 border border-ochre/20 rounded-lg px-3 py-1.5 text-sand/70 hover:text-sand hover:border-ochre/40 transition"
              >
                {coverImage ? "Cambia immagine" : "Seleziona immagine"}
              </button>
              {coverImage && (
                <button
                  onClick={() => setCoverImage(null)}
                  className="text-xs text-terracotta/70 hover:text-terracotta transition"
                >
                  Rimuovi
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs text-sand/50 mb-1">Titolo</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-primary/50 border border-ochre/20 rounded-lg px-3 py-2 text-sm text-sand placeholder-sand/30 focus:outline-none focus:border-teal/50"
          />
        </div>

        {/* Slug + Status */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-sand/50 mb-1">Slug</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full bg-primary/50 border border-ochre/20 rounded-lg px-3 py-2 text-sm text-sand font-mono placeholder-sand/30 focus:outline-none focus:border-teal/50"
            />
          </div>
          <div>
            <label className="block text-xs text-sand/50 mb-1">Stato</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "DRAFT" | "SCHEDULED" | "PUBLISHED")}
              className="w-full bg-primary/50 border border-ochre/20 rounded-lg px-3 py-2 text-sm text-sand focus:outline-none focus:border-teal/50"
            >
              <option value="DRAFT">Bozza</option>
              <option value="SCHEDULED">Programmato</option>
              <option value="PUBLISHED">Pubblicato</option>
            </select>
          </div>
        </div>

        {/* Excerpt */}
        <div>
          <label className="block text-xs text-sand/50 mb-1">Estratto</label>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={3}
            className="w-full bg-primary/50 border border-ochre/20 rounded-lg px-3 py-2 text-sm text-sand placeholder-sand/30 focus:outline-none focus:border-teal/50 resize-none"
            placeholder="Breve descrizione dell'articolo..."
          />
        </div>
      </div>

      {/* Block editor */}
      <BlockEditor blocks={blocks} onChange={setBlocks} />

      {/* Media picker */}
      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(path) => setCoverImage(path)}
      />
    </div>
  );
}
