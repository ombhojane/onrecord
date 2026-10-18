import { NextRequest, NextResponse } from "next/server";
import { syncChannel } from "@/lib/witness";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// The witness pays gas from one wallet; a per-channel cooldown keeps a public
// button from draining it.
const lastRun = new Map<string, number>();
const COOLDOWN_MS = 30_000;

export async function POST(req: NextRequest) {
  try {
    const { handle } = await req.json();
    if (typeof handle !== "string" || !/^[A-Za-z0-9_]{3,40}$/.test(handle))
      return NextResponse.json({ error: "bad handle" }, { status: 400 });
    const key = handle.toLowerCase();
    const prev = lastRun.get(key) ?? 0;
    if (Date.now() - prev < COOLDOWN_MS)
      return NextResponse.json(
        { error: "just witnessed — try again in a moment" },
        { status: 429 },
      );
    lastRun.set(key, Date.now());
    return NextResponse.json(await syncChannel(handle));
  } catch (e) {
    const msg = (e as Error).message ?? "failed";
    const broke = /insufficient funds|gas|needs test GLM/i.test(msg);
    return NextResponse.json(
      { error: broke ? "witness wallet is out of test GLM" : msg.slice(0, 200) },
      { status: 500 },
    );
  }
}
