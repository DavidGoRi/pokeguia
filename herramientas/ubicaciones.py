import csv, json, os, re, sys
from collections import defaultdict

D, SAL = sys.argv[1], sys.argv[2]
os.makedirs(SAL, exist_ok=True)

def leer(n):
    with open(os.path.join(D, n + '.csv'), encoding='utf-8') as f:
        return list(csv.DictReader(f))

# Juego -> versiones (ids de versions.csv)
JUEGOS = {'1': [1, 2], '2': [3], '3': [4, 5], '4': [6], '5': [7, 8], '6': [9], '7': [10, 11],
          '8': [12, 13], '9': [14], '10': [15, 16], '11': [17, 18], '14': [21, 22], '15': [23, 24],
          '16': [25, 26], '17': [27, 28], '18': [29, 30], '19': [31, 32],
          '20': [33, 34, 35, 50, 36, 51], '23': [37, 38], '24': [39], '25': [40, 41, 42, 52, 43, 53],
          '30': [47, 48], '32': [49]}
VNOMBRE = {}
for r in leer('version_names'):
    if r['local_language_id'] == '7':
        VNOMBRE[int(r['version_id'])] = r['name']

areas = {r['id']: r for r in leer('location_areas')}
locs = {r['id']: r for r in leer('locations')}
nes = {r['location_id']: r['name'] for r in leer('location_names') if r['local_language_id'] == '7'}
nen = {r['location_id']: r['name'] for r in leer('location_names') if r['local_language_id'] == '9'}

