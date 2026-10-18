// Unit tests for the message classifier and the verdict rules. Run: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { classify } from "../lib/classify";
import { verdictOf } from "../lib/stats";

test("a post with entry, target and stop-loss is a call, and its numbers are parsed", () => {
  const c = classify("BUY BANKNIFTY 52000 CE @ 210 TGT 260 SL 180");
  assert.equal(c.kind, "call");
  assert.equal(c.call?.side, "buy");
  assert.equal(c.call?.target, 260);
  assert.equal(c.call?.stoploss, 180);
});

test("a profit post after the fact is a claim, not a call", () => {
  // the pattern from our pitch: no call was posted before the move
  assert.equal(classify("Buy 440 / Profit booked 565 / All tgt done").kind, "claim");
  assert.equal(classify("ACCOUNT HANDLING LIVE PROFIT BOOKED ✅").kind, "claim");
});

test("a membership pitch with no trade content is promo", () => {
  assert.equal(classify("Join premium group now, lifetime 4500/- pay via UPI").kind, "promo");
});

test("chatter and price ticks with no instruction stay 'other'", () => {
  assert.equal(classify("232🔥").kind, "other");
  assert.equal(classify("Good morning traders").kind, "other");
});

test("verdicts follow the record, in priority order", () => {
  const n = { call: 0, claim: 0, promo: 0, deleted: 0, total: 0 };
  assert.equal(verdictOf(n).word, "UNWITNESSED");
  // any witnessed deletion outranks everything else
  assert.equal(verdictOf({ ...n, call: 5, deleted: 1, total: 10 }).word, "SHREDDER");
  // @bulltrade_observation: 4 profit claims, 0 calls posted first
  assert.equal(verdictOf({ ...n, claim: 4, promo: 3, total: 20 }).word, "NO RECEIPTS");
  assert.equal(verdictOf({ ...n, call: 3, claim: 2, total: 10 }).word, "ON RECORD");
  assert.equal(verdictOf({ ...n, promo: 6, total: 10 }).word, "ALL HYPE");
  assert.equal(verdictOf({ ...n, total: 20 }).word, "QUIET");
});
