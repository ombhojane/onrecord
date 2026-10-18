import { and, eq } from "@arkiv-network/sdk/query";
import { avNum, avStr, publicClient } from "./arkiv";
import { APP_TAG, LIFETIME_DAYS } from "./config";

export type Kind = "call" | "claim" | "promo" | "other";

export interface RecordItem {
  type: "msg" | "tomb";
  key: string;
  msgId: number;
  kind: Kind | "deleted";
  seenAt: number; // unix seconds
  secondsLeft: number; // until Entity Expiration
  lifetime: number; // nominal lifetime in seconds, for the candle
  creator?: string;
  text?: string;
  sha256?: string;
  hasMedia?: boolean;
  postedAt?: string;
}

export type VerdictWord = "SHREDDER" | "NO RECEIPTS" | "ALL HYPE" | "ON RECORD" | "QUIET" | "UNWITNESSED";

export interface Verdict {
  word: VerdictWord;
  tone: "red" | "green" | "lilac" | "ink";
}

export interface CaseFile {
  channel: string;
  items: RecordItem[]; // msgs + tombs, msgId ascending
  counts: Record<Kind, number> & { deleted: number; total: number };
  verdict: Verdict;
  witness?: string;
}

export function verdictOf(c: { call: number; claim: number; promo: number; deleted: number; total: number }): Verdict {
  if (c.total === 0) return { word: "UNWITNESSED", tone: "ink" };
  if (c.deleted > 0) return { word: "SHREDDER", tone: "red" };
  if (c.claim > c.call) return { word: "NO RECEIPTS", tone: "red" };
  if (c.call > 0) return { word: "ON RECORD", tone: "green" };
  if (c.promo * 2 >= c.total) return { word: "ALL HYPE", tone: "lilac" };
  return { word: "QUIET", tone: "ink" };
}

async function blockClock() {
  const t = await publicClient().getBlockTiming();
  return { block: t.currentBlock, dur: t.blockDuration || 2 };
}

function asKind(raw: unknown): Kind {
  const v = avStr(raw);
  return v === "call" || v === "claim" || v === "promo" ? v : "other";
}

export async function caseFile(channel: string): Promise<CaseFile> {
  const pub = publicClient();
  const clock = await blockClock();
  const left = (exp?: bigint) =>
    exp === undefined ? 0 : Math.max(0, Number(exp - clock.block) * clock.dur);

  const items: RecordItem[] = [];
  let witness: string | undefined;

  for await (const e of pub
    .select({ key: true, attributes: true, payload: true, expiresAt: true, creator: true })
    .where(and(eq("app", APP_TAG), eq("type", "msg"), eq("channel", channel)))) {
    const a = e.attributes ?? {};
    let p: Record<string, unknown> = {};
    try {
      p = e.toJson() as Record<string, unknown>;
    } catch {}
    witness ??= e.creator;
    items.push({
      type: "msg",
      key: e.key,
      msgId: avNum(a.msg_id),
      kind: asKind(a.kind),
      seenAt: avNum(a.seen_at) || 0,
      secondsLeft: left(e.expiresAt),
      lifetime: LIFETIME_DAYS.msg * 86400,
      creator: e.creator,
      text: typeof p.text === "string" ? p.text : undefined,
      sha256: typeof p.sha256 === "string" ? p.sha256 : avStr(a.content_hash) ?? "",
      hasMedia: Boolean(p.hasMedia),
      postedAt: typeof p.postedAt === "string" ? p.postedAt : undefined,
    });
  }

  for await (const e of pub
    .select({ key: true, attributes: true, expiresAt: true, creator: true })
    .where(and(eq("app", APP_TAG), eq("type", "tomb"), eq("channel", channel)))) {
    const a = e.attributes ?? {};
    items.push({
      type: "tomb",
      key: e.key,
      msgId: avNum(a.msg_id),
      kind: "deleted",
      seenAt: avNum(a.seen_at) || 0,
      secondsLeft: left(e.expiresAt),
      lifetime: LIFETIME_DAYS.tomb * 86400,
      creator: e.creator,
    });
  }

  // A tombstone replaces the message it indicts in the visual sequence.
  const tombIds = new Set(items.filter((i) => i.type === "tomb").map((i) => i.msgId));
  const merged = items
    .filter((i) => i.type === "tomb" || !tombIds.has(i.msgId))
    .sort((x, y) => x.msgId - y.msgId);

  const counts = { call: 0, claim: 0, promo: 0, other: 0, deleted: tombIds.size, total: 0 };
  for (const i of items) if (i.type === "msg") { counts[i.kind as Kind]++; counts.total++; }

  return { channel, items: merged, counts, verdict: verdictOf(counts), witness };
}

export interface CaseSummary {
  channel: string;
  counts: CaseFile["counts"];
  verdict: Verdict;
}

/** Every channel under witness, with its verdict — two chain queries total. */
export async function allCases(): Promise<CaseSummary[]> {
  const pub = publicClient();
  const map = new Map<string, CaseFile["counts"]>();
  const get = (c: string) => {
    if (!map.has(c)) map.set(c, { call: 0, claim: 0, promo: 0, other: 0, deleted: 0, total: 0 });
    return map.get(c)!;
  };
  for await (const e of pub
    .select({ attributes: true })
    .where(and(eq("app", APP_TAG), eq("type", "msg")))) {
    const a = e.attributes ?? {};
    const ch = avStr(a.channel);
    if (!ch) continue;
    const c = get(ch);
    c[asKind(a.kind)]++;
    c.total++;
  }
  for await (const e of pub
    .select({ attributes: true })
    .where(and(eq("app", APP_TAG), eq("type", "tomb")))) {
    const a = e.attributes ?? {};
    const ch = avStr(a.channel);
    if (ch) get(ch).deleted++;
  }
  return [...map.entries()]
    .map(([channel, counts]) => ({ channel, counts, verdict: verdictOf(counts) }))
    .sort((a, b) => b.counts.total - a.counts.total);
}
