"use client";

import { Plus, Trash2 } from "lucide-react";
import { Block } from "@/lib/blocks";

interface CtaButton {
  label: string;
  href: string;
  variant: "primary" | "outline";
}

interface CtaBlockProps {
  block: Block;
  onChange: (data: Record<string, any>) => void;
}

export function CtaBlock({ block, onChange }: CtaBlockProps) {
  const buttons: CtaButton[] = block.data.buttons || [];

  const update = (key: string, value: string) =>
    onChange({ ...block.data, [key]: value });

  const addButton = () => {
    onChange({
      ...block.data,
      buttons: [...buttons, { label: "", href: "", variant: "primary" }],
    });
  };

  const updateButton = (index: number, field: keyof CtaButton, value: string) => {
    const updated = buttons.map((b, i) =>
      i === index ? { ...b, [field]: value } : b
    );
    onChange({ ...block.data, buttons: updated });
  };

  const removeButton = (index: number) => {
    onChange({ ...block.data, buttons: buttons.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={block.data.title || ""}
        onChange={(e) => update("title", e.target.value)}
        placeholder="Titolo"
        className="w-full bg-primary/50 border border-ochre/20 rounded-lg px-3 py-2 text-sm text-sand placeholder-sand/30 focus:outline-none focus:border-teal/50"
      />
      <textarea
        value={block.data.description || ""}
        onChange={(e) => update("description", e.target.value)}
        placeholder="Descrizione"
        rows={2}
        className="w-full bg-primary/50 border border-ochre/20 rounded-lg px-3 py-2 text-sm text-sand placeholder-sand/30 focus:outline-none focus:border-teal/50 resize-none"
      />

      <div className="space-y-2">
        <p className="text-xs text-sand/50">Bottoni</p>
        {buttons.map((btn, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input
              type="text"
              value={btn.label}
              onChange={(e) => updateButton(i, "label", e.target.value)}
              placeholder="Testo bottone"
              className="flex-1 bg-primary/50 border border-ochre/20 rounded-lg px-3 py-2 text-sm text-sand placeholder-sand/30 focus:outline-none focus:border-teal/50"
            />
            <input
              type="text"
              value={btn.href}
              onChange={(e) => updateButton(i, "href", e.target.value)}
              placeholder="Link"
              className="flex-1 bg-primary/50 border border-ochre/20 rounded-lg px-3 py-2 text-sm text-sand placeholder-sand/30 focus:outline-none focus:border-teal/50"
            />
            <select
              value={btn.variant}
              onChange={(e) => updateButton(i, "variant", e.target.value)}
              className="bg-primary/50 border border-ochre/20 rounded-lg px-2 py-2 text-sm text-sand focus:outline-none focus:border-teal/50"
            >
              <option value="primary">Primary</option>
              <option value="outline">Outline</option>
            </select>
            <button
              type="button"
              onClick={() => removeButton(i)}
              className="text-terracotta/60 hover:text-terracotta transition"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addButton}
          className="flex items-center gap-1 text-xs text-teal hover:text-teal/80 transition"
        >
          <Plus size={14} /> Aggiungi bottone
        </button>
      </div>
    </div>
  );
}
