import { normalize } from "./normalize";

export type MsgKind = "call" | "claim" | "promo" | "other";

export interface ParsedCall {
  instrument?: string; // e.g. BANKNIFTY, NIFTY, a stock symbol
  side?: "buy" | "sell";
  entry?: number;
  target?: number;
  stoploss?: number;
}

export interface Classified {
  kind: MsgKind;
  text: string; // normalized
  call?: ParsedCall;
}

const INSTRUMENTS =
  /\b(bank\s*nifty|nifty|fin\s*nifty|midcp\s*nifty|sensex|crude\s*oil|[A-Z]{2,12}\s+\d{2,6}\s*(CE|PE))\b/i;

const CALL_SIGNALS = [
  /\b(buy|sell|long|short)\b[^\n]{0,40}\d/i,
  /\b(entry|above|below)\b\s*[@:]?\s*\d/i,
  /\b(tgt|target|tg)\b\s*[@:]?\s*\d/i,
  /\b(sl|stop\s*loss)\b\s*[@:]?\s*\d/i,
];

const CLAIM_SIGNALS = [
  /\b(profit|booked|done|achieved|hit|rocked)\b/i,
  /\b(all\s*)?(tgt|target)s?\s*(done|hit|achieved|complete)\b/i,
  /\bbooked\s+\d+/i,
];

const PROMO_SIGNALS = [
  /\b(premium|vip|paid)\s*(group|channel|membership)?\b/i,
  /\b(month|year|lifetime)\b[^\n]{0,30}\d{3,6}\s*\/?-?/i,
  /\b(offer|discount|join|subscribe|payment|screenshot|upi|paytm|gpay)\b/i,
  /\baccount\s*handling\b/i,
];

function score(text: string, patterns: RegExp[]): number {
  return patterns.reduce((n, p) => n + (p.test(text) ? 1 : 0), 0);
}

export function parseCall(text: string): ParsedCall {
  const call: ParsedCall = {};
  const inst = text.match(INSTRUMENTS);
  if (inst) call.instrument = inst[0].toUpperCase().replace(/\s+/g, "");
  const side = text.match(/\b(buy|long)\b/i)
    ? "buy"
    : text.match(/\b(sell|short)\b/i)
      ? "sell"
      : undefined;
  if (side) call.side = side;
  const entry = text.match(/\b(?:buy|sell|entry|above|cmp)\b\s*[@:]?\s*(\d{2,6}(?:\.\d+)?)/i);
  if (entry) call.entry = Number(entry[1]);
  const tgt = text.match(/\b(?:tgt|target|tg)\b\s*[@:,-]?\s*(\d{2,6}(?:\.\d+)?)/i);
  if (tgt) call.target = Number(tgt[1]);
  const sl = text.match(/\b(?:sl|stop\s*loss)\b\s*[@:,-]?\s*(\d{2,6}(?:\.\d+)?)/i);
  if (sl) call.stoploss = Number(sl[1]);
  return call;
}

/**
 * Order matters: a message can hype a profit AND sell a membership — promo wins
 * only when there is no trade content, so "Buy 440 / booked 565" stays a claim.
 */
export function classify(raw: string): Classified {
  const text = normalize(raw);
  const callScore = score(text, CALL_SIGNALS);
  const claimScore = score(text, CLAIM_SIGNALS);
  const promoScore = score(text, PROMO_SIGNALS);

  if (claimScore >= 1 && claimScore >= callScore)
    return { kind: "claim", text };
  if (callScore >= 2) return { kind: "call", text, call: parseCall(text) };
  if (promoScore >= 2) return { kind: "promo", text };
  return { kind: "other", text };
}
