import { isValidUpdateToken } from "@/lib/updateToken";
import { runGameDataUpdate } from "@/lib/updater";

/** Автомат шинэчлэлтийн хуваарь (src/instrumentation.ts) энэ хаягийг дуудна. */
export async function POST(request: Request) {
  if (!isValidUpdateToken(request.headers.get("x-update-token"))) {
    return new Response("Forbidden", { status: 403 });
  }
  const force = new URL(request.url).searchParams.get("force") === "1";
  return Response.json(await runGameDataUpdate({ force }));
}
