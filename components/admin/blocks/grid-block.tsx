"use client";

import { Plus, Trash2 } from "lucide-react";
import { Block } from "@/lib/blocks";

interface GridItem {
  title: string;
  description: string;
}

interface GridBlockProps {
  block: Block;
  onChange: (data: Record<string, any>) => void;
}

export function GridBlock({ block, onChange }: GridBlockProps) {
  const items: GridItem[] = block.data.items || [];

  const addItem = () => {
    onChange({
      ...block.data,
      items: [...items, { title: "", description: "" }],
    });
  };

  const updateItem = (index: number, field: keyof GridItem, value: string) => {
    const updated = items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    onChange({ ...block.data, items: updated });
  };

  const removeItem = (index: number) => {
    onChange({ ...block.data, items: items.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <label className="text-xs text-sand/50">Colonne</label>
        <select
          value={block.data.columns || 3}
          onChange={(e) => onChange({ ...block.data, columns: Number(e.target.value) })}
          className="bg-primary/50 border border-ochre/20 rounded-lg px-2 py-1.5 text-sm text-sand focus:outline-none focus:border-teal/50"
        >
          <option value={2}>2</option>
          <option value={3}>3</option>
          <option value={4}>4</option>
        </select>
      </div>

      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2 items-start bg-primary/30 rounded-lg p-3">
            <div className="flex-1 space-y-2">
              <input
                type="text"
                value={item.title}
                onChange={(e) => updateItem(i, "title", e.target.value)}
                placeholder="Titolo elemento"
                className="w-full bg-primary/50 border border-ochre/20 rounded-lg px-3 py-2 text-sm text-sand placeholder-sand/30 focus:outline-none focus:border-teal/50"
              />
              <textarea
                value={item.description}
                onChange={(e) => updateItem(i, "description", e.target.value)}
                placeholder="Descrizione elemento"
                rows={2}
                className="w-full bg-primary/50 border border-ochre/20 rounded-lg px-3 py-2 text-sm text-sand placeholder-sand/30 focus:outline-none focus:border-teal/50 resize-none"
              />
            </div>
            <button
              type="button"
              onClick={() => removeItem(i)}
              className="text-terracotta/60 hover:text-terracotta transition mt-1"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addItem}
          className="flex items-center gap-1 text-xs text-teal hover:text-teal/80 transition"
        >
          <Plus size={14} /> Aggiungi elemento
        </button>
      </div>
    </div>
  );
}
