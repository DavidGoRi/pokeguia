"""Traduce al español las notas cortas de ubicación de objetos de Serebii y PokémonDB
(«north, on large rock», «from man next to PokeCenter after defeating 5 trainers in the area», «2F, west - requires Cut»...).
Traducción por reglas, sin servicios externos. Lo que no reconoce lo deja como está."""
import re

DIR = {'north': 'norte', 'south': 'sur', 'east': 'este', 'west': 'oeste', 'northeast': 'noreste', 'northwest': 'noroeste',
       'southeast': 'sureste', 'southwest': 'suroeste', 'center': 'centro', 'middle': 'centro', 'central': 'central',
       'eastern': 'este', 'western': 'oeste', 'northern': 'norte', 'southern': 'sur', 'southeastern': 'sureste', 'easternmost': 'más al este'}
MOVS = {'Cut': 'Corte', 'Rock Smash': 'Golpe Roca', 'Rock Climb': 'Treparrocas', 'Surf': 'Surf', 'Strength': 'Fuerza', 'Dive': 'Buceo',
        'Bicycle': 'Bicicleta', 'Chop Down': 'Tala', 'Tauros Charge': 'Embestida de Tauros', 'Machamp Shove': 'Empujón de Machamp',
        'Sharpedo Jet': 'Propulsión de Sharpedo', 'Waterfall': 'Cascada', 'Flash': 'Destello', 'Fly': 'Vuelo', 'Whirlpool': 'Torbellino',
        'Koraidon/Miraidon climbing power': 'la habilidad de escalar de Koraidon/Miraidon',
        'Koraidon/Miraidon high jumping power': 'el salto alto de Koraidon/Miraidon', 'diagonal movement': 'moverse en diagonal'}
DIAS = {'Monday': 'lunes', 'Tuesday': 'martes', 'Wednesday': 'miércoles', 'Thursday': 'jueves', 'Friday': 'viernes', 'Saturday': 'sábado', 'Sunday': 'domingo'}
PERS = {'man': 'un hombre', 'woman': 'una mujer', 'girl': 'una chica', 'boy': 'un chico', 'guy': 'un chico', 'lady': 'una señora', 'old man': 'un anciano',
        'old lady': 'una anciana', 'elderly lady': 'una anciana', 'trainer': 'un entrenador', 'scientist': 'un científico', 'worker': 'un trabajador',
        'vendor': 'un vendedor', 'clown': 'un payaso', 'fisherman': 'un pescador', 'sailor': 'un marinero', 'hiker': 'un montañero', 'Hiker': 'un montañero',
        'youngster': 'un joven', 'Youngster': 'un joven', 'clerk': 'el dependiente', 'children': 'los niños', 'butler': 'el mayordomo', 'foreman': 'el capataz',
        'Team Rocket Grunt': 'un recluta del Team Rocket', 'Team Skull Grunt': 'un recluta del Team Skull', 'Team Flare grunt': 'un recluta del Team Flare',
        'Grunt': 'un recluta', 'Plasma Grunt': 'un recluta del Equipo Plasma', 'Black Belt': 'el Karateka', 'Coach Trainer': 'un Entrenador Guía',
        'Ace Trainer': 'un Entrenador Guay', 'Battle Girl': 'una Luchadora', 'Swimmer Girls': 'las nadadoras', 'Veteran': 'el Veterano', 'Collector': 'el Coleccionista'}
