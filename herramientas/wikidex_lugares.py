"""Busca en WikiDex, para cada lugar donde aparecen Pokémon, el mapa real con el lugar marcado ("mapa")
y las capturas del lugar en cada juego ("imagen <juego>"). Crea lugares_fotos.js. Uso personal.
Uso: python wikidex_lugares.py <carpeta app> <carpeta csv pokeapi> <cache.json>
"""
import csv, json, os, re, sys, time, urllib.parse, urllib.request

APP, CSV, CACHE = sys.argv[1], sys.argv[2], sys.argv[3]
API = 'https://www.wikidex.net/api.php'
UA = {'User-Agent': 'PokedexTiposLocal/1.0 (app personal)'}
cache = json.load(open(CACHE, encoding='utf-8')) if os.path.exists(CACHE) else {}

def api(**p):
    p['format'] = 'json'
    clave = json.dumps(p, sort_keys=True)
    if clave in cache: return cache[clave]
    url = API + '?' + urllib.parse.urlencode(p)
    for _ in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40) as r:
                d = json.loads(r.read().decode('utf-8'))
                cache[clave] = d
                time.sleep(1.0)
                return d
        except Exception:
            time.sleep(4)
    return {}

def guardar():
    json.dump(cache, open(CACHE, 'w', encoding='utf-8'), ensure_ascii=False)

# --- Lugares de todos los juegos: identificador -> (nombre, región) ---
def leer_js(f):
    t = open(os.path.join(APP, f), encoding='utf-8').read()
    return json.loads(t[t.index('{"'):t.rindex('}') + 1]) if '{"' in t else {}
NOMBRES = {}
NOMBRES.update(leer_js('ubic/nombres.js')); NOMBRES.update(leer_js('ubic/nombres_pkhex.js'))
reg_es = {'kanto': 'Kanto', 'johto': 'Johto', 'hoenn': 'Hoenn', 'sinnoh': 'Sinnoh', 'unova': 'Teselia', 'kalos': 'Kalos',
          'alola': 'Alola', 'galar': 'Galar', 'hisui': 'Hisui', 'paldea': 'Paldea'}
regiones = {r['id']: r['identifier'] for r in csv.DictReader(open(os.path.join(CSV, 'regions.csv'), encoding='utf-8'))}
loc_reg = {r['identifier']: reg_es.get(regiones.get(r['region_id'], ''), '')
           for r in csv.DictReader(open(os.path.join(CSV, 'locations.csv'), encoding='utf-8'))}
loc_en = {}
locs_csv = {r['id']: r['identifier'] for r in csv.DictReader(open(os.path.join(CSV, 'locations.csv'), encoding='utf-8'))}
for r in csv.DictReader(open(os.path.join(CSV, 'location_names.csv'), encoding='utf-8')):
    if r['local_language_id'] == '9': loc_en[locs_csv[r['location_id']]] = r['name']
PREF = {'sv': 'Paldea', 'la': 'Hisui', 'za': 'Kalos', 'bdsp': 'Sinnoh'}

lugares = {}
for f in os.listdir(os.path.join(APP, 'ubic')):
    if not re.match(r'\d+\.js$', f): continue
    t = open(os.path.join(APP, 'ubic', f), encoding='utf-8').read()
    d = json.loads(t[t.index(']=') + 2:t.rindex(';')])
    for nombre, ident in d['locs'].values():
        if ident in lugares: continue
        region = PREF.get(ident.split(':')[0], '') if ':' in ident else loc_reg.get(ident, '')
        lugares[ident] = (NOMBRES.get(ident, nombre), region, loc_en.get(ident, ''))
print(len(lugares), 'lugares')

def limpia(n):
    return re.sub(r'\s*\(.*?\)\s*$', '', n).strip()

# --- 1) Buscar la página por título ---
def candidatos(nombre, region):
    n = limpia(nombre)
    c = []
    if region: c.append(f'{n} ({region})')
    c.append(n)
    return c

encontrado = {}
pend = list(lugares.items())
titulos = {}
for ident, (n, r, en) in pend:
    for c in candidatos(n, r): titulos.setdefault(c, []).append(ident)
lista = list(titulos)
paginas = {}   # título pedido -> título real (tras redirecciones)
for k in range(0, len(lista), 50):
    d = api(action='query', titles='|'.join(lista[k:k + 50]), redirects=1)
    q = d.get('query', {})
    mapa = {x['from']: x['to'] for x in q.get('normalized', [])}
    red = {x['from']: x['to'] for x in q.get('redirects', [])}
    existentes = {p['title'] for p in q.get('pages', {}).values() if 'missing' not in p}
    for t in lista[k:k + 50]:
        t2 = mapa.get(t, t); t3 = red.get(t2, t2)
        if t3 in existentes: paginas[t] = t3
