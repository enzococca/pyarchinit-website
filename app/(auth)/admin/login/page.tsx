"use client";

import { useState } from "react";
import { loginAction } from "./actions";

export default function AdminLogin() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    const result = await loginAction(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center">
      <div className="bg-code-bg rounded-card p-8 w-full max-w-sm">
        <h1 className="text-2xl font-mono text-teal mb-6 text-center">pyArchInit Admin</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            className="w-full bg-primary border border-ochre/30 rounded-lg px-4 py-3 text-sand placeholder:text-ochre/50 focus:border-teal focus:outline-none"
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            required
            className="w-full bg-primary border border-ochre/30 rounded-lg px-4 py-3 text-sand placeholder:text-ochre/50 focus:border-teal focus:outline-none"
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal text-primary font-mono font-bold py-3 rounded-full hover:bg-teal/90 transition disabled:opacity-50"
          >
            {loading ? "Accesso..." : "Accedi"}
          </button>
        </form>
      </div>
    </div>
  );
}
