"use client";

import { useState } from "react";
import { Tag, Loader2, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface CourseCodeInputProps {
  courseSlug: string;
}

export function CourseCodeInput({ courseSlug }: CourseCodeInputProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/learn/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Errore durante l'attivazione");
      } else {
        setSuccess(true);
        setTimeout(() => router.refresh(), 1200);
      }
    } catch {
      setError("Errore di rete. Riprova.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex items-center gap-2 bg-teal/10 border border-teal/20 text-teal rounded-lg px-4 py-3 text-sm font-mono">
        <CheckCircle size={16} />
        Codice attivato! Caricamento corso...
      </div>
    );
  }

  return (
    <div className="bg-code-bg border border-sand/10 rounded-card p-5">
      <h4 className="font-mono text-sand/70 text-sm flex items-center gap-2 mb-3">
        <Tag size={14} className="text-ochre" />
        Hai un codice di accesso?
      </h4>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="A1B2C3D4E5F6"
          maxLength={12}
          className="flex-1 bg-primary border border-ochre/30 rounded-lg px-4 py-2 text-sand text-sm font-mono placeholder:text-ochre/30 focus:border-teal focus:outline-none uppercase"
        />
        <button
          type="submit"
          disabled={loading || !code.trim()}
          className="bg-teal text-primary font-mono font-bold text-sm px-4 py-2 rounded-lg hover:bg-teal/90 transition disabled:opacity-50"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : "Attiva"}
        </button>
      </form>
      {error && (
        <p className="text-red-400 text-xs font-mono mt-2">{error}</p>
      )}
    </div>
  );
}
