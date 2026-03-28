"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, FileText, ExternalLink } from "lucide-react";
import Link from "next/link";

interface Page {
  id: string;
  title: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED";
  updatedAt: string;
}

export default function AdminPaginePage() {
  const router = useRouter();
  const [pages, setPages] = useState<Page[]>([]);
  const [creating, setCreating] = useState(false);

  const loadPages = useCallback(async () => {
    const res = await fetch("/api/pages");
    if (res.ok) setPages(await res.json());
  }, []);

  useEffect(() => { loadPages(); }, [loadPages]);

  const createPage = async () => {
    const title = prompt("Titolo della pagina:");
    if (!title) return;

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    setCreating(true);
    const res = await fetch("/api/pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, slug }),
    });

    if (res.ok) {
      const page = await res.json();
      router.push(`/admin/pagine/${page.id}`);
    }
    setCreating(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-mono text-teal">Pagine</h1>
        <button
          onClick={createPage}
          disabled={creating}
          className="flex items-center gap-2 bg-teal text-primary px-4 py-2 rounded-card text-sm font-medium hover:bg-teal/90 transition disabled:opacity-50"
        >
          <Plus size={16} />
          {creating ? "Creazione..." : "Nuova pagina"}
        </button>
      </div>

      {pages.length === 0 ? (
        <div className="text-center py-16 text-sand/40">
          <FileText size={48} className="mx-auto mb-4 opacity-30" />
          <p>Nessuna pagina ancora. Crea la prima!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {pages.map((page) => (
            <div
              key={page.id}
              className="flex items-center gap-4 bg-code-bg rounded-card px-4 py-3 border border-ochre/10 hover:border-ochre/20 transition"
            >
              <FileText size={16} className="text-ochre/40 shrink-0" />
              <div className="flex-1 min-w-0">
                <Link
                  href={`/admin/pagine/${page.id}`}
                  className="text-sand hover:text-teal transition text-sm font-medium"
                >
                  {page.title}
                </Link>
                <p className="text-xs text-sand/40 truncate">/{page.slug}</p>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                  page.status === "PUBLISHED"
                    ? "bg-teal/10 text-teal"
                    : "bg-ochre/10 text-ochre"
                }`}
              >
                {page.status === "PUBLISHED" ? "Pubblicata" : "Bozza"}
              </span>
              <p className="text-xs text-sand/30 shrink-0">
                {new Date(page.updatedAt).toLocaleDateString("it-IT")}
              </p>
              {page.status === "PUBLISHED" && (
                <a
                  href={`/${page.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sand/30 hover:text-teal transition"
                >
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
