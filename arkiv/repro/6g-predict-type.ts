// friction.md 6g — the wallet client doc says it carries the public client's read
// actions, but predictEntityKeys is missing from its type AND at runtime. Type check: npx tsc --noEmit --strict --module esnext \
//   --moduleResolution bundler --target es2022 --skipLibCheck arkiv/repro/6g-predict-type.ts
// (passes only while the type is missing, thanks to @ts-expect-error)
// Runtime check (needs a key in .env.local): npx tsx arkiv/repro/6g-predict-type.ts
import "../../scripts/env";
import { walletClient } from "../../lib/arkiv";

const w = walletClient();
// @ts-expect-error SDK 0.8.1: Property 'predictEntityKeys' does not exist on the wallet client type
const fn = w.predictEntityKeys;
console.log("wallet client has predictEntityKeys at runtime:", typeof fn === "function");
