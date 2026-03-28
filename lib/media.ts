import sharp from "sharp";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { prisma } from "./db";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

export async function processAndSaveMedia(file: File, folder: string = "/") {
  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
  const isImage = file.type.startsWith("image/");

  let finalBuffer: Buffer = buffer;
  let width: number | undefined;
  let height: number | undefined;

  if (isImage && file.type !== "image/svg+xml") {
    const image = sharp(buffer);
    const metadata = await image.metadata();
    width = metadata.width;
    height = metadata.height;

    if (width && width > 2000) {
      finalBuffer = Buffer.from(await image.resize(2000, null, { withoutEnlargement: true }).webp({ quality: 85 }).toBuffer());
    } else {
      finalBuffer = Buffer.from(await image.webp({ quality: 85 }).toBuffer());
    }
  }

  const folderPath = path.join(UPLOAD_DIR, folder);
  await mkdir(folderPath, { recursive: true });

  const ext = isImage && file.type !== "image/svg+xml" ? ".webp" : path.extname(file.name);
  const savedFilename = filename.replace(path.extname(filename), ext);
  const filePath = path.join(folderPath, savedFilename);

  await writeFile(filePath, finalBuffer);

  const media = await prisma.media.create({
    data: {
      filename: savedFilename,
      path: `/uploads${folder === "/" ? "/" : folder + "/"}${savedFilename}`,
      mimeType: isImage ? "image/webp" : file.type,
      size: finalBuffer.length,
      width,
      height,
      folder,
    },
  });

  return media;
}
