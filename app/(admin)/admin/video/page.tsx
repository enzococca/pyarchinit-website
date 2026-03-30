"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import { Plus, PlayCircle, Pencil, Trash2, X, Check, Eye, EyeOff } from "lucide-react";

interface Video {
  id: string;
  title: string;
  youtubeId: string;
  category: string;
  description: string | null;
  order: number;
  published: boolean;
  createdAt: string;
}

type EditingVideo = Omit<Video, "createdAt">;

const emptyForm = (): EditingVideo => ({
  id: "",
  title: "",
  youtubeId: "",
  category: "",
  description: "",
  order: 0,
  published: true,
});

/** Parse a YouTube ID from a full URL, youtu.be short URL, or a plain ID */
function parseYouTubeId(input: string): string {
  const trimmed = input.trim();
  // youtu.be/ID
  const shortMatch = trimmed.match(/youtu\.be\/([A-Za-z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];
  // youtube.com/watch?v=ID or /embed/ID or /v/ID
  const longMatch = trimmed.match(/(?:v=|\/embed\/|\/v\/)([A-Za-z0-9_-]{11})/);
  if (longMatch) return longMatch[1];
  // Plain 11-char ID
  if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) return trimmed;
  return trimmed;
}

export default function AdminVideoPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [editing, setEditing] = useState<EditingVideo | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [youtubeInput, setYoutubeInput] = useState("");
  const [customCategory, setCustomCategory] = useState("");

  const loadVideos = useCallback(async () => {
    const res = await fetch("/api/videos");
    if (res.ok) setVideos(await res.json());
  }, []);

  useEffect(() => { loadVideos(); }, [loadVideos]);

  // Derive categories from existing videos
  const existingCategories = Array.from(new Set(videos.map((v) => v.category))).filter(Boolean);

  const startNew = () => {
    const form = emptyForm();
    form.order = videos.length;
    setEditing(form);
    setYoutubeInput("");
    setCustomCategory("");
    setIsNew(true);
  };

  const startEdit = (video: Video) => {
    setEditing({
      id: video.id,
      title: video.title,
      youtubeId: video.youtubeId,
      category: video.category,
      description: video.description ?? "",
      order: video.order,
      published: video.published,
    });
    setYoutubeInput(video.youtubeId);
    setCustomCategory("");
    setIsNew(false);
  };

  const cancelEdit = () => {
    setEditing(null);
    setIsNew(false);
    setYoutubeInput("");
    setCustomCategory("");
  };

  const handleYoutubeInputChange = (val: string) => {
    setYoutubeInput(val);
    const parsed = parseYouTubeId(val);
    setEditing((prev) => prev ? { ...prev, youtubeId: parsed } : prev);
  };

  const handleCategoryChange = (val: string) => {
    if (val === "__custom__") {
      setCustomCategory("");
      setEditing((prev) => prev ? { ...prev, category: "" } : prev);
    } else {
      setCustomCategory("");
      setEditing((prev) => prev ? { ...prev, category: val } : prev);
    }
  };

  const updateField = <K extends keyof EditingVideo>(key: K, value: EditingVideo[K]) => {
    setEditing((prev) => prev ? { ...prev, [key]: value } : prev);
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);

    const body = {
      ...editing,
      description: editing.description || null,
    };

    let res: Response;
    if (isNew) {
      res = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } else {
      res = await fetch(`/api/videos/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }

    if (res.ok) {
      await loadVideos();
      setEditing(null);
      setIsNew(false);
      setYoutubeInput("");
      setCustomCategory("");
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Eliminare questo video?")) return;
    setDeletingId(id);
    const res = await fetch(`/api/videos/${id}`, { method: "DELETE" });
    if (res.ok) await loadVideos();
    setDeletingId(null);
  };

  const handleTogglePublished = async (video: Video) => {
    setTogglingId(video.id);
    await fetch(`/api/videos/${video.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...video, published: !video.published }),
    });
    await loadVideos();
    setTogglingId(null);
  };

  // Determine the select value for category
  const categorySelectValue = editing
    ? existingCategories.includes(editing.category)
      ? editing.category
      : editing.category
        ? "__custom__"
        : ""
    : "";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-mono text-teal">Video</h1>
        <button
          onClick={startNew}
          className="flex items-center gap-2 bg-teal text-primary px-4 py-2 rounded-card text-sm font-medium hover:bg-teal/90 transition"
        >
          <Plus size={16} />
          Nuovo Video
        </button>
      </div>

      {/* Inline form */}
      {editing && (
        <div className="bg-code-bg border border-teal/20 rounded-card p-5 mb-6 space-y-4">
          <h2 className="text-teal font-mono text-sm font-semibold">
            {isNew ? "Nuovo video" : "Modifica video"}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-sand/50 mb-1">YouTube URL o ID *</label>
              <input
                type="text"
                value={youtubeInput}
                onChange={(e) => handleYoutubeInputChange(e.target.value)}
                className="w-full bg-primary/40 border border-sand/10 rounded px-3 py-2 text-sand text-sm focus:outline-none focus:border-teal/40"
                placeholder="https://www.youtube.com/watch?v=... o ID"
              />
              {editing.youtubeId && (
                <p className="text-xs text-teal/60 mt-1 font-mono">ID: {editing.youtubeId}</p>
              )}
            </div>
            <div>
              <label className="block text-xs text-sand/50 mb-1">Titolo *</label>
              <input
                type="text"
                value={editing.title}
                onChange={(e) => updateField("title", e.target.value)}
                className="w-full bg-primary/40 border border-sand/10 rounded px-3 py-2 text-sand text-sm focus:outline-none focus:border-teal/40"
                placeholder="Titolo del video"
              />
            </div>
          </div>

          {/* Thumbnail preview */}
          {editing.youtubeId && (
            <div>
              <label className="block text-xs text-sand/50 mb-1">Anteprima</label>
              <img
                src={`https://img.youtube.com/vi/${editing.youtubeId}/mqdefault.jpg`}
                alt="Anteprima YouTube"
                className="w-48 rounded border border-sand/10"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs text-sand/50 mb-1">Categoria *</label>
              <select
                value={categorySelectValue}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full bg-primary/40 border border-sand/10 rounded px-3 py-2 text-sand text-sm focus:outline-none focus:border-teal/40"
              >
                <option value="">— Seleziona categoria —</option>
                {existingCategories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                <option value="__custom__">+ Nuova categoria...</option>
              </select>
              {(categorySelectValue === "__custom__" || (editing.category && !existingCategories.includes(editing.category))) && (
                <input
                  type="text"
                  value={editing.category}
                  onChange={(e) => updateField("category", e.target.value)}
                  className="w-full mt-2 bg-primary/40 border border-sand/10 rounded px-3 py-2 text-sand text-sm focus:outline-none focus:border-teal/40"
                  placeholder="Nuova categoria..."
                  autoFocus
                />
              )}
            </div>
            <div>
              <label className="block text-xs text-sand/50 mb-1">Ordine</label>
              <input
                type="number"
                value={editing.order}
                onChange={(e) => updateField("order", parseInt(e.target.value) || 0)}
                className="w-full bg-primary/40 border border-sand/10 rounded px-3 py-2 text-sand text-sm focus:outline-none focus:border-teal/40"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-sand/50 mb-1">Descrizione (opzionale)</label>
            <textarea
              value={editing.description ?? ""}
              onChange={(e) => updateField("description", e.target.value)}
              rows={2}
              className="w-full bg-primary/40 border border-sand/10 rounded px-3 py-2 text-sand text-sm focus:outline-none focus:border-teal/40 resize-none"
              placeholder="Breve descrizione del video..."
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-sand/70">
              <input
                type="checkbox"
                checked={editing.published}
                onChange={(e) => updateField("published", e.target.checked)}
                className="accent-teal"
              />
              Pubblicato
            </label>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving || !editing.title || !editing.youtubeId || !editing.category}
              className="flex items-center gap-2 bg-teal text-primary px-4 py-2 rounded-card text-sm font-medium hover:bg-teal/90 transition disabled:opacity-50"
            >
              <Check size={14} />
              {saving ? "Salvataggio..." : "Salva"}
            </button>
            <button
              onClick={cancelEdit}
              className="flex items-center gap-2 border border-sand/20 text-sand/60 px-4 py-2 rounded-card text-sm hover:border-sand/40 transition"
            >
              <X size={14} />
              Annulla
            </button>
          </div>
        </div>
      )}

      {/* Videos list */}
      {videos.length === 0 && !editing ? (
        <div className="text-center py-16 text-sand/40">
          <PlayCircle size={48} className="mx-auto mb-4 opacity-30" />
          <p>Nessun video ancora. Aggiungi il primo!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {videos.map((video) => (
            <div
              key={video.id}
              className="flex items-center gap-4 bg-code-bg rounded-card px-4 py-3 border border-ochre/10 hover:border-ochre/20 transition"
            >
              {/* Thumbnail */}
              <img
                src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`}
                alt={video.title}
                className="w-20 h-12 object-cover rounded shrink-0"
              />

              <div className="flex-1 min-w-0">
                <p className="text-sand text-sm font-medium truncate">{video.title}</p>
                <p className="text-xs text-sand/40 font-mono">
                  <span className="text-teal/50 mr-2">[{video.category}]</span>
                  {video.youtubeId}
                  <span className="ml-2 text-sand/20">ord:{video.order}</span>
                </p>
              </div>

              <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${video.published ? "bg-teal/10 text-teal" : "bg-sand/10 text-sand/40"}`}>
                {video.published ? "Pubblicato" : "Bozza"}
              </span>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleTogglePublished(video)}
                  disabled={togglingId === video.id}
                  className="text-sand/30 hover:text-teal transition p-1 disabled:opacity-50"
                  title={video.published ? "Nascondi" : "Pubblica"}
                >
                  {video.published ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <button
                  onClick={() => startEdit(video)}
                  className="text-sand/30 hover:text-teal transition p-1"
                  title="Modifica"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleDelete(video.id)}
                  disabled={deletingId === video.id}
                  className="text-sand/30 hover:text-terracotta transition p-1 disabled:opacity-50"
                  title="Elimina"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
