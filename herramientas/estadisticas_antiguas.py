"""Genera estadisticas_antiguas.js: estadísticas base que cambiaron entre generaciones (PokeAPI, pokemon_stats_past.csv).
Cada entrada [gen, estadística, valor] vale para esa generación y las anteriores. Estadística 0-5 (PS..Velocidad) o 'E' (Especial de la 1.ª gen).
Uso: python herramientas/estadisticas_antiguas.py <carpeta_csv>
"""
import csv, json, os, sys
CSV = sys.argv[1]
APP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
past = {}
for r in csv.DictReader(open(os.path.join(CSV, 'pokemon_stats_past.csv'), encoding='utf-8')):
    s = int(r['stat_id'])
    past.setdefault(r['pokemon_id'], []).append([int(r['generation_id']), 'E' if s == 9 else s - 1, int(r['base_stat'])])
with open(os.path.join(APP, 'estadisticas_antiguas.js'), 'w', encoding='utf-8') as f:
    f.write('// Estadísticas base antiguas (PokeAPI). Generado con herramientas/estadisticas_antiguas.py\nwindow.STATS_PAST=')
    json.dump(past, f, separators=(',', ':'))
    f.write(';\n')
print(len(past), 'Pokémon con cambios')
