"""Genera objetos.js: objetos útiles de cada juego con descripción, precio, para qué sirven, dónde se consiguen
(con los identificadores de lugar para marcarlos en el mapa), qué Pokémon salvajes los llevan, y las MT.
Fuentes: PokeAPI (CSV: nombres, descripciones, precio, evoluciones, objetos de Pokémon salvajes),
Serebii (itemdex: ubicaciones y tiendas) y PokémonDB (listas de MT).
Uso: python herramientas/objetos.py <carpeta_csv> <carpeta_cache>
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from comun_datos import *
from notas_es import traducir_parentesis

# ---------- Categorías elegidas ----------
CATS = {
    'evo': ('Para evolucionar', ['evolution']),
    'combate': ('Objetos de combate', ['held-items', 'choice', 'type-enhancement', 'plates', 'species-specific', 'bad-held-items', 'jewels', 'memories']),
    'mega': ('Megapiedras', ['mega-stones']),
    'balls': ('Poké Balls', ['standard-balls', 'special-balls', 'apricorn-balls']),
    'medicina': ('Medicinas y curación', ['healing', 'revival', 'status-cures', 'pp-recovery', 'medicine']),
    'mejora': ('Vitaminas y mejoras', ['vitamins', 'stat-boosts', 'effort-training', 'training', 'nature-mints']),
    'clave': ('Objetos clave', ['gameplay', 'plot-advancement']),
}
EVO_EXTRA = {'kings-rock', 'metal-coat', 'deep-sea-tooth', 'deep-sea-scale', 'razor-claw', 'razor-fang', 'auspicious-armor', 'galarica-cuff',
             'galarica-wreath', 'soothe-bell', 'everstone', 'dragon-scale', 'up-grade', 'oval-stone', 'protector', 'electirizer', 'magmarizer',
             'dubious-disc', 'reaper-cloth', 'prism-scale', 'whipped-dream', 'sachet'}
cat_ident = {r['id']: r['identifier'] for r in leer('item_categories')}
ident_cat = {}
for k, (_, l) in CATS.items():
    for c in l: ident_cat[c] = k
items = {r['id']: r for r in leer('items')}
elegidos = {}
for i, r in items.items():
    c = ident_cat.get(cat_ident.get(r['category_id']))
    if r['identifier'] in EVO_EXTRA: c = 'evo'
    if c and i in item_es: elegidos[i] = c
print(len(elegidos), 'objetos elegidos')

# ---------- Juegos ----------
vg_de_version = {r['id']: r['version_group_id'] for r in leer('versions')}
JUEGOS_APP = {j['id'] for j in D['juegos']}
JUEGOS_SER = {'Red': ['1'], 'Blue': ['1'], 'Yellow': ['2'], 'Gold': ['3'], 'Silver': ['3'], 'Crystal': ['4'], 'Ruby': ['5'], 'Sapphire': ['5'],
              'Emerald': ['6'], 'FireRed': ['7'], 'LeafGreen': ['7'], 'Diamond': ['8'], 'Pearl': ['8'], 'Platinum': ['9'], 'HeartGold': ['10'],
              'SoulSilver': ['10'], 'Black': ['11'], 'White': ['11'], 'Black 2': ['14'], 'White 2': ['14'], 'X': ['15'], 'Y': ['15'],
              'Omega Ruby': ['16'], 'Alpha Sapphire': ['16'], 'Sun': ['17'], 'Moon': ['17'], 'Ultra Sun': ['18'], 'Ultra Moon': ['18'],
              "Let's Go Pikachu": ['19'], "Let's Go Eevee": ['19'], "Let's Go, Pikachu!": ['19'], "Let's Go, Eevee!": ['19'], 'Sword': ['20'], 'Shield': ['20'],
              'Brilliant Diamond': ['23'], 'Shining Pearl': ['23'], 'Legends: Arceus': ['24'], 'Legends Arceus': ['24'], 'Scarlet': ['25'], 'Violet': ['25'],
              'Legends: Z-A': ['30'], 'Legends Z-A': ['30']}

# ---------- Identificadores de lugar ----------
# Índice: forma normalizada -> identificadores de la app (con y sin prefijo de región/juego)
POR_NORMA = {}
for slug in NL:
    s = slug.split(':', 1)[-1]
    POR_NORMA.setdefault(normz(s), set()).add(slug)
    for reg in REGS:
        if s.startswith(reg + '-'): POR_NORMA.setdefault(normz(s[len(reg) + 1:]), set()).add(slug)
def candidatos(region, slug):
    k = normz(slug)
    reg = normz(region or '')
    c = set(POR_NORMA.get(reg + k, set()))
    if not c and reg and k and not k[-1].isdigit():   # lugares partidos en plantas: kanto-victory-road-1, -2...
        c = {s for s in NL if normz(s.split(':', 1)[-1]).startswith(reg + k) and re.fullmatch(r'\d+', normz(s.split(':', 1)[-1])[len(reg + k):])}
    if not c:
        todos = set(POR_NORMA.get(k, set()))
        de_region = {s for s in todos if reg and normz(s.split(':', 1)[-1]).startswith(reg)}
        c = de_region or todos
    return sorted(c)

def lugares_fila(celda):
    """Texto en español de la celda de Serebii y lista de identificadores de lugar enlazados."""
    ids = []
    for m in re.finditer(r'<a href="/pokearth/([a-z0-9-]+)/([^".]+)\.shtml">', celda):
        for c in candidatos(m.group(1), m.group(2)):
            if c not in ids: ids.append(c)
    return ubicaciones_html(celda), ids

# ---------- Ubicaciones (Serebii itemdex) ----------
donde = {}
for n, (i, c) in enumerate(sorted(elegidos.items(), key=lambda x: int(x[0]))):
    if n % 50 == 0: print(' ', n, 'de', len(elegidos), flush=True)
    pag = bajar('https://www.serebii.net/itemdex/' + items[i]['identifier'].replace('-', '') + '.shtml')
    if not pag: continue
    for seccion, prefijo in (('>Locations<', ''), ('>Shopping Details<', 'Tienda: ')):
        if seccion not in pag: continue
        zona = pag[pag.index(seccion):]
        zona = zona[:zona.find('</table>')] if '</table>' in zona else zona
        for fila in re.findall(r'<tr>(.*?)</tr>', zona, re.S):
            juegos = [texto(x) for x in re.findall(r'<td class="[a-z0-9-]+" colspan="\d+">(.*?)</td>', fila, re.S)]
            info = re.search(r'<td class="fooinfo"[^>]*>(.*?)</td>\s*$', fila, re.S)
            if not juegos or not info: continue
            t, ids = lugares_fila(info.group(1))
            if not t: continue
            e = {'t': prefijo + t, 'l': ids}
            for g in juegos:
                for jid in JUEGOS_SER.get(g, []):
                    l = donde.setdefault(jid, {}).setdefault(i, [])
                    if e not in l: l.append(e)
print('objetos con ubicación por juego:', {j: len(v) for j, v in sorted(donde.items(), key=lambda x: int(x[0]))})

# ---------- Descripciones, precio, evoluciones, objetos de salvajes ----------
desc = {}
for r in leer('item_flavor_text'):
    if r['language_id'] == '7' and r['item_id'] in elegidos:
        desc.setdefault(r['item_id'], {})[r['version_group_id']] = re.sub(r'\s+', ' ', r['flavor_text']).strip()
evo = {}
for r in leer('pokemon_evolution'):
    for campo, como in (('trigger_item_id', 'usar'), ('held_item_id', 'llevar')):
        if r[campo] and r[campo] in elegidos:
            evo.setdefault(r[campo], []).append([int(r['evolved_species_id']), como])
llevan = {}
for r in leer('pokemon_items'):
    if r['item_id'] not in elegidos: continue
    vg = vg_de_version.get(r['version_id'])
    if vg not in JUEGOS_APP: continue
    l = llevan.setdefault(vg, {}).setdefault(r['item_id'], [])
    e = [int(r['pokemon_id']), int(r['rarity'])]
    if e not in l: l.append(e)

# ---------- MT (PokémonDB) ----------
mov_ident = {r['identifier']: int(r['id']) for r in leer('moves')}
MT_PDB = {'red-blue': ['1', '2'], 'gold-silver': ['3', '4'], 'ruby-sapphire': ['5', '6'], 'firered-leafgreen': ['7'], 'diamond-pearl': ['8', '9'],
          'heartgold-soulsilver': ['10'], 'black-white': ['11'], 'black-white-2': ['14'], 'x-y': ['15'], 'omega-ruby-alpha-sapphire': ['16'],
          'sun-moon': ['17'], 'ultra-sun-ultra-moon': ['18'], 'lets-go-pikachu-eevee': ['19'], 'sword-shield': ['20'],
          'brilliant-diamond-shining-pearl': ['23'], 'scarlet-violet': ['25'], 'legends-z-a': ['30']}
mts = {}
for slug, jids in MT_PDB.items():
    pag = bajar(f'https://pokemondb.net/{slug}/tms', 2.0)
    for fila in re.findall(r'<tr>(.*?)</tr>', pag, re.S):
        num = re.search(r'<td class="cell-num">\s*(\w+)\s*</td>', fila)
        mv = re.search(r'href="/move/([a-z0-9-]+)"', fila)
        loc = re.search(r'<td class="cell-long-text">(.*?)</td>', fila, re.S)
        if not (num and mv): continue
        lugares, ids = [], []
        if loc:
            for a in re.finditer(r'<a href="/location/([a-z0-9-]+)">(.*?)</a>(.*?)(?=<a href|</div>|$)', loc.group(1), re.S):
                ident = a.group(1)
                reg = next((r for r in REGS if ident.startswith(r + '-')), None)
                kk = normz(ident[len(reg) + 1:] if reg else ident)
                nom = frase_es((IDX_REG.get((reg, kk)) if reg else None) or IDX.get(kk) or NL.get(ident) or lugar_es(texto(a.group(2))))
                extra = texto(a.group(3)).strip(' ,')
                lugares.append(nom + (' (' + traducir_nota(frase_es(extra).strip('() ')) + ')' if extra else ''))
                for c in ([ident] if ident in NL else []) + candidatos(reg, ident[len(reg) + 1:] if reg else ident):
                    if c not in ids: ids.append(c)
            if not lugares: lugares = [frase_es(texto(loc.group(1)))]
        n_mt = num.group(1)
        if any(r[0] == n_mt for r in mts.get(jids[0], []) if r[4] == slug): n_mt = 'DT' + n_mt   # segunda lista (DT de Espada/Escudo)
        for jid in jids:
            mts.setdefault(jid, []).append([n_mt, mov_ident.get(mv.group(1)), traducir_parentesis(' · '.join(x for x in lugares if x)), ids, slug])
print('MT:', {j: len(v) for j, v in mts.items()})

with open(os.path.join(APP, 'objetos.js'), 'w', encoding='utf-8') as f:
    f.write('// Objetos y MT: PokeAPI, Serebii (itemdex) y PokémonDB. Generado con herramientas/objetos.py\nwindow.OBJETOS=')
    json.dump({
        'cats': {k: v[0] for k, v in CATS.items()},
        'items': {i: {'n': item_es[i], 'i': items[i]['identifier'], 'c': c, 'p': int(items[i]['cost'] or 0), 'd': desc.get(i, {})} for i, c in elegidos.items()},
        'donde': donde, 'mt': mts, 'evo': evo, 'llevan': llevan,
        # compatibilidad con el resto de la app
        'nombres': {i: item_es[i] for i in elegidos}, 'ident': {i: items[i]['identifier'] for i in elegidos}, 'cat': elegidos,
    }, f, ensure_ascii=False, separators=(',', ':'))
    f.write(';\n')
print('hecho')
