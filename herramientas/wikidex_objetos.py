"""Genera objetos_lugares.js: dónde está exactamente cada objeto dentro de cada lugar (descripción en español de WikiDex,
sección «Objetos» de cada artículo de lugar, separada por generación o juego) y las imágenes de WikiDex que marcan los objetos.
Uso: python herramientas/wikidex_objetos.py <cache.json de WikiDex>
"""
import json, os, re, sys, time, unicodedata, urllib.parse, urllib.request

CACHE = sys.argv[1]
APP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
API = 'https://www.wikidex.net/api.php'
UA = {'User-Agent': 'PokeGuiaLocal/1.0 (app personal)'}
cache = json.load(open(CACHE, encoding='utf-8')) if os.path.exists(CACHE) else {}

def api(**p):
    p.update(format='json', formatversion='2')
    clave = json.dumps(p, sort_keys=True)
    if clave in cache: return cache[clave]
    time.sleep(.4)
    with urllib.request.urlopen(urllib.request.Request(API + '?' + urllib.parse.urlencode(p), headers=UA), timeout=60) as r:
        d = json.loads(r.read().decode('utf-8'))
    cache[clave] = d
    return d

def leer_js(f):
    t = open(os.path.join(APP, f), encoding='utf-8').read()
    return json.loads(t[t.index('=') + 1:t.rindex(';')])

LF = leer_js('lugares_fotos.js')
D = leer_js('datos.js')
GEN_JUEGOS = {}
for j in D['juegos']: GEN_JUEGOS.setdefault(int(j['gen']), []).append(j['id'])

# Texto de todas las páginas ya descargadas (las respuestas de la caché traen el wikitexto)
texto_pag = {}
def recoger(d):
    pags = (d.get('query') or {}).get('pages', [])
    for p in (pags.values() if isinstance(pags, dict) else pags):
        revs = p.get('revisions') or []
        if revs:
            sl = revs[0].get('slots', {}).get('main', {})
            c = sl.get('content') or sl.get('*') or revs[0].get('content') or revs[0].get('*')
            if c: texto_pag[p['title']] = c
for d in cache.values():
    if isinstance(d, dict): recoger(d)
titulos = sorted({v['pag'] for v in LF.values() if v.get('pag')})
faltan = [t for t in titulos if t not in texto_pag]
print(len(titulos), 'páginas de lugar;', len(faltan), 'por descargar')
for k in range(0, len(faltan), 40):
    recoger(api(action='query', titles='|'.join(faltan[k:k + 40]), prop='revisions', rvprop='content', rvslots='main', redirects='1'))

ORD = {'primera': 1, 'segunda': 2, 'tercera': 3, 'cuarta': 4, 'quinta': 5, 'sexta': 6, 'séptima': 7, 'septima': 7, 'octava': 8, 'novena': 9}
JUEGOS = [('rojo fuego', '7'), ('verde hoja', '7'), ("let's go", '19'), ('let’s go', '19'), ('diamante brillante', '23'), ('perla reluciente', '23'),
          ('leyendas pokémon: z-a', '30'), ('z-a', '30'), ('leyendas', '24'), ('arceus', '24'), ('escarlata', '25'), ('púrpura', '25'), ('espada', '20'), ('escudo', '20'),
          ('ultrasol', '18'), ('ultraluna', '18'), ('rubí omega', '16'), ('zafiro alfa', '16'), ('negro 2', '14'), ('blanco 2', '14'),
          ('heartgold', '10'), ('soulsilver', '10'), ('platino', '9'), ('esmeralda', '6'), ('cristal', '4'), ('amarillo', '2'),
          ('sol', '17'), ('luna', '17'), ('x', '15'), ('y', '15'), ('negro', '11'), ('blanco', '11'), ('diamante', '8'), ('perla', '8'),
          ('rubí', '5'), ('zafiro', '5'), ('oro', '3'), ('plata', '3'), ('rojo', '1'), ('azul', '1')]
def juegos_de(titulo):
    t = titulo.lower().replace('pokémon', ' ')
    m = re.search(r'(primera|segunda|tercera|cuarta|quinta|sexta|s[ée]ptima|octava|novena)\s+generaci', t)
    if m: return GEN_JUEGOS.get(ORD[m.group(1)], [])
    res = []
    for nombre, jid in JUEGOS:
        if re.search(r'(?<![\wáéíóú])' + re.escape(nombre) + r'(?![\wáéíóú])', t):
            if jid not in res: res.append(jid)
            t = re.sub(re.escape(nombre), ' ', t)
    return res

def norm(s):
    s = unicodedata.normalize('NFD', s.lower())
    return re.sub(r'\s+', ' ', ''.join(c for c in s if unicodedata.category(c) != 'Mn')).strip()

