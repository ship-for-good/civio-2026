#!/usr/bin/env bash
set -u

OUT_FILE="salida.txt"
URL="http://localhost:8080/chat"

# 1) Sobrescribe salida.txt en cada ejecucion
: > "$OUT_FILE"

found_true=0
found_false=0

run_query() {
  local idx="$1"
  local label="$2"
  local question="$3"
  local total="6"

  {
    echo "============================================================"
    echo "CONSULTA $idx: $label"
    echo "============================================================"
    echo "Request:"
    printf '{\n  "question": "%s"\n}\n' "$question"
    echo
    echo "Response:"
  } >> "$OUT_FILE"

  local payload
  payload=$(printf '{"question":"%s"}' "$question")

  echo "▶ Lanzando consulta ${idx}/${total}: ${question}..."

  local raw
  raw=$(curl -sS -X POST "$URL" \
    -H "Content-Type: application/json" \
    --data "$payload")

  if python3 -c 'import json,sys; json.loads(sys.stdin.read())' >/dev/null 2>&1 <<<"$raw"; then
    python3 -c 'import json,sys; print(json.dumps(json.loads(sys.stdin.read()), indent=2, ensure_ascii=False))' <<<"$raw" >> "$OUT_FILE"
  else
    echo "$raw" >> "$OUT_FILE"
  fi

  echo >> "$OUT_FILE"

  local found_value
  found_value=$(python3 -c 'import json,sys
try:
    obj=json.loads(sys.stdin.read())
    v=obj.get("found", None)
    print("true" if v is True else "false" if v is False else "unknown")
except Exception:
    print("unknown")
' <<<"$raw")

  if [[ "$found_value" == "true" ]]; then
    found_true=$((found_true + 1))
    echo "✅ found:true"
  elif [[ "$found_value" == "false" ]]; then
    found_false=$((found_false + 1))
    echo "❌ found:false"
  else
    echo "❌ found:unknown"
  fi
}

# 2) Seis consultas con 2s entre cada una
run_query 1 "Encuentra informacion directa" "¿Dónde puedo ver la agenda institucional del ministro?"
sleep 2
run_query 2 "Varios saltos hasta hoja" "¿Cómo consulto las subvenciones concedidas por ministerios?"
sleep 2
run_query 3 "Caso altos cargos" "¿Dónde puedo ver las retribuciones de los altos cargos?"
sleep 2
run_query 4 "Presupuestos con año especifico" "¿Dónde está el presupuesto de 2023 del Ministerio de Sanidad?"
sleep 2
run_query 5 "No existe, derecho de acceso" "¿Dónde se publica el inventario de naves espaciales del gobierno?"
sleep 2
run_query 6 "Consulta ambigua para verificacion LLM" "Necesito datos economicos de cargos publicos"

# 4) Resumen final por pantalla
echo "Consultas con found:true  = $found_true"
echo "Consultas con found:false = $found_false"
