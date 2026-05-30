#!/usr/bin/env python3
"""
buscar_contratos.py — consulta el dataset normalizado de contratos PLACSP.

Es la herramienta que la skill invoca en local (Claude Code / Cursor). En el
chatbot web, la edge function de Lovable replica esta misma lógica de filtrado
sobre el JSON guardado en Storage (ver buscar_contratos.ts).

Lee por defecto data/contratos_demo.json (muestra) o el que generes con
etl_placsp.py, filtra por órgano / CPV / año y devuelve JSON con la forma:

    { "contratos": [ {objeto, importe, adjudicatario, cpv, tipo_contrato,
                      fecha, estado, organo, expediente, url_expediente}, ... ],
      "total_importe": <suma>, "n": <num> }

Ejemplos:
    python buscar_contratos.py --organo "Barcelona" --cpv 4521
    python buscar_contratos.py --organo "Barcelona" --anio 2024 \\
        --dataset ../data/contratos_demo.json
"""

from __future__ import annotations

import argparse
import json
import os
import sys

DEFAULT_DATASET = os.path.join(
    os.path.dirname(__file__), "..", "data", "contratos_demo.json"
)


def matches(rec, organo, cpv, anio):
    if organo and organo.lower() not in (rec.get("organo") or "").lower():
        return False
    if cpv and not (rec.get("cpv") or "").startswith(cpv):
        return False
    if anio and not (rec.get("fecha") or "").startswith(anio):
        return False
    return True


def buscar(dataset_path, organo=None, cpv=None, anio=None):
    with open(dataset_path, encoding="utf-8") as fh:
        data = json.load(fh)
    contratos = data.get("contratos", data if isinstance(data, list) else [])
    hits = [r for r in contratos if matches(r, organo, cpv, anio)]
    total = round(sum(r.get("importe") or 0 for r in hits), 2)
    return {
        "contratos": hits,
        "n": len(hits),
        "total_importe": total,
        "_fuente": data.get("_meta", {}),
    }


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--organo", help="Subcadena del nombre del órgano")
    ap.add_argument("--cpv", help="Prefijo de CPV (p.ej. 4521)")
    ap.add_argument("--anio", help="Año (AAAA)")
    ap.add_argument("--dataset", default=DEFAULT_DATASET, help="Ruta del JSON")
    args = ap.parse_args(argv)

    if not os.path.exists(args.dataset):
        raise SystemExit(f"No existe el dataset: {args.dataset}")

    result = buscar(args.dataset, args.organo, args.cpv, args.anio)
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
