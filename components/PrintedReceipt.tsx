"use client";
import { useEffect, useState } from "react";
import type { RecordItem } from "@/lib/stats";
import { entityUrl, ownerUrl, txUrl, EXTEND_DAYS } from "@/lib/config";
import { Candle, agoLabel, leftLabel } from "./Candle";
import { KIND_COLOR } from "@/lib/kinds";

const WORD: Record<RecordItem["kind"], string> = {
  call: "call",
  claim: "claim",
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

/** One piece of evidence, printed out. */
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
        <button className="close" onClick={onClose} aria-label="close">✕</button>
        <div className="rhead">
          <div>
            <div className="rid">#{it.msgId}</div>
            <div className="when">{agoLabel(it.seenAt)}</div>
          </div>
          <div className={`stamp small ${it.kind === "deleted" ? "red" : "ink"}`} style={{ background: KIND_COLOR[it.kind], marginRight: 30 }}>
            {WORD[it.kind]}
          </div>
        </div>
        <hr />
        {it.type === "tomb" ? (
          <div className="body">
            Seen. Then <mark>gone</mark>.
          </div>
        ) : it.text ? (
          <div className="body">
            <Marked text={it.text} />
          </div>
        ) : (
          <div className="hash">sha256 {it.sha256}</div>
        )}
        <hr />
        <div className="rows">
          <div>
            <span>life</span>
            <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
              {leftLabel(left)} <Candle left={left} life={it.lifetime} />
            </span>
          </div>
          {it.creator && (
            <div>
              <span>witness</span>
              <a href={ownerUrl(it.creator)} target="_blank" rel="noreferrer">
                {it.creator.slice(0, 6)}…{it.creator.slice(-4)}
              </a>
            </div>
          )}
          <div>
            <span>entity</span>
            <a href={entityUrl(it.key)} target="_blank" rel="noreferrer">
              {it.key.slice(0, 10)}…
            </a>
          </div>
        </div>
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
