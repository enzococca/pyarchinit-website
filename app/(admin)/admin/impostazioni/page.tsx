"use client";

import { useState, useEffect } from "react";
import { Save, CheckCircle } from "lucide-react";

interface Settings {
  site_name: string;
  site_description: string;
  social_github: string;
  social_facebook: string;
  social_twitter: string;
  admin_email: string;
  stripe_publishable_key: string;
  paypal_client_id: string;
}

const defaultSettings: Settings = {
  site_name: "",
  site_description: "",
  social_github: "",
  social_facebook: "",
  social_twitter: "",
  admin_email: "",
  stripe_publishable_key: "",
  paypal_client_id: "",
};

const fields: { key: keyof Settings; label: string; type?: string; placeholder?: string }[] = [
  { key: "site_name", label: "Nome del sito", placeholder: "es. PyArchInit" },
  { key: "site_description", label: "Descrizione del sito", placeholder: "Breve descrizione..." },
  { key: "admin_email", label: "Email amministratore", type: "email", placeholder: "admin@esempio.com" },
  { key: "social_github", label: "GitHub URL", placeholder: "https://github.com/..." },
  { key: "social_facebook", label: "Facebook URL", placeholder: "https://facebook.com/..." },
  { key: "social_twitter", label: "Twitter/X URL", placeholder: "https://twitter.com/..." },
  { key: "stripe_publishable_key", label: "Stripe Publishable Key", placeholder: "pk_live_..." },
  { key: "paypal_client_id", label: "PayPal Client ID", placeholder: "AX..." },
];

export default function AdminImpostazioniPage() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data: Partial<Settings>) => {
        setSettings({ ...defaultSettings, ...data });
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setSaveError(false);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setSaveError(true);
      }
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-mono text-teal">Impostazioni</h1>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="text-xs text-teal flex items-center gap-1">
              <CheckCircle size={12} />
              Salvato
            </span>
          )}
          {saveError && (
            <span className="text-xs text-terracotta">Errore nel salvataggio</span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-teal text-primary px-4 py-2 rounded-card text-sm font-medium hover:bg-teal/90 transition disabled:opacity-50"
          >
            <Save size={15} />
            {saving ? "Salvataggio..." : "Salva"}
          </button>
        </div>
      </div>

      <div className="bg-code-bg rounded-card border border-ochre/10 p-6 space-y-4">
        {fields.map((field) => (
          <div key={field.key}>
            <label className="block text-xs text-sand/50 mb-1">{field.label}</label>
            <input
              type={field.type ?? "text"}
              value={settings[field.key]}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, [field.key]: e.target.value }))
              }
              placeholder={field.placeholder}
              className="w-full bg-primary/50 border border-ochre/20 rounded-lg px-3 py-2 text-sm text-sand placeholder-sand/30 focus:outline-none focus:border-teal/50"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
