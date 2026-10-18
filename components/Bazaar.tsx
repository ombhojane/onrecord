import { CAST, sizeK } from "@/lib/cast";

/**
 * The tip-bazaar crowd: one sprite per character, each bobbing on its own beat.
 * Sprites share one scale (see scripts/trim-cast.mts), so heads stay the same size.
 */
export function Bazaar() {
  return (
    <figure className="bazaar" aria-hidden>
      <div className="cast">
        {CAST.map((c, i) => (
          <span
            key={c.name}
            className="extra"
            style={{
              ["--d" as string]: `${(i * 0.37) % 2.6}s`,
              ["--z" as string]: i % 2 ? 2 : 1,
              ["--k" as string]: sizeK(c.name),
            }}
          >
            <span className="say">{c.line}</span>
            <img src={`/cast/${c.name}.png`} alt="" draggable={false} />
          </span>
        ))}
      </div>
    </figure>
  );
}
