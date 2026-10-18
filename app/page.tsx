import { allCases } from "@/lib/stats";
import { SearchSlip } from "@/components/SearchSlip";
import { Bazaar } from "@/components/Bazaar";

export const dynamic = "force-dynamic";

export default async function Home() {
  let pool: string[] = [];
  try {
    pool = (await allCases()).map((c) => c.channel);
  } catch {}

  return (
    <main>
      <section className="stage">
        <div className="stage-inner">
          <h1 className="stage-title">
            <span className="l1">Tipsters delete their losses.</span>
            <span className="l2">We keep the receipts.</span>
          </h1>
          <p className="dek">Check any Telegram stock‑tip channel before you pay.</p>
          <div className="stage-search">
            <SearchSlip pool={pool} />
          </div>
        </div>
        <Bazaar />
      </section>
    </main>
  );
}
