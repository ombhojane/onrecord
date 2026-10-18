"use client";
import { useMemo, useState } from "react";
import type { CaseFile, RecordItem } from "@/lib/stats";
import { Scale } from "./Scale";
import { Tape } from "./Tape";
import { KIND_COLOR } from "@/lib/kinds";
import { PrintedReceipt } from "./PrintedReceipt";
import { Witness } from "./Witness";

type K = RecordItem["kind"];
const CHIPS: { k: K; label: string }[] = [
  { k: "call", label: "calls" },
  { k: "claim", label: "claims" },
  { k: "promo", label: "promos" },
  { k: "other", label: "chatter" },
  { k: "deleted", label: "deleted" },
];

export function CaseBoard({ file }: { file: CaseFile }) {
  const [hidden, setHidden] = useState<Set<K>>(new Set());
  const [open, setOpen] = useState<RecordItem | null>(null);
  const { counts, verdict } = file;

  const shown = useMemo(() => file.items.filter((i) => !hidden.has(i.kind)), [file.items, hidden]);
  const solo = (k: "call" | "claim") => {
    const only = hidden.size === CHIPS.length - 1 && !hidden.has(k);
    setHidden(only ? new Set() : new Set(CHIPS.map((c) => c.k).filter((x) => x !== k)));
  };
  const pick = hidden.size === CHIPS.length - 1 ? (CHIPS.find((c) => !hidden.has(c.k))?.k as "call" | "claim") : null;

  if (counts.total === 0) {
    return (
      <section className="empty">
        <div className="stamp ink big">UNWITNESSED</div>
        <p>Nothing here speaks for them yet.</p>
        <Witness handle={file.channel} />
      </section>
    );
  }

  return (
    <>
      <section className="board">
        <div className="verdict-zone shake">
          <div className={`stamp ${verdict.tone} big`}>{verdict.word}</div>
        </div>
        <Scale before={counts.call} after={counts.claim} pick={pick === "call" || pick === "claim" ? pick : null} onPick={solo} />
      </section>

      <div className="chips">
        {CHIPS.map(({ k, label }) => {
          const n = k === "deleted" ? counts.deleted : counts[k];
          if (!n) return null;
          const off = hidden.has(k);
          return (
            <button
              key={k}
              className={`chip${off ? " off" : ""}`}
              onClick={() => {
                const next = new Set(hidden);
                off ? next.delete(k) : next.add(k);
                setHidden(next);
              }}
            >
              <span className="sw" style={{ background: KIND_COLOR[k] }} />
              {label} <b>{n}</b>
            </button>
          );
        })}
      </div>

      <Tape items={shown} onOpen={setOpen} />

      <div className="seal-row">
        <Witness handle={file.channel} />
      </div>

      {open && <PrintedReceipt it={open} onClose={() => setOpen(null)} />}
    </>
  );
}
