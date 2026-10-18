export const APP_TAG = "onrecord" as const;

export const RPC_HTTP =
  process.env.ARKIV_RPC_HTTP ??
  "https://rpc.tiramisu.db-chain.testnet.arkiv.network";
export const RPC_WS =
  process.env.NEXT_PUBLIC_ARKIV_RPC_WS ??
  "wss://rpc.tiramisu.db-chain.testnet.arkiv.network";

export const EXPLORER = "https://tiramisu.explorer.arkiv.network";
export const DATA_EXPLORER = "https://data.arkiv.network";

export const entityUrl = (key: string) =>
  `${DATA_EXPLORER}/entity/${key}?chain=tiramisu`;
export const ownerUrl = (addr: string) =>
  `${DATA_EXPLORER}/owner/${addr}?chain=tiramisu`;
export const txUrl = (hash: string) => `${EXPLORER}/tx/${hash}`;

/** Lifetimes, in days — see arkiv/schema.md for the reasoning per type. */
export const LIFETIME_DAYS = {
  msg: 60, // raw witness records age out once graded
  call: 3, // a tip is a time-scoped claim; it dies with its validity
  tomb: 180, // deletion evidence outlives the messages it indicts
} as const;

export const EXTEND_DAYS = 30;
