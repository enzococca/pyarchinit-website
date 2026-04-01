"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { loginStudentAction } from "./actions";

export default function LoginPage() {
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

    const result = await loginStudentAction(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
    // If no error, the server action redirects
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
          <h1 className="text-2xl font-mono text-teal">Accedi</h1>
          <p className="text-sand/40 text-sm mt-1">
            Inserisci le tue credenziali per accedere ai corsi
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-code-bg rounded-card p-6 space-y-4">
          <div>
            <label className="block text-xs text-sand/50 mb-1.5">Username o Email</label>
            <input
              name="email"
              type="text"
              required
              autoComplete="username"
              className="w-full bg-primary border border-ochre/30 rounded-lg px-4 py-3 text-sand placeholder:text-ochre/40 focus:border-teal focus:outline-none"
              placeholder="username"
            />
          </div>
          <div>
            <label className="block text-xs text-sand/50 mb-1.5">Password</label>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full bg-primary border border-ochre/30 rounded-lg px-4 py-3 text-sand placeholder:text-ochre/40 focus:border-teal focus:outline-none"
              placeholder="password"
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
            {loading ? "Accesso..." : "Accedi"}
          </button>
        </form>

        <div className="text-center mt-6">
          <Link href="/impara" className="text-sand/30 text-xs hover:text-sand/50 transition">
            ← Torna ai corsi
          </Link>
        </div>
      </div>
    </div>
  );
}
