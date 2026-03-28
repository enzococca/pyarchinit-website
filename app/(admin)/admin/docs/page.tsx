"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, ChevronRight, ChevronDown, FileText, FolderOpen, Save } from "lucide-react";

interface DocPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  order: number;
  sectionId: string;
}

interface DocSection {
  id: string;
  title: string;
  slug: string;
  order: number;
  parentId: string | null;
  pages: DocPage[];
  children: DocSection[];
}

export default function AdminDocsPage() {
  const [sections, setSections] = useState<DocSection[]>([]);
  const [selectedPage, setSelectedPage] = useState<DocPage | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const loadSections = useCallback(async () => {
    const res = await fetch("/api/docs");
    if (res.ok) {
      const data: DocSection[] = await res.json();
      setSections(data);
      // Expand all sections by default
      const ids = new Set<string>();
      const collect = (secs: DocSection[]) => {
        secs.forEach((s) => {
          ids.add(s.id);
          collect(s.children);
        });
      };
      collect(data);
      setExpandedSections(ids);
    }
  }, []);

  useEffect(() => {
    loadSections();
  }, [loadSections]);

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectPage = (page: DocPage) => {
    setSelectedPage(page);
    setEditTitle(page.title);
    setEditContent(page.content);
    setLastSaved(false);
  };

  const savePage = async () => {
    if (!selectedPage) return;
    setSaving(true);
    setLastSaved(false);
    const res = await fetch(`/api/docs/${selectedPage.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: editTitle, content: editContent }),
    });
    if (res.ok) {
      const updated: DocPage = await res.json();
      setSelectedPage(updated);
      setLastSaved(true);
      // Refresh the tree to reflect title changes
      await loadSections();
    }
    setSaving(false);
  };

  const addSection = async () => {
    const title = prompt("Nome della sezione:");
    if (!title) return;
    const res = await fetch("/api/docs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "section", title }),
    });
    if (res.ok) await loadSections();
  };

  const addPage = async (sectionId: string) => {
    const title = prompt("Titolo della pagina:");
    if (!title) return;
    const res = await fetch("/api/docs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "page", title, sectionId }),
    });
    if (res.ok) {
      await loadSections();
    }
  };

  const renderSection = (section: DocSection, depth = 0) => {
    const isExpanded = expandedSections.has(section.id);
    const paddingLeft = depth * 12;

    return (
      <div key={section.id}>
        <div
          className="flex items-center gap-1 group"
          style={{ paddingLeft: `${paddingLeft}px` }}
        >
          <button
            onClick={() => toggleSection(section.id)}
            className="p-0.5 text-sand/30 hover:text-sand transition"
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          <FolderOpen size={14} className="text-ochre/50 shrink-0" />
          <span className="flex-1 text-sm text-sand/70 py-1 truncate">{section.title}</span>
          <button
            onClick={() => addPage(section.id)}
            className="opacity-0 group-hover:opacity-100 transition p-0.5 text-sand/30 hover:text-teal"
            title="Aggiungi pagina"
          >
            <Plus size={13} />
          </button>
        </div>

        {isExpanded && (
          <div>
            {section.pages.map((page) => (
              <button
                key={page.id}
                onClick={() => selectPage(page)}
                className={`w-full flex items-center gap-2 py-1 px-2 text-sm rounded transition ${
                  selectedPage?.id === page.id
                    ? "bg-teal/10 text-teal"
                    : "text-sand/50 hover:text-sand hover:bg-sand/5"
                }`}
                style={{ paddingLeft: `${paddingLeft + 24}px` }}
              >
                <FileText size={13} className="shrink-0" />
                <span className="truncate">{page.title}</span>
              </button>
            ))}
            {section.children.map((child) => renderSection(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-120px)]">
      {/* Left: Tree */}
      <div className="w-64 shrink-0 bg-code-bg rounded-card border border-ochre/10 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 border-b border-ochre/10">
          <span className="text-xs font-mono text-sand/50">Struttura</span>
          <button
            onClick={addSection}
            className="flex items-center gap-1 text-xs text-teal hover:text-teal/80 transition"
          >
            <Plus size={13} />
            Sezione
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {sections.length === 0 ? (
            <p className="text-xs text-sand/30 text-center py-8 px-2">
              Nessuna sezione. Crea la prima!
            </p>
          ) : (
            sections.map((section) => renderSection(section))
          )}
        </div>
      </div>

      {/* Right: Editor */}
      <div className="flex-1 bg-code-bg rounded-card border border-ochre/10 flex flex-col overflow-hidden">
        {selectedPage ? (
          <>
            <div className="flex items-center justify-between px-4 py-2 border-b border-ochre/10">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => {
                  setEditTitle(e.target.value);
                  setLastSaved(false);
                }}
                className="flex-1 bg-transparent text-sm font-medium text-sand focus:outline-none placeholder-sand/30 mr-4"
                placeholder="Titolo pagina"
              />
              <div className="flex items-center gap-3">
                {lastSaved && (
                  <span className="text-xs text-teal/60">Salvato</span>
                )}
                <button
                  onClick={savePage}
                  disabled={saving}
                  className="flex items-center gap-2 bg-teal text-primary px-3 py-1.5 rounded-card text-xs font-medium hover:bg-teal/90 transition disabled:opacity-50"
                >
                  <Save size={13} />
                  {saving ? "Salvataggio..." : "Salva"}
                </button>
              </div>
            </div>

            <textarea
              value={editContent}
              onChange={(e) => {
                setEditContent(e.target.value);
                setLastSaved(false);
              }}
              className="flex-1 bg-transparent text-sm text-sand/80 font-mono p-4 resize-none focus:outline-none placeholder-sand/30 leading-relaxed"
              placeholder="Scrivi il contenuto in markdown..."
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-sand/30">
            <div className="text-center">
              <FileText size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Seleziona una pagina per modificarla</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