def limpia(s):
    s = re.sub(r'<ref[^>]*>.*?</ref>|<ref[^>]*/>', '', s, flags=re.S)
    s = re.sub(r'<br\s*/?>', ' ', s)
    s = re.sub(r'\[\[(?:Archivo|File|Imagen):[^\]]*\]\]', '', s)
    s = re.sub(r'\[\[([^\]|]*)\|([^\]]*)\]\]', r'\2', s)
    s = re.sub(r'\[\[([^\]]*)\]\]', r'\1', s)
    for _ in range(3): s = re.sub(r'\{\{(?:[^{}|]*\|)*([^{}|]*)\}\}', r'\1', s)
    s = re.sub(r"'{2,}", '', s)
    s = re.sub(r'<[^>]+>', '', s)
    return re.sub(r'\s+', ' ', s).strip(' .') + '.'

def args(plantilla):
    """Separa los parámetros de {{TP/Objeto|...}} respetando [[...]] y {{...}}."""
    partes, nivel, act = [], 0, ''
    for i, c in enumerate(plantilla):
        dos = plantilla[i:i + 2]
        if dos in ('[[', '{{'): nivel += 1
        elif dos in (']]', '}}'): nivel -= 1
        if c == '|' and nivel == 0: partes.append(act); act = ''
        else: act += c
    partes.append(act)
    return [p.strip() for p in partes]

# Juegos en los que existe cada lugar (para las páginas sin apartados por generación)
juegos_lugar = {}
for f in os.listdir(os.path.join(APP, 'ubic')):
    if re.match(r'^\d+\.js$', f):
        t = open(os.path.join(APP, 'ubic', f), encoding='utf-8').read()
        u = json.loads(t[t.index('=', t.index(']')) + 1:t.rindex(';')])
        for _, slug in u['locs'].values(): juegos_lugar.setdefault(slug, []).append(f[:-3])

datos, imagenes_pend = {}, set()
for ident, v in LF.items():
    wt = texto_pag.get(v.get('pag'))
    if not wt or 'TP/Objeto' not in wt: continue
    defecto = juegos_lugar.get(ident, [])
    actuales = defecto      # juegos del apartado actual
    for linea in wt.split('\n'):
        h = re.match(r'^(={2,5})\s*(.*?)\s*\1\s*$', linea)
        if h:
            js = juegos_de(h.group(2))
            if js: actuales = js
            elif len(h.group(1)) == 2: actuales = defecto
            continue
        for im in re.findall(r'\[\[(?:Archivo|File|Imagen):([^|\]]+)', linea):
            if re.search(r'objeto', im, re.I):
                for jid in actuales:
                    datos.setdefault(ident, {}).setdefault(jid, {'o': [], 'i': []})['i'].append(im.strip())
                imagenes_pend.add(im.strip())
        for m in re.finditer(r'\{\{TP/Objeto\|(.*)\}\}', linea):
            a = [x for x in args(m.group(1))]
            pos = [x for x in a if '=' not in x.split('[[')[0]]
            if len(pos) < 2 or not actuales: continue
            nombre, desc = limpia(pos[0]).rstrip('.'), limpia(pos[1])
            if len(desc) < 3: continue
            for jid in actuales:
                datos.setdefault(ident, {}).setdefault(jid, {'o': [], 'i': []})['o'].append([norm(nombre), nombre, desc])

# URLs de las imágenes que marcan los objetos
url_img = {}
lista = sorted(imagenes_pend)
for k in range(0, len(lista), 45):
    d = api(action='query', titles='|'.join('Archivo:' + x for x in lista[k:k + 45]), prop='imageinfo', iiprop='url')
    pags = (d.get('query') or {}).get('pages', [])
    for p in (pags.values() if isinstance(pags, dict) else pags):
        ii = p.get('imageinfo')
        if ii: url_img[p['title'].split(':', 1)[1]] = ii[0]['url']
for ident in datos:
    for jid, x in datos[ident].items():
        x['i'] = [url_img[n] for n in dict.fromkeys(x['i']) if n in url_img]

json.dump(cache, open(CACHE, 'w', encoding='utf-8'), ensure_ascii=False)
with open(os.path.join(APP, 'objetos_lugares.js'), 'w', encoding='utf-8') as f:
    f.write('// Dónde está cada objeto dentro de cada lugar (WikiDex). Generado con herramientas/wikidex_objetos.py\nwindow.OBJ_LUGAR=')
    json.dump(datos, f, ensure_ascii=False, separators=(',', ':'))
    f.write(';\n')
n_obj = sum(len(x['o']) for v in datos.values() for x in v.values())
print(len(datos), 'lugares con objetos;', n_obj, 'descripciones;', len(url_img), 'imágenes de objetos')
