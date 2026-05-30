"use client";

import { useState } from "react";
import { Bell } from "lucide-react";

export function ForumEmailToggle({ initial }: { initial: boolean }) {
  // initial = forumEmailOptOut. enabled = riceve email = !optOut
  const [enabled, setEnabled] = useState(!initial);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    setLoading(true);
    const next = !enabled;
    const res = await fetch("/api/account/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ forumEmailOptOut: !next }),
    });
    if (res.ok) setEnabled(next);
    setLoading(false);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      className="flex items-center justify-between w-full text-left disabled:opacity-50"
    >
      <span className="flex items-center gap-2 text-sm text-sand/70">
        <Bell size={15} className="text-teal" />
        Ricevi email dal forum
      </span>
      <span
        className={`relative inline-block w-10 h-5 rounded-full transition ${enabled ? "bg-teal" : "bg-sand/20"}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${enabled ? "translate-x-5" : ""}`}
        />
      </span>
    </button>
  );
}
