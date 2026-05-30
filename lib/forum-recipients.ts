// Logica pura per scegliere i destinatari di una notifica del forum.
// Nessuna dipendenza (testabile in isolamento).

export interface SubscriberRow {
  userId: string;
  unsubscribeToken: string;
  user: { email: string | null; forumEmailOptOut: boolean } | null;
}

export interface NotifyRecipient {
  userId: string;
  email: string;
  unsubscribeToken: string;
}

/**
 * Da una lista di sottoscrizioni produce i destinatari finali:
 * - esclude l'autore del post (excludeUserId)
 * - esclude chi ha disattivato le email del forum (forumEmailOptOut)
 * - esclude righe senza email
 * - deduplica per userId
 */
export function selectRecipients(
  rows: SubscriberRow[],
  excludeUserId: string
): NotifyRecipient[] {
  const seen = new Set<string>();
  const out: NotifyRecipient[] = [];
  for (const row of rows) {
    if (row.userId === excludeUserId) continue;
    if (!row.user || !row.user.email) continue;
    if (row.user.forumEmailOptOut) continue;
    if (seen.has(row.userId)) continue;
    seen.add(row.userId);
    out.push({
      userId: row.userId,
      email: row.user.email,
      unsubscribeToken: row.unsubscribeToken,
    });
  }
  return out;
}
