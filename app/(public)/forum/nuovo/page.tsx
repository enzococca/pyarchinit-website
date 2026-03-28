"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Send } from "lucide-react";

interface Category {
  id: string;
  name: string;
  color: string;
}

export default function NuovaDiscussionePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/forum/categories")
      .then((r) => r.json())
      .then((data: Category[]) => {
        setCategories(data);
        if (data.length > 0) setCategoryId(data[0].id);
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !categoryId) return;
    setLoading(true);
    setError(null);

    const res = await fetch("/api/forum/threads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content, categoryId }),
    });

    if (res.ok) {
      const thread = await res.json();
      router.push(`/forum/thread/${thread.slug}`);
    } else {
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        setError("Devi essere autenticato per pubblicare una discussione.");
      } else {
        setError(data.error ?? "Errore nella pubblicazione");
      }
      setLoading(false);
    }
  };

  return (
    <main>
      <section className="bg-gradient-to-br from-primary via-[#0d1524] to-[#0a1020] py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/forum"
            className="inline-flex items-center gap-1 text-teal/70 hover:text-teal text-sm mb-4 transition"
          >
            <ChevronLeft size={14} />
            Forum
          </Link>
          <h1 className="text-3xl font-mono font-bold text-sand">Nuova Discussione</h1>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm text-sand/60 mb-1.5" htmlFor="title">
              Titolo <span className="text-terracotta">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titolo della discussione"
              className="w-full bg-code-bg border border-sand/20 rounded-card px-4 py-2.5 text-sm text-sand placeholder:text-sand/30 focus:outline-none focus:border-teal/50"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm text-sand/60 mb-1.5" htmlFor="category">
              Categoria <span className="text-terracotta">*</span>
            </label>
            <select
              id="category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full bg-code-bg border border-sand/20 rounded-card px-4 py-2.5 text-sm text-sand focus:outline-none focus:border-teal/50"
              required
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm text-sand/60 mb-1.5" htmlFor="content">
              Contenuto <span className="text-terracotta">*</span>
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={12}
              placeholder="Descrivi la tua domanda o proposta in dettaglio..."
              className="w-full bg-code-bg border border-sand/20 rounded-card px-4 py-3 text-sm text-sand placeholder:text-sand/30 focus:outline-none focus:border-teal/50 resize-y"
              required
            />
          </div>

          {error && (
            <div className="bg-terracotta/10 border border-terracotta/20 rounded-card px-4 py-3 text-sm text-terracotta">
              {error}
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={loading || !title.trim() || !content.trim() || !categoryId}
              className="flex items-center gap-2 bg-teal text-primary px-6 py-2.5 rounded-card text-sm font-medium hover:bg-teal/90 transition disabled:opacity-50"
            >
              <Send size={14} />
              {loading ? "Pubblicazione..." : "Pubblica"}
            </button>
            <Link
              href="/forum"
              className="px-4 py-2.5 rounded-card border border-sand/20 text-sand/60 hover:border-sand/40 hover:text-sand text-sm transition"
            >
              Annulla
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}
