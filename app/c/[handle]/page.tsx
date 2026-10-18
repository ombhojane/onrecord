import { caseFile, type CaseFile } from "@/lib/stats";
import { CaseBoard } from "@/components/CaseBoard";

export const dynamic = "force-dynamic";

export default async function CasePage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const channel = handle.replace(/[^A-Za-z0-9_]/g, "");
  let file: CaseFile;
  try {
    file = await caseFile(channel);
  } catch {
    file = {
      channel,
      items: [],
      counts: { call: 0, claim: 0, promo: 0, other: 0, deleted: 0, total: 0 },
      verdict: { word: "UNWITNESSED", tone: "ink" },
    };
  }

  return (
    <main className="wrap">
      <div className="case-head">
        <a href="/" className="back" aria-label="back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M11 18l-6-6 6-6" />
          </svg>
        </a>
        <h1>@{channel}</h1>
      </div>
      <CaseBoard file={file} />
    </main>
  );
}
