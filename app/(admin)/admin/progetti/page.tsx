"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import { Plus, Boxes, Pencil, Trash2, ExternalLink, GitFork, X, Check } from "lucide-react";

interface Project {
  id: string;
  title: string;
  slug: string;
  description: string;
  url: string | null;
  githubUrl: string | null;
  imageUrl: string | null;
  status: string;
  category: string | null;
  order: number;
  createdAt: string;
}

const STATUS_OPTIONS = [
  { value: "active", label: "Attivo" },
  { value: "in-development", label: "In sviluppo" },
  { value: "archived", label: "Archiviato" },
];

const CATEGORY_OPTIONS = [
  { value: "", label: "— Nessuna categoria —" },
  { value: "Plugin QGIS", label: "Plugin QGIS" },
  { value: "Web App", label: "Web App" },
  { value: "Pacchetti Python", label: "Pacchetti Python" },
  { value: "App Mobile", label: "App Mobile" },
  { value: "Strumenti", label: "Strumenti" },
];

const statusClass: Record<string, string> = {
  active: "bg-teal/10 text-teal",
  "in-development": "bg-ochre/10 text-ochre",
  archived: "bg-sand/10 text-sand/50",
};

const statusLabel: Record<string, string> = {
  active: "Attivo",
  "in-development": "In sviluppo",
  archived: "Archiviato",
};

type EditingProject = Omit<Project, "createdAt">;

const emptyForm = (): EditingProject => ({
  id: "",
  title: "",
  slug: "",
  description: "",
  url: "",
  githubUrl: "",
  imageUrl: "",
  status: "active",
  category: "",
  order: 0,
});

