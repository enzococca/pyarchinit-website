import sharp from "sharp";

export const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

// Rileva il tipo reale dell'immagine dai magic-bytes. Ritorna il MIME o null.
export function detectImageType(buf: Buffer): string | null {
  if (buf.length < 12) return null;
  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 &&
    buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a
  ) return "image/png";
  // GIF: "GIF87a" / "GIF89a"
  if (buf.slice(0, 6).toString("ascii") === "GIF87a" || buf.slice(0, 6).toString("ascii") === "GIF89a")
    return "image/gif";
  // WEBP: "RIFF"...."WEBP"
  if (buf.slice(0, 4).toString("ascii") === "RIFF" && buf.slice(8, 12).toString("ascii") === "WEBP")
    return "image/webp";
  return null;
}

// Ri-codifica in webp (max 2000px lato lungo), neutralizzando payload e normalizzando.
export async function reencodeToWebp(
  buf: Buffer
): Promise<{ buffer: Buffer; width: number; height: number }> {
  const img = sharp(buf, { failOn: "error" });
  const meta = await img.metadata();
  const pipeline =
    meta.width && meta.width > 2000
      ? img.resize(2000, null, { withoutEnlargement: true })
      : img;
  const out = await pipeline.webp({ quality: 85 }).toBuffer({ resolveWithObject: true });
  return { buffer: Buffer.from(out.data), width: out.info.width, height: out.info.height };
}
