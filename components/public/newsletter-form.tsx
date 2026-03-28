"use client";

import { useState } from "react";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "already" | "error">("idle");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    setError("");

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Errore durante l'iscrizione");
        setStatus("error");
        return;
      }

      if (data.message === "already_subscribed") {
        setStatus("already");
      } else {
        setStatus("success");
        setEmail("");
      }
    } catch {
      setError("Errore di rete. Riprova.");
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="bg-teal/10 border border-teal/30 rounded-card px-5 py-4 text-teal text-sm">
        Iscritto! Grazie per esserti iscritto alla newsletter.
      </div>
    );
  }

  if (status === "already") {
    return (
      <div className="bg-teal/10 border border-teal/30 rounded-card px-5 py-4 text-teal text-sm">
        Sei già iscritto alla newsletter.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="La tua email"
        required
        className="flex-1 bg-white/5 border border-sand/20 rounded-card px-4 py-2.5 text-sand placeholder:text-sand/40 text-sm focus:outline-none focus:border-teal/50 transition"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="bg-teal text-primary font-medium px-5 py-2.5 rounded-card text-sm hover:bg-teal/90 transition disabled:opacity-50 shrink-0"
      >
        {status === "loading" ? "Iscrizione..." : "Iscriviti"}
      </button>
      {status === "error" && (
        <p className="text-terracotta text-xs mt-1 sm:hidden">{error}</p>
      )}
    </form>
  );
}
