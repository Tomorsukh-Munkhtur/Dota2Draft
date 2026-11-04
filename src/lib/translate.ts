// Мэдээг Claude API-аар монгол хэл рүү орчуулна. ANTHROPIC_API_KEY (.env.local) шаардлагатай.
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";

const Translation = z.object({
  title: z.string(),
  summary: z.string(),
  body: z.string(),
});

export type NewsTranslation = z.infer<typeof Translation>;

const SYSTEM = `You translate official Dota 2 news posts from English into natural, fluent Mongolian (Cyrillic) for a Mongolian Dota 2 fan site whose readers include many new players.

Return:
- title: the translated headline.
- summary: one or two Mongolian sentences summarizing the post for a news card.
- body: the full translation of the body, keeping its Markdown structure exactly — headings, lists, bold/italic, links and image lines. Keep every URL and every image line (![](...)) unchanged. Translate link text.

Translate everything faithfully; do not add commentary or drop sentences. Keep Dota hero, ability, item, cosmetic set, event, team and tournament names in their original English (e.g. "Black King Bar", "The International", "Team Spirit"). Patch numbers and dates stay as written. Use the Dota terms Mongolian players use: stun → стан, cooldown → cooldown, carry → керри, support → саппорт, lane → лайн, patch → патч, Immortal → Immortal, Arcana → Arcana.`;

let client: Anthropic | null = null;

export async function translateNews(title: string, body: string): Promise<NewsTranslation> {
  // Түлхүүргүй үед сайт бүхэлдээ унахгүйн тулд клиентийг анх хэрэглэх үед үүсгэнэ.
  client ??= new Anthropic();
  const response = await client.beta.messages.parse({
    model: "claude-opus-5-5",
    max_tokens: 16000,
    // Аюулгүй байдлын шүүлтүүр татгалзвал Anthropic-ийн санал болгосон загвар руу автоматаар шилжинэ.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "medium", format: betaZodOutputFormat(Translation) },
    system: SYSTEM,
    messages: [{ role: "user", content: `<title>${title}</title>\n<body>\n${body}\n</body>` }],
  });

  if (response.stop_reason === "refusal") throw new Error("Claude энэ мэдээг орчуулахаас татгалзлаа.");
  if (response.stop_reason === "max_tokens") throw new Error("Мэдээ хэт урт байна — орчуулга дундаа тасарсан.");
  if (!response.parsed_output) throw new Error("Орчуулгын хариуг уншиж чадсангүй.");
  return response.parsed_output;
}

/** Алдааг админд харуулах монгол мессеж болгоно. */
export function describeTranslateError(error: unknown) {
  if (error instanceof Anthropic.AuthenticationError)
    return "Claude API түлхүүр буруу эсвэл тохируулаагүй байна (.env.local дахь ANTHROPIC_API_KEY).";
  if (error instanceof Anthropic.RateLimitError) return "Claude API-ийн хязгаарт хүрлээ — түр хүлээгээд дахин оролдоно уу.";
  if (error instanceof Anthropic.APIError) return `Claude API алдаа (${error.status}): ${error.message}`;
  if (error instanceof Error && /api key|apiKey|authentication/i.test(error.message))
    return "Claude API түлхүүр тохируулаагүй байна (.env.local дахь ANTHROPIC_API_KEY).";
  return error instanceof Error ? error.message : String(error);
}
