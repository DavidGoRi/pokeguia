"""Genera rivales.js (rivales y jefes villanos por juego).
Fuentes: Serebii (páginas de rivales/villanos) y los desensamblados de pret (pokered, pokeyellow, pokegold, pokecrystal,
pokeruby, pokeemerald, pokefirered) para las generaciones 1-3. Los objetos están en objetos.py.
Uso: python herramientas/rivales_objetos.py <carpeta_csv> <carpeta_cache>
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from comun_datos import *

# ================= RIVALES (Serebii, gen 4+) =================
SER = {
    '9': ['platinum/rival'], '10': ['heartgoldsoulsilver/rival'],
    '11': ['blackwhite/cheren', 'blackwhite/bianca'],
    '14': ['black2white2/rival', 'black2white2/n', 'black2white2/teamplasma'],
    '15': ['xy/teamflare', 'xy/az'],
    '16': ['omegarubyalphasapphire/rival', 'omegarubyalphasapphire/wally'],
    '17': ['sunmoon/hau', 'sunmoon/gladion', 'sunmoon/teamskull'],
    '18': ['ultrasunultramoon/hau', 'ultrasunultramoon/gladion', 'ultrasunultramoon/teamskull', 'ultrasunultramoon/teamrainbowrocket'],
    '19': ['letsgopikachueevee/rival', 'letsgopikachueevee/blue', 'letsgopikachueevee/teamrocket'],
    '20': ['swordshield/hop', 'swordshield/bede', 'swordshield/marnie', 'swordshield/teamyell'],
    '23': ['brilliantdiamondshiningpearl/barry', 'brilliantdiamondshiningpearl/teamgalactic'],
    '24': ['legendsarceus/battles'],
    '25': ['scarletviolet/starfallstreet', 'scarletviolet/academyacetournament', 'scarletviolet/thewayhome'],
    '30': ['legendsz-a/battles', 'legendsz-a/roguerematch'],
}
TRAD_TIT = [(r'Encounter', 'Combate'), (r'Battle', 'Combate'), (r'Rematch', 'Revancha'), (r'Final', 'Final'), (r'Team', 'Equipo'),
            (r'Chosen', 'elegido'), (r'If you chose', 'Si elegiste a'), (r'Starter', 'inicial')]
def tit_es(t, region=None):
    t = texto(t)
    m = re.match(r'^(.*?):\s*(.+)$', t)
    if m: t = m.group(1) + ': ' + lugar_es(m.group(2), region)
    else: t = lugar_es(t, region)
    for a, b in TRAD_TIT: t = re.sub(a, b, t)
    t = re.sub(r'^First torneo|^First Tournament', 'Primer torneo', frase_es(t))
    return t
def entrenador_es(t):
    t = re.sub(r'^(Pok[ée]mon Trainer|Rival|Trainer)\s+', '', html.unescape(t)).strip()
    return {'Hop': 'Paul', 'Bede': 'Berto', 'Marnie': 'Roxy', 'Hau': 'Tilo', 'Gladion': 'Gladio', 'Barry': 'Israel', 'Wally': 'Blasco', 'Brendan / May': 'Bruno / Aura',
            'Arven': 'Damián', 'Nemona': 'Mencía', 'Penny': 'Noa', 'Silver': 'Plata', 'Blue': 'Azul', 'Lysandre': 'Lysson',
            'Team Flare Boss Lysandre': 'Lysson (jefe del Team Flare)'}.get(t, t)

nombre_esp_en = {}
for r in leer('pokemon_species_names'):
    if r['local_language_id'] == '9': nombre_esp_en[r['name'].lower()] = int(r['pokemon_species_id'])

def parse_viejo(b, titulo):
    """Tablas antiguas de Serebii: una fila con sprites y la siguiente con 'Nombre<br />Lv. N'."""
    filas = re.findall(r'<tr>(.*?)</tr>', b, re.S)
    combates = []
    for k in range(len(filas) - 1):
        celdas = re.findall(r'<td[^>]*>(.*?)</td>', filas[k], re.S)
        if not any(re.search(r'/pokemon/\d{3,4}', c) for c in celdas): continue
        info = re.findall(r'<td[^>]*>(.*?)</td>', filas[k + 1], re.S)
        if len(info) < 2 or not re.search(r'Lv\.?\s*\d+', filas[k + 1]): continue
        nota = re.findall(r'<i>([^<]+)</i>', info[0])
        equipo = []
        for c, inf in zip(celdas[1:], info[1:]):
            mm = re.search(r'/pokemon/(\d{3,4})(-[a-z0-9]+)?\.(?:png|gif|jpg)', c)
            nv = re.search(r'Lv\.?\s*(\d+)', inf)
            if mm: s, suf = int(mm.group(1)), (mm.group(2) or '').lstrip('-')
            else:
                nom = texto(re.sub(r'<br\s*/?>.*', '', inf, flags=re.S)).split('/')[0].strip().lower()
                s, suf = nombre_esp_en.get(nom), ''
            if s and 1 <= s <= 1025:
                equipo.append({'pid': forma_pid(s, suf), 's': s, 'nv': int(nv.group(1)) if nv else 0, 'm': [], 'o': ''})
        if equipo:
            combates.append({'titulo': titulo, 'entrenador': entrenador_es(texto(re.sub(r'<i>.*?</i>', '', info[0]))), 'nota': frase_es(texto(nota[0])) if nota else '', 'equipo': equipo})
    return combates

def parse_serebii(pagina, region):
    h = re.sub(r'<!--.*?-->', '', pagina, flags=re.S)
    m = re.search(r'<h1>(.*?)</h1>', h, re.S)
    grupo = texto(m.group(1)) if m else ''
    marcas = [(mm.start(), 'sec', mm) for mm in re.finditer(r'<h2[^>]*>(.*?)</h2>|<b><u>(.*?)</u></b>|class="fooleft"[^>]*>(.*?)</td>', h, re.S)]
    marcas += [(mm.start(), 'tr', mm) for mm in re.finditer(r'<table class="trainer"', h)]
    marcas += [(mm.start(), 'viejo', mm) for mm in re.finditer(r'<table[^>]*border="1"', h)]
    marcas.sort(key=lambda x: x[0])
    combates, titulo = [], grupo
    for k, (pos, tipo, mm) in enumerate(marcas):
        if tipo == 'sec':
            t = tit_es(next(g for g in mm.groups() if g is not None), region)
            if t: titulo = t
            continue
        fin = marcas[k + 1][0] if k + 1 < len(marcas) else len(h)
        b = h[pos:fin]
        if tipo == 'viejo':
            combates += parse_viejo(b, titulo); continue
        pks = re.findall(r'<img src="[^"]*?(?:pokemon|pokedex|art)[^"]*?/(\d{3,4})(-[a-z0-9]+)?\.(?:png|gif|jpg)"', b)
        if not pks: continue
        niveles = [int(x) for x in re.findall(r'Level\s*(\d+)', b)]
        ataques = [[mov_en.get(texto(a).lower()) for a in re.findall(r'<a[^>]*>([^<]+)</a>', cel)] for cel in re.findall(r'<b>Attacks</b>:(.*?)</td>', b, re.S)]
        objs = [texto(x) for x in re.findall(r'<b>Hold Item</b>:<br\s*/?>(.*?)</td>', b, re.S)]
        ent = re.search(r'</tr>\s*<tr>\s*<td[^>]*>(.*?)</td>', b, re.S)
        nota = re.findall(r'<i>([^<]+)</i>', b)
        equipo = []
        for i, (num, suf) in enumerate(pks):
            s = int(num)
            if s < 1 or s > 1025: continue
            ob = objs[i] if i < len(objs) else ''
            oid = item_en.get(ob.lower())
            equipo.append({'pid': forma_pid(s, (suf or '').lstrip('-')), 's': s, 'nv': niveles[i] if i < len(niveles) else 0,
                           'm': [x for x in (ataques[i] if i < len(ataques) else []) if x],
                           'o': item_es.get(oid, '') if oid else ''})
        if equipo:
            combates.append({'titulo': titulo, 'entrenador': entrenador_es(texto(ent.group(1))) if ent else grupo,
                             'nota': frase_es(texto(nota[-1])) if nota else '', 'equipo': equipo})
    return grupo, combates

REG_JUEGO = {'9': 'sinnoh', '10': 'johto', '11': 'unova', '14': 'unova', '15': 'kalos', '16': 'hoenn', '17': 'alola', '18': 'alola',
             '19': 'kanto', '20': 'galar', '23': 'sinnoh', '24': 'hisui', '25': 'paldea', '30': 'kalos'}
GRUPO_ES = {'Team Flare': 'Team Flare', 'Team Skull': 'Team Skull', 'Team Yell': 'Team Yell', 'Team Galactic': 'Equipo Galaxia',
            'Team Plasma': 'Equipo Plasma', 'Team Rocket': 'Team Rocket', 'Team Rainbow Rocket': 'Team Rainbow Rocket', 'Rival': 'Rival',
            'Starfall Street': 'Operación Estrella (Team Star)', 'Academy Ace Tournament': 'Torneo de la Academia', 'The Way Home': 'El camino a casa',
            'Battles': 'Combates importantes', 'Rogue Rematch': 'Revanchas', 'AZ': 'AZ'}
GRUPO_PAG = {'rival': 'Rival', 'cheren': 'Cheren', 'bianca': 'Bianca', 'n': 'N', 'teamplasma': 'Equipo Plasma', 'teamflare': 'Team Flare', 'az': 'AZ',
             'wally': 'Blasco', 'hau': 'Tilo', 'gladion': 'Gladio', 'teamskull': 'Team Skull', 'teamrainbowrocket': 'Team Rainbow Rocket', 'blue': 'Azul',
             'teamrocket': 'Team Rocket', 'hop': 'Paul', 'bede': 'Berto', 'marnie': 'Roxy', 'teamyell': 'Team Yell', 'barry': 'Israel',
             'teamgalactic': 'Equipo Galaxia', 'starfallstreet': 'Operación Estrella (Team Star)', 'academyacetournament': 'Torneo de la Academia',
             'thewayhome': 'El camino a casa'}
rivales = {}
for jid, pags in SER.items():
    for p in pags:
        pag = bajar('https://www.serebii.net/' + p + '.shtml')
        if not pag: continue
        grupo, combates = parse_serebii(pag, REG_JUEGO.get(jid))
        print(jid, p, grupo, len(combates))
        if combates:
            rivales.setdefault(jid, []).append({'grupo': GRUPO_PAG.get(p.split('/')[1], GRUPO_ES.get(grupo, grupo)), 'fuente': 'serebii', 'combates': combates})

# ================= RIVALES gen 1-3 (pret) =================
CONST = {}
for r in leer('pokemon_species'):
    CONST[r['identifier'].upper().replace('-', '_')] = int(r['id'])
CONST.update({'NIDORAN_F': 29, 'NIDORAN_M': 32, 'MR_MIME': 122, 'FARFETCH_D': 83, 'FARFETCHD': 83, 'HO_OH': 250, 'MIME_JR': 439, 'PORYGON_Z': 474})
def esp_const(n):
    n = n.replace('SPECIES_', '').strip()
    return CONST.get(n) or CONST.get(n.replace('_', ''))

INTERES = re.compile(r'rival|blue|green|silver|giovanni|archer|ariana|proton|petrel|executive|brendan|may|wally|maxie|archie|tabitha|matt|shelly|courtney|terry|gary|lance|red\b', re.I)
def humano(lbl):
    lbl = re.sub(r'^(sParty_|gTrainerParty_|gTrainer)', '', lbl)
    lbl = re.sub(r'(Data|Group)$', '', lbl)
    s = re.sub(r'(?<=[a-z0-9])(?=[A-Z])|_', ' ', lbl)
    s = re.sub(r'(?<=[A-Za-z])(?=\d)', ' ', s)
    for a, b in [('Route', 'Ruta'), ('Rival', 'Rival'), ('Lab', 'Laboratorio'), ('Champion', 'Campeón'), ('Early', '(pronto)'), ('Late', '(tarde)'),
                 ('Mt Moon', 'Mt. Moon'), ('Victory Road', 'Calle Victoria'), ('Ss Anne', 'S.S. Anne'), ('Pokemon Tower', 'Torre Pokémon'),
                 ('Silph Co', 'Silph S.A.'), ('Rocket Hideout', 'Escondite Rocket'), ('Game Corner', 'Casino'), ('Gym', 'Gimnasio'),
                 ('Treecko', '(Treecko)'), ('Torchic', '(Torchic)'), ('Mudkip', '(Mudkip)'), ('Squirtle', '(Squirtle)'), ('Bulbasaur', '(Bulbasaur)'), ('Charmander', '(Charmander)')]:
        s = re.sub(r'\b' + a + r'\b', b, s)
    return s.strip()

def pret_gen1(repo, jid):
    t = bajar(f'https://raw.githubusercontent.com/pret/{repo}/master/data/trainers/parties.asm', .3)
    combates, actual = [], None
    for linea in t.splitlines():
        m = re.match(r'^(\w+)Data:', linea)
        if m: actual = m.group(1); n = 0; continue
        m = re.match(r'^\s*db\s+(.*?)(;.*)?$', linea)
        if not (m and actual and INTERES.search(actual)): continue
        partes = [x.strip() for x in m.group(1).split(',')]
        com = (m.group(2) or '').strip('; ').strip()
        n += 1
        if not partes or partes[-1] != '0': continue
        partes = partes[:-1]
        equipo = []
        if partes[0] == '$FF':
            for i in range(1, len(partes) - 1, 2):
                s = esp_const(partes[i + 1]); equipo.append({'s': s, 'nv': int(partes[i])}) if s else None
        else:
            nv = int(partes[0])
            for x in partes[1:]:
                s = esp_const(x); equipo.append({'s': s, 'nv': nv}) if s else None
        if equipo:
            combates.append({'titulo': (com or humano(actual) + ' ' + str(n)), 'entrenador': humano(actual), 'nota': '', 'equipo': equipo})
    return combates

def pret_gen2(repo, jid):
    t = bajar(f'https://raw.githubusercontent.com/pret/{repo}/master/data/trainers/parties.asm', .3)
    combates, grupo, coment = [], None, ''
    lineas = t.splitlines()
    i = 0
    while i < len(lineas):
        l = lineas[i]
        m = re.match(r'^(\w+)Group:', l)
        if m: grupo = m.group(1)
        m = re.match(r'^\s*;\s*(\w+)\s*\((\d+)\)', l)
        if m: coment = m.group(1) + ' ' + m.group(2)
        m = re.match(r'^\s*db\s+"([^"]*)@",\s*(TRAINERTYPE_\w+)', l)
        if m and grupo and INTERES.search(grupo):
            tipo = m.group(2); equipo = []
            i += 1
            while i < len(lineas) and not re.match(r'^\s*db\s+-1', lineas[i]):
                mm = re.match(r'^\s*db\s+(\d+),\s*(\w+)(?:,\s*(\w+))?(.*)$', lineas[i])
                if mm:
                    s = esp_const(mm.group(2))
                    movs = []
                    if 'MOVES' in tipo:
                        movs = [x.strip() for x in mm.group(0).split(',')[2 + ('ITEM' in tipo):] if x.strip() and x.strip() != 'NO_MOVE']
                    if s: equipo.append({'s': s, 'nv': int(mm.group(1)), 'mc': movs})
                i += 1
            if equipo:
                combates.append({'titulo': humano(grupo) + ' ' + coment.split(' ')[-1], 'entrenador': humano(grupo), 'nota': '', 'equipo': equipo})
        i += 1
    return combates

def pret_gen3(repo, jid):
    t = bajar(f'https://raw.githubusercontent.com/pret/{repo}/master/src/data/trainer_parties.h', .3)
    combates = []
    for m in re.finditer(r'(?:static )?const struct \w+ ((?:sParty|gTrainerParty)_\w+)\[\]\s*=\s*\{(.*?)\n\};', t, re.S):
        lbl, cuerpo = m.group(1), m.group(2)
        if not GEN3.search(lbl) or 'Wallace' in lbl: continue
        equipo = []
        for mon in re.finditer(r'\{(.*?)\}', cuerpo, re.S):
            c = mon.group(1)
            sp = re.search(r'\.species\s*=\s*(SPECIES_\w+)', c); nv = re.search(r'\.(?:lvl|level)\s*=\s*(\d+)', c)
            mv = re.search(r'\.moves\s*=\s*([^\n]*)', c)
            s = esp_const(sp.group(1)) if sp else None
            if s: equipo.append({'s': s, 'nv': int(nv.group(1)) if nv else 0, 'mc': re.findall(r'MOVE_(\w+)', mv.group(1)) if mv else []})
        if equipo:
            ent = humano(lbl).split(' ')[0]
            ent = {'Boss': 'Giovanni', 'Champion': 'Rival', 'Campeón': 'Rival', 'Brendan': 'Bruno', 'May': 'Aura', 'Wally': 'Blasco', 'Archie': 'Aquiles', 'Maxie': 'Magno',
                   'Matt': 'Matías', 'Shelly': 'Silvina', 'Tabitha': 'Tatiano', 'Courtney': 'Carola', 'Steven': 'Máximo'}.get(ent, ent)
            combates.append({'titulo': humano(lbl), 'entrenador': ent, 'nota': '', 'equipo': equipo})
    return combates
GEN3 = re.compile(r'^(?:sParty_|gTrainerParty_)(Rival|Brendan|May|Wally|Maxie|Archie|Tabitha|Matt(?![a-z])|Shelly|Courtney|Boss|Champion|Steven)')

mov_const = {}
for r in leer('moves'):
    mov_const[r['identifier'].upper().replace('-', '_')] = int(r['id'])
def mov_c(n):
    n = n.replace('MOVE_', '')
    return mov_const.get(n) or mov_const.get(n.replace('_', '')) or {'PSYCHIC_M': 94, 'SELFDESTRUCT': 120, 'DOUBLESLAP': 3, 'THUNDERPUNCH': 9, 'VICEGRIP': 11,
        'SAND_ATTACK': 28, 'HI_JUMP_KICK': 136, 'SOFTBOILED': 135, 'SMOKESCREEN': 108, 'FAINT_ATTACK': 185, 'ANCIENTPOWER': 246, 'DYNAMICPUNCH': 223, 'DRAGONBREATH': 225, 'EXTREMESPEED': 245}.get(n)

for repo, jid, f in [('pokered', '1', pret_gen1), ('pokeyellow', '2', pret_gen1), ('pokegold', '3', pret_gen2), ('pokecrystal', '4', pret_gen2),
                     ('pokeruby', '5', pret_gen3), ('pokeemerald', '6', pret_gen3), ('pokefirered', '7', pret_gen3)]:
    try:
        cs = f(repo, jid)
    except Exception as e:
        print('fallo', repo, e); cs = []
    for c in cs:
        for x in c['equipo']:
            x['pid'] = forma_pid(x['s'], '')
            x['m'] = [y for y in (mov_c(z) for z in x.pop('mc', [])) if y]
    # Agrupa por entrenador (Rival 1/2/3 del código = un solo rival)
    NOMBRES = {'Rival': 'Rival', 'Executive M': 'Ejecutivo del Team Rocket', 'Executive F': 'Ejecutiva del Team Rocket', 'Red': 'Rojo', 'Blue': 'Azul'}
    grupos = {}
    for c in cs:
        e = re.sub(r'\s*\d+$', '', c['entrenador'])
        c['entrenador'] = NOMBRES.get(e, e)
        grupos.setdefault(c['entrenador'], []).append(c)
    if f is not pret_gen3:
        # Inicial que elegiste según la línea evolutiva del inicial del rival
        ELIGE = {1: 'Squirtle', 4: 'Bulbasaur', 7: 'Charmander', 152: 'Totodile', 155: 'Chikorita', 158: 'Cyndaquil'} if jid != '2' else {}
        linea = lambda s: next((b for b in ELIGE if b <= s <= b + 2), None)
        for g, l in grupos.items():
            for k, c in enumerate(l):
                trio = g == 'Rival' and len(l) % 3 == 0 and jid != '2'
                c['titulo'] = f'Combate {k // 3 + 1}' if trio else f'Combate {k + 1}'
                lin = next((linea(x['s']) for x in reversed(c['equipo']) if linea(x['s'])), None)
                if g == 'Rival' and lin: c['nota'] = 'Si elegiste a ' + ELIGE[lin]
    print(repo, len(cs), list(grupos)[:20])
    if grupos:
        rivales[jid] = [{'grupo': g, 'fuente': 'pret', 'combates': l} for g, l in grupos.items()]

with open(os.path.join(APP, 'rivales.js'), 'w', encoding='utf-8') as f:
    f.write('// Rivales y jefes villanos: Serebii (gen 4+) y desensamblados de pret (gen 1-3). Generado con herramientas/rivales_objetos.py\nwindow.RIVALES=')
    json.dump(rivales, f, ensure_ascii=False, separators=(',', ':')); f.write(';\n')
print('hecho')
