"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, FileText, ExternalLink } from "lucide-react";
import Link from "next/link";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  status: "DRAFT" | "SCHEDULED" | "PUBLISHED";
  createdAt: string;
  updatedAt: string;
}

const statusLabel: Record<BlogPost["status"], string> = {
  DRAFT: "Bozza",
  SCHEDULED: "Programmato",
  PUBLISHED: "Pubblicato",
};

const statusClass: Record<BlogPost["status"], string> = {
  DRAFT: "bg-ochre/10 text-ochre",
  SCHEDULED: "bg-terracotta/10 text-terracotta",
  PUBLISHED: "bg-teal/10 text-teal",
};

export default function AdminBlogPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [creating, setCreating] = useState(false);

  const loadPosts = useCallback(async () => {
    const res = await fetch("/api/blog");
    if (res.ok) setPosts(await res.json());
  }, []);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  const createPost = async () => {
    const title = prompt("Titolo dell'articolo:");
    if (!title) return;

    setCreating(true);
    const res = await fetch("/api/blog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });

    if (res.ok) {
      const post = await res.json();
      router.push(`/admin/blog/${post.id}`);
    }
    setCreating(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-mono text-teal">Blog</h1>
        <button
          onClick={createPost}
          disabled={creating}
          className="flex items-center gap-2 bg-teal text-primary px-4 py-2 rounded-card text-sm font-medium hover:bg-teal/90 transition disabled:opacity-50"
        >
          <Plus size={16} />
          {creating ? "Creazione..." : "Nuovo articolo"}
        </button>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-16 text-sand/40">
          <FileText size={48} className="mx-auto mb-4 opacity-30" />
          <p>Nessun articolo ancora. Crea il primo!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {posts.map((post) => (
            <div
              key={post.id}
              className="flex items-center gap-4 bg-code-bg rounded-card px-4 py-3 border border-ochre/10 hover:border-ochre/20 transition"
            >
              <FileText size={16} className="text-ochre/40 shrink-0" />
              <div className="flex-1 min-w-0">
                <Link
                  href={`/admin/blog/${post.id}`}
                  className="text-sand hover:text-teal transition text-sm font-medium"
                >
                  {post.title}
                </Link>
                <p className="text-xs text-sand/40 truncate">/blog/{post.slug}</p>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${statusClass[post.status]}`}
              >
                {statusLabel[post.status]}
              </span>
              <p className="text-xs text-sand/30 shrink-0">
                {new Date(post.createdAt).toLocaleDateString("it-IT")}
              </p>
              {post.status === "PUBLISHED" && (
                <a
                  href={`/blog/${post.slug}`}
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
