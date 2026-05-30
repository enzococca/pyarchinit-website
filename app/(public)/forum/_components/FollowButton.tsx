"use client";

import { useState } from "react";
import { Bell, BellOff } from "lucide-react";

interface Props {
  type: "thread" | "category";
  id: string;
  initialFollowing: boolean;
}

export function FollowButton({ type, id, initialFollowing }: Props) {
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    setLoading(true);
    const res = await fetch("/api/forum/subscriptions", {
      method: following ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, id }),
    });
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      setFollowing(Boolean(data.following));
    }
    setLoading(false);
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 text-xs font-mono rounded-full px-3 py-1.5 transition disabled:opacity-50 ${
        following
          ? "bg-teal/10 text-teal border border-teal/40"
          : "text-sand/60 border border-sand/20 hover:border-teal/50 hover:text-teal"
      }`}
    >
      {following ? <BellOff size={13} /> : <Bell size={13} />}
      {following ? "Non seguire" : "Segui"}
    </button>
  );
}
