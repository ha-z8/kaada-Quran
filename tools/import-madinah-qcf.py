#!/usr/bin/env python3
"""Import QCF V2 Madinah line data and official page fonts from a KFGQPC/QUL mirror.

Do not normalize or edit Quran glyph strings. Each file is checked for 604-page coverage.
Run only where you may distribute the official KFGQPC assets (noncommercial educational use).
"""
from __future__ import annotations
import json, os, pathlib, re, shutil, sys, zipfile

root=pathlib.Path(__file__).resolve().parent.parent
src=pathlib.Path(os.environ.get("MUSHAF_SOURCE","/tmp/KFGQPC-Madinah-Mushaf"))
pages=src/"data"/"pages"
out_pages=root/"data"/"mushaf"/"pages"
out_fonts=root/"fonts"/"qcf"
out_pages.mkdir(parents=True,exist_ok=True)
out_fonts.mkdir(parents=True,exist_ok=True)
for page in range(1,605):
    f=pages/f"page-{page:03}.json"
    if not f.exists():raise SystemExit(f"Missing source page {f}")
    obj=json.loads(f.read_text(encoding="utf-8"))
    if obj.get("page")!=page or not isinstance(obj.get("lines"),list) or not obj["lines"]:
        raise SystemExit(f"Page JSON invalid: {page}")
    for line in obj["lines"]:
        if line.get("type")=="text" and not all("qpcV2" in word and "location" in word for word in line.get("words",[])):
            raise SystemExit(f"Glyphs invalid on page {page}")
    (out_pages/f.name).write_text(json.dumps(obj,ensure_ascii=False,separators=(",",":")),encoding="utf-8")
zipped=src/"Al_Madinah_Mushaf_Win_Setup-2.1.zip"
if not zipped.exists() or zipped.stat().st_size<1_000_000:
    raise SystemExit("Official QCF font installer ZIP was not downloaded (git lfs pull)")
with zipfile.ZipFile(zipped) as archive:
    fonts={}
    for entry in archive.infolist():
        m=re.search(r'QCF2([0-9]{3})\.ttf$',entry.filename,re.I)
        if m and 1<=int(m.group(1))<=604:
            fonts[int(m.group(1))]=entry
    if len(fonts)!=604:raise SystemExit(f"Expected 604 QCF V2 fonts, found {len(fonts)}")
    for page,entry in fonts.items():
        with archive.open(entry) as fin,(out_fonts/f"QCF2{page:03}.ttf").open("wb") as fout:
            shutil.copyfileobj(fin,fout)
        if (out_fonts/f"QCF2{page:03}.ttf").stat().st_size<10_000:
            raise SystemExit(f"Invalid font page {page}")
print("Verified 604 QCF V2 page layout JSONs and 604 original page fonts")
