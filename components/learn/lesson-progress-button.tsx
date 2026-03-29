"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle } from "lucide-react";

interface LessonProgressButtonProps {
  lessonId: string;
  isCompleted: boolean;
  isLoggedIn: boolean;
}

export function LessonProgressButton({
  lessonId,
  isCompleted,
  isLoggedIn,
}: LessonProgressButtonProps) {
  const [completed, setCompleted] = useState(isCompleted);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  if (!isLoggedIn) {
    return (
      <div className="flex items-center gap-3 p-4 bg-code-bg border border-sand/10 rounded-card">
        <Circle size={18} className="text-sand/30 shrink-0" />
        <p className="text-sm text-sand/40">
          <a href="/login" className="text-teal hover:underline">
            Accedi
          </a>{" "}
          per tracciare i tuoi progressi
        </p>
      </div>
    );
  }

  const handleToggle = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/learn/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, completed: !completed }),
      });
      if (res.ok) {
        setCompleted((v) => !v);
        router.refresh();
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`flex items-center gap-3 w-full p-4 rounded-card border transition-all ${
        completed
          ? "bg-teal/10 border-teal/30 text-teal hover:bg-teal/5"
          : "bg-code-bg border-sand/10 text-sand/60 hover:border-teal/20 hover:text-sand"
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {loading ? (
        <span className="animate-spin inline-block w-4 h-4 border-2 border-current/30 border-t-current rounded-full shrink-0" />
      ) : completed ? (
        <CheckCircle2 size={18} className="shrink-0" />
      ) : (
        <Circle size={18} className="shrink-0 opacity-40" />
      )}
      <span className="text-sm font-mono">
        {completed ? "Lezione completata" : "Segna come completata"}
      </span>
    </button>
  );
}