TRAD = {
 # Kanto
 'pallet-town':'Pueblo Paleta','viridian-city':'Ciudad Verde','pewter-city':'Ciudad Plateada','cerulean-city':'Ciudad Celeste',
 'vermilion-city':'Ciudad Carmín','lavender-town':'Pueblo Lavanda','celadon-city':'Ciudad Azulona','saffron-city':'Ciudad Azafrán',
 'fuchsia-city':'Ciudad Fucsia','cinnabar-island':'Isla Canela','indigo-plateau':'Meseta Añil','viridian-forest':'Bosque Verde',
 'mt-moon':'Mt. Moon','rock-tunnel':'Túnel Roca','digletts-cave':'Cueva Diglett','seafoam-islands':'Islas Espuma',
 'cerulean-cave':'Cueva Celeste','kanto-power-plant':'Central Energía','pokemon-tower':'Torre Pokémon',
 'pokemon-mansion':'Mansión Pokémon','kanto-safari-zone':'Zona Safari','kanto-victory-road-1':'Calle Victoria',
 'kanto-victory-road-2':'Calle Victoria','ss-anne':'S.S. Anne','kanto-underground-path':'Camino Subterráneo',
 'mt-ember':'Monte Ascuas','berry-forest':'Bosque Baya','icefall-cave':'Cueva Helada','tanoby-ruins':'Ruinas Tanoby',
 'one-island':'Isla Prima','four-island':'Isla Cuarta','five-island':'Isla Quinta','trainer-tower':'Torre Entrenador',
 'roaming-kanto':'Errante por Kanto','kanto-pokecenter':'Centro Pokémon','birth-island':'Isla Origen','navel-rock':'Roca Ombligo',
 # Johto
 'new-bark-town':'Pueblo Primavera','cherrygrove-city':'Ciudad Cerezo','violet-city':'Ciudad Malva','azalea-town':'Pueblo Azalea',
 'goldenrod-city':'Ciudad Trigal','ecruteak-city':'Ciudad Iris','olivine-city':'Ciudad Olivo','cianwood-city':'Ciudad Orquídea',
 'mahogany-town':'Pueblo Caoba','blackthorn-city':'Ciudad Endrino','lake-of-rage':'Lago de la Furia','sprout-tower':'Torre Bellsprout',
 'ruins-of-alph':'Ruinas Alfa','union-cave':'Cueva Unión','slowpoke-well':'Pozo Slowpoke','ilex-forest':'Encinar',
 'national-park':'Parque Nacional','burned-tower':'Torre Quemada','bell-tower':'Torre Campana','whirl-islands':'Islas Remolino',
 'mt-mortar':'Monte Mortero','ice-path':'Ruta Helada','dark-cave':'Cueva Oscura','dragons-den':'Guarida Dragón',
 'tohjo-falls':'Cataratas Tohjo','mt-silver':'Monte Plateado','team-rocket-hq':'Guarida Rocket','johto-safari-zone':'Zona Safari',
 'safari-zone-gate':'Entrada a la Zona Safari','sinjoh-ruins':'Ruinas Sinjoh','roaming-johto':'Errante por Johto',
 # Sinnoh
 'twinleaf-town':'Pueblo Hojaverde','sandgem-town':'Pueblo Arena','jubilife-city':'Ciudad Jubileo','canalave-city':'Ciudad Canal',
 'oreburgh-city':'Ciudad Pirita','floaroma-town':'Pueblo Aromaflor','eterna-city':'Ciudad Vetusta','hearthome-city':'Ciudad Corazón',
 'solaceon-town':'Pueblo Sosiego','veilstone-city':'Ciudad Rocavelo','pastoria-city':'Ciudad Pradera','celestic-town':'Pueblo Caelestis',
 'sunyshore-city':'Ciudad Marina','snowpoint-city':'Ciudad Puntaneva','sinnoh-pokemon-league':'Liga Pokémon','resort-area':'Área Reposo',
 'oreburgh-mine':'Mina Pirita','valley-windworks':'Valle Eólico','eterna-forest':'Bosque Vetusto','fuego-ironworks':'Forja Fuego',
 'mt-coronet':'Monte Corona','great-marsh':'Gran Pantano','solaceon-ruins':'Ruinas Sosiego','sinnoh-victory-road':'Calle Victoria',
 'ravaged-path':'Senda Desgaste','oreburgh-gate':'Puerta Pirita','stark-mountain':'Monte Abrupto','turnback-cave':'Cueva Retorno',
 'snowpoint-temple':'Templo Puntaneva','wayward-cave':'Cueva Extravío','ruin-maniac-cave':'Cueva Ruinamaníaco',
 'trophy-garden':'Jardín Trofeo','iron-island':'Isla Hierro','old-chateau':'Vieja Mansión','lake-verity':'Lago Veraz',
 'lake-valor':'Lago Valor','lake-acuity':'Lago Agudeza','valor-lakefront':'Orilla Valor','acuity-lakefront':'Orilla Agudeza',
 'lost-tower':'Torre Perdida','spear-pillar':'Columna Lanza','floaroma-meadow':'Prado Aromaflor','sendoff-spring':'Fuente Despedida',
 'flower-paradise':'Paraíso Floral','maniac-tunnel':'Túnel Maníaco','newmoon-island':'Isla Lunanueva',
 'sinnoh-hall-of-origin-1':'Sala del Origen','trainers-school':'Escuela de Entrenadores','distortion-world':'Mundo Distorsión',
 'roaming-sinnoh':'Errante por Sinnoh',
 # Teselia
 'nuvema-town':'Pueblo Arcilla','accumula-town':'Pueblo Terracota','striaton-city':'Ciudad Gres','nacrene-city':'Ciudad Esmalte',
 'castelia-city':'Ciudad Porcelana','nimbasa-city':'Ciudad Mayólica','driftveil-city':'Ciudad Fayenza','mistralton-city':'Ciudad Loza',
 'icirrus-city':'Ciudad Teja','opelucid-city':'Ciudad Caolín','lacunosa-town':'Pueblo Chamota','aspertia-city':'Ciudad Engobe',
 'virbank-city':'Ciudad Hormigón','dreamyard':'Solar de los Sueños','pinwheel-forest':'Bosque Azulejo','desert-resort':'Resort Desierto',
 'relic-castle':'Castillo Ancestral','chargestone-cave':'Cueva Electrorroca','twist-mountain':'Monte Tuerca',
 'dragonspiral-tower':'Torre Dragospiral','unova-victory-road':'Calle Victoria','unova-victory-road-2':'Calle Victoria',
 'celestial-tower':'Torre Cielo','giant-chasm':'Cueva Gigante','cold-storage':'Almacén Frigorífico','moor-of-icirrus':'Pantano Teja',
 # Galar
 'postwick':'Pueblo Par','wedgehurst':'Pueblo Pala','motostoke':'Ciudad Pistón','turffield':'Pueblo Hoyuelo','hulbury':'Ciudad Amura',
 'ballonlea':'Pueblo Plié','hammerlocke':'Ciudad Artejo','circhester':'Ciudad Auriga','wyndon':'Ciudad Puntera',
 'galar-mine':'Mina de Galar','galar-mine-no-2':'Mina n.º 2 de Galar','slumbering-weald':'Bosque Oniria',
 'roaming-galar-wild-area':'Errante por el Área Silvestre','galar-wild-area-max-dens':'Guaridas Dinamax',
 'hauoli-city':'Ciudad Hauoli','malie-city':'Ciudad Malíe','verdant-cavern':'Cueva Sotobosque','po-town':'Pueblo Po',
 'roaming-hoenn':'Errante por Hoenn','roaming-kalos':'Errante por Kalos',
}

