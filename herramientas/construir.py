import csv, json, sys, os
from collections import defaultdict

D = sys.argv[1]
SALIDA = sys.argv[2]
ES, EN = '7', '9'

def leer(n):
    with open(os.path.join(D, n + '.csv'), encoding='utf-8') as f:
        return list(csv.DictReader(f))

tipos = {r['id']: r['identifier'] for r in leer('types') if int(r['id']) <= 18}

vg = {r['id']: r for r in leer('version_groups')}
versiones = leer('versions')
vnames = defaultdict(dict)
for r in leer('version_names'):
    vnames[r['version_id']][r['local_language_id']] = r['name']

dex_vg = defaultdict(list)
for r in leer('pokedex_version_groups'):
    dex_vg[r['version_group_id']].append(r['pokedex_id'])

dexnum = defaultdict(list)
for r in leer('pokemon_dex_numbers'):
    dexnum[r['pokedex_id']].append((int(r['pokedex_number']), int(r['species_id'])))
for k in dexnum:
    dexnum[k].sort()

especies = {}
for r in leer('pokemon_species'):
    especies[int(r['id'])] = {'g': int(r['generation_id']), 'n': r['identifier']}
for r in leer('pokemon_species_names'):
    sid = int(r['pokemon_species_id'])
    if r['local_language_id'] == ES and r['name']:
        especies[sid]['n'] = r['name']

# Juegos: (nombre del grupo, version groups que suman Pokédex, nacional, megas)
JUEGOS = [
    ('1', ['1'], True, False),
    ('2', ['2'], True, False),
    ('3', ['3'], True, False),
    ('4', ['4'], True, False),
    ('5', ['5'], True, False),
    ('6', ['6'], True, False),
    ('7', ['7'], True, False),
    ('8', ['8'], True, False),
    ('9', ['9'], True, False),
    ('10', ['10'], True, False),
    ('11', ['11'], True, False),
    ('14', ['14'], True, False),
    ('15', ['15'], True, True),
    ('16', ['16'], True, True),
    ('17', ['17'], True, True),
    ('18', ['18'], True, True),
    ('19', ['19'], False, True),
    ('20', ['20', '21', '22'], False, False),
    ('23', ['23'], True, False),
    ('24', ['24'], False, False),
    ('25', ['25', '26', '27'], False, False),
    ('30', ['30', '31'], False, True),
    ('32', ['32'], False, True),
]
EXTRA = {'20': ' (+ La isla de la armadura y Las nieves de la corona)',
         '25': ' (+ El tesoro oculto del área Cero)',
         '30': ' (+ Megadimensión)'}

def nombre_vg(vid):
    ns = [vnames[v['id']].get(ES) or vnames[v['id']].get(EN) or v['identifier']
          for v in versiones if v['version_group_id'] == vid]
    return ' / '.join(ns)

juegos = []
for vid, grupos, nac, megas in JUEGOS:
    lista, vistos = [], set()
    for g in grupos:
        for dx in dex_vg[g]:
            for num, sid in dexnum[dx]:
                if sid not in vistos:
                    vistos.add(sid)
                    lista.append([sid, num])
    gen = int(vg[vid]['generation_id'])
    nacional = []
    if nac:
        tope = {'17': 807, '18': 807, '23': 493}.get(vid, 99999)
        nacional = [s for s in sorted(especies) if especies[s]['g'] <= gen and s <= tope]
    nombre = nombre_vg(vid) + EXTRA.get(vid, '')
    if vid == '32':
        nombre = 'Pokémon Champions'
    juegos.append({'id': vid, 'nombre': nombre, 'gen': gen,
                   'orden': int(vg[vid]['order']), 'dex': lista,
                   'nacional': nacional, 'megas': megas})

# Pokémon (variantes) y tipos
tipos_act = defaultdict(list)
for r in leer('pokemon_types'):
    tipos_act[r['pokemon_id']].append((int(r['slot']), tipos.get(r['type_id'])))
tipos_past = defaultdict(lambda: defaultdict(list))
for r in leer('pokemon_types_past'):
    if r['type_id'] in tipos:
        tipos_past[r['pokemon_id']][int(r['generation_id'])].append((int(r['slot']), tipos[r['type_id']]))

formas = {}
for r in leer('pokemon_forms'):
    if r['is_default'] == '1':
        formas[r['pokemon_id']] = r
fnames = {}
for r in leer('pokemon_form_names'):
    if r['local_language_id'] == ES and r['form_name']:
        fnames[r['pokemon_form_id']] = r['form_name']
    elif r['local_language_id'] == EN and r['form_name']:
        fnames.setdefault(r['pokemon_form_id'], r['form_name'])

def ordenar(l):
    return [t for _, t in sorted(l) if t]

pokes = []
for r in leer('pokemon'):
    pid = r['id']
    sid = int(r['species_id'])
    if sid not in especies:
        continue
    act = ordenar(tipos_act[pid])
    pasado = [[g, ordenar(l)] for g, l in sorted(tipos_past[pid].items())]
    fo = formas.get(pid)
    intro = int(vg[fo['introduced_in_version_group_id']]['order']) if fo and fo['introduced_in_version_group_id'] in vg else 0
    pokes.append({'id': int(pid), 's': sid, 'd': r['is_default'] == '1',
                  'f': fnames.get(fo['id'], '') if fo else '',
                  'fi': fo['form_identifier'] if fo else '',
                  't': act, 'p': pasado, 'i': intro,
                  'm': bool(fo and fo['is_mega'] == '1')})

# Solo formas alternativas cuyos tipos difieran de la forma por defecto
defecto = {p['s']: p for p in pokes if p['d']}
def firma(p):
    return json.dumps([p['t'], p['p']])
filtrados = [p for p in pokes if p['d'] or (p['s'] in defecto and firma(p) != firma(defecto[p['s']]))]
# quitar Gigamax / totem / duplicados del mismo tipo
filtrados = [p for p in filtrados if p['d'] or ('gmax' not in p['fi'] and 'totem' not in p['fi'])]
for p in filtrados:
    del p['fi']

datos = {'juegos': juegos,
         'especies': {s: v for s, v in especies.items()},
         'pokemon': filtrados}
with open(SALIDA, 'w', encoding='utf-8') as f:
    f.write('window.DATOS = ')
    json.dump(datos, f, ensure_ascii=False, separators=(',', ':'))
    f.write(';\n')
print('juegos', len(juegos), 'especies', len(especies), 'pokemon', len(filtrados))
for j in juegos:
    print(j['id'], j['nombre'], 'gen', j['gen'], 'regional', len(j['dex']), 'nacional', len(j['nacional']))
