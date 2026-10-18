import { and, eq } from "@arkiv-network/sdk/query";
import { u64 } from "@arkiv-network/sdk/attr";
import { ExpirationTime, jsonToPayload } from "@arkiv-network/sdk/utils";
import { avNum, publicClient, walletClient } from "./arkiv";
import { APP_TAG, BURN, LIFETIME_DAYS, WITNESS } from "./config";
import { classify } from "./classify";
import { sha256Hex } from "./normalize";
import { fetchChannel } from "./ingest";

const now = () => Math.floor(Date.now() / 1000);
const BATCH = 20;

type Create = Parameters<ReturnType<typeof walletClient>["createEntity"]>[0];

async function existingIds(channel: string, type: "msg" | "tomb") {
  const ids = new Set<number>();
  for await (const e of publicClient()
    .select({ attributes: true })
    .where(and(eq("app", APP_TAG), eq("type", type), eq("channel", channel))).createdBy(WITNESS)) {
    const id = avNum(e.attributes?.msg_id);
    if (Number.isFinite(id)) ids.add(id);
  }
  return ids;
}

export interface SyncResult {
  channel: string;
  title?: string;
  visible: number;
  written: number;
  calls: number;
  tombs: number;
  txHashes: string[];
  restricted: boolean;
}

/**
 * One witness pass over a public channel, written as atomic batches: the
 * page snapshot lands in a single block, so "we saw it" has one timestamp.
 *
 * Evidence (msg, tomb) is created `readonly` — not even this witness can
 * edit its own testimony — and with `permissionlessExtension`, so anyone can
 * keep contested evidence alive. Calls are readonly but NOT extendable: a tip
 * dies with its own validity.
 */
export async function syncChannel(handle: string): Promise<SyncResult> {
  const page = await fetchChannel(handle);
  const result: SyncResult = {
    channel: page.handle,
    title: page.title,
    visible: page.messages.length,
    written: 0,
    calls: 0,
    tombs: 0,
    txHashes: [],
    restricted: page.messages.length === 0,
  };
  if (result.restricted) return result;

  const [seen, tombed] = await Promise.all([
    existingIds(page.handle, "msg"),
    existingIds(page.handle, "tomb"),
  ]);
  const visible = new Set(page.messages.map((m) => m.msgId));
  const lo = Math.min(...visible);
  const hi = Math.max(...visible);
  const t = BigInt(now());
  const evidence = { readonly: true, permissionlessExtension: true } as const;

  const creates: Create[] = [];

  for (const m of page.messages) {
    if (seen.has(m.msgId)) continue;
    const c = classify(m.raw);
    const sha256 = await sha256Hex(`${page.handle}/${m.msgId}:${c.text}`);
    creates.push({
      payload: jsonToPayload({
        v: 1,
        channel: page.handle,
        msgId: m.msgId,
        kind: c.kind,
        // text only for market statements; promos & chatter are hash-only
        text: c.kind === "call" || c.kind === "claim" ? c.text : undefined,
        hasMedia: m.hasMedia,
        postedAt: m.postedAt,
        sha256,
      }),
      contentType: "application/json",
      attributes: {
        app: APP_TAG,
        type: "msg",
        channel: page.handle,
        msg_id: u64(BigInt(m.msgId)),
        kind: c.kind,
        content_hash: sha256,
        seen_at: u64(t),
      },
      expires: ExpirationTime.fromDays(LIFETIME_DAYS.msg),
      flags: evidence,
    });
    result.written++;

    if (c.kind === "call" && c.call && (c.call.target || c.call.stoploss)) {
      creates.push({
        payload: jsonToPayload({ v: 1, channel: page.handle, msgId: m.msgId, ...c.call, committedAt: now() }),
        contentType: "application/json",
        attributes: {
          app: APP_TAG,
          type: "call",
          channel: page.handle,
          msg_id: u64(BigInt(m.msgId)),
          instrument: c.call.instrument ?? "unknown",
          side: c.call.side ?? "unknown",
          seen_at: u64(t),
        },
        expires: ExpirationTime.fromDays(LIFETIME_DAYS.call),
        flags: { readonly: true },
      });
      result.calls++;
    }
  }

  for (const id of seen) {
    if (id < lo || id > hi || visible.has(id) || tombed.has(id)) continue;
    creates.push({
      payload: jsonToPayload({
        v: 1,
        channel: page.handle,
        msgId: id,
        confirmedGoneAt: now(),
        note: "witnessed on-chain earlier; absent from the public page within its visible range",
      }),
      contentType: "application/json",
      attributes: {
        app: APP_TAG,
        type: "tomb",
        channel: page.handle,
        msg_id: u64(BigInt(id)),
        seen_at: u64(t),
      },
      expires: ExpirationTime.fromDays(LIFETIME_DAYS.tomb),
      flags: evidence,
    });
    result.tombs++;
  }

  if (creates.length === 0) return result;
  const wallet = walletClient();
  const balance = await publicClient().getBalance({ address: wallet.account.address });
  if (balance === 0n) throw new Error("witness wallet needs test GLM");
  for (let i = 0; i < creates.length; i += BATCH) {
    // Predict each create's key so the SAME transaction can hand it to BURN:
    // there is never a block in which the witness could delete what it wrote.
    const chunk = creates.slice(i, i + BATCH);
    const keys = await publicClient().predictEntityKeys({ owner: wallet.account.address, count: chunk.length });
    const { txHash } = await wallet.executeBatch({
      creates: chunk.map((c, j) => ({ ...c, salt: keys[j].salt })),
      ownershipChanges: keys.map((k) => ({ entityKey: k.key, newOwner: BURN })),
    });
    result.txHashes.push(txHash);
  }
  return result;
}
