"""Funciones comunes de los generadores (descargas con caché, traducciones de lugares, textos).
"""
import csv, html, json, os, re, sys, time, urllib.request
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from notas_es import traducir_nota

CSV, CACHE = sys.argv[1], sys.argv[2]
APP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.makedirs(CACHE, exist_ok=True)
UA = {'User-Agent': 'PokeGuiaLocal/1.0 (app personal)'}

def bajar(url, pausa=1.5):
    nombre = re.sub(r'[^A-Za-z0-9._-]', '_', url.split('//', 1)[1])[:180]
    ruta = os.path.join(CACHE, nombre)
    if os.path.exists(ruta):
        return open(ruta, encoding='utf-8', errors='replace').read()
    time.sleep(pausa)
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40) as r:
            datos = r.read().decode('utf-8', errors='replace')
    except Exception as e:
        print('  fallo', url, e)
        datos = ''
    open(ruta, 'w', encoding='utf-8').write(datos)
    return datos

leer = lambda f: list(csv.DictReader(open(os.path.join(CSV, f + '.csv'), encoding='utf-8')))
def leer_js(nombre):
    t = open(os.path.join(APP, nombre), encoding='utf-8').read()
    return json.loads(t[t.index('=') + 1:t.rindex(';')])

D = leer_js('datos.js')
# ---------- Traducciones ----------
esp_id = {r['identifier']: int(r['id']) for r in leer('pokemon_species')}
mov_en = {}
for r in leer('move_names'):
    if r['local_language_id'] == '9': mov_en[r['name'].lower()] = int(r['move_id'])
item_es, item_en = {}, {}
for r in leer('item_names'):
    if r['local_language_id'] == '7': item_es[r['item_id']] = r['name']
    if r['local_language_id'] == '9': item_en[r['name'].lower()] = r['item_id']
loc_region = {r['id']: r['region_id'] for r in leer('locations')}
loc_ident = {r['identifier']: r['id'] for r in leer('locations')}
loc_es, loc_en_id = {}, {}
for r in leer('location_names'):
    if r['local_language_id'] == '7': loc_es[r['location_id']] = r['name']
    if r['local_language_id'] == '9': loc_en_id.setdefault(r['name'].lower(), []).append(r['location_id'])
REGIONES = {'kanto': '1', 'johto': '2', 'hoenn': '3', 'sinnoh': '4', 'unova': '5', 'kalos': '6', 'alola': '7', 'galar': '8', 'hisui': '9', 'paldea': '10'}

# Diccionario propio de la app (identificador en inglés -> nombre en español)
NL = {}
for f in ('ubic/nombres.js', 'ubic/nombres_pkhex.js'):
    t = open(os.path.join(APP, f), encoding='utf-8').read()
    ini = t.index(',{') + 1 if f.endswith('pkhex.js') else t.index('{')
    NL.update(json.loads(t[ini:t.rindex('}') + 1]))
for f in os.listdir(os.path.join(APP, 'ubic')):
    if re.match(r'^\d+\.js$', f):
        t = open(os.path.join(APP, 'ubic', f), encoding='utf-8').read()
        try:
            u = json.loads(t[t.index('=', t.index(']')) + 1:t.rindex(';')])
            for es, slug in u['locs'].values():
                if slug and es and slug not in NL: NL[slug] = es
        except Exception as e:
            print('ubic', f, e)
normz = lambda s: re.sub(r'[^a-z0-9]', '', html.unescape(s).lower().replace('é', 'e'))
IDX, IDX_REG = {}, {}
def poner(d, k, es):   # una traducción real sustituye a una que solo repite el nombre en inglés
    if k not in d or (normz(d[k]) == (k[1] if isinstance(k, tuple) else k) and normz(es) != normz(d[k])): d[k] = es
for slug, es in NL.items():
    poner(IDX, normz(slug.split(':', 1)[-1]), es)
REGS = ['kanto', 'johto', 'hoenn', 'sinnoh', 'unova', 'kalos', 'alola', 'galar', 'hisui', 'paldea']
for slug, es in NL.items():
    s = slug.split(':', 1)[-1]
    for reg in REGS:
        if s.startswith(reg + '-'):
            poner(IDX_REG, (reg, normz(s[len(reg) + 1:])), es)
            poner(IDX, normz(s[len(reg) + 1:]), es)
for k, v in list(IDX_REG.items()):
    if normz(v) == k[1] and k[1] in IDX: IDX_REG[k] = IDX[k[1]]

def lugar_es(nombre_en, region=None):
    n = html.unescape(nombre_en).strip()
    k = normz(n)
    if region and (region, k) in IDX_REG: return IDX_REG[(region, k)]
    if region and normz(region + n) in IDX: return IDX[normz(region + n)]
    if k in IDX and not re.match(r'route\d', k): return IDX[k]
    ids = loc_en_id.get(n.lower(), [])
    if region:
        ids = [i for i in ids if loc_region.get(i) == REGIONES.get(region)] or ids
    for i in ids:
        if i in loc_es: return loc_es[i]
    n = re.sub(r'^Route (\d+)', r'Ruta \1', n)
    return frase_es(n)

