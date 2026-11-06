"""Convierte las tablas de encuentros de PKHeX (GPL-3) en ubic/<juego>.js para la app.
Juegos: 23 = Diamante Brillante/Perla Reluciente, 24 = Leyendas Arceus, 25 = Escarlata/Púrpura (+DLC), 30 = Leyendas Z-A.
Uso: python pkhex_ubic.py <carpeta pkhex> <carpeta csv pokeapi> <carpeta salida ubic>
"""
import csv, json, os, re, struct, sys
from collections import defaultdict

P, CSV, SAL = sys.argv[1], sys.argv[2], sys.argv[3]

def leer_csv(n):
    with open(os.path.join(CSV, n + '.csv'), encoding='utf-8') as f:
        return list(csv.DictReader(f))

# (especie, forma) -> id de pokemon de PokeAPI
EXCLUIR = re.compile(r'gmax|mega|totem|primal|eternamax|cap$|-cap-|cosplay|rock-star|belle|pop-star|phd|libre|starter|busted|own-tempo')
var = defaultdict(list)
for r in leer_csv('pokemon'):
    sid, pid = int(r['species_id']), int(r['id'])
    if r['is_default'] == '1':
        var[sid].insert(0, pid)
    elif not EXCLUIR.search(r['identifier']):
        var[sid].append(pid)
for s in var:
    var[s] = [var[s][0]] + sorted(var[s][1:])
def poke_id(especie, forma):
    l = var.get(especie)
    if not l: return None
    return l[forma] if forma < len(l) else l[0]

def textos(pref, idioma):
    t = {}
    for base in (0, 30000, 40000, 60000):
        f = os.path.join(P, f'text_{pref}_{base:05d}_{idioma}.txt')
        if os.path.exists(f):
            for i, linea in enumerate(open(f, encoding='utf-8-sig').read().split('\n')):
                linea = linea.strip()
                if linea: t[base + i] = linea
    return t

def binlinker(nombre, ancho=32):
    d = open(os.path.join(P, nombre), 'rb').read()
    n = struct.unpack_from('<H', d, 2)[0]
    if ancho == 32:
        offs = struct.unpack_from('<%dI' % (n + 1), d, 4)
    else:
        offs = struct.unpack_from('<%dH' % (n + 1), d, 4)
    return [d[offs[i]:offs[i + 1]] for i in range(n)]

# encuentro: (loc, metodo, min, max, versiones, condiciones)
def bdsp():
    tipos = {1: 'Hierba / cueva', 2: 'Surf', 3: 'Caña Vieja', 4: 'Caña Buena', 5: 'Supercaña', 6: 'Golpe Roca', 7: 'Cabezazo', 8: 'Árbol de miel'}
    out = []
    for fich, ver in (('encounter_bd.pkl', 'Diamante Brillante'), ('encounter_sp.pkl', 'Perla Reluciente'),
                      ('encounter_bd_underground.pkl', 'Diamante Brillante'), ('encounter_sp_underground.pkl', 'Perla Reluciente')):
        sub = 'underground' in fich
        for a in binlinker(fich):
            loc, tipo = struct.unpack_from('<H', a, 0)[0], a[2]
            met = 'Grutas del Subsuelo' if sub else tipos.get(tipo, 'Hierba / cueva')
            for i in range(4, len(a) - 3, 4):
                sp, mn, mx = struct.unpack_from('<H', a, i)[0], a[i + 2], a[i + 3]
                out.append((loc, met, sp & 0x3FF, sp >> 11, mn, mx, ver, ()))
    return out

def la():
    tipos = {0: 'Salvaje', 1: 'Distorsión espaciotemporal', 2: 'Lugar especial', 3: 'Aparición masiva', 4: 'Aparición masiva (gran)'}
    out = []
    for a in binlinker('encounter_la.pkl'):
        nloc = a[0]
        locs = list(a[1:1 + nloc])
        al = nloc + 1
        al += al & 1
        r = a[al:]
        tipo, cnt = r[0], r[1]
        for k in range(cnt):
            e = r[2 + 8 * k: 10 + 8 * k]
            sp, form, mn, mx = struct.unpack_from('<H', e, 0)[0], e[2], e[4], e[5]
            for l in locs:
                out.append((l, tipos.get(tipo, 'Salvaje'), sp, form, mn, mx, None, ()))
    return out

