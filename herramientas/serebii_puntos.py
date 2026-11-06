"""Extrae de Pokéarth (Serebii) los puntos donde aparece cada Pokémon en Paldea, Noroteo, Terario y Luminalia.
Crea mapas_puntos/<region>.js para la app (mapa de 1024x1024 px).
Uso: python serebii_puntos.py <carpeta html serebii> <carpeta csv pokeapi> <carpeta app>
"""
import csv, json, os, re, sys
from collections import defaultdict

S, CSV, APP = sys.argv[1], sys.argv[2], sys.argv[3]
ESCALA = {'paldea': 5000, 'kitakami': 2000, 'terarium': 2000, 'lumiosecity': 4096}

EXCLUIR = re.compile(r'gmax|mega|totem|primal|eternamax|cap$|-cap-|cosplay|rock-star|belle|pop-star|phd|libre|starter|busted|own-tempo')
var = defaultdict(list)
with open(os.path.join(CSV, 'pokemon.csv'), encoding='utf-8') as f:
    for r in csv.DictReader(f):
        sid, pid = int(r['species_id']), int(r['id'])
        if r['is_default'] == '1': var[sid].insert(0, pid)
        elif not EXCLUIR.search(r['identifier']): var[sid].append(pid)
for s in var: var[s] = [var[s][0]] + sorted(var[s][1:])

os.makedirs(os.path.join(APP, 'mapas_puntos'), exist_ok=True)
for r, esc in ESCALA.items():
    c = open(os.path.join(S, r + '.html'), encoding='utf-8', errors='replace').read()
    marcas = {}
    for m in re.finditer(r'\{ coords: \[\s*(-?[\d.]+),\s*(-?[\d.]+),\s*(-?[\d.]+)\s*\], icon: (\w+), tableID: (\d+)', c):
        x, z, ic, t = float(m.group(1)), float(m.group(3)), m.group(4), int(m.group(5))
        marcas.setdefault(t, []).append((round(x * 1024 / esc, 1), round(z * 1024 / esc, 1), ic))
    puntos = {}
    for m in re.finditer(r'(\d+): \{ tableIDs: \[([^\]]*)\]', c):
        clave = int(m.group(1))
        sp, forma = divmod(clave, 10)
        l = var.get(sp)
        if not l: continue
        pid = l[forma] if forma < len(l) else l[0]
        pts = set()
        for t in re.findall(r'\d+', m.group(2)):
            for x, y, ic in marcas.get(int(t), []):
                pts.add((x, y, 1 if 'scarlet' in ic.lower() else 2 if 'violet' in ic.lower() else 0))
        if pts:
            puntos.setdefault(pid, []).extend(sorted(pts))
    with open(os.path.join(APP, 'mapas_puntos', r + '.js'), 'w', encoding='utf-8') as f:
        f.write('(window.PUNTOS=window.PUNTOS||{})[' + json.dumps(r) + ']=')
        json.dump(puntos, f, separators=(',', ':'))
        f.write(';\n')
    print(r, len(marcas), 'tablas', len(puntos), 'pokemon', os.path.getsize(os.path.join(APP, 'mapas_puntos', r + '.js')) // 1024, 'KB')