export default function AdminProgettiPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [editing, setEditing] = useState<EditingProject | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    const res = await fetch("/api/projects");
    if (res.ok) setProjects(await res.json());
  }, []);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  const startNew = () => {
    setEditing(emptyForm());
    setIsNew(true);
  };

  const startEdit = (project: Project) => {
    setEditing({
      id: project.id,
      title: project.title,
      slug: project.slug,
      description: project.description,
      url: project.url ?? "",
      githubUrl: project.githubUrl ?? "",
      imageUrl: project.imageUrl ?? "",
      status: project.status,
      category: project.category ?? "",
      order: project.order,
    });
    setIsNew(false);
  };

  const cancelEdit = () => {
    setEditing(null);
    setIsNew(false);
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);

    const slug =
      editing.slug ||
      editing.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    const body = { ...editing, slug, url: editing.url || null, githubUrl: editing.githubUrl || null, imageUrl: editing.imageUrl || null, category: editing.category || null };

    let res: Response;
    if (isNew) {
      res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } else {
      res = await fetch(`/api/projects/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }

    if (res.ok) {
      await loadProjects();
      setEditing(null);
      setIsNew(false);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Eliminare questo progetto?")) return;
    setDeletingId(id);
    const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
    if (res.ok) await loadProjects();
    setDeletingId(null);
  };

  const updateField = <K extends keyof EditingProject>(key: K, value: EditingProject[K]) => {
    setEditing((prev) => prev ? { ...prev, [key]: value } : prev);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-mono text-teal">Progetti</h1>
        <button
          onClick={startNew}
          className="flex items-center gap-2 bg-teal text-primary px-4 py-2 rounded-card text-sm font-medium hover:bg-teal/90 transition"
        >
          <Plus size={16} />
          Nuovo progetto
        </button>
      </div>

      {/* Inline form for new / edit */}
      {editing && (
        <div className="bg-code-bg border border-teal/20 rounded-card p-5 mb-6 space-y-4">
          <h2 className="text-teal font-mono text-sm font-semibold">
            {isNew ? "Nuovo progetto" : "Modifica progetto"}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-sand/50 mb-1">Titolo *</label>
              <input
                type="text"
                value={editing.title}
                onChange={(e) => updateField("title", e.target.value)}
                className="w-full bg-primary/40 border border-sand/10 rounded px-3 py-2 text-sand text-sm focus:outline-none focus:border-teal/40"
                placeholder="Nome del progetto"
              />
            </div>
            <div>
              <label className="block text-xs text-sand/50 mb-1">Slug</label>
              <input
                type="text"
                value={editing.slug}
                onChange={(e) => updateField("slug", e.target.value)}
                className="w-full bg-primary/40 border border-sand/10 rounded px-3 py-2 text-sand text-sm focus:outline-none focus:border-teal/40"
                placeholder="generato-automaticamente"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-sand/50 mb-1">Descrizione *</label>
            <textarea
              value={editing.description}
              onChange={(e) => updateField("description", e.target.value)}
              rows={3}
              className="w-full bg-primary/40 border border-sand/10 rounded px-3 py-2 text-sand text-sm focus:outline-none focus:border-teal/40 resize-none"
              placeholder="Descrizione del progetto..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-sand/50 mb-1">URL sito web</label>
              <input
                type="url"
                value={editing.url ?? ""}
                onChange={(e) => updateField("url", e.target.value)}
                className="w-full bg-primary/40 border border-sand/10 rounded px-3 py-2 text-sand text-sm focus:outline-none focus:border-teal/40"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-xs text-sand/50 mb-1">URL GitHub</label>
              <input
                type="url"
                value={editing.githubUrl ?? ""}
                onChange={(e) => updateField("githubUrl", e.target.value)}
                className="w-full bg-primary/40 border border-sand/10 rounded px-3 py-2 text-sand text-sm focus:outline-none focus:border-teal/40"
                placeholder="https://github.com/..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs text-sand/50 mb-1">URL immagine</label>
              <input
                type="url"
                value={editing.imageUrl ?? ""}
                onChange={(e) => updateField("imageUrl", e.target.value)}
                className="w-full bg-primary/40 border border-sand/10 rounded px-3 py-2 text-sand text-sm focus:outline-none focus:border-teal/40"
                placeholder="https://..."
              />
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-sand/50 mb-1">Stato</label>
              <select
                value={editing.status}
                onChange={(e) => updateField("status", e.target.value)}
                className="w-full bg-primary/40 border border-sand/10 rounded px-3 py-2 text-sand text-sm focus:outline-none focus:border-teal/40"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-sand/50 mb-1">Categoria</label>
              <select
                value={editing.category ?? ""}
                onChange={(e) => updateField("category", e.target.value)}
                className="w-full bg-primary/40 border border-sand/10 rounded px-3 py-2 text-sand text-sm focus:outline-none focus:border-teal/40"
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving || !editing.title || !editing.description}
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

      {/* Projects list */}
      {projects.length === 0 && !editing ? (
        <div className="text-center py-16 text-sand/40">
          <Boxes size={48} className="mx-auto mb-4 opacity-30" />
          <p>Nessun progetto ancora. Crea il primo!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {projects.map((project) => (
            <div
              key={project.id}
              className="flex items-center gap-4 bg-code-bg rounded-card px-4 py-3 border border-ochre/10 hover:border-ochre/20 transition"
            >
              <Boxes size={16} className="text-teal/40 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sand text-sm font-medium truncate">{project.title}</p>
                <p className="text-xs text-sand/40 truncate">
                  {project.category && (
                    <span className="text-teal/50 mr-2">[{project.category}]</span>
                  )}
                  {project.description}
                </p>
              </div>

              <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${statusClass[project.status] ?? statusClass["archived"]}`}>
                {statusLabel[project.status] ?? project.status}
              </span>

              <div className="flex items-center gap-2 shrink-0">
                {project.url && (
                  <a href={project.url} target="_blank" rel="noopener noreferrer" className="text-sand/30 hover:text-teal transition">
                    <ExternalLink size={14} />
                  </a>
                )}
                {project.githubUrl && (
                  <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="text-sand/30 hover:text-teal transition">
                    <GitFork size={14} />
                  </a>
                )}
                <button
                  onClick={() => startEdit(project)}
                  className="text-sand/30 hover:text-teal transition p-1"
                  title="Modifica"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleDelete(project.id)}
                  disabled={deletingId === project.id}
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
