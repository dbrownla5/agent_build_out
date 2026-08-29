#!/usr/bin/env python3
"""Extract the 40 Permanent Occupational Workforce role contracts from the
Master Build Directive into machine-readable YAML.

The directive PDF uses subset fonts whose ligature glyphs (fi/fl) decode to
nothing, so 'qualified' arrives as 'qualied'. LIGATURES repairs the known set.
This script is the ONLY path by which role contracts enter the repo; the
registry is generated, never hand-authored.
"""
import re, sys, json, pathlib

SRC = sys.argv[1]
OUT = pathlib.Path(sys.argv[2])


# The eight contract fields the directive defines for every role.
FIELDS = [
    ("permanent_job",  r"Permanent job / separate-agent reason:"),
    ("in_scope",       r"In scope:"),
    ("out_of_scope",   r"Out of scope:"),
    ("authority",      r"Authority / prohibitions:"),
    ("inputs_outputs", r"Inputs / outputs:"),
    ("required_skills",r"Required skills:"),
    ("tools_access",   r"Future tools/access:"),
    ("living_model",   r"Living-model obligations:"),
    ("evaluation",     r"Evaluation / failure / separation:"),
]

def fix(s):
    # Ligatures are decoded at the PDF glyph layer (see scripts/extract_pdf.py).
    # Never repair text by substring replacement: "nal"->"final" corrupts
    # "original" into "origifinal". Fix the decoder, not the output.
    return re.sub(r"\s+", " ", s).strip()

raw = open(SRC, encoding="utf-8", errors="replace").read()

# Blueprint runs from the section header to the role-separation section.
start = raw.index("A) Permanent Occupational Workforce Blueprint")
end   = raw.index("7. Required role separation")
body  = raw[start:end]

# Split on numbered role headings at line start: "1. Title"
parts = re.split(r"\n(?=(\d{1,2})\.\s+[A-Z])", body)
roles, i = [], 0
chunks = []
for m in re.finditer(r"\n(\d{1,2})\.\s+([^\n]+)\n", body):
    chunks.append((int(m.group(1)), m.group(2).strip(), m.end()))
for idx, (num, title, pos) in enumerate(chunks):
    stop = chunks[idx+1][2] - len(f"\n{chunks[idx+1][0]}. {chunks[idx+1][1]}\n") if idx+1 < len(chunks) else len(body)
    seg = body[pos:stop]
    rec = {"id": num, "title": fix(title), "source": "Master Build Directive §A"}
    for fi, (key, pat) in enumerate(FIELDS):
        m = re.search(pat, seg)
        if not m:
            rec[key] = None
            continue
        nxt = len(seg)
        for k2, p2 in FIELDS[fi+1:]:
            m2 = re.search(p2, seg[m.end():])
            if m2:
                nxt = m.end() + m2.start(); break
        rec[key] = fix(seg[m.end():nxt])
    roles.append(rec)

roles = [r for r in roles if 1 <= r["id"] <= 40]
seen, dedup = set(), []
for r in sorted(roles, key=lambda x: x["id"]):
    if r["id"] in seen: continue
    seen.add(r["id"]); dedup.append(r)

OUT.mkdir(parents=True, exist_ok=True)
def y(s):
    if s is None: return "null"
    return '"' + s.replace("\\", "\\\\").replace('"', '\\"') + '"'
for r in dedup:
    slug = re.sub(r"[^a-z0-9]+", "_", r["title"].lower()).strip("_")
    p = OUT / f"{r['id']:02d}_{slug}.yaml"
    with open(p, "w", encoding="utf-8") as f:
        f.write(f"# Role {r['id']} — extracted from the Master Build Directive.\n")
        f.write("# GENERATED FILE. Do not hand-edit; re-run scripts/extract_roles.py.\n")
        f.write(f"id: {r['id']}\ntitle: {y(r['title'])}\nsource: {y(r['source'])}\n")
        for key, _ in FIELDS:
            f.write(f"{key}: {y(r[key])}\n")
missing = [(r["id"], k) for r in dedup for k, _ in FIELDS if not r[k]]
print(json.dumps({"roles_extracted": len(dedup),
                  "ids": [r["id"] for r in dedup],
                  "missing_fields": missing}, indent=None))
