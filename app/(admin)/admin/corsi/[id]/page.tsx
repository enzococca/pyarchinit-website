"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Save, ArrowLeft, CheckCircle, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { CourseBuilder, ModuleData } from "@/components/admin/course-builder";
import { MediaPicker } from "@/components/admin/media-picker";
import Image from "next/image";

interface CourseData {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  level: "BASE" | "INTERMEDIO" | "AVANZATO";
  category: string;
  coverImage: string | null;
  status: "DRAFT" | "PUBLISHED";
  modules: ModuleData[];
}

const CATEGORIES = ["Python", "GIS", "QGIS", "pyArchInit", "Scavo"];

export default function AdminCourseEditorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [course, setCourse] = useState<CourseData | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(0);
  const [level, setLevel] = useState<CourseData["level"]>("BASE");
  const [category, setCategory] = useState("Python");
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [status, setStatus] = useState<CourseData["status"]>("DRAFT");
  const [modules, setModules] = useState<ModuleData[]>([]);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/courses/${id}`)
      .then((r) => r.json())
      .then((data: CourseData) => {
        setCourse(data);
        setTitle(data.title);
        setSlug(data.slug);
        setDescription(data.description ?? "");
        setPrice(data.price ?? 0);
        setLevel(data.level ?? "BASE");
        setCategory(data.category ?? "Python");
        setCoverImage(data.coverImage ?? null);
        setStatus(data.status ?? "DRAFT");
        setModules(Array.isArray(data.modules) ? data.modules : []);
      });
  }, [id]);

  const save = useCallback(async () => {
    setSaving(true);
    setSaveError(false);
    try {
      const res = await fetch(`/api/courses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug,
          description,
          price,
          level,
          category,
          coverImage,
          status,
          modules,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setModules(Array.isArray(updated.modules) ? updated.modules : []);
        setLastSaved(new Date());
      } else {
        setSaveError(true);
      }
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  }, [id, title, slug, description, price, level, category, coverImage, status, modules]);

  if (!course) {
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
        <Link href="/admin/corsi" className="text-sand/40 hover:text-sand transition">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-mono text-teal flex-1 truncate">
          {title || "Corso senza titolo"}
        </h1>
        <div className="flex items-center gap-3">
          {lastSaved && !saving && (
            <span className="text-xs text-sand/30 flex items-center gap-1">
              <CheckCircle size={12} className="text-teal/60" />
              Salvato{" "}
              {lastSaved.toLocaleTimeString("it-IT", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
          {saveError && (
            <span className="text-xs text-terracotta">Errore nel salvataggio</span>
          )}
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 bg-teal text-primary px-4 py-2 rounded-card text-sm font-medium hover:bg-teal/90 transition disabled:opacity-50"
          >
            <Save size={15} />
            {saving ? "Salvataggio..." : "Salva"}
          </button>
        </div>
      </div>

      {/* Meta fields */}
      <div className="bg-code-bg rounded-card border border-ochre/10 p-4 mb-6 space-y-4">
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

        {/* Slug */}
        <div>
          <label className="block text-xs text-sand/50 mb-1">Slug</label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="w-full bg-primary/50 border border-ochre/20 rounded-lg px-3 py-2 text-sm text-sand font-mono placeholder-sand/30 focus:outline-none focus:border-teal/50"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs text-sand/50 mb-1">Descrizione</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full bg-primary/50 border border-ochre/20 rounded-lg px-3 py-2 text-sm text-sand placeholder-sand/30 focus:outline-none focus:border-teal/50 resize-none"
          />
        </div>

        {/* Price + Level + Category + Status */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <label className="block text-xs text-sand/50 mb-1">Prezzo (€)</label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
              className="w-full bg-primary/50 border border-ochre/20 rounded-lg px-3 py-2 text-sm text-sand focus:outline-none focus:border-teal/50"
            />
          </div>
          <div>
            <label className="block text-xs text-sand/50 mb-1">Livello</label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value as CourseData["level"])}
              className="w-full bg-primary/50 border border-ochre/20 rounded-lg px-3 py-2 text-sm text-sand focus:outline-none focus:border-teal/50"
            >
              <option value="BASE">Base</option>
              <option value="INTERMEDIO">Intermedio</option>
              <option value="AVANZATO">Avanzato</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-sand/50 mb-1">Categoria</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-primary/50 border border-ochre/20 rounded-lg px-3 py-2 text-sm text-sand focus:outline-none focus:border-teal/50"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-sand/50 mb-1">Stato</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as CourseData["status"])}
              className="w-full bg-primary/50 border border-ochre/20 rounded-lg px-3 py-2 text-sm text-sand focus:outline-none focus:border-teal/50"
            >
              <option value="DRAFT">Bozza</option>
              <option value="PUBLISHED">Pubblicato</option>
            </select>
          </div>
        </div>

        {/* Cover Image */}
        <div>
          <label className="block text-xs text-sand/50 mb-1">Immagine di copertina</label>
          <div className="flex items-center gap-3">
            {coverImage ? (
              <div className="relative w-32 h-20 rounded-lg overflow-hidden shrink-0">
                <Image
                  src={coverImage}
                  alt="Cover"
                  fill
                  className="object-cover"
                  sizes="128px"
                />
              </div>
            ) : (
              <div className="w-32 h-20 rounded-lg bg-primary/50 border border-ochre/20 flex items-center justify-center shrink-0">
                <ImageIcon size={20} className="text-sand/20" />
              </div>
            )}
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setMediaOpen(true)}
                className="text-xs text-teal hover:text-teal/80 transition block"
              >
                {coverImage ? "Cambia immagine" : "Seleziona immagine"}
              </button>
              {coverImage && (
                <button
                  type="button"
                  onClick={() => setCoverImage(null)}
                  className="text-xs text-terracotta/60 hover:text-terracotta transition block"
                >
                  Rimuovi
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Course Builder */}
      <div className="mb-6">
        <h2 className="text-sm font-mono text-sand/60 mb-3">Programma del corso</h2>
        <CourseBuilder modules={modules} onChange={setModules} />
      </div>

      {/* Media picker modal */}
      <MediaPicker
        open={mediaOpen}
        onClose={() => setMediaOpen(false)}
        onSelect={(path) => {
          setCoverImage(path);
          setMediaOpen(false);
        }}
      />
    </div>
  );
}
