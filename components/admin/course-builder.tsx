"use client";

import { useState } from "react";
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
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  ChevronDown,
  ChevronRight,
  Trash2,
  Plus,
  BookOpen,
} from "lucide-react";

export interface LessonData {
  id?: string;
  title: string;
  type: "VIDEO" | "TEXT" | "QUIZ" | "EXERCISE";
  isFree: boolean;
  order: number;
}

export interface ModuleData {
  id?: string;
  title: string;
  order: number;
  lessons: LessonData[];
}

interface CourseBuilderProps {
  modules: ModuleData[];
  onChange: (modules: ModuleData[]) => void;
}

const lessonTypeLabels: Record<LessonData["type"], string> = {
  VIDEO: "Video",
  TEXT: "Testo",
  QUIZ: "Quiz",
  EXERCISE: "Esercizio",
};

function SortableModule({
  mod,
  index,
  onUpdateModule,
  onDeleteModule,
  onAddLesson,
  onUpdateLesson,
  onDeleteLesson,
}: {
  mod: ModuleData;
  index: number;
  onUpdateModule: (index: number, data: Partial<ModuleData>) => void;
  onDeleteModule: (index: number) => void;
  onAddLesson: (moduleIndex: number) => void;
  onUpdateLesson: (
    moduleIndex: number,
    lessonIndex: number,
    data: Partial<LessonData>
  ) => void;
  onDeleteLesson: (moduleIndex: number, lessonIndex: number) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: mod.id ?? `new-${index}` });

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
      {/* Module header */}
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          {...attributes}
          {...listeners}
          className="text-sand/20 hover:text-sand/50 cursor-grab active:cursor-grabbing shrink-0"
          type="button"
        >
          <GripVertical size={16} />
        </button>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-sand/40 hover:text-sand shrink-0"
        >
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        <input
          type="text"
          value={mod.title}
          onChange={(e) => onUpdateModule(index, { title: e.target.value })}
          placeholder="Titolo modulo"
          className="flex-1 bg-transparent text-sm text-sand placeholder-sand/30 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => onDeleteModule(index)}
          className="text-sand/20 hover:text-terracotta transition shrink-0"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Lessons */}
      {expanded && (
        <div className="border-t border-ochre/10 px-3 py-2 space-y-2">
          {mod.lessons.length === 0 && (
            <p className="text-xs text-sand/30 text-center py-2">
              Nessuna lezione. Aggiungine una.
            </p>
          )}
          {mod.lessons.map((lesson, li) => (
            <div
              key={lesson.id ?? `new-lesson-${li}`}
              className="flex items-center gap-2 bg-primary/30 rounded-lg px-3 py-2"
            >
              <BookOpen size={12} className="text-sand/30 shrink-0" />
              <input
                type="text"
                value={lesson.title}
                onChange={(e) =>
                  onUpdateLesson(index, li, { title: e.target.value })
                }
                placeholder="Titolo lezione"
                className="flex-1 bg-transparent text-xs text-sand placeholder-sand/30 focus:outline-none min-w-0"
              />
              <select
                value={lesson.type}
                onChange={(e) =>
                  onUpdateLesson(index, li, {
                    type: e.target.value as LessonData["type"],
                  })
                }
                className="bg-code-bg border border-ochre/20 rounded px-2 py-0.5 text-xs text-sand focus:outline-none focus:border-teal/50 shrink-0"
              >
                {Object.entries(lessonTypeLabels).map(([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-1 text-xs text-sand/50 shrink-0 cursor-pointer">
                <input
                  type="checkbox"
                  checked={lesson.isFree}
                  onChange={(e) =>
                    onUpdateLesson(index, li, { isFree: e.target.checked })
                  }
                  className="accent-teal"
                />
                Free
              </label>
              <button
                type="button"
                onClick={() => onDeleteLesson(index, li)}
                className="text-sand/20 hover:text-terracotta transition shrink-0"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => onAddLesson(index)}
            className="flex items-center gap-1.5 text-xs text-teal/60 hover:text-teal transition mt-1"
          >
            <Plus size={12} />
            Aggiungi lezione
          </button>
        </div>
      )}
    </div>
  );
}

export function CourseBuilder({ modules, onChange }: CourseBuilderProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = modules.findIndex(
      (m, i) => (m.id ?? `new-${i}`) === active.id
    );
    const newIndex = modules.findIndex(
      (m, i) => (m.id ?? `new-${i}`) === over.id
    );

    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(modules, oldIndex, newIndex).map((m, i) => ({
      ...m,
      order: i,
    }));
    onChange(reordered);
  };

  const addModule = () => {
    onChange([
      ...modules,
      { title: "", order: modules.length, lessons: [] },
    ]);
  };

  const updateModule = (index: number, data: Partial<ModuleData>) => {
    const updated = modules.map((m, i) => (i === index ? { ...m, ...data } : m));
    onChange(updated);
  };

  const deleteModule = (index: number) => {
    onChange(modules.filter((_, i) => i !== index).map((m, i) => ({ ...m, order: i })));
  };

  const addLesson = (moduleIndex: number) => {
    const mod = modules[moduleIndex];
    const newLesson: LessonData = {
      title: "",
      type: "VIDEO",
      isFree: false,
      order: mod.lessons.length,
    };
    updateModule(moduleIndex, { lessons: [...mod.lessons, newLesson] });
  };

  const updateLesson = (
    moduleIndex: number,
    lessonIndex: number,
    data: Partial<LessonData>
  ) => {
    const mod = modules[moduleIndex];
    const updatedLessons = mod.lessons.map((l, i) =>
      i === lessonIndex ? { ...l, ...data } : l
    );
    updateModule(moduleIndex, { lessons: updatedLessons });
  };

  const deleteLesson = (moduleIndex: number, lessonIndex: number) => {
    const mod = modules[moduleIndex];
    const updatedLessons = mod.lessons
      .filter((_, i) => i !== lessonIndex)
      .map((l, i) => ({ ...l, order: i }));
    updateModule(moduleIndex, { lessons: updatedLessons });
  };

  const sortableIds = modules.map((m, i) => m.id ?? `new-${i}`);

  return (
    <div className="space-y-3">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
          {modules.map((mod, index) => (
            <SortableModule
              key={mod.id ?? `new-${index}`}
              mod={mod}
              index={index}
              onUpdateModule={updateModule}
              onDeleteModule={deleteModule}
              onAddLesson={addLesson}
              onUpdateLesson={updateLesson}
              onDeleteLesson={deleteLesson}
            />
          ))}
        </SortableContext>
      </DndContext>

      <button
        type="button"
        onClick={addModule}
        className="flex items-center gap-2 text-sm text-teal/60 hover:text-teal transition border border-dashed border-teal/20 hover:border-teal/40 rounded-card w-full justify-center py-3"
      >
        <Plus size={16} />
        Aggiungi modulo
      </button>
    </div>
  );
}