LUG = {'PokeCenter': 'Centro Pokémon', 'PokéCenter': 'Centro Pokémon', 'Pokemon Center': 'Centro Pokémon', 'PokeMart': 'Tienda', 'Pokemart': 'Tienda', 'Mart': 'Tienda',
       'house': 'casa', 'House': 'casa', 'Gym': 'Gimnasio', 'gym': 'gimnasio', 'cave': 'cueva', 'ruins': 'las ruinas', 'Watchtower': 'la Atalaya',
       'Lighthouse': 'el faro', 'lighthouse': 'el faro', 'lake': 'el lago', 'river': 'el río', 'pond': 'el estanque', 'waterfall': 'la cascada', 'beach': 'la playa',
       'island': 'una isla', 'cliffs': 'los acantilados', 'cliff': 'un acantilado', 'ridge': 'una cresta', 'plateau': 'una meseta', 'rocks': 'las rocas',
       'rock': 'una roca', 'large rock': 'una roca grande', 'small rock': 'una roca pequeña', 'tree': 'un árbol', 'small tree': 'un árbol pequeño',
       'bridge': 'el puente', 'entrance': 'la entrada', 'exit': 'la salida', 'gate': 'la garita', 'forest': 'el bosque', 'crater': 'el cráter', 'pool': 'la poza',
       'rooftop': 'una azotea', 'scaffolding': 'los andamios', 'crates': 'las cajas', 'boat': 'un barco', 'shipwreck': 'el pecio', 'jetty': 'el embarcadero',
       'alcove': 'un recoveco', 'dead end': 'un callejón sin salida', 'hedge maze': 'el laberinto de setos', 'swampland': 'el pantano', 'mountainside': 'la ladera',
       'platform': 'una plataforma', 'high platform': 'una plataforma alta', 'windmill': 'el molino', 'fence': 'la valla', 'bench': 'un banco', 'tunnel entrance': 'la entrada del túnel',
       'city walls': 'las murallas', 'ledge': 'un saliente', 'narrow ledge': 'un saliente estrecho', 'cliffside': 'la pared del acantilado', 'turret': 'la torreta',
       'Game Corner': 'Casino', 'Trainers\' School': 'Escuela de Entrenadores', 'Trainer School': 'Escuela de Entrenadores', 'Trick House': 'Casa Trampa',
       'Space Center': 'Centro Espacial', 'Pokémon Lab': 'Laboratorio Pokémon', 'Library': 'Biblioteca', 'Flower Shop': 'Floristería', 'Bike Shop': 'tienda de bicis',
       'Market': 'Mercado', 'Mall': 'Centro comercial', 'Hotel': 'Hotel', 'Musical Theater': 'Teatro Musical', 'Musical Hall': 'Teatro Musical',
       'Battle Company': 'Compañía de Combates', 'Lookout Station': 'Mirador', 'MooMoo Farm': 'Granja Mu-mu', 'Malasada Shop': 'Malasadería',
       'Celadon Mansion': 'Mansión Azulona', 'Space-time Distortions': 'las distorsiones espaciotemporales', 'Upper Level': 'Nivel superior',
       'Lower Level': 'Nivel inferior', 'Deepest Level': 'Nivel más profundo', 'Entrance area': 'Zona de la entrada', 'Interior': 'Interior', 'Plains': 'Llanura',
       'Storage Room': 'Almacén', 'Southern Guardhouse': 'Garita sur', 'north gate': 'garita norte', 'trial site': 'zona de la prueba', 'Escuadrón Base': 'base del Escuadrón',
       'Team Star Base': 'base del Team Star', 'Team Star dropout base': 'base del Team Star abandonada', 'Geothermal Power Plant': 'Central Geotérmica',
       'Lottery': 'Lotería', 'Bug Catching Contest': 'Concurso de Captura de Bichos', 'Bug Catching': 'Concurso de Captura de Bichos', 'Centro Comercial': 'Centro Comercial'}

def pal(x):
    """Traduce una expresión de lugar o persona (con artículos)."""
    x = x.strip()
    for k in sorted(PERS, key=len, reverse=True):
        if x == k: return PERS[k]
    for k in sorted(LUG, key=len, reverse=True):
        if x == k: return LUG[k]
        if x.lower() == k.lower(): return LUG[k]
    m = re.match(r'^(a|the)\s+(.*)$', x, re.I)
    if m: return pal(m.group(2))
    m = re.match(r'^(small|large|tall|huge|tall thin|grey|grassy|grass)\s+(.*)$', x)
    if m:
        adj = {'small': 'pequeño', 'large': 'grande', 'tall': 'alto', 'huge': 'enorme', 'tall thin': 'alto y fino', 'grey': 'gris', 'grassy': 'de hierba', 'grass': 'de hierba'}[m.group(1)]
        return pal(m.group(2)) + ' ' + adj
    m = re.match(r'^(.*?)\s+(?:no\.|No\.)\s*(\d+)$', x)
    if m: return pal(m.group(1)) + ' n.º ' + m.group(2)
    return x

