"use client";

import { useEffect, useState } from "react";
import { List } from "lucide-react";

interface TocItem {
  id: string;
  text: string;
  level: 2 | 3;
}

interface DocsTocProps {
  items: TocItem[];
}

export function DocsToc({ items }: DocsTocProps) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    if (items.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        rootMargin: "-64px 0px -60% 0px",
        threshold: 0,
      }
    );

    items.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  return (
    <nav className="space-y-1">
      <div className="flex items-center gap-2 mb-3">
        <List size={13} className="text-teal/60" />
        <h4 className="text-xs font-mono text-teal uppercase tracking-widest">
          In questa pagina
        </h4>
      </div>
      <ul className="space-y-0.5">
        {items.map((item) => (
          <li key={item.id} className={item.level === 3 ? "ml-3" : ""}>
            <a
              href={`#${item.id}`}
              className={`block text-xs py-1 transition-colors leading-snug ${
                activeId === item.id
                  ? "text-teal"
                  : "text-sand/40 hover:text-sand/70"
              }`}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
