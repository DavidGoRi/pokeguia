"""Lee los mapas de Pokéarth (Serebii) y crea mapas_reales.js con las zonas de cada lugar.
Uso: python serebii_mapas.py <carpeta html serebii> <carpeta app>
"""
import html, json, os, re, sys, unicodedata

S, APP = sys.argv[1], sys.argv[2]
REGIONES = ['kanto', 'johto', 'hoenn', 'sinnoh', 'unova', 'kalos']

t = open(os.path.join(APP, 'ubic', 'nombres.js'), encoding='utf-8').read()
IDS = set(json.loads(t[t.index('{"'):t.rindex('}') + 1]).keys())

def slug(x):
    x = unicodedata.normalize('NFD', x.lower().replace("'", '').replace('é', 'e'))
    x = ''.join(c for c in x if unicodedata.category(c) != 'Mn')
    return re.sub(r'[^a-z0-9]+', '-', x).strip('-')

ALIAS = {  # nombre de Serebii -> identificador de PokeAPI
    'mt-moon': 'mt-moon', 'power-plant': 'kanto-power-plant', 'safari-zone': '{r}-safari-zone',
    'victory-road': ['kanto-victory-road-1', 'kanto-victory-road-2', '{r}-victory-road', 'unova-victory-road', 'unova-victory-road-2'],
    'altering-cave': ['kanto-altering-cave', 'hoenn-altering-cave'], 'seavault-canyon': 'sevault-canyon',
    'mt-silver-johto': 'mt-silver', 'pokemon-league': '{r}-pokemon-league', 'mt-coronet': 'mt-coronet',
    'mt-mortar': 'mt-mortar', 'mt-pyre': 'mt-pyre', 'mt-chimney': 'mt-chimney', 'mt-silver': 'mt-silver',
    'team-rocket-h-q': 'team-rocket-hq', 'route-221': 'sinnoh-route-221',
    'hall-of-origin': 'sinnoh-hall-of-origin-1', 'evergrande-city': 'ever-grande-city', 'new-moon-island': 'newmoon-island',
    'valley-windwords': 'valley-windworks', 'tohjo-falls-kanto': 'tohjo-falls', 'route-26-kanto': 'kanto-route-26',
    'full-moon-island': 'fullmoon-island', 'sky-arrow-bridge': 'skyarrow-bridge', 'pokemon-mansion': 'pokemon-mansion', 'safari-zone-gate': 'safari-zone-gate',
}

def idents(region, titulo):
    s = slug(titulo)
    cand = []
    s = re.sub(r'^route-(\d+)-kanto$', r'route-\1', s)
    m = re.match(r'route-(\d+)$', s)
    if m:
        cand += [f'{region}-route-{m.group(1)}', f'{region}-sea-route-{m.group(1)}', f'kanto-route-{m.group(1)}',
                 f'kanto-sea-route-{m.group(1)}', f'johto-route-{m.group(1)}', f'johto-sea-route-{m.group(1)}']
    a = ALIAS.get(s)
    if a:
        for x in (a if isinstance(a, list) else [a]):
            cand.append(x.replace('{r}', region))
    cand += [s, f'{region}-{s}', s.replace('-town', '-town'), s + '-city']
    res = [c for c in dict.fromkeys(cand) if c in IDS]
    if m:  # una ruta solo puede ser una
        res = res[:1]
    return res

salida = {}
for r in REGIONES:
    c = open(os.path.join(S, r + '.html'), encoding='utf-8', errors='replace').read()
    img = re.search(r'<img[^>]*src="(/pokearth/[a-z]+\.png)"[^>]*usemap="#([^"]+)"', c)
    nombre_map = img.group(2)
    bloque = re.search(r'<map name="' + re.escape(nombre_map) + r'".*?</map>', c, re.S | re.I).group(0)
    zonas, sin = [], []
    for a in re.finditer(r'<area\b([^>]*)>', bloque, re.I):
        at = a.group(1)
        tit = re.search(r'title="([^"]+)"', at)
        sh = re.search(r'shape="([^"]+)"', at)
        co = re.search(r'coords="([^"]+)"', at)
        if not (tit and co): continue
        titulo = html.unescape(tit.group(1))
        if titulo in ('Top of Page', 'Serebii Open Search'): continue
        nums = [int(float(v)) for v in re.findall(r'-?\d+(?:\.\d+)?', co.group(1))]
        forma = (sh.group(1).lower() if sh else 'rect')
        ids = idents(r, titulo)
        if not ids: sin.append(titulo)
        zonas.append({'t': titulo, 'f': forma, 'c': nums, 'ids': ids})
    salida[r] = {'img': 'mapas_reales/' + r + '.png', 'zonas': zonas}
    print(r, len(zonas), 'zonas; sin identificador:', sin)

with open(os.path.join(APP, 'mapas_reales.js'), 'w', encoding='utf-8') as f:
    f.write('// Mapas reales de Pokéarth (serebii.net), solo para uso personal. Generado con herramientas/serebii_mapas.py\n')
    f.write('window.MAPAS_REALES=')
    json.dump(salida, f, ensure_ascii=False, separators=(',', ':'))
    f.write(';\n')
