#!/usr/bin/env python3
"""Génère le burn down chart du projet à partir des issues GitHub.

Aucune dépendance : stdlib seule. Le SVG est écrit à la main, puis converti
en PNG par Chrome en mode headless (le seul convertisseur présent sur la
machine).

    python scripts/burndown.py

Sorties : docs/burndown.svg et docs/burndown.png
"""
import json
import os
import shutil
import subprocess
import sys
from datetime import date, datetime, timedelta

REPO = "ArthurDescourvieres/ci-cd-kube"
START = date(2026, 9, 1)
END = date(2026, 9, 18)  # soutenance

# Le burndown est pondéré en HEURES, pas en nombre d'issues : une issue du
# lot 5 (Kubernetes) ne pèse pas comme une issue du lot 0. Les estimations
# viennent de PLAN.md.  (premiere_issue, derniere_issue, heures_du_lot)
LOTS = [
    ("0 - Setup",         1,  3,  1.0),
    ("1 - App",           4,  8,  2.0),
    ("2 - Docker",        9, 15,  3.0),
    ("3 - CI",           16, 21,  4.0),
    ("4 - Notifications", 22, 25,  2.0),
    ("5 - Kubernetes",   26, 33,  5.0),
    ("6 - CD",           34, 37,  3.0),
    ("7 - Rendu",        38, 41,  3.0),
]

W, H = 920, 520
M = {"l": 62, "r": 24, "t": 64, "b": 78}
PLOT_W = W - M["l"] - M["r"]
PLOT_H = H - M["t"] - M["b"]

INK, MUTED, GRID = "#1f2328", "#656d76", "#d8dee4"
IDEAL, ACTUAL, LATE = "#8c959f", "#1a7f37", "#cf222e"


def poids_par_issue():
    """heures -> une valeur par numéro d'issue."""
    p = {}
    for _, lo, hi, heures in LOTS:
        n = hi - lo + 1
        for num in range(lo, hi + 1):
            p[num] = heures / n
    return p


def gh_bin():
    """Sur Windows, subprocess ne résout pas « gh » tout seul : il faut gh.exe."""
    return (shutil.which("gh") or shutil.which("gh.exe")
            or r"C:\Program Files\GitHub CLI\gh.exe")


def issues():
    out = subprocess.run(
        [gh_bin(), "issue", "list", "--repo", REPO, "--state", "all",
         "--limit", "200", "--json", "number,closedAt,state"],
        capture_output=True, text=True, encoding="utf-8", check=True,
    ).stdout
    return json.loads(out)


def serie_reelle(data, poids):
    """reste à faire (heures) pour chaque jour de START à aujourd'hui."""
    total = sum(poids.values())
    fermees = {}
    for i in data:
        if i["closedAt"]:
            d = datetime.fromisoformat(i["closedAt"].replace("Z", "+00:00")).date()
            fermees.setdefault(d, 0.0)
            fermees[d] += poids.get(i["number"], 0.0)

    aujourdhui = min(date.today(), END)
    serie, reste = [], total
    j = START
    while j <= aujourdhui:
        reste -= fermees.get(j, 0.0)
        serie.append((j, round(reste, 3)))
        j += timedelta(days=1)
    return total, serie


def x(j):
    return M["l"] + PLOT_W * ((j - START).days / max((END - START).days, 1))


def y(v, total):
    return M["t"] + PLOT_H * (1 - v / total) if total else M["t"] + PLOT_H