guardar()
for ident, (n, r, en) in lugares.items():
    for c in candidatos(n, r):
        if c in paginas: encontrado[ident] = paginas[c]; break
print('por título:', len(encontrado))

# --- 2) Contenido de las páginas (ficha con mapa e imágenes) ---
def fichas(titulos):
    res = {}
    tl = sorted(set(titulos))
    for k in range(0, len(tl), 40):
        d = api(action='query', titles='|'.join(tl[k:k + 40]), prop='revisions', rvprop='content', rvslots='main')
        for p in d.get('query', {}).get('pages', {}).values():
            try: res[p['title']] = p['revisions'][0]['slots']['main']['*']
            except Exception: pass
    return res
texto = fichas(encontrado.values())
guardar()

def campos(wt):
    c = {}
    m = re.search(r'\{\{\s*(Ruta|Lugar|Ciudad|Pueblo|Localización|Cueva|Edificio)[^\n]*\n(.*?)\n\}\}', wt or '', re.S | re.I)
    cuerpo = m.group(2) if m else (wt or '')[:3000]
    for l in cuerpo.split('\n'):
        mm = re.match(r'\s*\|\s*([^=|]+?)\s*=\s*(.*)$', l)
        if mm: c[mm.group(1).strip().lower()] = mm.group(2).strip()
    return c

# --- 3) Si no se encontró o la ficha no coincide con el nombre inglés, buscar por nombre inglés ---
faltan = [i for i, (n, r, en) in lugares.items() if i not in encontrado and en]
for ident in faltan:
    n, r, en = lugares[ident]
    d = api(action='query', list='search', srsearch=f'"{en}" {r}'.strip(), srlimit=5)
    tits = [s['title'] for s in d.get('query', {}).get('search', [])]
    tx = fichas(tits)
    for t in tits:
        if campos(tx.get(t, '')).get('nombreinglés', '').lower() == en.lower():
            encontrado[ident] = t; texto[t] = tx[t]; break
guardar()
print('total encontrados:', len(encontrado), 'de', len(lugares))

# --- 4) Imágenes ---
datos, archivos = {}, set()
for ident, t in encontrado.items():
    c = campos(texto.get(t, ''))
    imgs = {}
    for k, v in c.items():
        mm = re.match(r'imagen\s*(.*)$', k)
        v = re.sub(r'^(archivo|file|imagen):', '', v, flags=re.I).strip()
        if mm and re.search(r'\.(png|jpe?g|gif|webp)$', v, re.I):
            imgs[mm.group(1).strip() or 'general'] = v
    mapa = re.sub(r'^(archivo|file):', '', c.get('mapa', ''), flags=re.I).strip()
    if not re.search(r'\.(png|jpe?g|gif|webp)$', mapa, re.I): mapa = ''
    datos[ident] = {'pag': t, 'mapa': mapa, 'imgs': imgs}
    if mapa: archivos.add(mapa)
    archivos.update(imgs.values())

urls = {}
al = sorted(archivos)
for k in range(0, len(al), 40):
    d = api(action='query', titles='|'.join('Archivo:' + a for a in al[k:k + 40]), prop='imageinfo', iiprop='url')
    q = d.get('query', {})
    norm = {x['to']: x['from'] for x in q.get('normalized', [])}
    for p in q.get('pages', {}).values():
        if p.get('imageinfo'):
            orig = norm.get(p['title'], p['title'])
            urls[orig.split(':', 1)[1]] = p['imageinfo'][0]['url']
            urls[p['title'].split(':', 1)[1]] = p['imageinfo'][0]['url']
guardar()

salida = {}
for ident, d in datos.items():
    e = {'pag': d['pag']}
    if d['mapa'] and d['mapa'] in urls: e['mapa'] = urls[d['mapa']]
    im = {k: urls[v] for k, v in d['imgs'].items() if v in urls}
    if im: e['img'] = im
    if 'mapa' in e or 'img' in e: salida[ident] = e
with open(os.path.join(APP, 'lugares_fotos.js'), 'w', encoding='utf-8') as f:
    f.write('// Mapas y capturas de cada lugar: WikiDex (wikidex.net), solo uso personal. Generado con herramientas/wikidex_lugares.py\n')
    f.write('window.LUGAR_FOTOS=')
    json.dump(salida, f, ensure_ascii=False, separators=(',', ':'))
    f.write(';\n')
print('con mapa:', sum(1 for e in salida.values() if 'mapa' in e), 'con capturas:', sum(1 for e in salida.values() if 'img' in e))
claves = {}
for e in salida.values():
    for k in e.get('img', {}): claves[k] = claves.get(k, 0) + 1
print('códigos de juego en capturas:', sorted(claves.items(), key=lambda x: -x[1])[:40])
