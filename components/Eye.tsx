"use client";
import { useEffect, useRef, useState } from "react";

export type Mood = "idle" | "stare" | "squint";

/** The Witness. It watches your cursor; it stares while witnessing; it squints at liars. */
export function Eye({ size = 120, mood = "idle" }: { size?: number; mood?: Mood }) {
  const ref = useRef<SVGSVGElement>(null);
  const [look, setLook] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const r = ref.current?.getBoundingClientRect();
      if (!r) return;
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const d = Math.hypot(dx, dy) || 1;
      const reach = Math.min(1, d / 260);
      setLook({ x: (dx / d) * 34 * reach, y: (dy / d) * 16 * reach });
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  const id = `eye${size}`;
  return (
    <svg
      ref={ref}
      className={`eye ${mood}`}
      width={size}
      height={size * 0.62}
      viewBox="-100 -62 200 124"
      aria-hidden
    >
      <defs>
        <clipPath id={id}>
          <path d="M-88 0 Q0 -66 88 0 Q0 66 -88 0Z" />
        </clipPath>
      </defs>
      <path
        d="M-58 -52 Q-6 -78 52 -56"
        fill="none"
        stroke="var(--ink)"
        strokeWidth="6"
        strokeLinecap="round"
        style={{ transform: mood === "stare" ? "translateY(-8px)" : mood === "squint" ? "translateY(10px) rotate(4deg)" : undefined, transition: "transform .4s var(--spring)" }}
      />
      <g className="lid">
        <path d="M-88 0 Q0 -66 88 0 Q0 66 -88 0Z" fill="var(--card)" stroke="var(--ink)" strokeWidth="5" strokeLinejoin="round" />
        <g clipPath={`url(#${id})`}>
          <g className="iris" style={{ transform: `translate(${look.x}px, ${look.y}px)` }}>
            <g className="iris-scale">
              <circle r="31" fill="var(--ink)" />
              <circle r="31" fill="none" stroke="var(--red)" strokeWidth="5" opacity=".9" />
              <circle cx="11" cy="-11" r="8" fill="var(--card)" />
            </g>
          </g>
        </g>
      </g>
    </svg>
  );
}
