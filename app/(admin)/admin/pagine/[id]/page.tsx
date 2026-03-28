"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Save, ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";
import { BlockEditor } from "@/components/admin/block-editor";
import { Block } from "@/lib/blocks";

interface PageData {
  id: string;
  title: string;
  slug: string;
  blocks: Block[];
  status: "DRAFT" | "PUBLISHED";
  updatedAt: string;
}

export default function AdminPageEditorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [page, setPage] = useState<PageData | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">("DRAFT");
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState(false);
  const autosaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch(`/api/pages/${id}`)
      .then((r) => r.json())
      .then((data: PageData) => {
        setPage(data);
        setTitle(data.title);
        setSlug(data.slug);
        setStatus(data.status);
        setBlocks(Array.isArray(data.blocks) ? data.blocks : []);
      });
  }, [id]);

  const save = useCallback(
    async (auto = false) => {
      setSaving(true);
      setSaveError(false);
      try {
        const res = await fetch(`/api/pages/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, slug, blocks, status }),
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
    [id, title, slug, blocks, status]
  );

  // Autosave every 30 seconds
  useEffect(() => {
    if (!page) return;
    if (autosaveRef.current) clearTimeout(autosaveRef.current);
    autosaveRef.current = setTimeout(() => save(true), 30_000);
    return () => {
      if (autosaveRef.current) clearTimeout(autosaveRef.current);
    };
  }, [title, slug, blocks, status, page, save]);

  if (!page) {
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
        <Link href="/admin/pagine" className="text-sand/40 hover:text-sand transition">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-mono text-teal flex-1 truncate">{title || "Pagina senza titolo"}</h1>
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
        <div>
          <label className="block text-xs text-sand/50 mb-1">Titolo</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-primary/50 border border-ochre/20 rounded-lg px-3 py-2 text-sm text-sand placeholder-sand/30 focus:outline-none focus:border-teal/50"
          />
        </div>
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
              onChange={(e) => setStatus(e.target.value as "DRAFT" | "PUBLISHED")}
              className="w-full bg-primary/50 border border-ochre/20 rounded-lg px-3 py-2 text-sm text-sand focus:outline-none focus:border-teal/50"
            >
              <option value="DRAFT">Bozza</option>
              <option value="PUBLISHED">Pubblicata</option>
            </select>
          </div>
        </div>
      </div>

      {/* Block editor */}
      <BlockEditor blocks={blocks} onChange={setBlocks} />
    </div>
  );
}
