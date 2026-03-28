"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";

interface Props {
  threadId: string;
  locked: boolean;
}

export function ReplyForm({ threadId, locked }: Props) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (locked) {
    return (
      <div className="bg-ochre/10 border border-ochre/20 rounded-card px-4 py-3 text-sm text-ochre">
        Questo thread è bloccato. Non è possibile aggiungere nuove risposte.
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    setError(null);

    const res = await fetch("/api/forum/replies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, threadId }),
    });

    if (res.ok) {
      setContent("");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Errore nell'invio della risposta");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <h3 className="text-sm font-mono text-sand/70">Aggiungi una risposta</h3>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={5}
        placeholder="Scrivi la tua risposta..."
        className="w-full bg-code-bg border border-sand/20 rounded-card px-4 py-3 text-sm text-sand placeholder:text-sand/30 focus:outline-none focus:border-teal/50 resize-y"
        required
      />
      {error && <p className="text-sm text-terracotta">{error}</p>}
      <button
        type="submit"
        disabled={loading || !content.trim()}
        className="flex items-center gap-2 bg-teal text-primary px-5 py-2 rounded-card text-sm font-medium hover:bg-teal/90 transition disabled:opacity-50"
      >
        <Send size={14} />
        {loading ? "Invio..." : "Rispondi"}
      </button>
    </form>
  );
}
