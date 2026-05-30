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
  const { classify } = await import("@/domain/buscador/classify");

  let classification;
  let source: "cursor" | "deterministic";
  let warning: string | undefined;

  try {
    getCursorApiKey();
    const resolved = await resolveTopicId(query);
    classification = buildClassificationFromTopicId(query, resolved.topicId);
    source = "cursor";
    warning = resolved.error;
  } catch (err) {
    classification = classify(query);
    source = "deterministic";
    const message = err instanceof Error ? err.message : "";
    if (message.includes("CURSOR_API_KEY")) {
      warning = "Clasificación determinista (CURSOR_API_KEY no configurada)";
    }
  }

  return NextResponse.json({
    classification,
    source,
    ...(warning !== undefined && { warning }),
  });
}
