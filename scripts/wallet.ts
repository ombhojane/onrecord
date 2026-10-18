import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { appendFileSync, existsSync, readFileSync } from "node:fs";

const envPath = new URL("../.env.local", import.meta.url).pathname;

if (existsSync(envPath) && readFileSync(envPath, "utf8").includes("ONRECORD_PRIVATE_KEY=0x")) {
  const pk = readFileSync(envPath, "utf8").match(/ONRECORD_PRIVATE_KEY=(0x[0-9a-fA-F]{64})/)?.[1];
  if (pk) {
    console.log("Existing witness wallet:", privateKeyToAccount(pk as `0x${string}`).address);
    process.exit(0);
  }
}

const pk = generatePrivateKey();
const account = privateKeyToAccount(pk);
appendFileSync(envPath, `\nONRECORD_PRIVATE_KEY=${pk}\n`);
console.log("New witness wallet:", account.address);
console.log("Fund it with test GLM at https://hub.arkiv.network/faucet");
