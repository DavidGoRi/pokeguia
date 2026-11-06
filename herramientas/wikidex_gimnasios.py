"""Busca en WikiDex (API MediaWiki) fotos reales del exterior e interior de cada gimnasio, por juego.
Crea gimnasios_fotos.js. Uso personal. Uso: python wikidex_gimnasios.py <carpeta app>
"""
import json, os, re, sys, time, urllib.parse, urllib.request

APP = sys.argv[1]
API = 'https://www.wikidex.net/api.php'
UA = {'User-Agent': 'PokedexTiposLocal/1.0 (app personal)'}

def api(**p):
    p['format'] = 'json'
    url = API + '?' + urllib.parse.urlencode(p)
    for intento in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
                time.sleep(1.0)
                return json.loads(r.read().decode('utf-8'))
        except Exception as e:
            time.sleep(3)
    return {}

t = open(os.path.join(APP, 'gimnasios.js'), encoding='utf-8').read()
G = json.loads(t[t.index('=') + 1:t.rindex(';')])

# Abreviaturas de WikiDex en los nombres de archivo, por juego (de la más concreta a la más general)
CODIGOS = {'1': ['RAAm', 'RA', 'Am', 'RAA'], '2': ['RAAm', 'Am', 'RA'], '3': ['OPC', 'OP'], '4': ['OPC', 'C'],
           '5': ['RZE', 'RZ'], '6': ['RZE', 'E'], '7': ['RFVH', 'RfVh'], '8': ['DPPt', 'DP'], '9': ['DPPt', 'Pt'],
           '10': ['HGSS'], '11': ['NB'], '14': ['N2B2', 'NB2', 'NB'], '15': ['XY'], '16': ['ROZA', 'RZE'],
           '19': ['LGPE'], '20': ['EpEc', 'EE'], '23': ['DBPR', 'DPPt'], '25': ['EP', 'EsPu', 'EscPur']}

cache_pag = {}
def pagina_gimnasio(lugar):
    if lugar in cache_pag: return cache_pag[lugar]
    corto = re.sub(r'^(Ciudad|Pueblo|Villa|Isla|Aldea) ', '', lugar)
    cands = ['Gimnasio de ' + lugar, 'Gimnasio Pokémon de ' + lugar, 'Gimnasio ' + corto, 'Estadio de ' + lugar, 'Estadio ' + corto]
    titulo = None
    r = api(action='query', titles='|'.join(cands), redirects=1)
    for p in (r.get('query', {}).get('pages', {}) or {}).values():
        if 'missing' not in p and p.get('title', '').startswith(('Gimnasio', 'Estadio')):
            titulo = p['title']; break
    if not titulo:
        r = api(action='query', list='search', srsearch='Gimnasio ' + lugar, srlimit=5)
        for s in r.get('query', {}).get('search', []):
            if s['title'].startswith(('Gimnasio', 'Estadio')):
                titulo = s['title']; break
    imgs = []
    if titulo:
        r = api(action='query', titles=titulo, prop='images', imlimit=500, redirects=1)
        for p in r.get('query', {}).get('pages', {}).values():
            imgs = [i['title'] for i in p.get('images', [])]
    cache_pag[lugar] = (titulo, imgs)
    return titulo, imgs

ANIME = re.compile(r'^Archivo:(PMS\w*|VOLT\w*|(EP|EE|PO|PE|EH|HO|EM|PK|AG|DP|SO|EV|ES|LH|ST|OP|PH|MP|HZ)\d)|líder de gimnasio', re.I)
PALABRAS = {'Exterior': ('exterior', 'entrada al gimnasio', 'fachada', 'estadio'), 'Interior': ('interior',)}

def elegir(imgs, juego, clase, estricto=True):
    """Imagen de exterior o interior para el juego (por su abreviatura). Descarta capturas del anime."""
    def tipo(i):
        l = i.lower()
        if not re.search(r'gimnasio|gym|estadio|cancha', l) or ANIME.match(i): return None
        if re.search(r'icono|medalla|sprite|^archivo:vs|fondo|derrotad|examen|cartel|desconocido|escondite|trampilla', l): return None
        return 'Interior' if re.search(r'interior|campo|cancha|entrada al interior', l) else 'Exterior'
    lista = [i for i in imgs if tipo(i) == clase]
    for cod in CODIGOS.get(juego, []):
        for i in lista:
            base = re.sub(r'\.(png|jpg|jpeg|gif|webp)$', '', i, flags=re.I)
            if re.search(r'(^|[\s_(])' + re.escape(cod) + r'($|[\s_)])', base):
                return i
    if not estricto and lista:
        return lista[-1]
    return None

def urls(titulos):
    res = {}
    titulos = [x for x in titulos if x]
    for k in range(0, len(titulos), 40):
        r = api(action='query', titles='|'.join(titulos[k:k + 40]), prop='imageinfo', iiprop='url')
        norm = {n['to']: n['from'] for n in r.get('query', {}).get('normalized', [])}
        for p in r.get('query', {}).get('pages', {}).values():
            if p.get('imageinfo'):
                res[norm.get(p['title'], p['title'])] = p['imageinfo'][0]['url']
                res[p['title']] = p['imageinfo'][0]['url']
    return res

eleccion = {}
for juego, gyms in G.items():
    for g in gyms:
        if g['tipo'] != 'gym': continue
        titulo, imgs = pagina_gimnasio(g['lugar'])
        ext, inn = elegir(imgs, juego, 'Exterior'), elegir(imgs, juego, 'Interior')
        if not ext: ext = elegir(imgs, juego, 'Exterior', False)   # de otro juego si no hay de este
        if not inn: inn = elegir(imgs, juego, 'Interior', False)
        eleccion[(juego, g['num'])] = (titulo, ext, inn)
        print(juego, g['num'], g['lugar'], '->', titulo, '|', ext, '|', inn)

todas = urls(sorted({x for (_, e, i) in eleccion.values() for x in (e, i) if x}))
salida = {}
for (juego, num), (titulo, e, i) in eleccion.items():
    d = {}
    if e and e in todas: d['ext'] = todas[e]
    if i and i in todas: d['int'] = todas[i]
    if titulo: d['pag'] = titulo
    salida.setdefault(juego, {})[num] = d
with open(os.path.join(APP, 'gimnasios_fotos.js'), 'w', encoding='utf-8') as f:
    f.write('// Fotos de gimnasios: WikiDex (wikidex.net), solo para uso personal. Generado con herramientas/wikidex_gimnasios.py\n')
    f.write('window.GIM_FOTOS=')
    json.dump(salida, f, ensure_ascii=False, separators=(',', ':'))
    f.write(';\n')
con = sum(1 for j in salida.values() for d in j.values() if 'ext' in d or 'int' in d)
print('gimnasios con foto:', con, 'de', len(eleccion))
