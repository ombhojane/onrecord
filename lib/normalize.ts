/**
 * Tip channels obfuscate text with Unicode tricks to dodge moderation:
 * mathematical alphanumerics (𝐀𝐋𝐋 𝐓𝐑𝐀𝐃𝐄), regional-indicator letters (🇩 🇮 🇸),
 * zero-width joiners inside words. NFKC folds most of it back to ASCII;
 * regional indicators need an explicit map.
 */
const REGIONAL_A = 0x1f1e6;

export function normalize(raw: string): string {
  let s = raw.normalize("NFKC");
  // Regional indicator letters -> plain letters (🇩 -> D)
  s = s.replace(/[\u{1F1E6}-\u{1F1FF}]/gu, (ch) =>
    String.fromCharCode(65 + (ch.codePointAt(0)! - REGIONAL_A)),
  );
  // Strip zero-width chars used to break up words
  s = s.replace(/[​-‏⁠﻿]/g, "");
  // Collapse whitespace
  return s.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

export async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
