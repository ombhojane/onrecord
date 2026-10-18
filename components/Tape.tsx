"use client";
import { useEffect, useRef } from "react";
import type { RecordItem } from "@/lib/stats";
import { Candle, leftLabel } from "./Candle";
import { KIND_COLOR } from "@/lib/kinds";


function Receipt({ it, i, onOpen }: { it: RecordItem; i: number; onOpen: () => void }) {
  const tilt = ((it.msgId * 37) % 7) - 3;
  return (
    <button
      className="rc"
      style={{ ["--i" as string]: i, ["--r" as string]: `${tilt * 0.6}deg` }}
      onClick={onOpen}
      aria-label={`message ${it.msgId}, ${it.kind}`}
    >
      <div className="paper zig">
        <div className="band" style={{ background: KIND_COLOR[it.kind] }} />
        <div className="id">
          <span>#{it.msgId}</span>
          {it.hasMedia && <span aria-hidden>▣</span>}
        </div>
        {it.text ? (
          <div className="txt">{it.text.slice(0, 110)}</div>
        ) : (
          <div className="redact" aria-label="stored as hash only">
            {[86, 64, 92, 48, 72].map((w, k) => (
              <i key={k} style={{ width: `${(w + it.msgId * (k + 3)) % 50 + 40}%` }} />
            ))}
          </div>
        )}
        <div className="meta">
          <span>{leftLabel(it.secondsLeft)}</span>
          <Candle left={it.secondsLeft} life={it.lifetime} />
        </div>
      </div>
    </button>
  );
}

function Tomb({ it, i, onOpen }: { it: RecordItem; i: number; onOpen: () => void }) {
  return (
    <button className="tomb" style={{ ["--i" as string]: i }} onClick={onOpen} aria-label={`message ${it.msgId} deleted`}>
      <img src="/om/headstone.svg" width={112} height={112} alt="" draggable={false} />
      <span className="tomb-id">#{it.msgId}</span>
    </button>
  );
}

/** Drag-to-scroll strip of evidence, newest at the right edge. */
export function Tape({ items, onOpen }: { items: RecordItem[]; onOpen: (it: RecordItem) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef({ down: false, x: 0, left: 0, moved: false });

  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTo({ left: el.scrollWidth, behavior: "auto" });
  }, [items.length]);

  return (
    <div className="tape-wrap">
      <div
        ref={ref}
        className="tape"
        onPointerDown={(e) => {
          drag.current = { down: true, x: e.clientX, left: ref.current!.scrollLeft, moved: false };
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d.down) return;
          const dx = e.clientX - d.x;
          if (Math.abs(dx) > 5) {
            d.moved = true;
            ref.current!.classList.add("dragging");
          }
          ref.current!.scrollLeft = d.left - dx;
        }}
        onPointerUp={() => {
          drag.current.down = false;
          ref.current?.classList.remove("dragging");
        }}
        onPointerLeave={() => {
          drag.current.down = false;
          ref.current?.classList.remove("dragging");
        }}
        onClickCapture={(e) => {
          if (drag.current.moved) {
            e.stopPropagation();
            drag.current.moved = false;
          }
        }}
      >
        {items.map((it, i) =>
          it.type === "tomb" ? (
            <Tomb key={it.key} it={it} i={i} onOpen={() => onOpen(it)} />
          ) : (
            <Receipt key={it.key} it={it} i={i} onOpen={() => onOpen(it)} />
          ),
        )}
      </div>
    </div>
  );
}
