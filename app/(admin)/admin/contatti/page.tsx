"use client";

import { useState, useEffect, useCallback } from "react";
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

const statusLabel: Record<Contact["status"], string> = {
  NEW: "Nuovo",
  READ: "Letto",
  REPLIED: "Risposto",
};

const statusClass: Record<Contact["status"], string> = {
  NEW: "bg-terracotta/10 text-terracotta",
  READ: "bg-ochre/10 text-ochre",
  REPLIED: "bg-teal/10 text-teal",
};

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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-mono text-teal">Contatti</h1>
        <span className="text-xs text-sand/40">{contacts.length} messaggi</span>
      </div>

      {contacts.length === 0 ? (
        <div className="text-center py-16 text-sand/40">
          <Mail size={48} className="mx-auto mb-4 opacity-30" />
          <p>Nessun messaggio ricevuto.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className="bg-code-bg rounded-card border border-ochre/10 p-4"
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <p className="text-sm font-medium text-sand">{contact.name}</p>
                  <p className="text-xs text-sand/50">{contact.email}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-sand/30">
                    {new Date(contact.createdAt).toLocaleDateString("it-IT")}
                  </span>
                  <select
                    value={contact.status}
                    onChange={(e) => updateStatus(contact.id, e.target.value as Contact["status"])}
                    className={`text-xs px-2 py-0.5 rounded-full border-0 focus:outline-none focus:ring-1 focus:ring-teal/50 cursor-pointer ${statusClass[contact.status]}`}
                  >
                    <option value="NEW">Nuovo</option>
                    <option value="READ">Letto</option>
                    <option value="REPLIED">Risposto</option>
                  </select>
                </div>
              </div>
              {contact.type && (
                <p className="text-xs text-ochre/70 mb-1">
                  Tipo: {contact.type}
                </p>
              )}
              <p className="text-sm text-sand/70 whitespace-pre-wrap">{contact.message}</p>

              <div className="mt-3 flex justify-end">
                <a
                  href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
                    contact.email
                  )}&su=${encodeURIComponent(
                    `Re: ${contact.type} — pyArchInit`
                  )}&body=${encodeURIComponent(
                    `Ciao ${contact.name.split(" ")[0]},\n\ngrazie per averci scritto.\n\n\n\n---\nIl tuo messaggio:\n${contact.message}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    if (contact.status !== "REPLIED") updateStatus(contact.id, "REPLIED");
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-mono text-teal border border-teal/30 hover:border-teal/60 hover:bg-teal/5 rounded-full px-3 py-1 transition"
                >
                  <Reply size={13} /> Rispondi su Gmail
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
