"""Convierte las páginas de gimnasios de PokémonDB en gimnasios.js.
Uso: python gimnasios.py <carpeta html> <carpeta csv pokeapi> <carpeta app>
"""
import csv, html, json, os, re, sys, unicodedata

H, CSV, APP = sys.argv[1], sys.argv[2], sys.argv[3]

PAGINAS = {'red-blue': '1', 'yellow': '2', 'gold-silver': '3', 'crystal': '4', 'ruby-sapphire': '5', 'emerald': '6',
           'firered-leafgreen': '7', 'diamond-pearl': '8', 'platinum': '9', 'heartgold-soulsilver': '10',
           'black-white': '11', 'black-white-2': '14', 'x-y': '15', 'omega-ruby-alpha-sapphire': '16',
           'sun-moon': '17', 'ultra-sun-ultra-moon': '18', 'lets-go-pikachu-eevee': '19', 'sword-shield': '20',
           'brilliant-diamond-shining-pearl': '23', 'scarlet-violet': '25'}

LIDERES = {'Falkner': 'Pegaso', 'Bugsy': 'Antón', 'Whitney': 'Blanca', 'Morty': 'Morti', 'Chuck': 'Aníbal',
           'Jasmine': 'Yasmina', 'Pryce': 'Fredo', 'Clair': 'Débora', 'Janine': 'Sachiko', 'Blue': 'Azul',
           'Roxanne': 'Petra', 'Brawly': 'Marcial', 'Wattson': 'Erico', 'Flannery': 'Candela', 'Winona': 'Alana',
           'Tate & Liza': 'Vito y Leti', 'Tate and Liza': 'Vito y Leti', 'Wallace': 'Plubio', 'Juan': 'Galano',
           'Roark': 'Roco', 'Maylene': 'Brega', 'Crasher Wake': 'Mananti', 'Byron': 'Acero', 'Candice': 'Inverna',
           'Volkner': 'Lectro', 'Cilan': 'Millo', 'Chili': 'Zeo', 'Cress': 'Maíz', 'Lenora': 'Aloe', 'Burgh': 'Camus',
           'Elesa': 'Camila', 'Clay': 'Yakón', 'Skyla': 'Gerania', 'Brycen': 'Junco', 'Drayden': 'Lirio',
           'Roxie': 'Hiedra', 'Marlon': 'Ciprián', 'Viola': 'Violeta', 'Grant': 'Lino', 'Korrina': 'Corelia',
           'Ramos': 'Amaro', 'Clemont': 'Lem', 'Valerie': 'Valeria', 'Olympia': 'Ástrid', 'Wulfric': 'Édel',
           'Hala': 'Kaudan', 'Olivia': 'Mayla', 'Nanu': 'Denio', 'Milo': 'Percy', 'Nessa': 'Cathy', 'Kabu': 'Naboru',
           'Bea': 'Judith', 'Allister': 'Alistair', 'Opal': 'Sally', 'Gordie': 'Morris', 'Melony': 'Mel',
           'Piers': 'Nerio', 'Raihan': 'Roy', 'Katy': 'Araceli', 'Brassius': 'Brais', 'Iono': 'e-Nigma',
           'Kofu': 'Fuco', 'Larry': 'Laureano', 'Tulip': 'Tuli',
           # Alto Mando y Campeones
           'Will': 'Mento', 'Sidney': 'Sixto', 'Phoebe': 'Fátima', 'Glacia': 'Nívea', 'Drake': 'Dracón',
           'Steven': 'Máximo', 'Aaron': 'Alecrán', 'Bertha': 'Gaia', 'Flint': 'Fausto', 'Lucian': 'Delos',
           'Cynthia': 'Cintia', 'Shauntal': 'Anís', 'Grimsley': 'Aza', 'Caitlin': 'Catleya', 'Marshal': 'Lotto',
           'Alder': 'Mirto', 'Siebold': 'Narciso', 'Wikstrom': 'Tileo', 'Drasna': 'Drácena', 'Diantha': 'Dianta',
           'Professor Kukui': 'Profesor Kukui', 'Kukui': 'Profesor Kukui', 'Hau': 'Tilo', 'Rika': 'Cayena',
           'Poppy': 'Pola', 'Hassel': 'Hesperio', 'Geeta': 'Ságita', 'Nemona': 'Mencía', 'Leon': 'Lionel'}
MEDALLAS = {'Boulder': 'Roca', 'Cascade': 'Cascada', 'Thunder': 'Trueno', 'Rainbow': 'Arcoíris', 'Soul': 'Alma',
            'Marsh': 'Pantano', 'Volcano': 'Volcán', 'Earth': 'Tierra', 'Zephyr': 'Céfiro', 'Hive': 'Colmena',
            'Plain': 'Planicie', 'Fog': 'Niebla', 'Storm': 'Tormenta', 'Mineral': 'Mineral', 'Glacier': 'Glaciar',
            'Rising': 'Dragón', 'Stone': 'Piedra', 'Knuckle': 'Puño', 'Dynamo': 'Dinamo', 'Heat': 'Calor',
            'Balance': 'Equilibrio', 'Feather': 'Pluma', 'Mind': 'Mente', 'Rain': 'Lluvia'}
TIPOS = {'normal', 'fighting', 'flying', 'poison', 'ground', 'rock', 'bug', 'ghost', 'steel', 'fire', 'water', 'grass',
         'electric', 'psychic', 'ice', 'dragon', 'dark', 'fairy'}

def leer_csv(n):
    with open(os.path.join(CSV, n + '.csv'), encoding='utf-8') as f:
        return list(csv.DictReader(f))
