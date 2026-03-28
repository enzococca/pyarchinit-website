"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Send, ArrowLeft, Eye, EyeOff } from "lucide-react";

interface Campaign {
  id: string;
  subject: string;
  content: string;
  status: "DRAFT" | "SENDING" | "SENT";
  sentAt: string | null;
}

export default function AdminNewsletterCampaignPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [preview, setPreview] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  const loadCampaign = useCallback(async () => {
    const res = await fetch(`/api/newsletter/campaigns/${id}`);
    if (res.ok) {
      const data = await res.json();
      setCampaign(data);
      setSubject(data.subject);
      setContent(data.content);
    }
  }, [id]);

  useEffect(() => { loadCampaign(); }, [loadCampaign]);

  const save = async () => {
    setSaving(true);
    setMessage("");
    const res = await fetch(`/api/newsletter/campaigns/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, content }),
    });
    if (res.ok) {
      setMessageType("success");
      setMessage("Salvato!");
      const data = await res.json();
      setCampaign(data);
    } else {
      setMessageType("error");
      setMessage("Errore nel salvataggio.");
    }
    setSaving(false);
  };

  const send = async () => {
    if (!confirm(`Inviare la campagna "${subject}" a tutti gli iscritti confermati?`)) return;

    setSending(true);
    setMessage("");

    // Save first
    await fetch(`/api/newsletter/campaigns/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, content }),
    });

    const res = await fetch("/api/newsletter/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campaignId: id }),
    });

    if (res.ok) {
      const data = await res.json();
      setMessageType("success");
      setMessage(`Inviata a ${data.sent} iscritti.`);
      await loadCampaign();
    } else {
      const data = await res.json();
      setMessageType("error");
      setMessage(data.error ?? "Errore durante l'invio.");
    }
    setSending(false);
  };

  if (!campaign) {
    return (
      <div className="text-center py-16 text-sand/40">
        <p>Caricamento...</p>
      </div>
    );
  }

  const isSent = campaign.status === "SENT";

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.push("/admin/newsletter")}
          className="text-sand/40 hover:text-sand transition"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-mono text-teal flex-1">Campagna Newsletter</h1>
        {isSent && (
          <span className="text-xs bg-teal/10 text-teal px-3 py-1 rounded-full">
            Inviata il {campaign.sentAt ? new Date(campaign.sentAt).toLocaleDateString("it-IT") : "—"}
          </span>
        )}
      </div>

      {message && (
        <div
          className={`mb-4 px-4 py-3 rounded-card text-sm ${
            messageType === "success"
              ? "bg-teal/10 text-teal border border-teal/20"
              : "bg-terracotta/10 text-terracotta border border-terracotta/20"
          }`}
        >
          {message}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-xs text-sand/50 mb-1.5 font-mono uppercase tracking-wide">
            Oggetto
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            disabled={isSent}
            placeholder="Oggetto dell'email..."
            className="w-full bg-code-bg border border-sand/20 rounded-card px-4 py-2.5 text-sand text-sm focus:outline-none focus:border-teal/50 transition disabled:opacity-50"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs text-sand/50 font-mono uppercase tracking-wide">
              Contenuto (HTML)
            </label>
            <button
              onClick={() => setPreview(!preview)}
              className="flex items-center gap-1.5 text-xs text-sand/40 hover:text-sand transition"
            >
              {preview ? <EyeOff size={13} /> : <Eye size={13} />}
              {preview ? "Modifica" : "Anteprima"}
            </button>
          </div>

          {preview ? (
            <div
              className="bg-code-bg border border-sand/20 rounded-card p-4 min-h-[300px] text-sand text-sm prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          ) : (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isSent}
              rows={16}
              placeholder="<p>Contenuto della newsletter...</p>"
              className="w-full bg-code-bg border border-sand/20 rounded-card px-4 py-3 text-sand text-sm font-mono focus:outline-none focus:border-teal/50 transition resize-y disabled:opacity-50"
            />
          )}
        </div>

        {!isSent && (
          <div className="flex gap-3 justify-end">
            <button
              onClick={save}
              disabled={saving}
              className="px-5 py-2 rounded-card border border-sand/20 text-sand text-sm hover:border-sand/40 transition disabled:opacity-50"
            >
              {saving ? "Salvataggio..." : "Salva bozza"}
            </button>
            <button
              onClick={send}
              disabled={sending || saving}
              className="flex items-center gap-2 bg-teal text-primary px-5 py-2 rounded-card text-sm font-medium hover:bg-teal/90 transition disabled:opacity-50"
            >
              <Send size={15} />
              {sending ? "Invio in corso..." : "Invia campagna"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
