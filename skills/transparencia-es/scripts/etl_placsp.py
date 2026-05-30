#!/usr/bin/env python3
"""
etl_placsp.py — ETL offline de datos abiertos de la Plataforma de Contratación
del Sector Público (PLACSP) a un JSON normalizado para la skill "transparencia-es".

Descarga (o lee en local) el ZIP mensual de sindicación ATOM, parsea las entradas
CODICE 2.07 y las normaliza al esquema que consume el chatbot:

    { objeto, importe, adjudicatario, cpv, tipo_contrato, fecha, estado,
      organo, expediente, url_expediente }

Fuente oficial (licitaciones, excluye contratos menores):
    https://contrataciondelsectorpublico.gob.es/sindicacion/sindicacion_643/
        licitacionesPerfilesContratanteCompleto3_AAAAMM.zip
El ZIP contiene ficheros .atom (máx. 500 entradas cada uno, encadenados con
<link rel="next">). Aquí se procesan TODOS los .atom del ZIP.

Solo usa librería estándar (urllib, zipfile, xml.etree). No requiere instalar nada.

Ejemplos:
    # Descargar el mes y filtrar por órgano + familia CPV de obras educativas
    python etl_placsp.py --periodo 202504 --organo "Barcelona" --cpv 4521 \\
        --out ../data/contratos.json

    # Procesar un ZIP ya descargado a mano (red bloqueada, etc.)
    python etl_placsp.py --source ./licitaciones_202504.zip --out ../data/contratos.json
"""

from __future__ import annotations

import argparse
import datetime as dt
import io
import json
import sys
import urllib.request
import zipfile
from xml.etree import ElementTree as ET

ZIP_URL = (
    "https://contrataciondelsectorpublico.gob.es/sindicacion/sindicacion_643/"
    "licitacionesPerfilesContratanteCompleto3_{periodo}.zip"
)
USER_AGENT = "civio-transparencia-es/1.0 (hackathon Ship for Good)"

# Códigos CODICE de tipo de contrato -> etiqueta legible (PLACSP)
TIPO_CONTRATO = {
    "1": "Suministros",
    "2": "Servicios",
    "3": "Obras",
    "21": "Gestión de servicios públicos",
    "31": "Concesión de obras públicas",
    "32": "Concesión de servicios",
    "40": "Concesión de obras",
    "50": "Concesión de servicios",
    "7": "Administrativo especial",
    "8": "Privado",
}


# --- Helpers tolerantes a namespaces (CODICE usa prefijos cac/cbc/place-ext) ---

def local(tag: str) -> str:
    """Devuelve el nombre local de una etiqueta '{ns}Nombre' -> 'Nombre'."""
    return tag.rsplit("}", 1)[-1] if "}" in tag else tag


def first(elem, name):
    """Primer descendiente cuyo nombre local sea `name` (o None)."""
    if elem is None:
        return None
    for el in elem.iter():
        if local(el.tag) == name and el is not elem:
            return el
    return None


def text(elem, name, default=""):
    el = first(elem, name)
    if el is not None and el.text:
        return " ".join(el.text.split())
    return default


def to_float(value):
    try:
        return round(float(str(value).replace(",", ".")), 2)
    except (TypeError, ValueError):
        return None


# --- Parseo de una entrada ATOM -> registro normalizado ---

def parse_entry(entry) -> dict:
    # Contenedores CODICE de interés
    project = first(entry, "ProcurementProject")
    party = first(entry, "LocatedContractingParty")
    result = first(entry, "TenderResult")

    # Importe: presupuesto total o estimado
    importe = None
    budget = first(project, "BudgetAmount") if project else None
    if budget is not None:
        importe = to_float(text(budget, "TotalAmount") or
                           text(budget, "TaxExclusiveAmount"))
    if importe is None and project is not None:
        importe = to_float(text(project, "TotalAmount") or
                           text(project, "EstimatedOverallContractAmount"))

    # Órgano de contratación (nombre del Party dentro de LocatedContractingParty)
    organo = ""
    if party is not None:
        organo = text(party, "Name")  # primer Name suele ser el del organismo

    # Adjudicatario (parte ganadora)
    adjudicatario = text(result, "Name") if result is not None else ""

    # Enlace al expediente: link alternate o el <id> de la entrada
    url = ""
    for link in entry.iter():
        if local(link.tag) == "link" and link.get("rel") in (None, "alternate"):
            if link.get("href"):
                url = link.get("href")
                break
    if not url:
        url = text(entry, "id")

    return {
        "objeto": text(project, "Name") if project else text(entry, "title"),
        "importe": importe,
        "adjudicatario": adjudicatario,
        "cpv": text(project, "ItemClassificationCode") if project else "",
        "tipo_contrato": (lambda c: TIPO_CONTRATO.get(c, c))(
            text(project, "TypeCode") if project else ""),
        "fecha": (text(entry, "updated") or text(entry, "published"))[:10],
        "estado": text(entry, "ContractFolderStatusCode"),
        "organo": organo,
        "expediente": text(entry, "ContractFolderID"),
        "url_expediente": url,
    }


