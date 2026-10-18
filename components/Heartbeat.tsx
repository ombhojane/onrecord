"use client";
import { useEffect, useState } from "react";
import { createPublicClient } from "@arkiv-network/sdk";
import { tiramisu } from "@arkiv-network/sdk/chains";
import { webSocket } from "viem";
import { RPC_WS } from "@/lib/config";

type Blip = { id: string; kind: "created" | "extended" | "deleted" | "other"; ours: boolean };

/**
 * The chain's pulse, live over a WebSocket subscription (watchEntityEvents with
 * no fromBlock, so it is a real socket, not polling). Red bars are our witness.
 */
export function Heartbeat({ witness }: { witness?: string }) {
  const [live, setLive] = useState(false);
  const [blips, setBlips] = useState<Blip[]>([]);
  const [n, setN] = useState(0);

  useEffect(() => {
    let unwatch: (() => void) | undefined;
    try {
      const client = createPublicClient({ chain: tiramisu, transport: webSocket(RPC_WS) });
      unwatch = client.watchEntityEvents({
        onEvent: (ev) => {
          setLive(true);
          setN((x) => x + 1);
          const kind =
            ev.type === "EntityCreated" ? "created" : ev.type === "ExpiryExtended" ? "extended" : ev.type === "EntityDeleted" ? "deleted" : "other";
          const owner = "owner" in ev ? String(ev.owner).toLowerCase() : "";
          setBlips((b) =>
            [...b, { id: `${ev.entityKey}-${ev.type}-${Math.random()}`, kind, ours: !!witness && owner === witness.toLowerCase() } as Blip].slice(-8),
          );
        },
        onError: () => setLive(false),
      });
      setLive(true);
    } catch {
      setLive(false);
    }
    return () => unwatch?.();
  }, [witness]);

  return (
    <div className={`beat${live ? " live" : ""}`} title="Arkiv Tiramisu · live entity events">
      <span className="pulse" />
      <span className="blips">
        {blips.map((b) => (
          <span key={b.id} className={`blip ${b.kind}${b.ours ? " ours" : ""}`} />
        ))}
      </span>
      <span className="n mono">{n}</span>
    </div>
  );
}
