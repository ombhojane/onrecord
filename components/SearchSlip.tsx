"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function cleanHandle(raw: string) {
  return raw
    .trim()
    .replace(/^https?:\/\/(www\.)?t(elegram)?\.me\/(s\/)?/i, "")
    .replace(/^@/, "")
    .replace(/[/?#].*$/, "")
    .replace(/[^A-Za-z0-9_]/g, "");
}

export function SearchSlip() {
  const [v, setV] = useState("");
  const router = useRouter();
  const go = (e: React.FormEvent) => {
    e.preventDefault();
    const h = cleanHandle(v);
    if (h.length >= 3) router.push(`/c/${h}`);
  };
  return (
    <form className="slip" onSubmit={go}>
      <span className="at">@</span>
      <input
        value={v}
        onChange={(e) => setV(e.target.value)}
        placeholder="channel"
        autoComplete="off"
        spellCheck={false}
        aria-label="Telegram channel handle or link"
      />
      <button className="go" type="submit" aria-label="check the record">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </button>
    </form>
  );
}