def nombre_loc(lid):
    ident = locs[lid]['identifier']
    if lid in nes:
        return nes[lid]
    if ident in TRAD:
        return TRAD[ident]
    m = re.match(r'.*?-(sea-)?route-(\d+)$', ident)
    if m:
        return ('Ruta marina ' if m.group(1) else 'Ruta ') + m.group(2)
    return nen.get(lid) or ident.replace('-', ' ').title()

METODO = {'walk':'Hierba / cueva','old-rod':'Caña Vieja','good-rod':'Caña Buena','super-rod':'Supercaña','surf':'Surf',
 'rock-smash':'Golpe Roca','headbutt':'Cabezazo','dark-grass':'Hierba alta oscura','grass-spots':'Hierba que se mueve',
 'cave-spots':'Polvo en cueva','bridge-spots':'Sombra en puente','super-rod-spots':'Supercaña (burbujas)',
 'surf-spots':'Surf (agua que se mueve)','yellow-flowers':'Flores amarillas','purple-flowers':'Flores moradas',
 'red-flowers':'Flores rojas','rough-terrain':'Terreno abrupto','gift':'Regalo','gift-egg':'Huevo de regalo',
 'static':'Encuentro fijo','pokeflute':'Poké Flauta','headbutt-low':'Cabezazo','headbutt-normal':'Cabezazo',
 'headbutt-high':'Cabezazo','squirt-bottle':'Regadera','wailmer-pail':'Regadera Wailmer','seaweed':'Buceo (algas)',
 'roaming-grass':'Errante (hierba)','roaming-water':'Errante (agua)','devon-scope':'Detector Devon',
 'feebas-tile-fishing':'Pesca en casillas de Feebas','island-scan':'Escáner Isla','sos':'Llamada de auxilio (SOS)',
 'bubbling-spots':'Agua burbujeante','berry-trees':'Árboles de bayas','npc-trade':'Intercambio con PNJ',
 'sos-from-bubbling-spot':'SOS en agua burbujeante','overworld':'Visible en el mapa','overworld-water':'Visible en el agua',
 'overworld-flying':'Visible volando','fishing':'Pesca','pokemon-den':'Guarida Dinamax / incursión',
 'overworld-special':'Visible en el mapa (especial)','overworld-flying-special':'Visible volando (especial)',
 'overworld-water-special':'Visible en el agua (especial)','horde':'Encuentro múltiple','hidden-grotto':'Claro oculto',
 'honey-tree':'Árbol de miel','overworld-dirt':'Visible en la tierra','wanderer':'Errante (aparece a veces)',
 'wanderer-water':'Errante en el agua','chase-water':'Persigue en el agua','dynamax-adventure':'Aventura Dinamax',
 'max-raid':'Incursión Dinamax','trash-can-ambush':'Emboscada en papelera','rustling-bush-ambush':'Emboscada en arbusto',
 'ceiling-ambush':'Emboscada desde el techo','ground-ambush':'Emboscada desde el suelo','sky-ambush':'Emboscada desde el cielo'}
metodos = {}
for r in leer('encounter_methods'):
    metodos[r['id']] = METODO.get(r['identifier'], r['identifier'].replace('-', ' ').capitalize())
slots = {r['id']: (metodos[r['encounter_method_id']], int(r['rarity'] or 0)) for r in leer('encounter_slots')}

