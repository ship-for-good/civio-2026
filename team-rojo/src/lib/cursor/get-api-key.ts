/**
 * Lee CURSOR_API_KEY desde el entorno (p. ej. `.env.local` o export en shell).
 * Nunca incluyas la clave en el código fuente.
 */
export function getCursorApiKey(): string {
  const key = process.env.CURSOR_API_KEY?.trim();
  if (!key) {
    throw new Error(
      "CURSOR_API_KEY no está definida. Crea team-rojo/.env.local con CURSOR_API_KEY=cursor_... o ejecuta: export CURSOR_API_KEY='...'"
    );
  }
  return key;
}
