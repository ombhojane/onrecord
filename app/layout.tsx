import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Bricolage_Grotesque, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import { privateKeyToAccount } from "viem/accounts";
import { Defs } from "@/components/Stamp";
import { Heartbeat } from "@/components/Heartbeat";
import { ownerUrl } from "@/lib/config";
import "./globals.css";

const sans = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-serif", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: "OnRecord — show me the receipts",
  description: "Real track records for trading-tip channels, witnessed on Arkiv. Deleted calls become tombstones.",
};

function witnessAddress() {
  const pk = process.env.ONRECORD_PRIVATE_KEY;
  try {
    return pk?.startsWith("0x") ? privateKeyToAccount(pk as `0x${string}`).address : undefined;
  } catch {
    return undefined;
  }
}

export default function RootLayout({ children }: { children: ReactNode }) {
  const witness = witnessAddress();
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} ${mono.variable}`}>
      <body>
        <Defs />
        <header className="topbar">
          <a href="/" className="wordmark">
            <img src="/om/receipt.svg" width={30} height={30} alt="" className="logo-om" />
            <b>On</b>
            <i>Record</i>
          </a>
          <Heartbeat witness={witness} />
        </header>
        {children}
        <footer className="foot">
          not investment advice · witnessed on Arkiv Tiramisu
          {witness && (
            <>
              {" · "}
              <a href={ownerUrl(witness)} target="_blank" rel="noreferrer" className="mono">
                {witness.slice(0, 6)}…{witness.slice(-4)}
              </a>
            </>
          )}
          {" · "}
          emoji by{" "}
          <a href="https://openmoji.org" target="_blank" rel="noreferrer">
            OpenMoji
          </a>{" "}
          (CC BY-SA 4.0)
        </footer>
      </body>
    </html>
  );
}
