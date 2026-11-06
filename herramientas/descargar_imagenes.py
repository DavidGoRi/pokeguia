"""Modo sin internet: descarga todas las imágenes que usa la app en pokedex_tipos/imagenes/
y crea imagenes/indice.js para que la app las use en local. Se puede volver a ejecutar: solo baja lo que falte.
Uso: python herramientas/descargar_imagenes.py   (desde la carpeta pokedex_tipos o indicando la carpeta)
"""
import json, os, re, sys, threading, time, urllib.parse, urllib.request
from concurrent.futures import ThreadPoolExecutor

APP = sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEST = os.path.join(APP, 'imagenes')
UA = {'User-Agent': 'PokedexTiposLocal/1.0 (app personal)'}

def leer_js(nombre):
    t = open(os.path.join(APP, nombre), encoding='utf-8').read()
    return json.loads(t[t.index('=') + 1:t.rindex(';')])

D = leer_js('datos.js')
G = leer_js('gimnasios.js')
GF = leer_js('gimnasios_fotos.js')
LF = leer_js('lugares_fotos.js')

urls = set()
BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/'
for p in D['pokemon']:
    urls.add(f"{BASE}other/official-artwork/{p['id']}.png")
RUTAS = {'1': 'generation-i/red-blue', '2': 'generation-i/yellow', '3': 'generation-ii/gold', '4': 'generation-ii/crystal',
         '5': 'generation-iii/ruby-sapphire', '6': 'generation-iii/emerald', '7': 'generation-iii/firered-leafgreen',
         '8': 'generation-iv/diamond-pearl', '9': 'generation-iv/platinum', '10': 'generation-iv/heartgold-soulsilver',
         '11': 'generation-v/black-white', '14': 'generation-v/black-white', '15': 'generation-vi/x-y',
         '16': 'generation-vi/omegaruby-alphasapphire', '17': 'generation-vii/ultra-sun-ultra-moon', '18': 'generation-vii/ultra-sun-ultra-moon'}
por_especie = {}
for p in D['pokemon']: por_especie.setdefault(p['s'], []).append(p['id'])
for j in D['juegos']:
    r = RUTAS.get(j['id'])
    if not r: continue
    esp = set(j['nacional']) | {s for s, _ in j['dex']}
    for s in esp:
        for pid in por_especie.get(s, []):
            urls.add(f"{BASE}versions/{r}/{pid}.png")
for gs in G.values():
    for g in gs:
        for l in g['lideres']:
            urls.add(l['img'])
for j in GF.values():
    for d in j.values():
        for k in ('ext', 'int'):
            if d.get(k): urls.add(d[k])
for d in LF.values():
    if d.get('mapa'): urls.add(d['mapa'])
    for u in d.get('img', {}).values(): urls.add(u)

def ruta_local(u):
    pu = urllib.parse.urlparse(u)
    return os.path.join('imagenes', pu.netloc, *[urllib.parse.unquote(x) for x in pu.path.strip('/').split('/')])

hechos, fallos, lock = {}, [], threading.Lock()
def bajar(u):
    rel = ruta_local(u)
    dest = os.path.join(APP, rel)
    if os.path.exists(dest) and os.path.getsize(dest) > 0:
        with lock: hechos[u] = rel.replace(os.sep, '/')
        return
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    for intento in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=40) as r:
                datos = r.read()
            with open(dest, 'wb') as f: f.write(datos)
            with lock: hechos[u] = rel.replace(os.sep, '/')
            if 'wikidex' in u or 'pokemondb' in u: time.sleep(0.3)   # sin saturar a las webs pequeñas
            return
        except urllib.error.HTTPError as e:
            if e.code == 404: break
            time.sleep(2)
        except Exception:
            time.sleep(2)
    with lock: fallos.append(u)

lista = sorted(urls)
print(len(lista), 'imágenes en total')
with ThreadPoolExecutor(max_workers=6) as ex:
    for i, _ in enumerate(ex.map(bajar, lista), 1):
        if i % 500 == 0: print(i, 'de', len(lista), flush=True)

with open(os.path.join(DEST, 'indice.js'), 'w', encoding='utf-8') as f:
    f.write('window.IMG_LOCAL=')
    json.dump(hechos, f, separators=(',', ':'))
    f.write(';\n')
tam = sum(os.path.getsize(os.path.join(APP, r)) for r in hechos.values()) // (1024 * 1024)
print('descargadas:', len(hechos), 'fallidas o inexistentes:', len(fallos), 'tamaño:', tam, 'MB')
por_web = {}
for u in fallos:
    k = urllib.parse.urlparse(u).netloc + ('/versions' if '/versions/' in u else '')
    por_web[k] = por_web.get(k, 0) + 1
print('fallos por web:', por_web)
