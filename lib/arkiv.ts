import { createPublicClient, createWalletClient } from "@arkiv-network/sdk";
import { tiramisu } from "@arkiv-network/sdk/chains";
import { http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { RPC_HTTP } from "./config";

/** Attribute values read back as tagged `{ type, value }` objects — unwrap them. */
export function av(v: unknown): unknown {
  return v !== null && typeof v === "object" && "value" in v ? (v as { value: unknown }).value : v;
}
export function avStr(v: unknown): string | undefined {
  const x = av(v);
  return typeof x === "string" ? x : undefined;
}
export function avNum(v: unknown): number {
  const x = av(v);
  return typeof x === "bigint" ? Number(x) : typeof x === "number" ? x : Number.NaN;
}

export function publicClient() {
  return createPublicClient({ chain: tiramisu, transport: http(RPC_HTTP) });
}

export function walletClient() {
  const pk = process.env.ONRECORD_PRIVATE_KEY;
  if (!pk || !pk.startsWith("0x"))
    throw new Error("ONRECORD_PRIVATE_KEY missing — run: npm run wallet");
  return createWalletClient({
    chain: tiramisu,
    transport: http(RPC_HTTP),
    account: privateKeyToAccount(pk as `0x${string}`),
  });
}
