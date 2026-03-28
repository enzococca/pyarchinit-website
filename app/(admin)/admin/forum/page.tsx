"use client";

import { useState, useEffect, useCallback } from "react";
import { MessageSquare, Pin, Lock, Trash2 } from "lucide-react";

interface Thread {
  id: string;
  title: string;
  slug: string;
  pinned: boolean;
  locked: boolean;
  views: number;
  createdAt: string;
  user: { name: string | null; email: string };
  category: { name: string; color: string };
  _count: { replies: number };
}

export default function AdminForumPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(false);

  const loadThreads = useCallback(async () => {
    const res = await fetch("/api/forum/admin");
    if (res.ok) setThreads(await res.json());
  }, []);

  useEffect(() => { loadThreads(); }, [loadThreads]);

  const action = async (act: string, threadId: string) => {
    setLoading(true);
    const res = await fetch("/api/forum/admin", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: act, threadId }),
    });
    if (res.ok) await loadThreads();
    setLoading(false);
  };

  const confirmDelete = (threadId: string, title: string) => {
    if (!confirm(`Eliminare "${title}"?`)) return;
    action("deleteThread", threadId);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-mono text-teal">Forum</h1>
        <span className="text-xs text-sand/40">{threads.length} thread</span>
      </div>

      {threads.length === 0 ? (
        <div className="text-center py-16 text-sand/40">
          <MessageSquare size={48} className="mx-auto mb-4 opacity-30" />
          <p>Nessun thread nel forum.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {threads.map((thread) => (
            <div
              key={thread.id}
              className="bg-code-bg rounded-card border border-ochre/10 p-4 flex items-start gap-4"
            >
              <div
                className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0"
                style={{ backgroundColor: thread.category.color }}
              />
              <div className="flex-1 min-w-0">
                <a
                  href={`/forum/thread/${thread.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sand hover:text-teal transition text-sm font-medium"
                >
                  {thread.title}
                </a>
                <p className="text-xs text-sand/40 mt-0.5">
                  {thread.category.name} &middot; {thread.user.name ?? thread.user.email} &middot;{" "}
                  {new Date(thread.createdAt).toLocaleDateString("it-IT")} &middot;{" "}
                  {thread._count.replies} risposte &middot; {thread.views} visite
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {thread.pinned && (
                  <span className="text-xs text-teal bg-teal/10 px-2 py-0.5 rounded-full">
                    Fissato
                  </span>
                )}
                {thread.locked && (
                  <span className="text-xs text-ochre bg-ochre/10 px-2 py-0.5 rounded-full">
                    Bloccato
                  </span>
                )}
                <button
                  onClick={() => action("pin", thread.id)}
                  disabled={loading}
                  title={thread.pinned ? "Rimuovi pin" : "Fissa"}
                  className="p-1.5 rounded-lg text-sand/40 hover:text-teal hover:bg-teal/10 transition disabled:opacity-50"
                >
                  <Pin size={14} />
                </button>
                <button
                  onClick={() => action("lock", thread.id)}
                  disabled={loading}
                  title={thread.locked ? "Sblocca" : "Blocca"}
                  className="p-1.5 rounded-lg text-sand/40 hover:text-ochre hover:bg-ochre/10 transition disabled:opacity-50"
                >
                  <Lock size={14} />
                </button>
                <button
                  onClick={() => confirmDelete(thread.id, thread.title)}
                  disabled={loading}
                  title="Elimina"
                  className="p-1.5 rounded-lg text-sand/40 hover:text-terracotta hover:bg-terracotta/10 transition disabled:opacity-50"
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
