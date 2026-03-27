"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, FileText, GraduationCap, PenSquare,
  ImageIcon, BookOpen, Users, Mail, Settings,
} from "lucide-react";
import { clsx } from "clsx";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/pagine", label: "Pagine", icon: FileText },
  { href: "/admin/corsi", label: "Corsi", icon: GraduationCap },
  { href: "/admin/blog", label: "Blog", icon: PenSquare },
  { href: "/admin/media", label: "Media", icon: ImageIcon },
  { href: "/admin/docs", label: "Documentazione", icon: BookOpen },
  { href: "/admin/studenti", label: "Studenti", icon: Users },
  { href: "/admin/contatti", label: "Contatti", icon: Mail },
  { href: "/admin/impostazioni", label: "Impostazioni", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-code-bg min-h-screen p-4 flex flex-col">
      <Link href="/admin" className="text-teal font-mono text-xl font-bold mb-8 px-3">
        pyArchInit
      </Link>
      <nav className="space-y-1 flex-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition",
                isActive
                  ? "bg-teal/10 text-teal"
                  : "text-sand/70 hover:text-sand hover:bg-white/5"
              )}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