pokes = leer_csv('pokemon')
por_ident = {r['identifier']: int(r['id']) for r in pokes}
especie_de = {int(r['id']): int(r['species_id']) for r in pokes}
sp_ident = {r['identifier']: int(r['id']) for r in leer_csv('pokemon_species')}
defecto = {int(r['species_id']): int(r['id']) for r in pokes if r['is_default'] == '1'}

def lugares():
    n = {}
    for f in ('nombres.js', 'nombres_pkhex.js'):
        t = open(os.path.join(APP, 'ubic', f), encoding='utf-8').read()
        n.update(json.loads(t[t.index('{"'):t.rindex('}') + 1]))
    return n
NOMBRES = lugares()

def slug(t):
    t = unicodedata.normalize('NFD', t.lower())
    t = ''.join(c for c in t if unicodedata.category(c) != 'Mn')
    return re.sub(r'[^a-z0-9]+', '-', t).strip('-')

EXTRA = {}  # sin traducción oficial segura: se dejan en inglés
def nombre_lugar(en):
    s = slug(en)
    for k in (s, 'sv:' + s, 'bdsp:' + s, s + '-city', s + '-town', 'alola-' + s):
        if k in NOMBRES and slug(NOMBRES[k]) != s: return NOMBRES[k]   # saltar nombres que siguen en inglés
    return EXTRA.get(en, en)

FORMAS = {'Alolan': 'alola', 'Galarian': 'galar', 'Hisuian': 'hisui', 'Paldean': 'paldea'}
def pokemon_id(sl, forma):
    sid = sp_ident.get(sl)
    if sid is None:
        pid = por_ident.get(sl)
        return pid, especie_de.get(pid)
    if forma:
        for k, v in FORMAS.items():
            if forma.startswith(k) and (sl + '-' + v) in por_ident: return por_ident[sl + '-' + v], sid
        if forma.startswith('Mega'):
            x = ' X' in forma and '-x' or (' Y' in forma and '-y' or '')
            if (sl + '-mega' + x) in por_ident: return por_ident[sl + '-mega' + x], sid
    return defecto.get(sid), sid

texto_limpio = lambda s: html.unescape(re.sub(r'<[^>]+>', ' ', s)).replace('Ã©', 'é').strip()

salida = {}
for pag, jid in PAGINAS.items():
    c = open(os.path.join(H, pag + '.html'), encoding='utf-8').read()
    secciones = re.split(r'(?=<h2[ >])', c)
    gyms = []
    for sec in secciones:
        m = re.match(r'<h2 id="(gym|kahuna|elite4|champion)-(\d+)">([^<]*)</h2>', sec)
        if not m: continue
        titulo = html.unescape(m.group(3))
        lugar_en = titulo.split(',', 1)[1].strip() if ',' in titulo else ''
        lideres = []
        for bloque in sec.split('<div class="infocard-list-trainer-pkmn">')[1:]:
            cab = re.search(r'trainer-head.*?<img[^>]*src="([^"]+)"[^>]*>.*?<span class="ent-name">([^<]+)</span><br>\s*<small>(.*?)</small></span>', bloque, re.S)
            if not cab: continue
            img, nombre, info = cab.group(1), html.unescape(cab.group(2)).strip(), cab.group(3)
            if 'rematch' in nombre.lower(): continue
            tipo = re.search(r'itype (\w+)">\w+ type', info)
            lineas = [texto_limpio(x) for x in re.split(r'<br\s*/?>', info)]
            medalla = next((l for l in lineas if l.endswith('Badge')), '')
            notas = [l for l in lineas if l and not l.endswith('Badge') and 'type Pok' not in l]
            mb = re.match(r'(\w+) Badge', medalla)
            equipo = []
            for card in re.findall(r'<div class="infocard trainer-pkmn">(.*?)</span></div>', bloque, re.S):
                sl = re.search(r'href="/pokedex/([^"]+)"', card).group(1)
                nv = re.search(r'Level (\d+)', card)
                peq = re.findall(r'<small>([^<#][^<]*)</small>', card)
                forma = next((p for p in peq if not p.startswith('Level')), '')
                tps = [t for t in re.findall(r'class="itype (\w+)"', card) if t in TIPOS]
                pid, sid = pokemon_id(sl, forma)
                if not pid: print('  ?', pag, sl, forma); continue
                equipo.append({'pid': pid, 's': sid, 'nv': int(nv.group(1)) if nv else None, 't': tps, 'f': forma})
            lideres.append({'n': LIDERES.get(nombre, nombre), 'en': nombre, 'img': img,
                            'tipo': tipo.group(1) if tipo else (equipo[0]['t'][0] if equipo else 'normal'),
                            'medalla': ('Medalla ' + MEDALLAS[mb.group(1)]) if mb and mb.group(1) in MEDALLAS else '',
                            'notas': notas, 'equipo': equipo})
        gyms.append({'tipo': m.group(1), 'num': int(m.group(2)), 'lugar': nombre_lugar(lugar_en), 'lugar_en': lugar_en,
                     'lideres': lideres})
    salida[jid] = gyms
    print(jid, pag, len(gyms), 'gimnasios', sum(len(g['lideres']) for g in gyms), 'líderes')

with open(os.path.join(APP, 'gimnasios.js'), 'w', encoding='utf-8') as f:
    f.write('// Datos de gimnasios: PokémonDB (pokemondb.net). Generado con herramientas/gimnasios.py\nwindow.GIMNASIOS=')
    json.dump(salida, f, ensure_ascii=False, separators=(',', ':'))
    f.write(';\n')
notas = sorted({n for g in salida.values() for x in g for l in x['lideres'] for n in l['notas']})
print('NOTAS:', notas)
print('LUGARES sin traducir:', sorted({x['lugar'] for g in salida.values() for x in g if x['lugar'] == x['lugar_en']}))
