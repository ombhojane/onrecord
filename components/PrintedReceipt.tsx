"use client";
import { useEffect, useState } from "react";
import type { RecordItem } from "@/lib/stats";
import { entityUrl, ownerUrl, txUrl, EXTEND_DAYS } from "@/lib/config";
import { Candle, agoLabel, leftLabel } from "./Candle";
import { KIND_COLOR } from "@/lib/kinds";

const WORD: Record<RecordItem["kind"], string> = {
  call: "call",
  claim: "profit claim",
  promo: "promo",
  other: "chatter",
  deleted: "deleted",
};

function Marked({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\d[\d,.]*)/g).map((part, i) =>
        /^\d/.test(part) ? <mark key={i}>{part}</mark> : <span key={i}>{part}</span>,
      )}
    </>
  );
}

/** The entity's real sha256 drawn as a ticket barcode: each hex digit sets a bar width. */
function Barcode({ hex }: { hex: string }) {
  const bars = (hex || "0").slice(0, 44).split("");
  return (
    <div className="barcode" aria-hidden>
      <div className="bars">
        {bars.map((c, i) => (
          <i key={i} style={{ width: 1 + (parseInt(c, 16) % 4), opacity: i % 7 === 3 ? 0.6 : 1 }} />
        ))}
      </div>
      <span className="code mono">{hex?.slice(0, 24)}…</span>
    </div>
  );
}

/** One piece of evidence, printed as a ticket. */
export function PrintedReceipt({ it, onClose }: { it: RecordItem; onClose: () => void }) {
  const [left, setLeft] = useState(it.secondsLeft);
  const [state, setState] = useState<{ busy?: boolean; tx?: string; err?: string }>({});

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function keepAlive() {
    setState({ busy: true });
    try {
      const r = await fetch("/api/extend", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ key: it.key }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setLeft((l) => l + EXTEND_DAYS * 86400);
      setState({ tx: d.txHash });
    } catch (e) {
      setState({ err: (e as Error).message });
    }
  }

  return (
    <div className="scrim" onClick={onClose}>
      <article className="receipt zig" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal>
        <button className="close" onClick={onClose} aria-label="close">
          ✕
        </button>

        <div className="tk-top mono">
          <span>ONRECORD · ORIGINAL RECEIPT</span>
          <span>Re. {it.msgId}</span>
        </div>

        <div className="tk-row">
          <span className="tk-k">kind</span>
          <span className="tk-v">
            <i className="sw" style={{ background: KIND_COLOR[it.kind] }} /> {WORD[it.kind]}
          </span>
        </div>
        <div className="tk-row">
          <span className="tk-k">witnessed</span>
          <span className="tk-v">{agoLabel(it.seenAt)}</span>
        </div>

        {it.type === "tomb" ? (
          <div className="body tk-quote gone">
            Seen on the record. Then <mark>deleted</mark> at source.
          </div>
        ) : it.text ? (
          <div className="body tk-quote">
            <Marked text={it.text} />
          </div>
        ) : (
          <div className="tk-quote hash">content witnessed as hash only</div>
        )}

        <div className="tk-row">
          <span className="tk-k">lifetime</span>
          <span className="tk-v" style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
            {leftLabel(left)} <Candle left={left} life={it.lifetime} />
          </span>
        </div>
        <div className="tk-row">
          <span className="tk-k">edits</span>
          <span className="tk-v">nobody can edit · anyone can extend</span>
        </div>
        {it.creator && (
          <div className="tk-row">
            <span className="tk-k">witness</span>
            <a className="tk-v mono" href={ownerUrl(it.creator)} target="_blank" rel="noreferrer">
              {it.creator.slice(0, 8)}…{it.creator.slice(-6)}
            </a>
          </div>
        )}
        <div className="tk-row">
          <span className="tk-k">entity</span>
          <a className="tk-v mono" href={entityUrl(it.key)} target="_blank" rel="noreferrer">
            {it.key.slice(0, 12)}…{it.key.slice(-6)}
          </a>
        </div>

        <Barcode hex={it.sha256 ?? it.key.slice(2)} />

        <div className="acts">
          <a className="btn" href={entityUrl(it.key)} target="_blank" rel="noreferrer">
            proof ↗
          </a>
          <button className="btn solid" onClick={keepAlive} disabled={state.busy || !!state.tx}>
            {state.busy ? "extending…" : state.tx ? "kept alive ✓" : `keep alive +${EXTEND_DAYS}d`}
          </button>
        </div>
        {state.tx && (
          <p className="hash" style={{ marginTop: 12 }}>
            <a href={txUrl(state.tx)} target="_blank" rel="noreferrer">
              tx {state.tx.slice(0, 18)}… ↗
            </a>
          </p>
        )}
        {state.err && <p style={{ color: "var(--red)", fontSize: 13, marginTop: 12 }}>{state.err}</p>}
      </article>
    </div>
  );
}
