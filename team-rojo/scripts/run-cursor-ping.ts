/**
 * Prueba de conexión con Cursor API.
 *
 * Uso:
 *   cd team-rojo
 *   cp env.example .env.local   # y rellena CURSOR_API_KEY
 *   npm run cursor:ping
 */
import { loadEnvLocal } from "./load-env-local";
import { runCursorPingTest } from "../src/lib/cursor/test-prompt";

loadEnvLocal();

async function main() {
  console.log("Cursor ping — comprobando API key...\n");

  const result = await runCursorPingTest();

  console.log("Auth:", result.auth.ok ? "OK" : "FAIL");
  if (result.auth.apiKeyName) {
    console.log("  API key:", result.auth.apiKeyName);
  }
  if (result.auth.userEmail) {
    console.log("  Email:", result.auth.userEmail);
  }
  if (result.auth.modelCount !== undefined) {
    console.log("  Modelos disponibles:", result.auth.modelCount);
  }
  console.log("\nRun status:", result.runStatus);
  if (result.rawText) {
    console.log("Respuesta (raw):", result.rawText.slice(0, 500));
  }
  if (result.parsed) {
    console.log("JSON parseado:", result.parsed);
  }
  if (result.error) {
    console.error("Error:", result.error);
  }

  if (result.success) {
    console.log("\n✓ Cursor API OK (auth + agente)");
    process.exit(0);
  }

  if (result.auth.ok && result.runStatus === "startup_failed") {
    console.log(
      "\n◐ Auth OK — el agente no se pudo ejecutar (¿plan Pro?). La clave funciona para Cursor.me / models.list."
    );
    process.exit(0);
  }

  console.error("\n✗ Cursor API falló la prueba");
  process.exit(1);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