def movs(x):
    partes = re.split(r'\s*(?:,|\band\b)\s*', x)
    t = [MOVS.get(p.strip(), p.strip()) for p in partes if p.strip()]
    return ' y '.join([', '.join(t[:-1]), t[-1]] if len(t) > 1 else t)

REGLAS = [
    (r'^(\d+)F$', lambda m: f'planta {m.group(1)}'),
    (r'^B(\d+)F$', lambda m: f'sótano {m.group(1)}'),
    (r'^(\d+)F\s+(.*)$', lambda m: f'planta {m.group(1)}, {seg(m.group(2))}'),
    (r'^B(\d+)F\s+(.*)$', lambda m: f'sótano {m.group(1)}, {seg(m.group(2))}'),
    (r'^(far )?(north|south|east|west|northeast|northwest|southeast|southwest|center|middle)$', lambda m: ('extremo ' if m.group(1) else '') + 'zona ' + DIR[m.group(2)]),
    (r'^(?:may )?requires? (.*)$', lambda m: 'requiere ' + movs(m.group(1))),
    (r'^Gym - defeat (.*)$', lambda m: 'en el Gimnasio, tras vencer a ' + m.group(1)),
    (r'^(?:defeat|beat) (?:gym leaders?|Gym Leaders?) (.*)$', lambda m: 'tras vencer a la líder o el líder de gimnasio ' + m.group(1).replace(' & ', ' y ')),
    (r'^(?:defeat|beat) (?:all )?(trainers|bikers|kids|students|the 5 Kimono Girls|the four trainers)(.*)$', lambda m: 'tras vencer a ' + {'trainers': 'todos los entrenadores', 'bikers': 'los moteros', 'kids': 'los niños', 'students': 'los alumnos', 'the 5 Kimono Girls': 'las cinco Chicas Kimono', 'the four trainers': 'los cuatro entrenadores'}[m.group(1)] + seg_resto(m.group(2))),
    (r'^(?:defeat|beat) (.*)$', lambda m: 'tras vencer a ' + pal(m.group(1)).replace(' & ', ' y ')),
    (r'^from (.+?) next to (.+?) after defeating (\d+) trainers in the area$', lambda m: f'te lo da {pal(m.group(1))} junto al {pal(m.group(2)).replace("Centro Pokémon", "Centro Pokémon")} tras vencer a {m.group(3)} entrenadores de la zona'),
    (r'^from (.+?) after (?:defeating|beating) (.*)$', lambda m: f'te lo da {pal(m.group(1))} tras vencer a {pal(m.group(2))}'),
    (r'^from (.+?) in (.*)$', lambda m: f'te lo da {pal(m.group(1))} en {pal(m.group(2))}'),
    (r'^from (.+?) (?:on|by|at) (.*)$', lambda m: f'te lo da {pal(m.group(1))} en {pal(m.group(2))}'),
    (r'^from (.+?) next to (.*)$', lambda m: f'te lo da {pal(m.group(1))} junto a {pal(m.group(2))}'),
    (r'^from (.+?) with (.*)$', lambda m: f'te lo da {pal(m.group(1))} con {m.group(2)}'),
    (r'^(?:received )?from (.*)$', lambda m: 'te lo da ' + pal(m.group(1))),
    (r'^(?:Gift|Souvenir|Daily|Event|Random chance)$', lambda m: {'Gift': 'regalo', 'Souvenir': 'recuerdo', 'Daily': 'cada día', 'Event': 'evento', 'Random chance': 'al azar'}[m.group(0)]),
    (r'^on top of (.*)$', lambda m: 'encima de ' + pal(m.group(1))),
    (r'^atop (.*)$', lambda m: 'encima de ' + pal(m.group(1))),
    (r'^top of (.*)$', lambda m: 'en lo alto de ' + pal(m.group(1))),
    (r'^bottom of (.*)$', lambda m: 'al pie de ' + pal(m.group(1))),
    (r'^on (.*?) (above|below|overlooking|near|in|north of|south of|east of|west of) (.*)$', lambda m: f'en {pal(m.group(1))} {PREP[m.group(2)]} {pal(m.group(3))}'),
    (r'^on (.*)$', lambda m: 'sobre ' + pal(m.group(1)) if m.group(1) in ('rock', 'rocks', 'large rock', 'small rock', 'ruins', 'rooftop', 'crystal') else 'en ' + pal(m.group(1))),
    (r'^in (.*?) (above|below|on|near|behind) (.*)$', lambda m: f'en {pal(m.group(1))} {PREP[m.group(2)]} {pal(m.group(3))}'),
    (r'^in (.*)$', lambda m: 'en ' + pal(m.group(1))),
    (r'^under (.*)$', lambda m: 'bajo ' + pal(m.group(1))),
    (r'^behind (.*)$', lambda m: 'detrás de ' + pal(m.group(1))),
    (r'^amongst (.*)$', lambda m: 'entre ' + pal(m.group(1))),
    (r'^(?:near|by) (.*)$', lambda m: 'cerca de ' + pal(m.group(1))),
    (r'^across (.*)$', lambda m: 'al otro lado de ' + pal(m.group(1))),
    (r'^opposite (.*)$', lambda m: 'enfrente de ' + pal(m.group(1))),
    (r'^outside (.*)$', lambda m: 'fuera de ' + pal(m.group(1))),
    (r'^inside (.*)$', lambda m: 'dentro de ' + pal(m.group(1))),
    (r'^(north|south|east|west) of (.*)$', lambda m: f'al {DIR[m.group(1)]} de {pal(m.group(2))}'),
    (r'^(\w+) (house|room|exterior|island|bypass|house)$', lambda m: f'{pal(m.group(2))} del {DIR.get(m.group(1), m.group(1))}' if m.group(1) in DIR else m.group(0)),
    (r'^Game Corner - ([\d,]+) Coins$', lambda m: 'premio del Casino por ' + m.group(1).replace(',', '.') + ' fichas'),
    (r'^(?:Mauville )?Game Corner - (.*)$', lambda m: 'Casino: ' + seg(m.group(1))),
    (r'^Come (\d)(?:st|nd|rd|th) in Bug Catching Contest$', lambda m: f'quedar {m.group(1)}.º en el Concurso de Captura de Bichos'),
    (r'^(\d)(?:st|nd|rd|th) Prize in Bug Catching$', lambda m: f'{m.group(1)}.º premio del Concurso de Captura de Bichos'),
    (r'^(?:Goldenrod (?:Dept\. Store )?)?Lottery(?: Prize)? - (.*)$', lambda m: 'Lotería: ' + seg(m.group(1))),
    (r'^Get (\d|all the) Numbers? in the Lottery$', lambda m: 'Lotería: acertar ' + ('todos los números' if m.group(1) == 'all the' else m.group(1) + ' número(s)')),
    (r'^(\d) Numbers? Match$', lambda m: f'acertar {m.group(1)} número(s)'),
    (r'^All Numbers Match$', lambda m: 'acertar todos los números'),
    (r'^(\d)(?:st|nd|rd|th) Prize$', lambda m: f'{m.group(1)}.º premio'),
    (r'^Earn (\d+) Points? at Buena\'s Password$', lambda m: f'conseguir {m.group(1)} puntos en la Contraseña de Buena'),
    (r'^Show (.*)$', lambda m: 'enséñale ' + m.group(1).replace(' a ', ' un ').replace(' an ', ' un ').replace(' to ', ' a ').replace(' in HG or ', ' en HG o ').replace(' in SS', ' en SS').replace(' & ', ' y ')),
    (r'^Give (.*?) to (.*)$', lambda m: f'dale {m.group(1)} a {pal(m.group(2))}'),
    (r'^give (.*?) to (.*)$', lambda m: f'dale {m.group(1)} a {pal(m.group(2))}'),
    (r'^Give (\w+) a (.*)$', lambda m: f'dale a {m.group(1)} un {m.group(2)}'),
    (r'^give (\w+) (.*)$', lambda m: f'dale a {pal(m.group(1))} {m.group(2)}'),
    (r'^(?:exchange|trade) (.*?)(?: with (.*))?$', lambda m: 'cámbialo por ' + m.group(1) + (' con ' + m.group(2) if m.group(2) else '')),
    (r'^(?:After|after) (?:capturing|obtaining|finding|rescuing|Rescuing) (.*)$', lambda m: 'tras conseguir ' + m.group(1)),
    (r'^Attached to (.*)$', lambda m: 'lo lleva ' + m.group(1)),
    (r'^Held by (.*)$', lambda m: 'lo lleva ' + m.group(1)),
    (r'^(.*) Only$|^(.*) only$', lambda m: 'solo ' + DIAS.get((m.group(1) or m.group(2)).strip(), {'Winter': 'en invierno', 'Autumn': 'en otoño', 'Spring/Summer': 'en primavera y verano'}.get((m.group(1) or m.group(2)).strip(), 'en ' + (m.group(1) or m.group(2))))),
    (r'^(\w+) on (Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)$', lambda m: f'te lo da {m.group(1)} los {DIAS[m.group(2)]}'),
    (r'^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday) (Night|Nights)(?: Only)?$', lambda m: f'solo los {DIAS[m.group(1)]} por la noche'),
    (r'^at night$', lambda m: 'de noche'),
    (r'^(Low|High) Tide$', lambda m: 'con la marea ' + ('baja' if m.group(1) == 'Low' else 'alta')),
    (r'^Winter$', lambda m: 'en invierno'),
    (r'^[Mm]able.?s Research Level (\d+)$', lambda m: f'investigación de Mable, nivel {m.group(1)}'),
    (r'^(Jaune|Vert|Bleu|Rouge|Magenta) Sector (\d+)$', lambda m: f'Sector {m.group(1)} {m.group(2)}'),
    (r'^(Jaune|Vert|Bleu|Rouge|Magenta) (Street|Plaza)$', lambda m: ('Calle ' if m.group(2) == 'Street' else 'Plaza ') + m.group(1)),
    (r'^Watt Trader - (\d+)W$', lambda m: f'comerciante de vatios por {m.group(1)} W'),
    (r'^(?:PokeCenter|PokeMart|TM Shop|Shopping Mall Nine|Slateport Market|Lilycove Centro Comercial|Centro Comercial(?: 2F)?) - \$([\d,]+)$', lambda m: 'se compra por ' + m.group(1).replace(',', '.') + ' ₽'),
    (r'^TM Machine: ([\d,]+) LP, (.*)$', lambda m: f'Máquina de MT: {m.group(1).replace(",", ".")} PL y {m.group(2)}'),
    (r'^If you answer (\w+)$', lambda m: f'si respondes {m.group(1)}'),
    (r'^Answer (\w+)$', lambda m: f'responde {m.group(1)}'),
    (r'^(.*) - (Bad|Good|Good/Strange) Ending$', lambda m: f'{m.group(1)}: final {"malo" if m.group(2) == "Bad" else "bueno" if m.group(2) == "Good" else "bueno o raro"}'),
    (r'^use skate rail$', lambda m: 'usa el raíl para patinar'),
    (r'^[Rr]equiere (.*)$', lambda m: 'requiere ' + movs(m.group(1))),
    (r'^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)$', lambda m: 'los ' + DIAS[m.group(1)]),
    (r'^Goldenrod Dept\. Store Lottery$', lambda m: 'Lotería del Centro Comercial de Ciudad Trigal'),
    (r'^Trick House (\d+)$', lambda m: f'Casa Trampa {m.group(1)}'),
    (r'^(.+?),? \$([\d,]+)$', lambda m: f'{pal(m.group(1))}: se compra por {m.group(2).replace(",", ".")} ₽'),
    (r'^(?:Recogida|Pickup) ability, (\d+)% chance$', lambda m: f'habilidad Recogida, {m.group(1)} % de probabilidad'),
    (r'^requires (.*)$', lambda m: 'requiere ' + movs(m.group(1))),
]
PREP = {'above': 'sobre', 'below': 'bajo', 'overlooking': 'con vistas a', 'near': 'cerca de', 'in': 'en', 'on': 'en', 'behind': 'detrás de',
        'north of': 'al norte de', 'south of': 'al sur de', 'east of': 'al este de', 'west of': 'al oeste de'}

