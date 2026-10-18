import { allCases, type CaseSummary } from "@/lib/stats";
import { Eye } from "@/components/Eye";
import { SearchSlip } from "@/components/SearchSlip";
import { Stamp } from "@/components/Stamp";
import { KIND_COLOR } from "@/lib/kinds";

export const dynamic = "force-dynamic";

export default async function Home() {
  let cases: CaseSummary[] = [];
  try {
    cases = await allCases();
  } catch {}

  return (
    <main className="wrap">
      <section className="hero">
        <Eye size={190} />
        <h1>
          Show me the <em>receipts.</em>
        </h1>
        <p className="sub">
          <b>93%</b> of F&amp;O traders lost money. Check who they followed.
        </p>
        <SearchSlip />
      </section>

      {cases.length > 0 && (
        <section className="cases">
          {cases.map((c) => (
            <a key={c.channel} href={`/c/${c.channel}`} className="folder">
              <div className="h">@{c.channel}</div>
              <div className="tally">
                <span><i className="sw" style={{ background: KIND_COLOR.call }} />{c.counts.call}</span>
                <span><i className="sw" style={{ background: KIND_COLOR.claim }} />{c.counts.claim}</span>
                {c.counts.deleted > 0 && <span><i className="sw" style={{ background: KIND_COLOR.deleted }} />{c.counts.deleted}</span>}
              </div>
              <span className="mini">
                <Stamp verdict={c.verdict} size="small" />
              </span>
            </a>
          ))}
        </section>
      )}
    </main>
  );
}