def parse_atom_bytes(data: bytes):
    try:
        root = ET.fromstring(data)
    except ET.ParseError as exc:  # fichero corrupto / parcial
        print(f"  aviso: no se pudo parsear un .atom ({exc})", file=sys.stderr)
        return
    for el in root.iter():
        if local(el.tag) == "entry":
            yield parse_entry(el)


# --- Carga de la fuente (ZIP remoto, ZIP local o .atom local) ---

def iter_entries(source: str):
    if source.startswith("http://") or source.startswith("https://"):
        print(f"Descargando {source} ...", file=sys.stderr)
        req = urllib.request.Request(source, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(req, timeout=120) as resp:
            blob = resp.read()
        yield from iter_zip(io.BytesIO(blob))
    elif source.lower().endswith(".zip"):
        with open(source, "rb") as fh:
            yield from iter_zip(io.BytesIO(fh.read()))
    elif source.lower().endswith(".atom") or source.lower().endswith(".xml"):
        with open(source, "rb") as fh:
            yield from parse_atom_bytes(fh.read())
    else:
        raise SystemExit(f"Fuente no reconocida: {source}")


def iter_zip(buf: io.BytesIO):
    with zipfile.ZipFile(buf) as zf:
        names = sorted(n for n in zf.namelist() if n.lower().endswith(".atom"))
        if not names:
            print("  aviso: el ZIP no contiene ficheros .atom", file=sys.stderr)
        for name in names:
            yield from parse_atom_bytes(zf.read(name))


def matches(rec: dict, organo: str | None, cpv: str | None, anio: str | None) -> bool:
    if organo and organo.lower() not in (rec.get("organo") or "").lower():
        return False
    if cpv and not (rec.get("cpv") or "").startswith(cpv):
        return False
    if anio and not (rec.get("fecha") or "").startswith(anio):
        return False
    return True


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--periodo", help="AAAAMM (por defecto: mes anterior)")
    ap.add_argument("--source", help="URL o ruta local (.zip/.atom). Si se omite, "
                                     "se construye la URL oficial con --periodo")
    ap.add_argument("--organo", help="Filtro: subcadena del nombre del órgano")
    ap.add_argument("--cpv", help="Filtro: prefijo de CPV (p.ej. 4521)")
    ap.add_argument("--anio", help="Filtro: año de la entrada (AAAA)")
    ap.add_argument("--max", type=int, default=0, help="Máximo de registros (0 = sin límite)")
    ap.add_argument("--out", default="-", help="Fichero de salida JSON ('-' = stdout)")
    args = ap.parse_args(argv)

    if not args.source:
        periodo = args.periodo
        if not periodo:
            today = dt.date.today().replace(day=1)
            prev = today - dt.timedelta(days=1)
            periodo = f"{prev.year}{prev.month:02d}"
        args.source = ZIP_URL.format(periodo=periodo)

    registros = []
    for rec in iter_entries(args.source):
        if matches(rec, args.organo, args.cpv, args.anio):
            registros.append(rec)
            if args.max and len(registros) >= args.max:
                break

    payload = {
        "_meta": {
            "dataset_tipo": "extraccion_real",
            "fuente": args.source,
            "generado": dt.datetime.now().isoformat(timespec="seconds"),
            "filtros": {"organo": args.organo, "cpv": args.cpv, "anio": args.anio},
            "n": len(registros),
            "nota": "Datos abiertos de PLACSP normalizados. Los importes pueden ser de "
                    "licitación o adjudicación. Excluye contratos menores.",
        },
        "contratos": registros,
    }

    out = json.dumps(payload, ensure_ascii=False, indent=2)
    if args.out == "-":
        print(out)
    else:
        with open(args.out, "w", encoding="utf-8") as fh:
            fh.write(out)
        print(f"Escritos {len(registros)} contratos en {args.out}", file=sys.stderr)


if __name__ == "__main__":
    main()
