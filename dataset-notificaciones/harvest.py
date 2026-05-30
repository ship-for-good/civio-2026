#!/usr/bin/env python3
"""Download harvested derecho-de-acceso PDFs and build a unified index CSV."""
import csv
import json
import os
import re
import ssl
import sys
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed

OUT_JSON = sys.argv[1]
DEST = os.path.dirname(os.path.abspath(__file__))
PDF_DIR = os.path.join(DEST, "pdfs")
CSV_PATH = os.path.join(DEST, "index.csv")
os.makedirs(PDF_DIR, exist_ok=True)

HEADERS = [
    "source", "doc_type", "ambito", "organismo", "asunto", "fecha",
    "expediente_id", "reclamacion_ref", "resolucion_sentido",
    "pdf_url", "local_path", "download_status", "http_status", "size_bytes", "notes",
]

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "\
     "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"

with open(OUT_JSON, encoding="utf-8") as fh:
    data = json.load(fh)

sources = data.get("result", {}).get("sources", []) or data.get("sources", [])

# Flatten + dedup by URL
rows = []
seen = set()
for src in sources:
    sname = src.get("source", "")
    for doc in src.get("documents", []):
        url = (doc.get("pdf_url") or "").strip()
        if not url or not url.lower().startswith("http") or url in seen:
            continue
        seen.add(url)
        rows.append({
            "source": sname,
            "doc_type": doc.get("doc_type", ""),
            "ambito": doc.get("ambito", ""),
            "organismo": doc.get("organismo", ""),
            "asunto": doc.get("asunto", ""),
            "fecha": doc.get("fecha", ""),
            "expediente_id": doc.get("expediente_id", ""),
            "reclamacion_ref": doc.get("reclamacion_ref", ""),
            "resolucion_sentido": doc.get("resolucion_sentido", ""),
            "pdf_url": url,
            "local_path": "", "download_status": "", "http_status": "",
            "size_bytes": "", "notes": doc.get("notes", ""),
        })

print(f"Documentos únicos a descargar: {len(rows)}")


def safe_name(row, i):
    base = (row["expediente_id"] or row["doc_type"] or "doc").strip()
    base = re.sub(r"[^A-Za-z0-9._-]+", "_", base).strip("_")[:60] or "doc"
    return f"{i:03d}_{base}.pdf"


def download(idx_row):
    i, row = idx_row
    url = row["pdf_url"]
    fname = safe_name(row, i)
    fpath = os.path.join(PDF_DIR, fname)
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=25) as resp:
            code = resp.getcode()
            content = resp.read()
        if content[:5] != b"%PDF-":
            row.update(download_status="not_pdf", http_status=str(code),
                       size_bytes=str(len(content)))
            return row
        with open(fpath, "wb") as out:
            out.write(content)
        row.update(local_path=os.path.join("pdfs", fname),
                   download_status="ok", http_status=str(code),
                   size_bytes=str(len(content)))
    except Exception as e:  # noqa
        row.update(download_status=f"error:{type(e).__name__}",
                   http_status="", size_bytes="")
    return row


results = []
with ThreadPoolExecutor(max_workers=8) as ex:
    futs = [ex.submit(download, (i, r)) for i, r in enumerate(rows, 1)]
    for f in as_completed(futs):
        results.append(f.result())

# Keep original order by url
order = {r["pdf_url"]: n for n, r in enumerate(rows)}
results.sort(key=lambda r: order[r["pdf_url"]])

with open(CSV_PATH, "w", newline="", encoding="utf-8") as fh:
    w = csv.DictWriter(fh, fieldnames=HEADERS)
    w.writeheader()
    w.writerows(results)

ok = sum(1 for r in results if r["download_status"] == "ok")
print(f"Descargados OK: {ok}/{len(results)}")
print(f"CSV: {CSV_PATH}")
# Breakdown
from collections import Counter
print("Por estado:", dict(Counter(r["download_status"] for r in results)))
print("Por tipo (OK):", dict(Counter(r["doc_type"] for r in results if r["download_status"] == "ok")))
print("Por sentido (OK):", dict(Counter(r["resolucion_sentido"] for r in results if r["download_status"] == "ok")))