FRASES = [(r'Destroy floating Poke ?Ball in (\d+) Star Hyperspace Zone with relevant Item Power', r'rompe la Poké Ball flotante en una zona del Hiperespacio de \1 estrellas con el poder de objeto adecuado'),
          (r'Destroy Gold Bonus Poke ?Ball in (\d+) Star Hyperspace Zone(?: with relevant Item Power)?', r'rompe la Poké Ball dorada de bonificación en una zona del Hiperespacio de \1 estrellas'),
          (r'Destroy Gold Bonus Poke ?Ball in Rogue Mega Rematch Hyperspace Zone(?: with relevant Item Power)?', 'rompe la Poké Ball dorada de bonificación en la zona del Hiperespacio de las revanchas de megaevolución'),
          (r'Defeat (.+?) in (\d+) Star in Hyperspace Battle Zone', r'vence al \1 en la zona de combate del Hiperespacio de \2 estrellas'),
          (r'Defeat (.+?) in Battle Zone', r'vence al \1 en la zona de combate'),
          (r'Side Mission (\d+):', r'misión secundaria \1:'), (r'Main Mission (\d+)', r'misión principal \1'), (r'Request Rewards\s*:', 'recompensa de las peticiones:'),
          (r'Z-A Infinite Royale Reward Match Reward', 'recompensa del combate de premio del Royale Infinito Z-A'),
          (r'Ranked Battle Rank-up reward', 'recompensa por subir de rango en los Combates Clasificatorios'),
          (r'Return with a Pokémon from a PokéJob', 'al volver un Pokémon de un Poké Trabajo'), (r'Digging Duo', 'Hermanos Excavadores'),
          (r'Walk with a Pokémon in (?:the|a) Poké ?Ball Plus', 'paseando con un Pokémon en la Poké Ball Plus'),
          (r'On floor in Space-time Distortions', 'en el suelo de las distorsiones espaciotemporales'), (r'Space-time Distortion Items', 'objetos de las distorsiones espaciotemporales'),
          (r'Gift for completion of Path of Tenacity Battle', 'regalo por superar el combate del Camino de la Tenacidad'),
          (r'Boxes in Cobalt Coastlands', 'cajas en la Costa Cobalto'), (r'Berry Trees in all areas', 'árboles de bayas de todas las zonas'),
          (r'oculto in ground and dug up by Ursaluna', 'oculto bajo tierra; lo desentierra Ursaluna'), (r'Random Stagmalites in battle', 'al azar en las estalagmitas durante el combate'),
          (r'Catch/Transfer lots of ', 'captura o transfiere muchos '), (r'Loto-ID Reward in Pokémon Centers', 'premio de la Lotería ID de los Centros Pokémon'),
          (r'From Fan in Contest Hall - Normal Rank', 'te lo da un fan en la Sala de Concursos (categoría Normal)'),
          (r'From Fan in Contest Hall - All Ranks', 'te lo da un fan en la Sala de Concursos (todas las categorías)'),
          (r'From Secret Pal in Secret Base', 'te lo da un amigo de tu base secreta'), (r"Ogre Oustin' Reward", "recompensa del minijuego Echa al Ogro"),
          (r'Drop reward from Max Raid Battles', 'recompensa de las incursiones Dinamax'), (r'Raid Battles', 'incursiones'), (r'Max Lair', 'Guarida Dinamax'),
          (r'Hoenn Battle Frontier', 'Frente Batalla de Hoenn'), (r'Battle Frontier', 'Frente Batalla'), (r'Battle Tower', 'Torre Batalla'), (r'Battle Subway', 'Metro Batalla'),
          (r'Battle Park', 'Parque Batalla'), (r'Master Dojo', 'Dojo Maestro'), (r'The Great Crater of Paldea', 'Gran Cráter de Paldea'),
          (r'Found by your ([A-Z][a-z]+)-type Pokémon in', r'lo encuentra tu Pokémon de tipo \1 en'), (r'From Fan in Contest Hall - (\w+) Rank', r'te lo da un fan en la Sala de Concursos (categoría \1)'),
          (r'Random (grass|boulders) in battle', lambda m: 'al azar en ' + ('la hierba' if m.group(1) == 'grass' else 'las rocas') + ' durante el combate'),
          (r'Purchase (\d+) Balls in a shop', r'al comprar \1 Poké Balls en una tienda'), (r'Buy (\d+) Balls at any Tienda', r'al comprar \1 Poké Balls en cualquier tienda'),
          (r"Talk to other players avatars in the Wild Area", 'hablando con avatares de otros jugadores en el Área Silvestre'),
          (r'Exchange (\d+)W with a Hiker in the Wild Area', r'cambiando \1 vatios con un montañero del Área Silvestre'), (r'Capture Reward', 'recompensa por captura'),
          (r'Z-A Battle Club Rankup Rewards', 'recompensa por subir de rango en el Club de Combate Z-A'), (r'Show trainer all Forms of Burmy', 'enséñale a un entrenador todas las formas de Burmy'),
          (r'(\d+) BP\b', r'\1 PB'), (r'Stow-on-Side', 'Pueblo Plié'), (r'Wild Area', 'Área Silvestre'),
          (r'Tin Tower', 'Torre Hojalata'), (r'Burnt Tower|Burned Tower', 'Torre Quemada'), (r'Radio Tower', 'Torre Radio'),
          (r'With Dowsing Machine', 'con el Zahorí'), (r'Dowsing Machine', 'Zahorí'), (r'Hidden', 'oculto'), (r'Dustcloud', 'nube de polvo'),
          (r'Received from', 'Te lo da'), (r'Given by', 'Te lo da'), (r'Gift from', 'Regalo de'), (r'Purchase(d)? (for|from)', 'Se compra'),
          (r'Requires', 'Requiere'), (r'After defeating', 'Tras vencer a'), (r'after beating', 'tras vencer a'), (r'Post-?game', 'Posliga'),
          (r'Department Store', 'Centro Comercial'), (r'Poké Mart', 'Tienda'), (r'PokéMart', 'Tienda'), (r'Held by wild', 'Lo llevan los salvajes:'),
          (r'Trade for', 'Cambio por'), (r'Pickup', 'Recogida'), (r'Pokémon League', 'Liga Pokémon'), (r'Version', 'Edición'),
          (r'\(north\)', '(norte)'), (r'\(south\)', '(sur)'), (r'\(east\)', '(este)'), (r'\(west\)', '(oeste)'), (r'\(northwest\)', '(noroeste)'),
          (r'\(northeast\)', '(noreste)'), (r'\(southwest\)', '(suroeste)'), (r'\(southeast\)', '(sureste)'), (r'Item Printer', 'Imprimeobjetos'),
          (r'PokéDex Completion Reward', 'premio por completar la Pokédex'), (r'items on overworld', 'en el mapa'), (r'Celadon Department Store', 'Centro Comercial Azulona'),
          (r'If you picked', 'Si elegiste a'), (r'(\w+) Chosen', r'Si elegiste a \1'), (r'Phase', 'Fase'), (r'Tournament', 'torneo'), (r'Squad', 'Escuadrón'),
          ]
