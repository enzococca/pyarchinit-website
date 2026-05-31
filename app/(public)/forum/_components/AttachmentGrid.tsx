import Image from "next/image";

interface Attachment {
  id: string;
  url: string;
  width: number | null;
  height: number | null;
  scanStatus: "PENDING" | "CLEAN" | "INFECTED";
}

export function AttachmentGrid({ attachments }: { attachments: Attachment[] }) {
  const visible = attachments.filter((a) => a.scanStatus !== "INFECTED");
  if (visible.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {visible.map((a) =>
        a.scanStatus === "PENDING" ? (
          <div
            key={a.id}
            className="w-28 h-28 rounded-card border border-sand/15 bg-code-bg flex items-center justify-center text-[11px] text-sand/40 text-center px-2"
          >
            🔍 in verifica…
          </div>
        ) : (
          <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer" className="block">
            <Image
              src={a.url}
              alt="Allegato"
              width={a.width ?? 200}
              height={a.height ?? 200}
              className="w-28 h-28 object-cover rounded-card border border-sand/15 hover:border-teal/40 transition"
            />
          </a>
        )
      )}
    </div>
  );
}
