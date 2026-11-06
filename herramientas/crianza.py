"""Genera crianza.js: grupos huevo, ciclos de eclosión, ratio de sexo, ratio de captura y naturalezas (PokeAPI, CSV).
Uso: python herramientas/crianza.py <carpeta_csv>
"""
import csv, json, os, sys

CSV = sys.argv[1]
APP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
leer = lambda f: list(csv.DictReader(open(os.path.join(CSV, f + '.csv'), encoding='utf-8')))

grupos = {r['egg_group_id']: r['name'] for r in leer('egg_group_prose') if r['local_language_id'] == '7'}
por_esp = {}
for r in leer('pokemon_egg_groups'):
    por_esp.setdefault(r['species_id'], []).append(int(r['egg_group_id']))
esp = {}
for r in leer('pokemon_species'):
    esp[r['id']] = [por_esp.get(r['id'], []), int(r['hatch_counter'] or 0), int(r['gender_rate']), int(r['capture_rate'] or 0)]
nombres = {r['nature_id']: r['name'] for r in leer('nature_names') if r['local_language_id'] == '7'}
nat = []
for r in sorted(leer('natures'), key=lambda r: int(r['game_index'])):
    sube, baja = int(r['increased_stat_id']) - 1, int(r['decreased_stat_id']) - 1
    nat.append([nombres[r['id']], sube if sube != baja else 0, baja if sube != baja else 0])

with open(os.path.join(APP, 'crianza.js'), 'w', encoding='utf-8') as f:
    f.write('// Grupos huevo, ciclos de eclosión, sexo, captura y naturalezas (PokeAPI). Generado con herramientas/crianza.py\n')
    f.write('window.CRIANZA=')
    json.dump({'grupos': grupos, 'e': esp, 'nat': nat}, f, ensure_ascii=False, separators=(',', ':'))
    f.write(';\n')
print(len(esp), 'especies,', len(nat), 'naturalezas,', grupos)
