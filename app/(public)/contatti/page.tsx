"use client";

import { useState } from "react";
import { Send, CheckCircle2 } from "lucide-react";

const contactTypes = [
  { value: "Informazioni", label: "Informazioni generali" },
  { value: "Corsi", label: "Corsi" },
  { value: "Consulenza", label: "Consulenza" },
  { value: "Supporto tecnico", label: "Supporto tecnico" },
  { value: "Altro", label: "Altro" },
];

export default function ContattiPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    type: "Informazioni",
    message: "",
  });
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError("");

    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setSuccess(true);
        setForm({ name: "", email: "", type: "Informazioni", message: "" });
      } else {
        setError("Si è verificato un errore. Riprova più tardi.");
      }
    } catch {
      setError("Si è verificato un errore. Riprova più tardi.");
    } finally {
      setSending(false);
    }
  };

  if (success) {
    return (
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-teal/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={32} className="text-teal" />
          </div>
          <h2 className="text-2xl font-mono font-bold text-sand mb-3">
            Messaggio inviato!
          </h2>
          <p className="text-sand/60 mb-8">
            Grazie per averci contattato. Ti risponderemo al più presto.
          </p>
          <button
            onClick={() => setSuccess(false)}
            className="text-sm text-teal hover:text-teal/80 transition-colors"
          >
            Invia un altro messaggio
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="mb-12">
        <h1 className="text-4xl font-mono font-bold text-sand mb-3">Contatti</h1>
        <p className="text-sand/50 text-lg">
          Hai domande su pyArchInit? Compila il modulo e ti risponderemo al più presto.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm text-sand/70 mb-1.5" htmlFor="name">
            Nome e cognome <span className="text-teal">*</span>
          </label>
          <input
            id="name"
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full bg-code-bg border border-sand/10 rounded-card px-4 py-3 text-sand placeholder-sand/30 focus:outline-none focus:border-teal/50 transition-colors"
            placeholder="Mario Rossi"
          />
        </div>

        <div>
          <label className="block text-sm text-sand/70 mb-1.5" htmlFor="email">
            Email <span className="text-teal">*</span>
          </label>
          <input
            id="email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full bg-code-bg border border-sand/10 rounded-card px-4 py-3 text-sand placeholder-sand/30 focus:outline-none focus:border-teal/50 transition-colors"
            placeholder="mario@esempio.it"
          />
        </div>

        <div>
          <label className="block text-sm text-sand/70 mb-1.5" htmlFor="type">
            Tipo di richiesta <span className="text-teal">*</span>
          </label>
          <select
            id="type"
            required
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="w-full bg-code-bg border border-sand/10 rounded-card px-4 py-3 text-sand focus:outline-none focus:border-teal/50 transition-colors"
          >
            {contactTypes.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-sand/70 mb-1.5" htmlFor="message">
            Messaggio <span className="text-teal">*</span>
          </label>
          <textarea
            id="message"
            required
            rows={6}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            className="w-full bg-code-bg border border-sand/10 rounded-card px-4 py-3 text-sand placeholder-sand/30 focus:outline-none focus:border-teal/50 transition-colors resize-none"
            placeholder="Descrivi la tua richiesta..."
          />
        </div>

        {error && (
          <p className="text-sm text-terracotta">{error}</p>
        )}

        <button
          type="submit"
          disabled={sending}
          className="w-full flex items-center justify-center gap-2 bg-teal text-primary font-medium py-3 rounded-card hover:bg-teal/90 transition-colors disabled:opacity-50"
        >
          <Send size={16} />
          {sending ? "Invio in corso..." : "Invia messaggio"}
        </button>
      </form>
    </main>
  );
}
