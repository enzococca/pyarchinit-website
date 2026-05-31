import { createHash } from "crypto";

export type ScanResult = "PENDING" | "CLEAN" | "INFECTED";

const VT = "https://www.virustotal.com/api/v3";

function key(): string | null {
  return process.env.VIRUSTOTAL_API_KEY || null;
}

function verdict(stats: { malicious?: number; suspicious?: number } | undefined): ScanResult {
  if (!stats) return "PENDING";
  return (stats.malicious ?? 0) + (stats.suspicious ?? 0) > 0 ? "INFECTED" : "CLEAN";
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Scansiona un buffer. Senza API key degrada a CLEAN (validazione di base già fatta).
// Ritorna lo stato e l'eventuale analysisId per il re-check successivo.
export async function scanBuffer(
  buffer: Buffer
): Promise<{ status: ScanResult; analysisId: string | null }> {
  const k = key();
  if (!k) return { status: "CLEAN", analysisId: null };

  // 1) lookup per hash (immediato se già noto)
  const sha256 = createHash("sha256").update(buffer).digest("hex");
  const lookup = await fetch(`${VT}/files/${sha256}`, { headers: { "x-apikey": k } }).catch(() => null);
  if (lookup && lookup.ok) {
    const body = await lookup.json();
    return { status: verdict(body?.data?.attributes?.last_analysis_stats), analysisId: null };
  }

  // 2) upload
  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(buffer)]), "upload");
  const up = await fetch(`${VT}/files`, { method: "POST", headers: { "x-apikey": k }, body: form }).catch(() => null);
  if (!up || !up.ok) return { status: "PENDING", analysisId: null };
  const upBody = await up.json();
  const analysisId: string | null = upBody?.data?.id ?? null;
  if (!analysisId) return { status: "PENDING", analysisId: null };

  // 3) poll breve (~8s)
  for (let i = 0; i < 4; i++) {
    await sleep(2000);
    const r = await recheckAnalysis(analysisId);
    if (r !== "PENDING") return { status: r, analysisId };
  }
  return { status: "PENDING", analysisId };
}

// Ricontrolla un'analisi esistente (usato per i PENDING alla visualizzazione).
export async function recheckAnalysis(analysisId: string): Promise<ScanResult> {
  const k = key();
  if (!k) return "CLEAN";
  const res = await fetch(`${VT}/analyses/${analysisId}`, { headers: { "x-apikey": k } }).catch(() => null);
  if (!res || !res.ok) return "PENDING";
  const body = await res.json();
  const attr = body?.data?.attributes;
  if (attr?.status !== "completed") return "PENDING";
  return verdict(attr?.stats);
}
