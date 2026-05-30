import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const query =
    typeof body === "object" &&
    body !== null &&
    "query" in body &&
    typeof (body as { query: unknown }).query === "string"
      ? (body as { query: string }).query.trim()
      : "";

  if (!query) {
    return NextResponse.json({ error: "La consulta no puede estar vacía" }, { status: 400 });
  }

  const { getCursorApiKey } = await import("@/lib/cursor/get-api-key");
  const { resolveTopicId } = await import("@/lib/cursor/resolve-topic");
  const { buildClassificationFromTopicId } = await import(
    "@/domain/buscador/classification"
  );

  try {
    getCursorApiKey();
  } catch (err) {
    const message = err instanceof Error ? err.message : "CURSOR_API_KEY no configurada";
    return NextResponse.json({ error: message }, { status: 503 });
  }

  const resolved = await resolveTopicId(query);
  const classification = buildClassificationFromTopicId(query, resolved.topicId);

  return NextResponse.json({
    classification,
    source: "cursor" as const,
    ...(resolved.error !== undefined && { warning: resolved.error }),
  });
}
