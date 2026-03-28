"use client";

import { useState } from "react";
import { ShoppingCart, LogIn } from "lucide-react";

interface CourseEnrollButtonProps {
  courseId: string;
  price: number;
}

export function CourseEnrollButton({ courseId, price }: CourseEnrollButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleEnroll = async () => {
    setLoading(true);
    const form = new FormData();
    form.append("courseId", courseId);

    const res = await fetch("/api/checkout", {
      method: "POST",
      body: form,
    });

    if (res.redirected) {
      window.location.href = res.url;
    } else if (res.ok) {
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        window.location.href = "/dashboard";
      }
    } else if (res.status === 401) {
      window.location.href = "/login";
    } else {
      setLoading(false);
      alert("Errore durante l'iscrizione. Riprova.");
    }
  };

  return (
    <button
      onClick={handleEnroll}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 bg-teal text-primary px-6 py-3 rounded-card font-medium hover:bg-teal/90 transition disabled:opacity-50"
    >
      {price === 0 ? (
        <>
          <LogIn size={18} />
          {loading ? "Iscrizione..." : "Iscriviti gratuitamente"}
        </>
      ) : (
        <>
          <ShoppingCart size={18} />
          {loading ? "Reindirizzamento..." : "Acquista il corso"}
        </>
      )}
    </button>
  );
}