COND = {'1':'Enjambre','3':'Mañana','4':'Día','5':'Noche','6':'Pokéradar','9':'Rubí en ranura 2','10':'Zafiro en ranura 2',
 '11':'Esmeralda en ranura 2','12':'Rojo Fuego en ranura 2','13':'Verde Hoja en ranura 2','15':'Radio Hoenn','16':'Radio Sinnoh',
 '17':'Primavera','18':'Verano','19':'Otoño','20':'Invierno','35':'Tras entrar al Salón de la Fama','37':'Con la Pokédex Nacional',
 '186':'Antes de la Pokédex Nacional','247':'Tiempo normal','248':'Nublado','249':'Lluvia','250':'Tormenta','251':'Nieve',
 '252':'Ventisca','253':'Tormenta de arena','254':'Sol intenso','255':'Niebla','256':'Antes del Salón de la Fama',
 '205':'Concurso de captura de bichos','192':'Árbol (común)','193':'Árbol (raro)','194':'Árbol (secreto)',
 '336':'Incursión','337':'Incursión','338':'Incursión 1★','339':'Incursión 2★','340':'Incursión 3★','341':'Incursión 4★',
 '342':'Incursión 5★','343':'Incursión'}
IGNORAR = {'2', '7', '8', '14', '204', '257', '336', '337', '343'}
cprosa = {r['encounter_condition_value_id']: r['name'] for r in leer('encounter_condition_value_prose') if r['local_language_id'] == '9'}
def etiqueta(c):
    if c in COND: return COND[c]
    p = cprosa.get(c, '')
    if p.startswith('Give '): return 'Intercambio'
    return p or None
cond_enc = defaultdict(set)
for r in leer('encounter_condition_value_map'):
    c = r['encounter_condition_value_id']
    if c in IGNORAR: continue
    e = etiqueta(c)
    if e: cond_enc[r['encounter_id']].add(e)

ver_juego = {v: j for j, vs in JUEGOS.items() for v in vs}
# (juego, pokemon, loc, metodo) -> datos
agg = {}
for r in leer('encounters'):
    v = int(r['version_id'])
    j = ver_juego.get(v)
    if not j: continue
    area = areas[r['location_area_id']]
    lid = area['location_id']
    met, rar = slots.get(r['encounter_slot_id'], ('?', 0))
    k = (j, int(r['pokemon_id']), lid, met)
    a = agg.setdefault(k, {'min': 999, 'max': 0, 'v': set(), 'c': set(), 'p': defaultdict(int)})
    a['min'] = min(a['min'], int(r['min_level'])); a['max'] = max(a['max'], int(r['max_level']))
    a['v'].add(v)
    cs = cond_enc.get(r['id'], set())
    a['c'] |= cs
    a['p'][(v, r['location_area_id'], tuple(sorted(cs)))] += rar

por_juego = defaultdict(lambda: {'locs': {}, 'p': defaultdict(list)})
for (j, pid, lid, met), a in agg.items():
    g = por_juego[j]
    g['locs'][lid] = [nombre_loc(lid), locs[lid]['identifier']]
    prob = max(a['p'].values()) if a['p'] else 0
    BASE = {35: 33, 36: 33, 50: 34, 51: 34, 42: 40, 43: 40, 52: 41, 53: 41}
    vs = list(dict.fromkeys(VNOMBRE.get(BASE.get(v, v), str(v)) for v in JUEGOS[j] if v in a['v']))
    todas = len(set(VNOMBRE.get(BASE.get(v, v)) for v in JUEGOS[j]))
    g['p'][pid].append([int(lid), met, a['min'], a['max'], vs if len(vs) < todas else [], sorted(a['c']), min(prob, 100)])

with open(os.path.join(SAL, 'nombres.js'), 'w', encoding='utf-8') as f:
    f.write('window.NOMBRES_LUGAR=')
    json.dump({locs[l]['identifier']: nombre_loc(l) for l in locs}, f, ensure_ascii=False, separators=(',', ':'))
    f.write(';\n')

for j, g in por_juego.items():
    for pid in g['p']:
        g['p'][pid].sort(key=lambda e: (g['locs'][str(e[0])][0], e[1]))
    with open(os.path.join(SAL, j + '.js'), 'w', encoding='utf-8') as f:
        f.write('(window.UBIC=window.UBIC||{})[' + json.dumps(j) + ']=')
        json.dump({'locs': g['locs'], 'p': g['p']}, f, ensure_ascii=False, separators=(',', ':'))
        f.write(';\n')
    print(j, len(g['locs']), 'lugares', len(g['p']), 'pokemon', os.path.getsize(os.path.join(SAL, j + '.js')) // 1024, 'KB')
