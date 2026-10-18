import type { VerdictWord } from "./stats";
import SIZES from "./cast.json";

/** Each bazaar character and the line they say. Order is the crowd's left-to-right order. */
export const CAST: { name: string; line: string }[] = [
  { name: "tout", line: "Sure-shot call!" },
  { name: "student", line: "To the moon." },
  { name: "bull", line: "Trust me, bro." },
  { name: "slips", line: "Profit booked!!" },
  { name: "landline", line: "Tip line, hold please." },
  { name: "receipt", line: "I kept the receipt." },
  { name: "chai", line: "Chai pe charcha?" },
  { name: "auntie", line: "Which one is real?" },
  { name: "sardar", line: "Chart dekho, chart!" },
  { name: "nani", line: "Kal wala call kahan gaya?" },
  { name: "nailbiter", line: "It said 90% accuracy…" },
  { name: "clerk", line: "Deleted. Again." },
  { name: "fist", line: "Show me proof." },
  { name: "bear", line: "Screenshot or it didn't happen." },
];

const LINE = Object.fromEntries(CAST.map((c) => [c.name, c.line]));

/** Sprite height as a fraction of the generation canvas (see scripts/trim-cast.mts). */
export const sizeK = (name: string) => (SIZES as Record<string, { k: number }>)[name]?.k ?? 0.85;

/** The character who speaks for each verdict on a channel page. */
const BY_VERDICT: Record<VerdictWord, string> = {
  "NO RECEIPTS": "bull",
  SHREDDER: "clerk",
  "ALL HYPE": "tout",
  "ON RECORD": "receipt",
  QUIET: "landline",
  UNWITNESSED: "nani",
};

export function verdictCharacter(word: VerdictWord) {
  const name = BY_VERDICT[word];
  return { name, line: LINE[name], k: sizeK(name) };
}
