import { NextRequest, NextResponse } from "next/server";
import { ExpirationTime } from "@arkiv-network/sdk/utils";
import { avStr, publicClient, walletClient } from "@/lib/arkiv";
import { EXTEND_DAYS } from "@/lib/config";

export const dynamic = "force-dynamic";

const lastRun = new Map<string, number>();

/**
 * Lifetime Extension: push a piece of evidence EXTEND_DAYS further out.
 * Evidence entities carry `permissionlessExtension`, so this is a right any
 * wallet has; the server wallet just pays for visitors without one.
 */
export async function POST(req: NextRequest) {
  try {
    const { key } = await req.json();
    if (typeof key !== "string" || !/^0x[0-9a-fA-F]{64}$/.test(key))
      return NextResponse.json({ error: "bad key" }, { status: 400 });
    if (Date.now() - (lastRun.get(key) ?? 0) < 20_000)
      return NextResponse.json({ error: "already extended — give it a moment" }, { status: 429 });
    lastRun.set(key, Date.now());

    const pub = publicClient();
    const entity = await pub.getEntity(key as `0x${string}`);
    const type = avStr(entity.attributes?.type);
    if (avStr(entity.attributes?.app) !== "onrecord" || (type !== "msg" && type !== "tomb"))
      return NextResponse.json({ error: type === "call" ? "calls die with their validity" : "not OnRecord evidence" }, { status: 400 });
    const { blockDuration } = await pub.getBlockTiming();
    const blocks = BigInt(Math.round((EXTEND_DAYS * 86400) / (blockDuration || 2)));
    const current = entity.expiresAt ?? 0n;

    const { txHash, expiresAt } = await walletClient().extendEntity({
      entityKey: key as `0x${string}`,
      expires: ExpirationTime.atBlock(current + blocks),
    });
    return NextResponse.json({ txHash, expiresAt: expiresAt.toString() });
  } catch (e) {
    const msg = (e as Error).message ?? "failed";
    return NextResponse.json(
      { error: /insufficient funds|gas/i.test(msg) ? "witness wallet is out of test GLM" : msg.slice(0, 200) },
      { status: 500 },
    );
  }
}
