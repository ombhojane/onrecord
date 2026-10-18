"use client";
import { useEffect, useState } from "react";

const PIVOT = { x: 180, y: 58 };
const ARM = 128;

/**
 * Said-before vs said-after. Committed calls sit on the left pan, after-the-fact
 * profit claims on the right; the beam tips toward whichever outweighs.
 */
export function Scale({
  before,
  after,
  pick,
  onPick,
}: {
  before: number;
  after: number;
  pick: "call" | "claim" | null;
  onPick: (k: "call" | "claim") => void;
}) {
  const target = Math.max(-20, Math.min(20, ((after - before) / Math.max(1, after + before)) * 20));
  const [a, setA] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setA(target), 450);
    return () => clearTimeout(t);
  }, [target]);

  const rad = (a * Math.PI) / 180;
  const L = { x: PIVOT.x - ARM * Math.cos(rad), y: PIVOT.y - ARM * Math.sin(rad) };
  const R = { x: PIVOT.x + ARM * Math.cos(rad), y: PIVOT.y + ARM * Math.sin(rad) };
  const move = "transform 1.4s var(--spring)";

  const Pan = ({ at, n, label, kind }: { at: { x: number; y: number }; n: number; label: string; kind: "call" | "claim" }) => (
    <g
      className={`pan${pick === kind ? " on" : ""}`}
      style={{ transform: `translate(${at.x}px, ${at.y}px)`, transition: move }}
      onClick={() => onPick(kind)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onPick(kind)}
    >
      <line x1="0" y1="0" x2="-48" y2="80" stroke="var(--ink)" strokeWidth="2" />
      <line x1="0" y1="0" x2="48" y2="80" stroke="var(--ink)" strokeWidth="2" />
      {/* the count sits on the pan like a weight, clear of the bowl */}
      <text className="num" x="0" y="76" textAnchor="middle" fill={n === 0 ? "var(--mute)" : kind === "claim" ? "var(--red)" : "var(--green)"}>
        {n}
      </text>
      <path className="dish" d="M-60 80 Q0 118 60 80 Z" fill="var(--card)" stroke="var(--ink)" strokeWidth="3" strokeLinejoin="round" />
      <text className="lbl" x="0" y="126" textAnchor="middle">
        {label}
      </text>
    </g>
  );

  return (
    <div className="scale-wrap">
      <svg className="scale-svg" viewBox="0 -14 360 290" role="img" aria-label={`${before} calls before, ${after} claims after`}>
        <path d="M120 262 Q180 228 240 262 Z" fill="var(--ink)" />
        <line x1={PIVOT.x} y1={PIVOT.y} x2={PIVOT.x} y2="242" stroke="var(--ink)" strokeWidth="6" strokeLinecap="round" />
        <g style={{ transform: `rotate(${a}deg)`, transformOrigin: `${PIVOT.x}px ${PIVOT.y}px`, transformBox: "view-box", transition: move }}>
          <line x1={PIVOT.x - ARM} y1={PIVOT.y} x2={PIVOT.x + ARM} y2={PIVOT.y} stroke="var(--ink)" strokeWidth="6" strokeLinecap="round" />
        </g>
        <circle cx={PIVOT.x} cy={PIVOT.y} r="10" fill="var(--red)" stroke="var(--ink)" strokeWidth="3" />
        <Pan at={L} n={before} label="POSTED FIRST" kind="call" />
        <Pan at={R} n={after} label="CLAIMED AFTER" kind="claim" />
      </svg>
    </div>
  );
}
