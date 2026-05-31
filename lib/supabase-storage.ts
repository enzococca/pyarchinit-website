const BUCKET = "forum-attachments";

function cfg() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return { url: url.replace(/\/$/, ""), key };
}

export function storageConfigured(): boolean {
  return cfg() !== null;
}

// Carica un buffer e ritorna l'URL pubblico. Lancia se lo storage non è configurato.
export async function uploadObject(
  path: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  const c = cfg();
  if (!c) throw new Error("Supabase Storage non configurato");
  const res = await fetch(`${c.url}/storage/v1/object/${BUCKET}/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${c.key}`,
      "Content-Type": contentType,
      "x-upsert": "true",
    },
    body: new Uint8Array(buffer),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Upload Storage fallito (${res.status}): ${t}`);
  }
  return `${c.url}/storage/v1/object/public/${BUCKET}/${path}`;
}

export async function deleteObject(path: string): Promise<void> {
  const c = cfg();
  if (!c) return;
  await fetch(`${c.url}/storage/v1/object/${BUCKET}/${path}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${c.key}` },
  }).catch(() => {});
}
