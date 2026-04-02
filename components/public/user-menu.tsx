"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronDown, User, BookOpen, LogOut } from "lucide-react";

interface UserInfo {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
}

export function UserMenu() {
  const [user, setUser] = useState<UserInfo | null | undefined>(undefined);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => setUser(data))
      .catch(() => setUser(null));
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Loading state — render nothing to avoid layout shift
  if (user === undefined) return null;

  // Not logged in
  if (!user) {
    return (
      <Link
        href="/login"
        className="hidden md:inline-flex items-center px-3 py-1.5 rounded-card text-xs font-mono text-sand/60 border border-sand/15 hover:border-teal/30 hover:text-teal transition-colors"
      >
        Login
      </Link>
    );
  }

  // Logged in
  const initial = (user.name || user.email || "U").charAt(0).toUpperCase();

  return (
    <div className="relative hidden md:block" ref={dropdownRef}>
      <button
        onClick={() => setDropdownOpen((prev) => !prev)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-card text-xs font-mono text-sand/70 border border-sand/15 hover:border-teal/30 hover:text-teal transition-colors"
      >
        <span className="w-5 h-5 rounded-full bg-teal text-primary flex items-center justify-center text-xs font-bold shrink-0">
          {initial}
        </span>
        <span className="max-w-[100px] truncate">{user.name || user.email}</span>
        <ChevronDown size={12} className={`transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-code-bg border border-sand/15 rounded-card shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-sand/10">
            <p className="text-xs font-mono text-sand/50 truncate">{user.email}</p>
          </div>
          <div className="py-1">
            <Link
              href="/account"
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-sand/70 hover:text-sand hover:bg-sand/5 transition-colors"
              onClick={() => setDropdownOpen(false)}
            >
              <User size={14} />
              Il mio account
            </Link>
            <Link
              href="/account/corsi"
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-sand/70 hover:text-sand hover:bg-sand/5 transition-colors"
              onClick={() => setDropdownOpen(false)}
            >
              <BookOpen size={14} />
              I miei corsi
            </Link>
          </div>
          <div className="border-t border-sand/10 py-1">
            <button
              onClick={async () => {
                setDropdownOpen(false);
                await fetch("/api/auth/signout", { method: "POST" });
                window.location.href = "/";
              }}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-sand/50 hover:text-red-400 hover:bg-red-400/5 transition-colors"
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
