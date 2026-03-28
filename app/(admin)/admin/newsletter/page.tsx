"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Users, Newspaper, Plus, Mail, CheckCircle, Clock, XCircle } from "lucide-react";

interface Subscriber {
  id: string;
  email: string;
  name: string | null;
  confirmed: boolean;
  createdAt: string;
  unsubscribedAt: string | null;
}

interface Campaign {
  id: string;
  subject: string;
  status: "DRAFT" | "SENDING" | "SENT";
  sentAt: string | null;
  createdAt: string;
}

interface Stats {
  total: number;
  confirmed: number;
  unsubscribed: number;
}

const campaignStatusLabel: Record<Campaign["status"], string> = {
  DRAFT: "Bozza",
  SENDING: "In invio",
  SENT: "Inviata",
};

const campaignStatusClass: Record<Campaign["status"], string> = {
  DRAFT: "bg-ochre/10 text-ochre",
  SENDING: "bg-terracotta/10 text-terracotta",
  SENT: "bg-teal/10 text-teal",
};

export default function AdminNewsletterPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"subscribers" | "campaigns">("subscribers");
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, confirmed: 0, unsubscribed: 0 });
  const [creating, setCreating] = useState(false);

  const loadData = useCallback(async () => {
    const [subsRes, campRes] = await Promise.all([
      fetch("/api/newsletter"),
      fetch("/api/newsletter/campaigns"),
    ]);
    if (subsRes.ok) {
      const data = await subsRes.json();
      setSubscribers(data.subscribers);
      setStats(data.stats);
    }
    if (campRes.ok) {
      setCampaigns(await campRes.json());
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const createCampaign = async () => {
    const subject = prompt("Oggetto della campagna:");
    if (!subject) return;

    setCreating(true);
    const res = await fetch("/api/newsletter/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject }),
    });
    if (res.ok) {
      const camp = await res.json();
      router.push(`/admin/newsletter/${camp.id}`);
    }
    setCreating(false);
  };

  function getSubscriberStatus(sub: Subscriber) {
    if (sub.unsubscribedAt) return "unsubscribed";
    if (sub.confirmed) return "confirmed";
    return "pending";
  }

  const statusIcon = {
    confirmed: <CheckCircle size={14} className="text-teal" />,
    pending: <Clock size={14} className="text-ochre" />,
    unsubscribed: <XCircle size={14} className="text-terracotta" />,
  };

  const statusText = {
    confirmed: "Confermato",
    pending: "In attesa",
    unsubscribed: "Disiscritto",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-mono text-teal">Newsletter</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-code-bg rounded-card p-4 border border-ochre/10">
          <p className="text-xs text-sand/40 mb-1">Totale iscritti</p>
          <p className="text-2xl font-mono text-sand">{stats.total}</p>
        </div>
        <div className="bg-code-bg rounded-card p-4 border border-ochre/10">
          <p className="text-xs text-sand/40 mb-1">Confermati</p>
          <p className="text-2xl font-mono text-teal">{stats.confirmed}</p>
        </div>
        <div className="bg-code-bg rounded-card p-4 border border-ochre/10">
          <p className="text-xs text-sand/40 mb-1">Disiscrit</p>
          <p className="text-2xl font-mono text-terracotta">{stats.unsubscribed}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-sand/10">
        <button
          onClick={() => setTab("subscribers")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition border-b-2 -mb-px ${
            tab === "subscribers"
              ? "border-teal text-teal"
              : "border-transparent text-sand/50 hover:text-sand"
          }`}
        >
          <Users size={15} />
          Iscritti
        </button>
        <button
          onClick={() => setTab("campaigns")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition border-b-2 -mb-px ${
            tab === "campaigns"
              ? "border-teal text-teal"
              : "border-transparent text-sand/50 hover:text-sand"
          }`}
        >
          <Newspaper size={15} />
          Campagne
        </button>
      </div>

      {/* Subscribers tab */}
      {tab === "subscribers" && (
        <div>
          {subscribers.length === 0 ? (
            <div className="text-center py-16 text-sand/40">
              <Mail size={48} className="mx-auto mb-4 opacity-30" />
              <p>Nessun iscritto ancora.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {subscribers.map((sub) => {
                const subStatus = getSubscriberStatus(sub);
                return (
                  <div
                    key={sub.id}
                    className="flex items-center gap-4 bg-code-bg rounded-card px-4 py-3 border border-ochre/10"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sand text-sm font-medium">{sub.email}</p>
                      {sub.name && (
                        <p className="text-xs text-sand/40">{sub.name}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {statusIcon[subStatus]}
                      <span className="text-xs text-sand/50">{statusText[subStatus]}</span>
                    </div>
                    <p className="text-xs text-sand/30 shrink-0">
                      {new Date(sub.createdAt).toLocaleDateString("it-IT")}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Campaigns tab */}
      {tab === "campaigns" && (
        <div>
          <div className="flex justify-end mb-4">
            <button
              onClick={createCampaign}
              disabled={creating}
              className="flex items-center gap-2 bg-teal text-primary px-4 py-2 rounded-card text-sm font-medium hover:bg-teal/90 transition disabled:opacity-50"
            >
              <Plus size={16} />
              {creating ? "Creazione..." : "Nuova campagna"}
            </button>
          </div>

          {campaigns.length === 0 ? (
            <div className="text-center py-16 text-sand/40">
              <Newspaper size={48} className="mx-auto mb-4 opacity-30" />
              <p>Nessuna campagna ancora.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {campaigns.map((camp) => (
                <div
                  key={camp.id}
                  className="flex items-center gap-4 bg-code-bg rounded-card px-4 py-3 border border-ochre/10 hover:border-ochre/20 transition cursor-pointer"
                  onClick={() => router.push(`/admin/newsletter/${camp.id}`)}
                >
                  <Newspaper size={16} className="text-teal/40 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sand text-sm font-medium">{camp.subject}</p>
                    {camp.sentAt && (
                      <p className="text-xs text-sand/40">
                        Inviata il {new Date(camp.sentAt).toLocaleDateString("it-IT")}
                      </p>
                    )}
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${campaignStatusClass[camp.status]}`}
                  >
                    {campaignStatusLabel[camp.status]}
                  </span>
                  <p className="text-xs text-sand/30 shrink-0">
                    {new Date(camp.createdAt).toLocaleDateString("it-IT")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