def svg(total, serie):
    s = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" '
        f'viewBox="0 0 {W} {H}" font-family="Segoe UI, Helvetica, Arial, sans-serif">',
        f'<rect width="{W}" height="{H}" fill="#ffffff"/>',
        f'<text x="{M["l"]}" y="30" font-size="19" font-weight="600" fill="{INK}">'
        f'Burn down — CI-CD Kube</text>',
    ]

    reste = serie[-1][1] if serie else total
    fait = total - reste
    jours = (END - date.today()).days
    s.append(
        f'<text x="{M["l"]}" y="50" font-size="12.5" fill="{MUTED}">'
        f'{fait:.1f} h faites sur {total:.0f} h · {reste:.1f} h restantes · '
        f'{jours} jours avant la soutenance</text>'
    )

    # --- grille horizontale + axe Y (heures) ---
    pas = 5
    v = 0
    while v <= total + 0.01:
        yy = y(v, total)
        s.append(f'<line x1="{M["l"]}" y1="{yy:.1f}" x2="{M["l"]+PLOT_W}" '
                 f'y2="{yy:.1f}" stroke="{GRID}" stroke-width="1"/>')
        s.append(f'<text x="{M["l"]-10}" y="{yy+4:.1f}" font-size="11.5" '
                 f'fill="{MUTED}" text-anchor="end">{v:.0f} h</text>')
        v += pas

    # --- axe X (dates) ---
    j = START
    while j <= END:
        xx = x(j)
        weekend = j.weekday() >= 5
        if weekend:
            s.append(f'<rect x="{xx-6:.1f}" y="{M["t"]}" width="12" '
                     f'height="{PLOT_H}" fill="#f6f8fa"/>')
        s.append(f'<line x1="{xx:.1f}" y1="{M["t"]}" x2="{xx:.1f}" '
                 f'y2="{M["t"]+PLOT_H}" stroke="{GRID}" stroke-width="1"/>')
        s.append(f'<text x="{xx:.1f}" y="{M["t"]+PLOT_H+18}" font-size="10.5" '
                 f'fill="{MUTED}" text-anchor="middle">{j.strftime("%d/%m")}</text>')
        j += timedelta(days=1)

    # --- ligne idéale ---
    s.append(f'<line x1="{x(START):.1f}" y1="{y(total,total):.1f}" '
             f'x2="{x(END):.1f}" y2="{y(0,total):.1f}" stroke="{IDEAL}" '
             f'stroke-width="2" stroke-dasharray="6 5"/>')

    # --- ligne réelle (escalier) ---
    if serie:
        pts, prev = [], None
        for j, v in serie:
            if prev is not None:
                pts.append(f"{x(j):.1f},{y(prev,total):.1f}")
            pts.append(f"{x(j):.1f},{y(v,total):.1f}")
            prev = v
        en_retard = serie[-1][1] > total * (1 - (date.today()-START).days /
                                            max((END-START).days, 1)) + 0.01
        col = LATE if en_retard else ACTUAL
        s.append(f'<polyline points="{" ".join(pts)}" fill="none" '
                 f'stroke="{col}" stroke-width="2.5" stroke-linejoin="round"/>')
        jd, vd = serie[-1]
        s.append(f'<circle cx="{x(jd):.1f}" cy="{y(vd,total):.1f}" r="4.5" '
                 f'fill="{col}"/>')

    # --- légende ---
    ly = H - 26
    s.append(f'<line x1="{M["l"]}" y1="{ly}" x2="{M["l"]+26}" y2="{ly}" '
             f'stroke="{IDEAL}" stroke-width="2" stroke-dasharray="6 5"/>')
    s.append(f'<text x="{M["l"]+34}" y="{ly+4}" font-size="12" fill="{MUTED}">'
             f'idéal (rythme constant jusqu\'au 18/09)</text>')
    s.append(f'<line x1="{M["l"]+280}" y1="{ly}" x2="{M["l"]+306}" y2="{ly}" '
             f'stroke="{ACTUAL}" stroke-width="2.5"/>')
    s.append(f'<text x="{M["l"]+314}" y="{ly+4}" font-size="12" fill="{MUTED}">'
             f'réel (issues fermées, pondérées en heures)</text>')
    s.append("</svg>")
    return "\n".join(s)


def en_png(svg_path, png_path):
    chrome = os.environ.get("CHROME") or shutil.which("chrome") or \
        r"C:\Program Files\Google\Chrome\Application\chrome.exe"
    if not os.path.exists(chrome):
        print("Chrome introuvable — SVG généré, PNG non produit.", file=sys.stderr)
        return False
    tmp = os.path.abspath(png_path)
    subprocess.run(
        [chrome, "--headless=new", "--disable-gpu", "--hide-scrollbars",
         f"--window-size={W},{H}", "--default-background-color=ffffff",
         f"--screenshot={tmp}", "file:///" + os.path.abspath(svg_path).replace("\\", "/")],
        capture_output=True, check=False,
    )
    return os.path.exists(tmp)


def main():
    racine = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    docs = os.path.join(racine, "docs")
    os.makedirs(docs, exist_ok=True)

    poids = poids_par_issue()
    total, serie = serie_reelle(issues(), poids)

    svg_path = os.path.join(docs, "burndown.svg")
    png_path = os.path.join(docs, "burndown.png")
    with open(svg_path, "w", encoding="utf-8") as f:
        f.write(svg(total, serie))
    ok = en_png(svg_path, png_path)

    reste = serie[-1][1] if serie else total
    print(f"docs/burndown.svg écrit — reste {reste:.1f} h sur {total:.0f} h")
    if ok:
        print("docs/burndown.png écrit")


if __name__ == "__main__":
    main()
