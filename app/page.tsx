import { allCases } from "@/lib/stats";
import { SearchSlip } from "@/components/SearchSlip";

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
          <p className="kicker">Telegram tip channels, held to their word</p>
          <h1 className="stage-title">
            Tipsters delete their losses.
            <br />
            <em>We keep the receipts.</em>
          </h1>
          <aside className="stage-meta l">
            <b>Witnessed on Arkiv</b>
            <span>every post, notarised</span>
          </aside>
          <aside className="stage-meta r">
            <b>₹1.8 lakh crore lost</b>
            <span>93% of F&O traders · SEBI</span>
          </aside>
          <div className="stage-search">
            <SearchSlip pool={pool} />
          </div>
        </div>
        <figure className="bazaar" aria-hidden>
          <div className="bazaar-row">
            <img src="/art/crowd_a.png" alt="" draggable={false} />
            <img src="/art/crowd_b.png" alt="" draggable={false} className="b" />
          </div>
        </figure>
      </section>
    </main>
  );
}
