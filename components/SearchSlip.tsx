"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

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
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const router = useRouter();

  const go = (e: React.FormEvent) => {
    e.preventDefault();
    const h = cleanHandle(v);
    if (h.length >= 3) router.push(`/c/${h}`);
  };

  /** The dice: pulls a random channel already on record and types it in. */
  function roll() {
    if (pool.length === 0 || rolling) return;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    setRolling(true);
    setV("");
    if (timer.current) clearInterval(timer.current);
    let i = 0;
    timer.current = setInterval(() => {
      i++;
      setV(pick.slice(0, i));
      if (i >= pick.length) {
        if (timer.current) clearInterval(timer.current);
        setRolling(false);
        inputRef.current?.focus();
      }
    }, 26);
  }

  return (
    <form className="slip" onSubmit={go}>
      <span className="at">@</span>
      <input
        ref={inputRef}
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
          <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden>
            <rect x="2" y="2" width="22" height="22" rx="6" fill="var(--card)" stroke="currentColor" strokeWidth="2.4" />
            <circle cx="8.5" cy="8.5" r="2" fill="currentColor" />
            <circle cx="17.5" cy="8.5" r="2" fill="currentColor" />
            <circle cx="13" cy="13" r="2" fill="currentColor" />
            <circle cx="8.5" cy="17.5" r="2" fill="currentColor" />
            <circle cx="17.5" cy="17.5" r="2" fill="currentColor" />
          </svg>
        </button>
      )}
      <button className="go" type="submit" aria-label="check the record">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </button>
    </form>
  );
}
