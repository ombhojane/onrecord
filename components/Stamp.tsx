import type { Verdict } from "@/lib/stats";

export function Stamp({ verdict, size = "big" }: { verdict: Verdict; size?: "big" | "small" }) {
  return <div className={`stamp ${verdict.tone} ${size}`}>{verdict.word}</div>;
}

/** Shared SVG filters: the rough-ink edge every stamp is printed through. */
export function Defs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
      <filter id="rough" x="-10%" y="-20%" width="120%" height="140%">
        <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" result="warp" />
        <feDisplacementMap in="SourceGraphic" in2="warp" scale="3.5" result="edge" />
        <feTurbulence type="fractalNoise" baseFrequency="1.25" numOctaves="1" seed="3" result="grain" />
        <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -3 2.75" result="holes" />
        <feComposite in="edge" in2="holes" operator="in" />
      </filter>
    </svg>
  );
}
