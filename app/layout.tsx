import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Archivo, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import { privateKeyToAccount } from "viem/accounts";
import { Defs } from "@/components/Stamp";
import { Heartbeat } from "@/components/Heartbeat";
import { DATA_EXPLORER, ownerUrl } from "@/lib/config";
import "./globals.css";

const sans = Archivo({ subsets: ["latin"], variable: "--font-sans", display: "swap", axes: ["wdth"] });
const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-serif", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: "OnRecord — show me the receipts",
  description: "Real track records for trading-tip channels, witnessed on Arkiv. Deleted calls become tombstones.",
};

/** Public address of the witness wallet; the key itself never leaves the server. */
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
          <a href="/" className="logo" aria-label="OnRecord home">
            <span className="lamp">ON</span>
            <span className="rec">RECORD</span>
          </a>
          <Heartbeat witness={witness} href={witness ? ownerUrl(witness) : `${DATA_EXPLORER}/?chain=tiramisu`} />
        </header>
        {children}
      </body>
    </html>
  );
}
