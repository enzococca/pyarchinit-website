export type BlockType = "text" | "image" | "hero" | "cta" | "grid" | "video" | "code";

export interface Block {
  id: string;
  type: BlockType;
  data: Record<string, any>;
}

export const blockLabels: Record<BlockType, string> = {
  text: "Testo",
  image: "Immagine",
  hero: "Hero",
  cta: "Call to Action",
  grid: "Griglia",
  video: "Video",
  code: "Codice",
};

export function createEmptyBlock(type: BlockType): Block {
  const id = crypto.randomUUID();
  const defaults: Record<BlockType, Record<string, any>> = {
    text: { content: "" },
    image: { src: "", alt: "" },
    hero: { title: "", subtitle: "" },
    cta: { title: "", description: "", buttons: [] },
    grid: { columns: 3, items: [] },
    video: { url: "", caption: "" },
    code: { code: "", language: "python" },
  };
  return { id, type, data: defaults[type] };
}
