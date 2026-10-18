import type { RecordItem } from "./stats";

export const KIND_COLOR: Record<RecordItem["kind"], string> = {
  call: "var(--hi-green)",
  claim: "var(--hi-yellow)",
  promo: "var(--hi-lilac)",
  other: "var(--line)",
  deleted: "var(--hi-red)",
};
