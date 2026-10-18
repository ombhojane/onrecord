import { notFound } from "next/navigation";
import { CaseBoard } from "@/components/CaseBoard";
import type { CaseFile, RecordItem } from "@/lib/stats";
import { verdictOf } from "@/lib/stats";

// Design QA only: synthetic fixture, unreachable in production builds.
export default function DevBoard() {
  if (process.env.NODE_ENV !== "development") notFound();

  const now = Math.floor(Date.now() / 1000);
  const kinds: RecordItem["kind"][] = ["claim", "other", "promo", "claim", "other", "promo", "promo", "other", "other", "call", "other", "deleted", "other", "other", "claim", "other", "deleted", "claim", "promo", "claim"];
  const texts: Partial<Record<RecordItem["kind"], string>> = {
    claim: "ACCOUNT HANDLING LIVE PROFIT BOOKED 🥳✅ Buy 440 Profit booked 565 All tgt done",
    call: "BUY BANKNIFTY 52000 CE @ 210 TGT 260 SL 180",
  };
  const items: RecordItem[] = kinds.map((k, i) => ({
    type: k === "deleted" ? "tomb" : "msg",
    key: `0x${(i + 1).toString(16).padStart(64, "0")}`,
    msgId: 5790 + i,
    kind: k,
    seenAt: now - (20 - i) * 3600,
    secondsLeft: k === "deleted" ? 170 * 86400 : (60 - i * 2.5) * 86400,
    lifetime: (k === "deleted" ? 180 : 60) * 86400,
    creator: "0x3e4d746d07568B5d0BE5b6C83937c6FCd741e7fc",
    text: texts[k],
    sha256: "9f2c4e1ab7d0" + "0".repeat(52),
    hasMedia: i % 3 === 0,
  }));
  const counts = { call: 1, claim: 5, promo: 4, other: 8, deleted: 2, total: 18 };
  const file: CaseFile = { channel: "fixture", items, counts, verdict: verdictOf(counts) };

  return (
    <main className="wrap">
      <div className="case-head">
        <h1>@fixture</h1>
      </div>
      <CaseBoard file={file} />
    </main>
  );
}
