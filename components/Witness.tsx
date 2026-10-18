"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { txUrl } from "@/lib/config";
import { Om } from "./Om";

type Result = { written: number; tombs: number; calls: number; restricted: boolean; txHashes: string[] };

/** The seal. Press it and the witness reads the channel onto Arkiv in one atomic batch. */
export function Witness({ handle }: { handle: string }) {
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ ok: boolean; node: React.ReactNode } | null>(null);
  const router = useRouter();

  async function run() {
    setBusy(true);
    setToast(null);
    try {
      const r = await fetch("/api/sync", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ handle }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      const res = d as Result;
      const tx = res.txHashes.at(-1);
      setToast({
        ok: true,
        node: res.restricted ? (
          <span>this channel hides its public page</span>
        ) : res.written + res.tombs === 0 ? (
          <span>nothing new · already on record</span>
        ) : (
          <>
            <span>
              +{res.written} witnessed{res.tombs ? ` · ✝ ${res.tombs}` : ""}
            </span>
            {tx && (
              <a href={txUrl(tx)} target="_blank" rel="noreferrer">
                tx ↗
              </a>
            )}
          </>
        ),
      });
      router.refresh();
    } catch (e) {
      setToast({ ok: false, node: <span>{(e as Error).message}</span> });
    } finally {
      setBusy(false);
      setTimeout(() => setToast(null), 7000);
    }
  }

  return (
    <>
      <div className="printer">
        <button className="seal" onClick={run} disabled={busy} aria-label="witness this channel">
          <svg className="ring" viewBox="0 0 120 120" aria-hidden>
            <defs>
              <path id="sealpath" d="M60 60 m-48 0 a48 48 0 1 1 96 0 a48 48 0 1 1 -96 0" />
            </defs>
            <text>
              <textPath href="#sealpath">{busy ? "witnessing · witnessing · " : "witness · on record · "}</textPath>
            </text>
          </svg>
          <Om name="magnifier" size={58} className={busy ? "seal-om busy" : "seal-om"} />
        </button>
        {busy && (
          <div className="printing" aria-hidden>
            {Array.from({ length: 9 }).map((_, i) => (
              <i key={i} style={{ width: `${55 + ((i * 29) % 40)}%` }} />
            ))}
          </div>
        )}
      </div>
      {toast && <div className={`toast${toast.ok ? "" : " bad"}`}>{toast.node}</div>}
    </>
  );
}
