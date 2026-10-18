import "./env";
import { createPublicClient } from "@arkiv-network/sdk";
import { tiramisu } from "@arkiv-network/sdk/chains";
import { http, formatEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const pub = createPublicClient({ chain: tiramisu, transport: http() });
console.log("chainId:", await pub.getChainId());

const ours = privateKeyToAccount(
  process.env.ONRECORD_PRIVATE_KEY as `0x${string}`,
).address;
const exampleKey =
  "0x3d05798f7d11bb1c10b83fed8d3b4d76570c31cd66c8e0a8d8d991434c6d7a5e" as const;
const example = privateKeyToAccount(exampleKey).address;

for (const [label, addr] of [
  ["witness", ours],
  ["sdk-example", example],
] as const) {
  const bal = await pub.getBalance({ address: addr });
  console.log(`${label} ${addr}: ${formatEther(bal)} GLM`);
}