TIEMPO = ['Día', 'Noche', 'Atardecer', 'Amanecer']  # bit puesto = no aparece
CLIMA = [(1, 'Despejado'), (2, 'Nublado'), (4, 'Lluvia'), (8, 'Tormenta'), (16, 'Niebla'), (32, 'Nieve'), (64, 'Ventisca'), (128, 'Tormenta de arena')]
def sv():
    out = []
    for a in binlinker('encounter_wild_paldea.pkl'):
        loc, cross = a[0], a[2]
        real = cross or loc
        for i in range(4, len(a) - 7, 8):
            sp, form, mn, mx, t, w = struct.unpack_from('<H', a, i)[0], a[i + 2], a[i + 4], a[i + 5], a[i + 6], a[i + 7]
            cs = []
            if t: cs += ['Solo: ' + ', '.join(n for b, n in enumerate(TIEMPO) if not t & (1 << b))]
            if w and w not in (1 | 2 | 4 | 8, 1 | 2, 1 | 2 | 4 | 128, 1 | 2 | 32 | 64, 255):
                cs += [n for b, n in CLIMA if w & b]
            out.append((real, 'Salvaje', sp, form, mn, mx, None, tuple(cs)))
    return out

def za():
    out = []
    for fich, met in (('encounter_za.pkl', 'Salvaje'), ('encounter_hyperspace_za.pkl', 'Hiperespacio')):
        for a in binlinker(fich, 16):
            loc = struct.unpack_from('<H', a, 0)[0]
            for i in range(4, len(a) - 7, 8):
                sp, form, mn, mx, alfa = struct.unpack_from('<H', a, i)[0], a[i + 2], a[i + 4], a[i + 5], a[i + 6]
                out.append((loc, met, sp, form, mn, mx, None, ('Alfa',) if alfa == 1 else ()))
    return out

def estaticos(fich, juego):
    """Encuentros fijos y regalos escritos en el código de PKHeX."""
    out = []
    for linea in open(os.path.join(P, fich), encoding='utf-8'):
        if 'Location' not in linea or linea.strip().startswith('//'): continue
        loc = re.search(r'Location\s*=\s*(\d+)', linea)
        if not loc: continue
        m = re.search(r'Species\s*=\s*(\d+)', linea)
        if m:
            sp = int(m.group(1))
            form = int((re.search(r'Form\s*=\s*(\d+)', linea) or [0, 0])[1])
            lv = int((re.search(r'Level\s*=\s*(\d+)', linea) or [0, 0])[1])
        else:
            m = re.search(r'new\((\d+),\s*(\d+),\s*(\d+)', linea)
            if not m: continue
            sp, form, lv = int(m.group(1)), int(m.group(2)), int(m.group(3))
        if not 0 < sp <= 1025: continue
        met = 'Huevo / regalo' if ('Egg' in linea or 'FixedBall' in linea or 'Gift' in linea) else 'Encuentro fijo'
        ver = None
        if juego == '23':
            if re.search(r'new\(BD\)', linea): ver = 'Diamante Brillante'
            if re.search(r'new\(SP\)', linea): ver = 'Perla Reluciente'
        if juego == '25':
            if re.search(r'new\(SL\)', linea): ver = 'Escarlata'
            if re.search(r'new\(VL\)', linea): ver = 'Púrpura'
        out.append((int(loc.group(1)), met, sp, form, lv, lv, ver, ()))
    return out

JUEGOS = {
    '23': ('bdsp', bdsp() + estaticos('Encounters8b.cs', '23'), ['Diamante Brillante', 'Perla Reluciente']),
    '24': ('la', la() + estaticos('Encounters8a.cs', '24'), []),
    '25': ('sv', sv() + estaticos('Encounters9.cs', '25'), ['Escarlata', 'Púrpura']),
    '30': ('za', za() + estaticos('Encounters9a.cs', '30'), []),
}

