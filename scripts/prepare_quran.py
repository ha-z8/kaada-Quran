"""Fetch the full Hafs/Uthmani Quran, check order and count, then store locally."""
import json
import pathlib
import time
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
SOURCE = "https://api.alquran.cloud/v1/quran/quran-uthmani"
EXPECTED = [7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6]
assert len(EXPECTED) == 114 and sum(EXPECTED) == 6236

def retrieve():
    for attempt in range(5):
        try:
            req = urllib.request.Request(SOURCE, headers={"User-Agent": "KAADA-Quran/1.0"})
            with urllib.request.urlopen(req, timeout=75) as response:
                return json.load(response)
        except Exception:
            if attempt == 4:
                raise
            time.sleep(3 * (attempt + 1))

payload = retrieve()
surahs = payload["data"]["surahs"]
if len(surahs) != 114:
    raise ValueError("Missing surahs")
out = []
for idx, surah in enumerate(surahs, start=1):
    verses = surah["ayahs"]
    if surah["number"] != idx or len(verses) != EXPECTED[idx - 1]:
        raise ValueError(f"Bad surah: {idx}")
    clean = []
    for number, ayah in enumerate(verses, start=1):
        if ayah["numberInSurah"] != number or not ayah["text"].strip():
            raise ValueError(f"Bad ayah: {idx}:{number}")
        clean.append({"id": number, "text": ayah["text"]})
    out.append({"id": idx, "name": surah["name"].removeprefix("سُورَةُ ").removeprefix("سورة "), "verses": clean})
if sum(len(s["verses"]) for s in out) != 6236:
    raise ValueError("Verse count mismatch")
(ROOT / "data").mkdir(exist_ok=True)
(ROOT / "data" / "quran.json").write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
(ROOT / "data" / "SOURCE.md").write_text(
    "# مصدر النص القرآني\\n\\n"
    f"API: {SOURCE}\\n\\n"
    "Edition: quran-uthmani (Hafs). Retrieved using AlQuran.Cloud. "
    "Text must be preserved verbatim. Verify provenance and any distribution terms "
    "of the underlying Uthmani text before republishing.\\n",
    encoding="utf-8",
)
print(f"PASS: {len(out)} surahs and {sum(len(s['verses']) for s in out)} verses")
