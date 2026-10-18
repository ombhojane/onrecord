"use client";
import { useMemo, useState } from "react";
import type { CaseFile, RecordItem } from "@/lib/stats";
import { Scale } from "./Scale";
import { Tape } from "./Tape";
import { KIND_COLOR } from "@/lib/kinds";
import { PrintedReceipt } from "./PrintedReceipt";
import { Witness } from "./Witness";
import { verdictCharacter } from "@/lib/cast";
import type { CaseFile as CF } from "@/lib/stats";

type K = RecordItem["kind"];
const CHIPS: { k: K; label: string }[] = [
  { k: "call", label: "calls" },
  { k: "claim", label: "claims" },
  { k: "promo", label: "promos" },
  { k: "other", label: "chatter" },
  { k: "deleted", label: "deleted" },
];

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** The verdict in plain words, for someone who has never seen the site before. */
function verdictLine(f: CF) {
  const { call, claim, deleted, promo, total } = f.counts;
  switch (f.verdict.word) {
    case "NO RECEIPTS":
      return `${plural(claim, "profit claim", "profit claims")}. ${plural(call, "call", "calls")} posted before the result.`;
    case "SHREDDER":
      return `${plural(deleted, "post", "posts")} deleted after we saw ${deleted === 1 ? "it" : "them"}.`;
    case "ALL HYPE":
      return `${promo} of ${total} posts just sell a membership.`;
    case "ON RECORD":
      return `${plural(call, "call", "calls")} posted before the result, and none deleted.`;
    default:
      return `${plural(total, "post", "posts")} on record. No calls or profit claims yet.`;
  }
}

function Speaker({ word }: { word: CF["verdict"]["word"] }) {
  const c = verdictCharacter(word);
  return (
    <figure className="speaker" style={{ ["--k" as string]: c.k }} aria-hidden>
      <span className="speaker-say">{c.line}</span>
      <img src={`/cast/${c.name}.png`} alt="" draggable={false} />
    </figure>
  );
}

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
        <Speaker word="UNWITNESSED" />
        <h2 className="empty-title">Not on record yet.</h2>
        <p>Witness it now, and every post it makes from here on stays on record.</p>
        <Witness handle={file.channel} />
      </section>
    );
  }

  return (
    <>
      <section className="board">
        <div className={`verdict tone-${verdict.tone}`}>
          <Speaker word={verdict.word} />
          <div className="verdict-text">
            <h2 className="verdict-word">{verdict.word}.</h2>
            <p className="verdict-line">{verdictLine(file)}</p>
          </div>
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
