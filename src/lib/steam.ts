// Steam-ийн албан ёсны Dota 2 мэдээг татаж Markdown болгоно.
// Энэ файл next/* импортлохгүй тул scripts/ дотроос node-оор шууд ажиллуулж болно.
import type { NewsItem } from "./newsStore.ts";

const STEAM_NEWS =
  "https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=570&maxlength=0&feeds=steam_community_announcements";
const CLAN_IMAGE = "https://clan.akamai.steamstatic.com/images";

type SteamNewsItem = {
  gid: string;
  title: string;
  author: string;
  contents: string;
  date: number;
};

const LEFTOVER_TAGS =
  /\[\/?(?:p|u|s|strike|spoiler|noparse|table|tr|td|th|code|img|url|list|olist|\*|h[1-6]|b|i|hr|quote|previewyoutube|video)(?:[=\s][^\]]*)?\]/gi;

/** Steam-ийн BBCode-ийг Markdown болгоно. */
export function bbcodeToMarkdown(src: string): string {
  let s = src.replace(/\r\n/g, "\n").replace(/\{STEAM_CLAN(?:_LOC)?_IMAGE\}/g, CLAN_IMAGE);
  s = s.replace(/\[img(?:\s+src="([^"]*)")?\]([^[]*)\[\/img\]/gi, (_, a: string, b: string) => {
    const url = (a || b).trim();
    return url ? `\n\n![](${url})\n\n` : "";
  });
  s = s.replace(/\[url=["']?([^\]"']+)["']?\]([\s\S]*?)\[\/url\]/gi, "[$2]($1)");
  s = s.replace(/\[previewyoutube=([^;\]]+)[^\]]*\]\s*\[\/previewyoutube\]/gi, "\n\n[YouTube](https://www.youtube.com/watch?v=$1)\n\n");
  s = s.replace(/\[h1\]([\s\S]*?)\[\/h1\]/gi, "\n\n## $1\n\n");
  s = s.replace(/\[h2\]([\s\S]*?)\[\/h2\]/gi, "\n\n## $1\n\n");
  s = s.replace(/\[h3\]([\s\S]*?)\[\/h3\]/gi, "\n\n### $1\n\n");
  s = s.replace(/\[b\]([\s\S]*?)\[\/b\]/gi, "**$1**");
  s = s.replace(/\[i\]([\s\S]*?)\[\/i\]/gi, "*$1*");
  s = s.replace(/\[(o?list)\]([\s\S]*?)\[\/\1\]/gi, (_, kind: string, body: string) => {
    const lines = body
      .split(/\[\*\]/)
      .map((t) => t.replace(/\s+/g, " ").trim())
      .filter(Boolean)
      .map((t, i) => (kind.toLowerCase() === "olist" ? `${i + 1}. ${t}` : `- ${t}`));
    return `\n\n${lines.join("\n")}\n\n`;
  });
  s = s.replace(/\[hr\](?:\[\/hr\])?/gi, "\n\n---\n\n");
  s = s.replace(/\[quote[^\]]*\]([\s\S]*?)\[\/quote\]/gi, (_, t: string) =>
    t
      .trim()
      .split("\n")
      .map((l) => `> ${l}`)
      .join("\n"),
  );
  s = s.replace(/\[p\]([\s\S]*?)\[\/p\]/gi, "$1\n\n");
  s = s.replace(LEFTOVER_TAGS, "");
  return s.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function firstImage(markdown: string) {
  return markdown.match(/!\[\]\((\S+?)\)/)?.[1] ?? null;
}

export async function fetchSteamNews(count = 20): Promise<NewsItem[]> {
  const res = await fetch(`${STEAM_NEWS}&count=${count}`, { signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`Steam API: HTTP ${res.status}`);
  const json = (await res.json()) as { appnews: { newsitems: SteamNewsItem[] } };
  return json.appnews.newsitems.map((n) => {
    const bodyEn = bbcodeToMarkdown(n.contents);
    return {
      id: n.gid,
      sourceUrl: `https://store.steampowered.com/news/app/570/view/${n.gid}`,
      author: n.author,
      date: new Date(n.date * 1000).toISOString(),
      image: firstImage(bodyEn),
      titleEn: n.title,
      bodyEn,
      titleMn: null,
      summaryMn: null,
      bodyMn: null,
      status: "draft",
      translatedAt: null,
      publishedAt: null,
    };
  });
}
