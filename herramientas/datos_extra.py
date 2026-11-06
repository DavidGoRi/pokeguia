"""Genera para la app: estadísticas, habilidades, evoluciones (extra.js), movimientos (movimientos.js)
y, por juego, los movimientos que aprende cada Pokémon y su descripción de la Pokédex (movs/<juego>.js).
Fuente: CSV de PokeAPI. Uso: python datos_extra.py <carpeta csv> <carpeta app>
"""
import csv, json, os, re, sys
from collections import defaultdict

D, APP = sys.argv[1], sys.argv[2]
ES = '7'
def leer(n):
    with open(os.path.join(D, n + '.csv'), encoding='utf-8') as f:
        return list(csv.DictReader(f))
def escribir(ruta, var, obj, clave=None):
    os.makedirs(os.path.dirname(ruta), exist_ok=True)
    with open(ruta, 'w', encoding='utf-8') as f:
        if clave is None: f.write(f'window.{var}=')
        else: f.write(f'(window.{var}=window.{var}||{{}})[{json.dumps(clave)}]=')
        json.dump(obj, f, ensure_ascii=False, separators=(',', ':'))
        f.write(';\n')
    print(ruta, os.path.getsize(ruta) // 1024, 'KB')

TIPOS = {r['id']: r['identifier'] for r in leer('types')}
vg = {r['id']: r for r in leer('version_groups')}
vg_orden = {k: int(v['order']) for k, v in vg.items()}
gen_vg = {k: int(v['generation_id']) for k, v in vg.items()}
JUEGO_VG = {'1': '1', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8', '9': '9', '10': '10', '11': '11',
            '14': '14', '15': '15', '16': '16', '17': '17', '18': '18', '19': '19', '20': '20', '23': '23', '24': '24',
            '25': '25', '30': '30', '32': '32'}
JUEGO_VERS = {'1': [1, 2], '2': [3], '3': [4, 5], '4': [6], '5': [7, 8], '6': [9], '7': [10, 11], '8': [12, 13], '9': [14],
              '10': [15, 16], '11': [17, 18], '14': [21, 22], '15': [23, 24], '16': [25, 26], '17': [27, 28], '18': [29, 30],
              '19': [31, 32], '20': [33, 34], '23': [37, 38], '24': [39], '25': [40, 41], '30': [47, 48], '32': [49]}

# ---------- Nombres ----------
def nombres(tabla, campo_id, lang=ES):
    n, en = {}, {}
    for r in leer(tabla):
        if r['local_language_id'] == lang: n[r[campo_id]] = r['name']
        elif r['local_language_id'] == '9': en[r[campo_id]] = r['name']
    for k, v in en.items(): n.setdefault(k, v)
    return n
especie_n = nombres('pokemon_species_names', 'pokemon_species_id')
item_n = nombres('item_names', 'item_id')
move_n = nombres('move_names', 'move_id')
abil_n = nombres('ability_names', 'ability_id')
loc_n = nombres('location_names', 'location_id')
# Nombres en español que ya usa la app (traducciones propias de ciudades y rutas)
_t = open(os.path.join(APP, 'ubic', 'nombres.js'), encoding='utf-8').read()
_nl = json.loads(_t[_t.index('{"'):_t.rindex('}') + 1])
for r in leer('locations'):
    if r['identifier'] in _nl: loc_n[r['id']] = _nl[r['identifier']]
items_id = {r['id']: r['identifier'] for r in leer('items')}
TIPO_ES = {'normal': 'Normal', 'fighting': 'Lucha', 'flying': 'Volador', 'poison': 'Veneno', 'ground': 'Tierra', 'rock': 'Roca',
           'bug': 'Bicho', 'ghost': 'Fantasma', 'steel': 'Acero', 'fire': 'Fuego', 'water': 'Agua', 'grass': 'Planta',
           'electric': 'Eléctrico', 'psychic': 'Psíquico', 'ice': 'Hielo', 'dragon': 'Dragón', 'dark': 'Siniestro', 'fairy': 'Hada'}

# ---------- Estadísticas ----------
stats = defaultdict(lambda: [0] * 6)
for r in leer('pokemon_stats'):
    s = int(r['stat_id'])
    if 1 <= s <= 6: stats[r['pokemon_id']][s - 1] = int(r['base_stat'])

# ---------- Habilidades (actuales y antiguas) ----------
abil_act = defaultdict(list)
for r in leer('pokemon_abilities'):
    abil_act[r['pokemon_id']].append((int(r['slot']), int(r['ability_id']), r['is_hidden'] == '1'))
abil_past = defaultdict(lambda: defaultdict(list))
for r in leer('pokemon_abilities_past'):
    abil_past[r['pokemon_id']][int(r['generation_id'])].append((int(r['slot']), int(r['ability_id']) if r['ability_id'] else 0, r['is_hidden'] == '1'))
habilidades = {}
for pid, l in abil_act.items():
    h = {'a': [[a, int(o), s] for s, a, o in sorted(l)]}
    if pid in abil_past:   # solo trae los huecos que cambiaron: la app los mezcla con los actuales
        h['p'] = {g: [[a, int(o), s] for s, a, o in sorted(x)] for g, x in abil_past[pid].items()}
    habilidades[pid] = h
abil_gen = {r['id']: int(r['generation_id']) for r in leer('abilities')}
desc_hab = {}
for r in leer('ability_flavor_text'):
    if r['language_id'] == ES:
        desc_hab[r['ability_id']] = re.sub(r'\s+', ' ', r['flavor_text']).strip()   # se queda la más reciente
info_hab = {a: [abil_n.get(a, a), desc_hab.get(a, ''), abil_gen.get(a, 3)] for a in abil_n}

# ---------- Evoluciones ----------
especies = {r['id']: r for r in leer('pokemon_species')}
cadena = defaultdict(list)
for sid, r in especies.items():
    cadena[r['evolution_chain_id']].append(sid)
triggers = {r['id']: r['identifier'] for r in leer('evolution_triggers')}
GENERO = {'1': 'hembra', '2': 'macho'}
MOMENTO = {'day': 'de día', 'night': 'de noche', 'dusk': 'al atardecer', 'full-moon': 'con luna llena'}
def texto_evo(r):
    t = triggers.get(r['evolution_trigger_id'], '')
    partes = []
    if t == 'level-up':
        partes.append(f"Nivel {r['minimum_level']}" if r['minimum_level'] else 'Subir de nivel')
    elif t == 'trade': partes.append('Intercambio')
    elif t == 'use-item': partes.append('Usar ' + item_n.get(r['trigger_item_id'], 'objeto'))
    elif t == 'shed': partes.append('Hueco en el equipo y una Poké Ball al evolucionar Nincada')
    elif t == 'spin': partes.append('Girar llevando un dulce')
    elif t == 'tower-of-darkness': partes.append('Superar la Torre del Siniestro')
    elif t == 'tower-of-waters': partes.append('Superar la Torre del Agua')
    elif t == 'three-critical-hits': partes.append('3 golpes críticos en un combate')
    elif t == 'take-damage': partes.append('Recibir 49 PS de daño y pasar bajo el arco de piedra')
    elif t == 'agile-style-move': partes.append('Usar un movimiento rápido 20 veces')
    elif t == 'strong-style-move': partes.append('Usar un movimiento fuerte 20 veces')
    elif t == 'recoil-damage': partes.append('Recibir 294 PS de daño de retroceso')
    elif t == 'use-move': partes.append('Usar ' + move_n.get(r['used_move_id'], 'un movimiento') + (f" {r['minimum_move_count']} veces" if r['minimum_move_count'] else ''))
    elif t == 'three-defeated-bisharp': partes.append('Derrotar a 3 Bisharp que lleven Mando')
    elif t == 'gimmighoul-coins': partes.append('Reunir 999 monedas de Gimmighoul')
    elif t == 'meltan-candies': partes.append('400 caramelos de Meltan (Pokémon GO)')
    else: partes.append('Condición especial')
    if r['held_item_id']: partes.append('llevando ' + item_n.get(r['held_item_id'], 'un objeto'))
    if r['minimum_happiness']: partes.append('con mucha amistad')
    if r['minimum_affection']: partes.append('con mucho afecto')
    if r['minimum_beauty']: partes.append('con mucha belleza')
    if r['time_of_day'] in MOMENTO: partes.append(MOMENTO[r['time_of_day']])
    if r['known_move_id']: partes.append('conociendo ' + move_n.get(r['known_move_id'], 'un movimiento'))
    if r['known_move_type_id']: partes.append('conociendo un movimiento de tipo ' + TIPO_ES.get(TIPOS.get(r['known_move_type_id'], ''), ''))
    if r['location_id']: partes.append('en ' + loc_n.get(r['location_id'], 'un lugar concreto'))
    if r['relative_physical_stats']:
        partes.append({'1': 'con Ataque mayor que Defensa', '-1': 'con Ataque menor que Defensa', '0': 'con Ataque igual a Defensa'}[r['relative_physical_stats']])
    if r['party_species_id']: partes.append('con ' + especie_n.get(r['party_species_id'], '') + ' en el equipo')
    if r['party_type_id']: partes.append('con un Pokémon de tipo ' + TIPO_ES.get(TIPOS.get(r['party_type_id'], ''), '') + ' en el equipo')
    if r['trade_species_id']: partes.append('a cambio de ' + especie_n.get(r['trade_species_id'], ''))
    if r['needs_overworld_rain'] == '1': partes.append('mientras llueve')
    if r['turn_upside_down'] == '1': partes.append('con la consola boca abajo')
    if r['gender_id'] in GENERO: partes.append('(solo ' + GENERO[r['gender_id']] + ')')
    if r.get('minimum_steps'): partes.append(f"tras andar {r['minimum_steps']} pasos")
    return ', '.join(partes[:1]) + (' ' + ', '.join(partes[1:]) if len(partes) > 1 else '')

evos = defaultdict(list)   # especie destino -> [(vg, texto)]
for r in leer('pokemon_evolution'):
    evos[r['evolved_species_id']].append((r['version_group_id'] or '1', texto_evo(r)))
evolucion = {}   # especie -> {de: especie previa, m: [[orden_vg_desde, [textos]]]}
for sid, r in especies.items():
    if not r['evolves_from_species_id']: continue
    porvg = defaultdict(list)
    for v, t in evos.get(sid, []):
        if t not in porvg[vg_orden.get(v, 1)]: porvg[vg_orden.get(v, 1)].append(t)
    evolucion[sid] = {'de': int(r['evolves_from_species_id']), 'm': sorted([[o, ts] for o, ts in porvg.items()])}
cadenas = {sid: int(r['evolution_chain_id']) for sid, r in especies.items()}
miembros = {c: sorted(int(x) for x in l) for c, l in cadena.items()}

escribir(os.path.join(APP, 'extra.js'), 'EXTRA', {
    'stats': stats, 'hab': habilidades, 'infoHab': info_hab, 'evo': evolucion, 'cad': cadenas, 'miem': miembros,
    'leg': [int(s) for s, r in especies.items() if r['is_legendary'] == '1' or r['is_mythical'] == '1'],
    'bebe': [int(s) for s, r in especies.items() if r['is_baby'] == '1']})

# ---------- Movimientos ----------
clases = {'1': 'estado', '2': 'físico', '3': 'especial'}
movs = {}
for r in leer('moves'):
    if int(r['id']) > 10000: continue
    movs[r['id']] = [move_n.get(r['id'], r['identifier']), TIPOS.get(r['type_id'], ''), clases.get(r['damage_class_id'], ''),
                     int(r['power']) if r['power'] else None, int(r['accuracy']) if r['accuracy'] else None, int(r['pp']) if r['pp'] else None]
escribir(os.path.join(APP, 'movimientos.js'), 'MOVS', movs)

maquinas = {}   # (vg, move) -> 'MT01'
for r in leer('machines'):
    ident = items_id.get(r['item_id'], '')
    m = re.match(r'(tm|hm|tr)(\d+)', ident)
    etiqueta = ({'tm': 'MT', 'hm': 'MO', 'tr': 'DT'}[m.group(1)] + m.group(2)) if m else 'MT'
    maquinas[(r['version_group_id'], r['move_id'])] = etiqueta

por_juego = defaultdict(lambda: defaultdict(lambda: {'n': [], 'm': [], 'h': [], 't': []}))
vg_juego = {v: j for j, v in JUEGO_VG.items()}
METODO = {'1': 'n', '2': 'h', '3': 't', '4': 'm'}
with open(os.path.join(D, 'pokemon_moves.csv'), encoding='utf-8') as f:
    for r in csv.DictReader(f):
        j = vg_juego.get(r['version_group_id'])
        met = METODO.get(r['pokemon_move_method_id'])
        if not j or not met or r['move_id'] not in movs: continue
        e = por_juego[j][r['pokemon_id']]
        mid = int(r['move_id'])
        if met == 'n': e['n'].append([int(r['level'] or 0), mid])
        elif met == 'm': e['m'].append([maquinas.get((r['version_group_id'], r['move_id']), 'MT'), mid])
        elif mid not in e[met]: e[met].append(mid)

desc = defaultdict(dict)   # versión -> especie -> texto
for r in leer('pokemon_species_flavor_text'):
    if r['language_id'] == ES:
        desc[int(r['version_id'])][r['species_id']] = re.sub(r'\s+', ' ', r['flavor_text']).strip()
ultima = {}
for v in sorted(desc):
    for s, t in desc[v].items(): ultima[s] = t

for j in JUEGO_VG:
    p = {}
    for pid, e in por_juego.get(j, {}).items():
        e['n'] = sorted({(a, b) for a, b in e['n']})
        e['m'] = sorted({(a, b) for a, b in e['m']}, key=lambda x: (x[0][:2], int(re.sub(r'\D', '', x[0]) or 0)))
        p[pid] = {k: v for k, v in e.items() if v}
    d = {}
    for v in JUEGO_VERS[j]:
        for s, t in desc.get(v, {}).items(): d.setdefault(s, t)
    escribir(os.path.join(APP, 'movs', j + '.js'), 'MOVSJ', {'p': p, 'd': d, 'dUlt': {} if d else {}}, j)
escribir(os.path.join(APP, 'movs', 'descripciones.js'), 'DESC_ULT', ultima)