def seg_resto(x):
    x = x.strip()
    if not x: return ''
    m = re.match(r'^in under (\d+) minutes$', x)
    if m: return f' en menos de {m.group(1)} minutos'
    m = re.match(r'^(?:and|at) (.*)$', x)
    if m: return ' y ' + seg(m.group(1))
    return ' ' + seg(x)

def seg(x):
    x = x.strip()
    if x in MANUAL: return MANUAL[x]
    for var in (x, x[:1].lower() + x[1:]):
        for pat, f in REGLAS:
            m = re.match(pat, var)
            if m:
                try: return f(m).replace('cerca de el ', 'cerca del ').replace('cerca de Centro', 'cerca del Centro').replace('junto a el ', 'junto al ').replace(' de el ', ' del ')
                except Exception: pass
    if x in DIR: return 'zona ' + DIR[x]
    return pal(x)

import json as _json, os as _os
_ruta = _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), 'notas_manual.json')
MANUAL = _json.load(open(_ruta, encoding='utf-8')) if _os.path.exists(_ruta) else {}

def traducir_nota(nota):
    nota = nota.replace('Pok�', 'Poké').replace('Pok�mon', 'Pokémon')
    if nota in MANUAL: return MANUAL[nota]
    partes = re.split(r'\s*(?:;| - |, (?=(?:requires|defeat|from|near|on|in|atop|under|behind|amongst|by|access|go|take|use|outside|answer|show|give|received|may)\b))\s*', nota)
    salida = []
    for p in partes:
        sub = re.split(r',\s*', p) if re.match(r'^(far )?(north|south|east|west|northeast|northwest|southeast|southwest|center|middle|\d+F|B\d+F)\b', p) else [p]
        salida.extend(seg(s) for s in sub if s.strip())
    t = ', '.join(s for s in salida if s)
    return t[:1].lower() + t[1:] if t and not re.match(r'^[A-ZÁÉÍÓÚ][a-záéíóú]+ [A-Z]', t) else t

if __name__ == '__main__':
    import json, sys
    for n in json.load(open(sys.argv[1], encoding='utf-8'))[:int(sys.argv[2]) if len(sys.argv) > 2 else None]:
        print(n, '=>', traducir_nota(n))

_INGLES = re.compile(r"\b(the|from|From|after|defeat|defeating|Get|Badges|Show|Level|Research|Lottery|Store|House|Market|Boulevard|Ruins|Top|Bottom|Left|Right|Girl|Man|Assistant|Aide|President|Gift|Trade|Return|Requiere|ability|chance|Mission|Gym|Entrance|entrance|Wednesday|Monday|Tuesday|Thursday|Friday|Saturday|Sunday|win|on|in|north|south|east|west|near|requires)\b")
def traducir_parentesis(t):
    """Traduce las notas entre paréntesis que sigan en inglés (y el texto entero si todo él es una nota)."""
    t = re.sub(r'\(([^()]*)\)', lambda m: '(' + (traducir_nota(m.group(1)) if _INGLES.search(m.group(1)) else m.group(1)) + ')', t)
    return t