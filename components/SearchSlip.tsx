"use client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

/** Pip positions on a 3×3 grid (1 = top-left … 9 = bottom-right). */
const PIP_LAYOUT: Record<number, number[]> = {
  1: [5], 2: [1, 9], 3: [1, 5, 9], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9],
};
/** Like a real die, opposite faces sum to 7: front/back 1·6, top/bottom 2·5, right/left 3·4. */
const FACES = [
  ["front", 1], ["back", 6], ["top", 2], ["bottom", 5], ["right", 3], ["left", 4],
] as const;

function Cube() {
  return (
    <span className="cube" aria-hidden>
      {FACES.map(([f, n]) => (
        <span key={f} className={`face ${f}`}>
          {PIP_LAYOUT[n].map((p) => (
            <i key={p} style={{ gridArea: `${Math.ceil(p / 3)} / ${((p - 1) % 3) + 1}` }} />
          ))}
        </span>
      ))}
    </span>
  );
}

export function cleanHandle(raw: string) {
  return raw
    .trim()
    .replace(/^https?:\/\/(www\.)?t(elegram)?\.me\/(s\/)?/i, "")
    .replace(/^@/, "")
    .replace(/[/?#].*$/, "")
    .replace(/[^A-Za-z0-9_]/g, "");
}

export function SearchSlip({ pool = [] }: { pool?: string[] }) {
  const [v, setV] = useState("");
  const [rolling, setRolling] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const go = (e: React.FormEvent) => {
    e.preventDefault();
    const h = cleanHandle(v);
    if (h.length >= 3) startTransition(() => router.push(`/c/${h}`));
  };

  /** The dice: drops a random channel already on record straight into the slip. */
  function roll() {
    if (pool.length === 0) return;
    const others = pool.filter((p) => p !== cleanHandle(v));
    const pick = (others.length ? others : pool)[Math.floor(Math.random() * (others.length || pool.length))];
    setV(pick);
    setRolling(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setRolling(false), 600);
    inputRef.current?.focus();
  }

  return (
    <form className="slip" onSubmit={go}>
      <span className="at">@</span>
      <input
        ref={inputRef}
        className={rolling ? "rolled" : undefined}
        value={v}
        onChange={(e) => setV(e.target.value)}
        placeholder="channel"
        autoComplete="off"
        spellCheck={false}
        aria-label="Telegram channel handle or link"
      />
      {pool.length > 0 && (
        <button
          type="button"
          className={`dice${rolling ? " rolling" : ""}`}
          onClick={roll}
          aria-label="pick a channel already on record"
          title="try one on record"
        >
          <Cube />
        </button>
      )}
      <button className={`go${pending ? " busy" : ""}`} type="submit" aria-label="check the record" disabled={pending}>
        {pending ? (
          <span className="go-spin" aria-hidden />
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        )}
      </button>
    </form>
  );
}
