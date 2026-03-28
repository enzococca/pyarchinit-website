import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { processAndSaveMedia } from "@/lib/media";

export async function POST(req: NextRequest) {
  await requireAdmin();
  const formData = await req.formData();
  const files = formData.getAll("files") as File[];
  const folder = (formData.get("folder") as string) || "/";

  if (!files.length) {
    return NextResponse.json({ error: "No files" }, { status: 400 });
  }

  const results = await Promise.all(
    files.map((file) => processAndSaveMedia(file, folder))
  );

  return NextResponse.json(results);
}
