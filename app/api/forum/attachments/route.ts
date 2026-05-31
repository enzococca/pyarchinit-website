import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth-utils";
import { detectImageType, reencodeToWebp, MAX_BYTES } from "@/lib/image-validate";
import { uploadObject, deleteObject, storageConfigured } from "@/lib/supabase-storage";
import { scanBuffer } from "@/lib/virustotal";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const me = await prisma.user.findUnique({ where: { id: userId }, select: { banned: true } });
  if (me?.banned) return NextResponse.json({ error: "Sei stato escluso dal forum." }, { status: 403 });

  if (!storageConfigured()) {
    return NextResponse.json({ error: "Storage non configurato" }, { status: 503 });
  }

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Nessun file" }, { status: 400 });
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Immagine troppo grande (max 8 MB)" }, { status: 400 });
  }

  const raw = Buffer.from(await file.arrayBuffer());
  if (!detectImageType(raw)) {
    return NextResponse.json({ error: "Tipo di file non consentito (solo immagini)" }, { status: 400 });
  }

  let processed: { buffer: Buffer; width: number; height: number };
  try {
    processed = await reencodeToWebp(raw);
  } catch {
    return NextResponse.json({ error: "Immagine non valida" }, { status: 400 });
  }

  const path = `${userId}/${Date.now()}-${Math.round(processed.width)}.webp`;
  let url: string;
  try {
    url = await uploadObject(path, processed.buffer, "image/webp");
  } catch (e) {
    return NextResponse.json({ error: "Upload fallito" }, { status: 502 });
  }

  const scan = await scanBuffer(processed.buffer);
  if (scan.status === "INFECTED") {
    await deleteObject(path);
    return NextResponse.json({ error: "File rifiutato: rilevata minaccia" }, { status: 422 });
  }

  const attachment = await prisma.forumAttachment.create({
    data: {
      url,
      path,
      mimeType: "image/webp",
      size: processed.buffer.length,
      width: processed.width,
      height: processed.height,
      scanStatus: scan.status,
      vtAnalysisId: scan.analysisId,
      uploaderId: userId,
    },
  });

  return NextResponse.json({
    id: attachment.id,
    url: attachment.url,
    scanStatus: attachment.scanStatus,
    width: attachment.width,
    height: attachment.height,
  });
}
