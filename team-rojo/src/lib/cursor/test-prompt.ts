import { Agent, Cursor, CursorAgentError } from "@cursor/sdk";
import { getCursorApiKey } from "./get-api-key";

/** Prompt mínimo para verificar conectividad con la API de Cursor. */
export const CURSOR_TEST_PROMPT = `Eres un asistente de prueba para el buscador de información pública de Civio (Ship for Good).

Responde ÚNICAMENTE con este JSON válido, sin markdown ni texto adicional:
{"ok":true,"message":"cursor-connected"}`;

export type CursorPingPayload = {
  ok: boolean;
  message: string;
};

export type CursorAuthCheck = {
  ok: boolean;
  apiKeyName?: string;
  userEmail?: string;
  modelCount?: number;
  error?: string;
};

export type CursorPingResult = {
  success: boolean;
  auth: CursorAuthCheck;
  runStatus: string;
  rawText: string;
  parsed: CursorPingPayload | null;
  error?: string;
};

function extractJsonObject(text: string): CursorPingPayload | null {
  const match = text.match(/\{[\s\S]*"ok"[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]) as CursorPingPayload;
    if (typeof parsed.ok === "boolean" && typeof parsed.message === "string") {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

/** Verifica que la API key es válida (sin lanzar un agente). */
export async function verifyCursorAuth(): Promise<CursorAuthCheck> {
  const apiKey = getCursorApiKey();

  try {
    const me = await Cursor.me({ apiKey });
    const models = await Cursor.models.list({ apiKey });
    return {
      ok: true,
      apiKeyName: me.apiKeyName,
      userEmail: me.userEmail,
      modelCount: models.length,
    };
  } catch (err) {
    const message =
      err instanceof CursorAgentError
        ? `${err.message} (retryable=${err.isRetryable})`
        : err instanceof Error
          ? err.message
          : String(err);
    return { ok: false, error: message };
  }
}

/**
 * Ejecuta un one-shot contra Cursor Agent API para validar la API key.
 * Requiere CURSOR_API_KEY y ejecutarse desde el directorio team-rojo (cwd local).
 * En cuentas Free el agente puede fallar con plan_required; usa auth.ok como mínimo.
 */
export async function runCursorPingTest(): Promise<CursorPingResult> {
  const apiKey = getCursorApiKey();
  const cwd = process.cwd();
  const auth = await verifyCursorAuth();

  if (!auth.ok) {
    return {
      success: false,
      auth,
      runStatus: "auth_failed",
      rawText: "",
      parsed: null,
      error: auth.error ?? "Autenticación fallida",
    };
  }

  try {
    const result = await Agent.prompt(CURSOR_TEST_PROMPT, {
      apiKey,
      model: { id: "composer-2.5" },
      local: { cwd, settingSources: [] },
    });

    const rawText = (result.result ?? "").trim();
    const parsed = extractJsonObject(rawText);

    if (result.status === "error") {
      return {
        success: false,
        auth,
        runStatus: result.status,
        rawText,
        parsed,
        error: "El run terminó con status error",
      };
    }

    const success = parsed?.ok === true && parsed.message === "cursor-connected";

    return {
      success,
      auth,
      runStatus: result.status,
      rawText,
      parsed,
      ...(success ? {} : { error: "La respuesta no coincide con el JSON esperado" }),
    };
  } catch (err) {
    if (err instanceof CursorAgentError) {
      const isPlanRequired = err.message.includes("plan_required");
      return {
        success: false,
        auth,
        runStatus: "startup_failed",
        rawText: "",
        parsed: null,
        error: isPlanRequired
          ? `${err.message} — La clave es válida pero hace falta plan Pro para ejecutar agentes.`
          : `${err.message} (retryable=${err.isRetryable})`,
      };
    }
    throw err;
  }
}