import unicodedata
def slug(t):
    t = unicodedata.normalize('NFD', t.lower())
    t = ''.join(c for c in t if unicodedata.category(c) != 'Mn')
    return re.sub(r'[^a-z0-9]+', '-', t).strip('-')

def ident_de(pref, ingles):
    s = slug(ingles)
    if pref == 'bdsp':
        # Usar los identificadores de PokeAPI para que encajen en el mapa de Sinnoh
        m = re.match(r'route-(\d+)$', s)
        if m:
            n = int(m.group(1))
            return ('sinnoh-sea-route-%d' if n in (220, 223, 226, 230) else 'sinnoh-route-%d') % n
        if s.startswith('grand-underground'): return 'bdsp:grand-underground'
        if s.startswith('ramanas-park'): return 'bdsp:ramanas-park'
        if s.startswith('lake-valor'): return 'lake-valor'
        if s.startswith('lake-acuity'): return 'lake-acuity'
        return {'mount-coronet': 'mt-coronet', 'victory-road': 'sinnoh-victory-road', 'pokemon-league': 'sinnoh-pokemon-league',
                'hall-of-origin': 'sinnoh-hall-of-origin-1'}.get(s, s)
    return pref + ':' + s

NOMBRES = {}
for j, (pref, encs, versiones) in JUEGOS.items():
    es, en = textos(pref, 'es'), textos(pref, 'en')
    for k, v in en.items():
        if k in es and es[k] not in ('－', '—', '-'):
            NOMBRES.setdefault(ident_de(pref, v), es[k])
    NOMBRES['bdsp:grand-underground'] = 'Grutas del Subsuelo'
    NOMBRES['bdsp:ramanas-park'] = 'Parque Hansa'
    locs, agg = {}, {}
    for loc, met, sp, form, mn, mx, ver, cs in encs:
        pid = poke_id(sp, form)
        nombre = es.get(loc) or en.get(loc)
        if not pid or not nombre or nombre in ('—', '－', '----', '-'): continue
        ingles = en.get(loc, nombre)
        ident = ident_de(pref, ingles)
        locs[str(loc)] = [nombre, ident]
        k = (pid, loc, met)
        a = agg.setdefault(k, {'min': 999, 'max': 0, 'v': set(), 'c': set()})
        a['min'] = min(a['min'], mn); a['max'] = max(a['max'], mx)
        if ver: a['v'].add(ver)
        else: a['v'].update(versiones)
        a['c'].update(cs)
    p = defaultdict(list)
    for (pid, loc, met), a in agg.items():
        vs = [v for v in versiones if v in a['v']]
        p[pid].append([loc, met, a['min'], a['max'], vs if len(vs) < len(versiones) else [], sorted(a['c']), 0])
    for pid in p:
        p[pid].sort(key=lambda e: (locs[str(e[0])][0], e[1]))
    ruta = os.path.join(SAL, j + '.js')
    with open(ruta, 'w', encoding='utf-8') as f:
        f.write('(window.UBIC=window.UBIC||{})[' + json.dumps(j) + ']=')
        json.dump({'locs': locs, 'p': p, 'fuente': 'PKHeX'}, f, ensure_ascii=False, separators=(',', ':'))
        f.write(';\n')
    print(j, len(locs), 'lugares', len(p), 'pokemon', os.path.getsize(ruta) // 1024, 'KB')
    # lista de lugares para dibujar los mapas
    with open(os.path.join(P, f'lugares_{j}.txt'), 'w', encoding='utf-8') as f:
        for k, (n, i) in sorted(locs.items(), key=lambda x: int(x[0])):
            f.write(f'{k}\t{i}\t{n}\n')

with open(os.path.join(SAL, 'nombres_pkhex.js'), 'w', encoding='utf-8') as f:
    f.write('Object.assign(window.NOMBRES_LUGAR=window.NOMBRES_LUGAR||{},')
    json.dump({k: v for k, v in NOMBRES.items() if ':' in k}, f, ensure_ascii=False, separators=(',', ':'))
    f.write(');\n')