def frase_es(t):
    for a, b in FRASES: t = re.sub(a, b, t)
    return t

# Todos los nombres de lugar pasan también por las frases (Battle Tower -> Torre Batalla...)
_lugar_es_base = lugar_es
def lugar_es(nombre_en, region=None):
    return frase_es(_lugar_es_base(nombre_en, region))

def texto(h):
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', h)).replace('\xa0', ' ')).strip()

def ubicaciones_html(celda):
    """Convierte la celda de ubicaciones de Serebii (enlaces a pokearth + notas en cursiva) en texto en español."""
    def enlace(m):
        reg = m.group(1); return lugar_es(texto(m.group(3)), reg)
    c = re.sub(r'<a href="/pokearth/([a-z]+)/([^"]*)">(.*?)</a>', enlace, celda)
    c = re.sub(r'<i>(.*?)</i>', lambda m: '(' + traducir_nota(frase_es(texto(m.group(1))).strip('() ')) + ')', c)
    c = re.sub(r'<b>([A-Za-z]+):</b>', lambda m: m.group(1) + ':', c)
    c = re.sub(r'<br\s*/?>', ' · ', c)
    t = texto(c)
    t = re.sub(r'(,\s*)+', ', ', t).strip(' ,·')
    # Pasada final: cualquier nota entre paréntesis que siga en inglés
    t = re.sub(r'\(([^()]*)\)', lambda m: '(' + (traducir_nota(m.group(1)) if re.search(r'\b(the|from|after|defeat|defeating|Get|Badges|Show|Level|Research|Lottery|Store|House|Market|Boulevard|Ruins|Top|Bottom|Left|Right|Girl|Man|Assistant|Aide|President|Gift|Trade|Return|Requiere|ability|chance|Mission|Gym|Entrance|Wednesday|Monday|Tuesday|Thursday|Friday|Saturday|Sunday|win)\b', m.group(1)) else m.group(1)) + ')', t)
    return frase_es(t)

def forma_pid(s, suf):
    cand = [p for p in D['pokemon'] if p['s'] == s]
    claves = {'a': 'Alola', 'g': 'Galar', 'h': 'Hisui', 'p': 'Paldea'}
    if suf and suf[0] in claves:
        for p in cand:
            if claves[suf[0]] in (p['f'] or ''): return p['id']
    for p in cand:
        if p['d']: return p['id']
    return s

