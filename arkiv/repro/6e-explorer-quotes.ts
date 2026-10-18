// friction.md 6e — the Data Explorer only accepts single-quoted string literals.
// The SDK's own render() shows the accepted form. No key needed.
// Run: npx tsx arkiv/repro/6e-explorer-quotes.ts
import { and, eq, render } from "@arkiv-network/sdk/query";

console.log("paste this into data.arkiv.network (Tiramisu):");
console.log(" ", render(and(eq("app", "onrecord"), eq("type", "msg"), eq("channel", "bulltrade_observation"))));
console.log('the same with double quotes, app = str("onrecord") ..., is rejected with');
console.log('  "Query rejected (literal, -32003): Transaction creation failed."');
