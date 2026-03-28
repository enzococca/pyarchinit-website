"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, Plus, ChevronDown } from "lucide-react";
import { Block, BlockType, blockLabels, createEmptyBlock } from "@/lib/blocks";
import { TextBlock } from "./blocks/text-block";
import { ImageBlock } from "./blocks/image-block";
import { HeroBlock } from "./blocks/hero-block";
import { CtaBlock } from "./blocks/cta-block";
import { GridBlock } from "./blocks/grid-block";
import { VideoBlock } from "./blocks/video-block";
import { CodeBlock } from "./blocks/code-block";

const BLOCK_TYPES: BlockType[] = ["text", "image", "hero", "cta", "grid", "video", "code"];

interface BlockEditorProps {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
}

function BlockRenderer({
  block,
  onChange,
}: {
  block: Block;
  onChange: (data: Record<string, any>) => void;
}) {
  switch (block.type) {
    case "text":
      return <TextBlock block={block} onChange={onChange} />;
    case "image":
      return <ImageBlock block={block} onChange={onChange} />;
    case "hero":
      return <HeroBlock block={block} onChange={onChange} />;
    case "cta":
      return <CtaBlock block={block} onChange={onChange} />;
    case "grid":
      return <GridBlock block={block} onChange={onChange} />;
    case "video":
      return <VideoBlock block={block} onChange={onChange} />;
    case "code":
      return <CodeBlock block={block} onChange={onChange} />;
    default:
      return null;
  }
}

function SortableBlock({
  block,
  onUpdate,
  onDelete,
}: {
  block: Block;
  onUpdate: (id: string, data: Record<string, any>) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-code-bg rounded-card border border-ochre/10"
    >
      <div className="flex items-center gap-2 px-3 py-2 border-b border-ochre/10">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="text-sand/30 hover:text-sand/60 cursor-grab active:cursor-grabbing"
        >
          <GripVertical size={16} />
        </button>
        <span className="text-xs font-mono text-ochre/60 flex-1">{blockLabels[block.type]}</span>
        <button
          type="button"
          onClick={() => onDelete(block.id)}
          className="text-terracotta/40 hover:text-terracotta transition"
        >
          <Trash2 size={14} />
        </button>
      </div>
      <div className="p-4">
        <BlockRenderer
          block={block}
          onChange={(data) => onUpdate(block.id, data)}
        />
      </div>
    </div>
  );
}

export function BlockEditor({ blocks, onChange }: BlockEditorProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        const oldIndex = blocks.findIndex((b) => b.id === active.id);
        const newIndex = blocks.findIndex((b) => b.id === over.id);
        onChange(arrayMove(blocks, oldIndex, newIndex));
      }
    },
    [blocks, onChange]
  );

  const updateBlock = useCallback(
    (id: string, data: Record<string, any>) => {
      onChange(blocks.map((b) => (b.id === id ? { ...b, data } : b)));
    },
    [blocks, onChange]
  );

  const deleteBlock = useCallback(
    (id: string) => {
      onChange(blocks.filter((b) => b.id !== id));
    },
    [blocks, onChange]
  );

  const addBlock = useCallback(
    (type: BlockType) => {
      onChange([...blocks, createEmptyBlock(type)]);
      setMenuOpen(false);
    },
    [blocks, onChange]
  );

  return (
    <div className="space-y-3">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          {blocks.map((block) => (
            <SortableBlock
              key={block.id}
              block={block}
              onUpdate={updateBlock}
              onDelete={deleteBlock}
            />
          ))}
        </SortableContext>
      </DndContext>

      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          className="flex items-center gap-2 text-sm text-teal border border-teal/30 rounded-card px-4 py-2 hover:bg-teal/5 transition"
        >
          <Plus size={16} />
          Aggiungi blocco
          <ChevronDown size={14} className={menuOpen ? "rotate-180 transition" : "transition"} />
        </button>

        {menuOpen && (
          <div className="absolute top-full mt-1 left-0 z-10 bg-code-bg border border-ochre/20 rounded-card shadow-lg overflow-hidden min-w-[180px]">
            {BLOCK_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => addBlock(type)}
                className="w-full text-left px-4 py-2.5 text-sm text-sand/70 hover:text-sand hover:bg-white/5 transition"
              >
                {blockLabels[type]}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
