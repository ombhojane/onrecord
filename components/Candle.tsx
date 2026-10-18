/** Remaining Entity Expiration lifetime, drawn as a candle burning down. */
export function Candle({ left, life }: { left: number; life: number }) {
  const frac = Math.max(0, Math.min(1, life ? left / life : 0));
  return (
    <span className={`candle${left <= 0 ? " out" : ""}`} title={leftLabel(left)}>
      <span className="flame" />
      <span className="wick" />
      <span className="wax" style={{ height: 4 + Math.round(frac * 24) }} />
    </span>
  );
}

export function leftLabel(s: number) {
  if (s <= 0) return "expired";
  const d = Math.floor(s / 86400);
  if (d >= 1) return `${d}d`;
  const h = Math.floor(s / 3600);
  if (h >= 1) return `${h}h`;
  return `${Math.max(1, Math.floor(s / 60))}m`;
}

export function agoLabel(unix: number) {
  if (!unix) return "";
  const s = Math.floor(Date.now() / 1000) - unix;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
