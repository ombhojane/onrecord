/**
 * Witness ingestion for PUBLIC Telegram channels via the t.me/s/<handle>
 * preview endpoint. No Telegram account, no API key, nobody's permission —
 * anyone can run this witness and co-attest the same channel.
 */
export interface ChannelMessage {
  msgId: number; // Telegram per-channel sequential id — gaps betray deletions
  raw: string; // inner text of the message (may be empty for pure-image posts)
  hasMedia: boolean;
  postedAt?: string; // ISO timestamp from the page, when present
}

export interface ChannelPage {
  handle: string;
  title?: string;
  subscribers?: string;
  messages: ChannelMessage[];
}

const MSG_BLOCK =
  /<div class="tgme_widget_message[^"]*" data-post="([^/]+)\/(\d+)"[\s\S]*?(?=<div class="tgme_widget_message[^"]*" data-post="|$)/g;

function innerText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .trim();
}

export async function fetchChannel(handle: string): Promise<ChannelPage> {
  const clean = handle.replace(/^@/, "").replace(/[^A-Za-z0-9_]/g, "");
  const res = await fetch(`https://t.me/s/${clean}`, {
    headers: { "user-agent": "Mozilla/5.0 (OnRecord witness)" },
  });
  if (!res.ok) throw new Error(`t.me/s/${clean} -> HTTP ${res.status}`);
  const html = await res.text();

  const title = html.match(
    /<meta property="og:title" content="([^"]*)"/,
  )?.[1];
  const subscribers = html.match(/([\d\s,.]+)\s*subscribers/)?.[1]?.trim();

  const messages: ChannelMessage[] = [];
  for (const m of html.matchAll(MSG_BLOCK)) {
    const msgId = Number(m[2]);
    const block = m[0];
    const textHtml =
      block.match(
        /<div class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/,
      )?.[1] ?? "";
    const postedAt = block.match(/<time datetime="([^"]+)"/)?.[1];
    messages.push({
      msgId,
      raw: innerText(textHtml),
      hasMedia: /tgme_widget_message_photo|tgme_widget_message_video/.test(
        block,
      ),
      postedAt,
    });
  }
  // The preview page can repeat blocks; keep the last occurrence per id.
  const byId = new Map(messages.map((m) => [m.msgId, m]));
  return {
    handle: clean,
    title,
    subscribers,
    messages: [...byId.values()].sort((a, b) => a.msgId - b.msgId),
  };
}
