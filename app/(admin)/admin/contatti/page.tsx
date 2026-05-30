"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Mail, Reply } from "lucide-react";

interface Contact {
  id: string;
  name: string;
  email: string;
  type: string;
  message: string;
  status: "NEW" | "READ" | "REPLIED";
  createdAt: string;
}

interface Group {
  key: string;
  name: string;
  email: string;
  messages: Contact[]; // dal più vecchio al più recente
  lastDate: string;
  hasNew: boolean;
}

const statusClass: Record<Contact["status"], string> = {
  NEW: "bg-terracotta/10 text-terracotta",
  READ: "bg-ochre/10 text-ochre",
  REPLIED: "bg-teal/10 text-teal",
};

// Apre la composizione di una nuova mail in Gmail (nel browser), precompilata.
function gmailComposeUrl(c: Contact): string {
  const su = `Re: ${c.type} — pyArchInit`;
  const body = `Ciao ${c.name.split(" ")[0]},\n\ngrazie per averci scritto.\n\n\n\n---\nIl tuo messaggio:\n${c.message}`;
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
    c.email
  )}&su=${encodeURIComponent(su)}&body=${encodeURIComponent(body)}`;
}

// Apre Gmail con la ricerca dell'intera conversazione con quella persona
// (messaggi ricevuti + tue risposte).
function gmailConversationUrl(email: string): string {
  return `https://mail.google.com/mail/u/0/#search/${encodeURIComponent(
    `from:${email} OR to:${email}`
  )}`;
}

export default function AdminContattiPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);

  const loadContacts = useCallback(async () => {
    const res = await fetch("/api/contacts");
    if (res.ok) setContacts(await res.json());
  }, []);

  useEffect(() => { loadContacts(); }, [loadContacts]);

  const updateStatus = async (id: string, status: Contact["status"]) => {
    const res = await fetch(`/api/contacts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setContacts((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status } : c))
      );
    }
  };

  // Raggruppa i messaggi per persona (chiave = email), ordinando le
  // conversazioni per attività più recente e i messaggi in ordine cronologico.
  const groups = useMemo<Group[]>(() => {
    const map = new Map<string, Contact[]>();
    for (const c of contacts) {
      const key = c.email.trim().toLowerCase();
      const arr = map.get(key);
      if (arr) arr.push(c);
      else map.set(key, [c]);
    }

    const result: Group[] = [];
    for (const [key, msgs] of map) {
      const sorted = [...msgs].sort(
        (a, b) => +new Date(a.createdAt) - +new Date(b.createdAt)
      );
      const latest = sorted[sorted.length - 1];
      result.push({
        key,
        name: latest.name,
        email: latest.email,
        messages: sorted,
        lastDate: latest.createdAt,
        hasNew: sorted.some((m) => m.status === "NEW"),
      });
    }
    result.sort((a, b) => +new Date(b.lastDate) - +new Date(a.lastDate));
    return result;
  }, [contacts]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-mono text-teal">Contatti</h1>
        <span className="text-xs text-sand/40">
          {groups.length} {groups.length === 1 ? "contatto" : "contatti"} ·{" "}
          {contacts.length} messaggi
        </span>
      </div>

      {contacts.length === 0 ? (
        <div className="text-center py-16 text-sand/40">
          <Mail size={48} className="mx-auto mb-4 opacity-30" />
          <p>Nessun messaggio ricevuto.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {groups.map((group) => (
            <div
              key={group.key}
              className="bg-code-bg rounded-card border border-ochre/10 overflow-hidden"
            >
              {/* Intestazione persona */}
              <div className="flex items-start justify-between gap-4 px-4 py-3 border-b border-ochre/10 bg-primary/20">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-sand flex items-center gap-2">
                    {group.name}
                    {group.hasNew && (
                      <span
                        className="w-2 h-2 rounded-full bg-terracotta shrink-0"
                        title="Contiene messaggi nuovi"
                      />
                    )}
                  </p>
                  <p className="text-xs text-sand/50 truncate">{group.email}</p>
                  <p className="text-[11px] text-sand/30 mt-0.5">
                    {group.messages.length}{" "}
                    {group.messages.length === 1 ? "messaggio" : "messaggi"} ·
                    ultimo {new Date(group.lastDate).toLocaleDateString("it-IT")}
                  </p>
                </div>
                <a
                  href={gmailConversationUrl(group.email)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-mono text-teal border border-teal/30 hover:border-teal/60 hover:bg-teal/5 rounded-full px-3 py-1 transition shrink-0"
                >
                  <Mail size={13} /> Apri in Gmail
                </a>
              </div>

              {/* Messaggi: dal più vecchio al più recente */}
              <div className="divide-y divide-ochre/5">
                {group.messages.map((contact) => (
                  <div key={contact.id} className="p-4">
                    <div className="flex items-center justify-between gap-4 mb-2">
                      <div className="flex items-center gap-2 text-xs">
                        {contact.type && (
                          <span className="text-ochre/70">{contact.type}</span>
                        )}
                        <span className="text-sand/30">
                          {new Date(contact.createdAt).toLocaleDateString("it-IT")}
                        </span>
                      </div>
                      <select
                        value={contact.status}
                        onChange={(e) =>
                          updateStatus(contact.id, e.target.value as Contact["status"])
                        }
                        className={`text-xs px-2 py-0.5 rounded-full border-0 focus:outline-none focus:ring-1 focus:ring-teal/50 cursor-pointer ${statusClass[contact.status]}`}
                      >
                        <option value="NEW">Nuovo</option>
                        <option value="READ">Letto</option>
                        <option value="REPLIED">Risposto</option>
                      </select>
                    </div>
                    <p className="text-sm text-sand/70 whitespace-pre-wrap">
                      {contact.message}
                    </p>
                    <div className="mt-3 flex justify-end">
                      <a
                        href={gmailComposeUrl(contact)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => {
                          if (contact.status !== "REPLIED")
                            updateStatus(contact.id, "REPLIED");
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-mono text-teal border border-teal/30 hover:border-teal/60 hover:bg-teal/5 rounded-full px-3 py-1 transition"
                      >
                        <Reply size={13} /> Rispondi su Gmail
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
