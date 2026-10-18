import type { VerdictWord } from "@/lib/stats";

/** OpenMoji (CC BY-SA 4.0) — ink-outlined emoji served from /public/om. */
export function Om({ name, size = 48, className }: { name: string; size?: number; className?: string }) {
  return (
    <img
      src={`/om/${name}.svg`}
      width={size}
      height={size}
      alt=""
      draggable={false}
      className={`om${className ? ` ${className}` : ""}`}
    />
  );
}

export const VERDICT_OM: Record<VerdictWord, string> = {
  SHREDDER: "shredder",
  "NO RECEIPTS": "clown",
  "ALL HYPE": "megaphone",
  "ON RECORD": "check",
  QUIET: "shush",
  UNWITNESSED: "magnifier",
};
