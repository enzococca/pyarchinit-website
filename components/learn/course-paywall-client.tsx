"use client";

import { useState } from "react";
import { Lock, CreditCard, Loader2, CheckCircle } from "lucide-react";

interface CoursePaywallClientProps {
  courseSlug: string;
  price: number;
  moduleCount: number;
  lessonCount: number;
  labCount: number;
}

export function CoursePaywallClient({
  courseSlug,
  price,
  moduleCount,
  lessonCount,
  labCount,
}: CoursePaywallClientProps) {
  const [loading, setLoading] = useState<"paypal" | "stripe" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePurchase = async (provider: "paypal" | "stripe") => {
    setLoading(provider);
    setError(null);
    try {
      const res = await fetch("/api/learn/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseSlug, provider }),
      });

      const data = (await res.json()) as {
        redirectUrl?: string;
        redirect?: string;
        error?: string;
      };

      if (!res.ok) {
        setError(data.error ?? "Errore durante il pagamento");
        return;
      }

      const url = data.redirectUrl ?? data.redirect;
      if (url) {
        window.location.href = url;
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Errore di rete");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="bg-gradient-to-br from-amber-400/5 to-code-bg border border-amber-400/20 rounded-card p-8 mb-8">
      {/* Lock icon + price */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-full bg-amber-400/10 flex items-center justify-center">
          <Lock size={22} className="text-amber-400" />
        </div>
        <div>
          <h2 className="font-mono font-bold text-sand text-xl">
            Accedi al corso
          </h2>
          <p className="text-sand/50 text-sm mt-0.5">
            Pagamento unico — accesso a vita
          </p>
        </div>
        <div className="ml-auto text-right">
          <div className="text-3xl font-mono font-bold text-amber-400">
            €{price.toFixed(2)}
          </div>
          <div className="text-xs text-sand/30 font-mono">EUR</div>
        </div>
      </div>

      {/* What's included */}
      <div className="bg-sand/5 rounded-lg p-4 mb-6 space-y-2">
        <p className="text-xs font-mono text-sand/40 uppercase tracking-widest mb-3">
          Incluso
        </p>
        <div className="flex items-center gap-2 text-sm text-sand/60">
          <CheckCircle size={14} className="text-teal shrink-0" />
          <span>{moduleCount} moduli di contenuto</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-sand/60">
          <CheckCircle size={14} className="text-teal shrink-0" />
          <span>{lessonCount} lezioni interattive</span>
        </div>
        {labCount > 0 && (
          <div className="flex items-center gap-2 text-sm text-sand/60">
            <CheckCircle size={14} className="text-teal shrink-0" />
            <span>{labCount} laboratori pratici</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm text-sand/60">
          <CheckCircle size={14} className="text-teal shrink-0" />
          <span>Python playground integrato nel browser</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-sand/60">
          <CheckCircle size={14} className="text-teal shrink-0" />
          <span>Accesso a vita + aggiornamenti futuri</span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg px-4 py-3 text-sm font-mono">
          {error}
        </div>
      )}

      {/* Payment buttons */}
      <div className="space-y-3">
        {/* PayPal */}
        <button
          onClick={() => handlePurchase("paypal")}
          disabled={loading !== null}
          className="w-full flex items-center justify-center gap-3 bg-[#0070ba] hover:bg-[#005ea6] text-white font-bold text-sm px-6 py-3.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading === "paypal" ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Collegamento a PayPal...
            </>
          ) : (
            <>
              {/* PayPal-ish icon */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.067 8.478c.492.88.556 2.014.3 3.327-.74 3.806-3.276 5.12-6.514 5.12h-.5a.805.805 0 0 0-.794.68l-.04.22-.63 3.993-.032.17a.804.804 0 0 1-.794.679H7.72a.483.483 0 0 1-.477-.558L7.418 21h1.518l.95-6.02h1.385c4.678 0 7.75-2.697 8.796-7.502zm-2.96-5.09c.762.868.983 1.81.752 3.285-.019.123-.04.247-.063.373C16.96 10.538 14.498 12 11.37 12H9.004a.85.85 0 0 0-.839.718L7.004 19H4.523a.483.483 0 0 1-.477-.557l2.476-15.658A.805.805 0 0 1 7.316 2h5.39c2.25 0 3.91.529 4.401 1.388z"/>
              </svg>
              Paga con PayPal
            </>
          )}
        </button>

        {/* Stripe / Card */}
        <button
          onClick={() => handlePurchase("stripe")}
          disabled={loading !== null}
          className="w-full flex items-center justify-center gap-3 bg-sand/10 hover:bg-sand/15 text-sand border border-sand/20 hover:border-sand/30 font-bold text-sm px-6 py-3.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading === "stripe" ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Collegamento a Stripe...
            </>
          ) : (
            <>
              <CreditCard size={16} />
              Paga con Carta di Credito
            </>
          )}
        </button>
      </div>

      <p className="text-xs text-sand/25 text-center mt-4 font-mono">
        Pagamento sicuro · SSL · Nessun addebito ricorrente
      </p>
    </div>
  );
}
