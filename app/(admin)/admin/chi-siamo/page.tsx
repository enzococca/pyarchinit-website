"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { Save, CheckCircle, Users } from "lucide-react";

interface ChiSiamoSettings {
  chisiamo_luca_bio: string;
  chisiamo_enzo_bio: string;
  chisiamo_description: string;
}

const defaults: ChiSiamoSettings = {
  chisiamo_luca_bio:
    "Laureato in Scienze Archeologiche con indirizzo medievale presso l'Università di Siena. Dal 2005 gestisce lo sviluppo di pyArchInit, il plugin open-source per QGIS dedicato alla gestione dei dati di scavo su piattaforma GIS. Esperto in rilievo GNSS, Structure From Motion, QGIS e modellazione 3D con Blender. Dirige il programma di formazione Flyover Academy.",
  chisiamo_enzo_bio:
    "Specializzato in informatica applicata all'archeologia e alla preistoria. Dottore di ricerca in Scienze e Tecnologie per l'Archeologia e i Beni Culturali. Sviluppa soluzioni software per la documentazione e gestione dei dati archeologici. Attivo in progetti di ricerca in Italia, Africa, Asia, Medio Oriente e Indonesia.",
  chisiamo_description:
    "pyArchInit è un progetto open source sviluppato e mantenuto da Luca Mandolesi ed Enzo Cocca. Il progetto combina competenze archeologiche con tecnologie all'avanguardia: GIS, droni, fotogrammetria, modellazione 3D e intelligenza artificiale applicata ai beni culturali.",
};

export default function AdminChiSiamoPage() {
  const [settings, setSettings] = useState<ChiSiamoSettings>(defaults);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data: Partial<ChiSiamoSettings>) => {
        setSettings({
          chisiamo_luca_bio: data.chisiamo_luca_bio || defaults.chisiamo_luca_bio,
          chisiamo_enzo_bio: data.chisiamo_enzo_bio || defaults.chisiamo_enzo_bio,
          chisiamo_description: data.chisiamo_description || defaults.chisiamo_description,
        });
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
        <div className="flex items-center gap-3">
          <Users size={20} className="text-teal" />
          <h1 className="text-2xl font-mono text-teal">Chi siamo</h1>
        </div>
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

      <div className="space-y-6">
        {/* Luca bio */}
        <div className="bg-code-bg rounded-card border border-ochre/10 p-6">
          <h2 className="text-sm font-mono text-teal mb-4">Luca Mandolesi — Bio</h2>
          <textarea
            value={settings.chisiamo_luca_bio}
            onChange={(e) => setSettings((prev) => ({ ...prev, chisiamo_luca_bio: e.target.value }))}
            rows={6}
            className="w-full bg-primary/50 border border-ochre/20 rounded-lg px-3 py-2 text-sm text-sand placeholder-sand/30 focus:outline-none focus:border-teal/50 resize-y"
          />
        </div>

        {/* Enzo bio */}
        <div className="bg-code-bg rounded-card border border-ochre/10 p-6">
          <h2 className="text-sm font-mono text-teal mb-4">Enzo Cocca — Bio</h2>
          <textarea
            value={settings.chisiamo_enzo_bio}
            onChange={(e) => setSettings((prev) => ({ ...prev, chisiamo_enzo_bio: e.target.value }))}
            rows={6}
            className="w-full bg-primary/50 border border-ochre/20 rounded-lg px-3 py-2 text-sm text-sand placeholder-sand/30 focus:outline-none focus:border-teal/50 resize-y"
          />
        </div>

        {/* Project description */}
        <div className="bg-code-bg rounded-card border border-ochre/10 p-6">
          <h2 className="text-sm font-mono text-teal mb-4">Descrizione progetto</h2>
          <p className="text-xs text-sand/40 mb-3">
            Testo visualizzato nella sezione centrale della pagina &quot;Chi siamo&quot;.
          </p>
          <textarea
            value={settings.chisiamo_description}
            onChange={(e) => setSettings((prev) => ({ ...prev, chisiamo_description: e.target.value }))}
            rows={5}
            className="w-full bg-primary/50 border border-ochre/20 rounded-lg px-3 py-2 text-sm text-sand placeholder-sand/30 focus:outline-none focus:border-teal/50 resize-y"
          />
        </div>
      </div>
    </div>
  );
}
