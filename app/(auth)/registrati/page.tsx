"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { registerAction } from "./actions";

export default function RegistratiPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/impara";
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    formData.set("callbackUrl", callbackUrl);

    const result = await registerAction(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
    // If no error, server action redirects
  }

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Image
            src="/images/logo_pyarchinit_official.png"
            alt="pyArchInit"
            width={56}
            height={56}
            className="mx-auto mb-4"
          />
          <h1 className="text-2xl font-mono text-teal">Crea un account</h1>
          <p className="text-sand/40 text-sm mt-1">
            Unisciti alla community di pyArchInit
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-code-bg rounded-card p-6 space-y-4">
          <div>
            <label className="block text-xs text-sand/50 mb-1.5">Nome</label>
            <input
              name="nome"
              type="text"
              required
              autoComplete="name"
              className="w-full bg-primary border border-ochre/30 rounded-lg px-4 py-3 text-sand placeholder:text-ochre/40 focus:border-teal focus:outline-none"
              placeholder="Il tuo nome"
            />
          </div>
          <div>
            <label className="block text-xs text-sand/50 mb-1.5">Email</label>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full bg-primary border border-ochre/30 rounded-lg px-4 py-3 text-sand placeholder:text-ochre/40 focus:border-teal focus:outline-none"
              placeholder="tua@email.com"
            />
          </div>
          <div>
            <label className="block text-xs text-sand/50 mb-1.5">Password</label>
            <input
              name="password"
              type="password"
              required
              autoComplete="new-password"
              minLength={8}
              className="w-full bg-primary border border-ochre/30 rounded-lg px-4 py-3 text-sand placeholder:text-ochre/40 focus:border-teal focus:outline-none"
              placeholder="Almeno 8 caratteri"
            />
          </div>
          <div>
            <label className="block text-xs text-sand/50 mb-1.5">Conferma Password</label>
            <input
              name="confermaPassword"
              type="password"
              required
              autoComplete="new-password"
              minLength={8}
              className="w-full bg-primary border border-ochre/30 rounded-lg px-4 py-3 text-sand placeholder:text-ochre/40 focus:border-teal focus:outline-none"
              placeholder="Ripeti la password"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal text-primary font-mono font-bold py-3 rounded-full hover:bg-teal/90 transition disabled:opacity-50"
          >
            {loading ? "Registrazione..." : "Registrati"}
          </button>
        </form>

        <div className="text-center mt-6 space-y-2">
          <p className="text-sand/40 text-sm">
            Hai già un account?{" "}
            <Link href="/login" className="text-teal hover:text-teal/80 transition">
              Accedi
            </Link>
          </p>
          <Link href="/impara" className="block text-sand/30 text-xs hover:text-sand/50 transition">
            ← Torna ai corsi
          </Link>
        </div>
      </div>
    </div>
  );
}
