// PokéGuía: Mi partida (ruta, zonas, me faltan, progreso, copia), Herramientas (daño, comparador,
// naturalezas/IV/EV, buscador de movimientos, crianza, quiz) y "tu equipo contra el líder".
(function () {
const CR = window.CRIANZA || {grupos: {}, e: {}, nat: []};
const MV = () => window.MOVS || {};
const juegoDe = id => D.juegos.find(j => j.id === id);
const genDe = j => +j.gen;
const base = s => (POR_ESPECIE[s] || []).find(x => x.d) || (POR_ESPECIE[s] || [])[0];
const mini = (p, extra = '') => `<img class="mini-sp" src="${sprite(p.id)}" alt="" loading="lazy"${extra}>`;
const pct = v => (Math.round(v * 10) / 10).toLocaleString('es-ES');
const leerLS = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } };
const guardarLS = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const mult = (t, a, d) => t[a] && t[a][d] !== undefined ? t[a][d] : 1;

function rellenar(sel, conCambio) {
  [...D.juegos].sort((a, b) => b.orden - a.orden).forEach(j => { const o = document.createElement('option'); o.value = j.id; o.textContent = `${j.nombre} — Gen ${j.gen}`; sel.appendChild(o); });
  sel.addEventListener('change', conCambio);
}
function pestanas(id, alCambiar) {
  const caja = $(id);
  caja.querySelectorAll('button').forEach(b => b.onclick = () => {
    caja.querySelectorAll('button').forEach(x => x.classList.toggle('activa', x === b));
    alCambiar(b.dataset.s);
  });
  return () => caja.querySelector('.activa').dataset.s;
}

// ---------- Fórmulas ----------
function statReal(b, i, nv, iv = 31, ev = 0, nat = 1) {
  const n = Math.floor((2 * b + iv + Math.floor(ev / 4)) * nv / 100);
  if (i === 0) return b === 1 ? 1 : n + nv + 10;
  return Math.floor((n + 5) * nat);
}
const FISICOS = new Set(['normal', 'fighting', 'flying', 'poison', 'ground', 'rock', 'bug', 'ghost', 'steel']);
// mov = [nombre, tipo, categoría, potencia]
function calcDano(pa, pd, nva, nvd, mov, gen, opc = {}) {
  if (!mov || !mov[3] || mov[2] === 'estado') return null;
  const {t} = tablaGen(gen);
  if (!t[mov[1]]) return null;
  const sa = X.stats[pa.id] && statsEn(pa.id, gen), sd = X.stats[pd.id] && statsEn(pd.id, gen);
  if (!sa || !sd) return null;
  const fis = gen <= 3 ? FISICOS.has(mov[1]) : mov[2] === 'físico';
  const ia = fis ? 1 : 3, id = fis ? 2 : (gen === 1 ? 3 : 4);
  const A = statReal(sa[ia], ia, nva, 31, opc.eva || 0, opc.nata || 1);
  const Df = statReal(sd[id], id, nvd, 31, opc.evd || 0, opc.natd || 1);
  const HP = statReal(sd[0], 0, nvd, 31, opc.evps || 0);
  const ef = tiposEnGen(pd, gen).reduce((x, d) => x * mult(t, mov[1], d), 1);
  const stab = tiposEnGen(pa, gen).includes(mov[1]) ? 1.5 : 1;
  const b = Math.floor(Math.floor(Math.floor(2 * nva / 5 + 2) * mov[3] * A / Df) / 50) + 2;
  const max = ef ? Math.max(1, Math.floor(b * stab * ef)) : 0, min = ef ? Math.max(1, Math.floor(Math.floor(b * .85) * stab * ef)) : 0;
  return {min, max, hp: HP, ef, stab, fis, pmin: min / HP * 100, pmax: max / HP * 100,
    golpes: max ? [Math.ceil(HP / max), Math.ceil(HP / min)] : [Infinity, Infinity]};
}
const textoEf = e => e === 0 ? 'No le afecta' : e >= 4 ? '¡Superefectivo ×4!' : e >= 2 ? 'Es muy eficaz (×2)' : e === 1 ? 'Daño normal (×1)' : e <= .25 ? 'Muy poco eficaz (×¼)' : 'No es muy eficaz (×½)';
const textoGolpes = g => !isFinite(g[0]) ? 'No hace daño' : g[0] === g[1] ? (g[0] === 1 ? 'Lo debilita de un golpe' : `${g[0]} golpes`) : `${g[0]}–${g[1]} golpes`;
function aprende(mp, nivel, conMT = true) {   // movimientos que puede conocer a ese nivel (nivel y, si se pide, MT/MO y tutor)
  if (!mp) return [];
  const s = new Set();
  (mp.n || []).forEach(([l, m]) => { if (l <= nivel) s.add(m); });
  if (conMT) {
    (mp.m || []).forEach(([, m]) => s.add(m));
    (mp.t || []).forEach(m => s.add(Array.isArray(m) ? m[1] : m));
  }
  return [...s];
}
// Lo que sabe un Pokémon de un entrenador: los 4 últimos movimientos aprendidos por nivel
function ultimos4(mp, nivel) {
  if (!mp || !mp.n) return [];
  const l = [];
  for (const [nv, m] of [...mp.n].sort((a, b) => a[0] - b[0])) if (nv <= nivel) { const i = l.indexOf(m); if (i >= 0) l.splice(i, 1); l.push(m); }
  return l.slice(-4);
}
const setPoke = (mj, p) => mj && mj.p && (mj.p[p.id] || mj.p[(base(p.s) || {}).id]);

// ===================== TU EQUIPO CONTRA EL LÍDER =====================
window.liderVsEquipo = async function (j, l, cajaDada, titulo = 'Tu equipo contra este líder') {
  const caja = cajaDada || $('vsEquipo'); if (!caja) return;
  const gen = genDe(j), eq = leerEquipo(j.id).map(id => D.pokemon.find(p => p.id === id)).filter(Boolean);
  const marca = j.id + '|' + l.n; caja.dataset.m = marca;
  if (!eq.length) {
    caja.innerHTML = `<h3>${titulo}</h3><p class="vacio">Guarda tu equipo de ${esc(j.nombre)} en «Mi equipo» y aquí verás qué Pokémon sacar contra cada uno y con qué movimiento.</p>`;
    return;
  }
  const mj = await cargarMovs(j.id);
  if (caja.dataset.m !== marca) return;
  const nvMax = Math.max(...l.equipo.map(m => m.nv || 0)) || 50;
  const clave = 'pokeguia.nivelEq.' + j.id;
  const nvEq = leerLS(clave, nvMax), conMT = leerLS('pokeguia.mtEq', false);
  const filas = l.equipo.map(m => {
    const rival = D.pokemon.find(p => p.id === m.pid); if (!rival) return '';
    const nvR = m.nv || nvMax;
    const movsRival = (m.m && m.m.length ? m.m : ultimos4(setPoke(mj, rival), nvR)).map(id => MV()[id]).filter(v => v && v[3] && v[2] !== 'estado');
    const opciones = eq.map(p => {
      const movs = aprende(setPoke(mj, p), nvEq, conMT);
      let mejor = null;
      for (const mid of movs) { const mv = MV()[mid]; const r = calcDano(p, rival, nvEq, nvR, mv, gen);
        if (r && (!mejor || r.pmax + r.pmin > mejor.r.pmax + mejor.r.pmin)) mejor = {r, mv}; }
      if (!mejor) {   // sin datos de movimientos: un ataque de 80 de su tipo
        for (const tp of tiposEnGen(p, gen)) { const mv = ['Ataque de tipo ' + NOMBRE[tp], tp, X.stats[p.id] && X.stats[p.id][1] >= X.stats[p.id][3] ? 'físico' : 'especial', 80];
          const r = calcDano(p, rival, nvEq, nvR, mv, gen); if (r && (!mejor || r.pmax > mejor.r.pmax)) mejor = {r, mv, aprox: true}; }
      }
      // Peligro: sus movimientos a ese nivel; sin datos, un ataque de 80 de potencia de su tipo
      let peligro = 0, movP = null;
      const cands = movsRival.length ? movsRival : tiposEnGen(rival, gen).flatMap(tp => [['ataque de tipo ' + NOMBRE[tp], tp, 'físico', 80], ['ataque de tipo ' + NOMBRE[tp], tp, 'especial', 80]]);
      for (const mv of cands) { const r = calcDano(rival, p, nvR, nvEq, mv, gen); if (r && r.pmax > peligro) { peligro = r.pmax; movP = mv[0]; } }
      return {p, mejor, peligro, movP};
    }).filter(o => o.mejor);
    if (!opciones.length) return '';
    opciones.sort((a, b) => (b.mejor.r.pmax - b.peligro * .35) - (a.mejor.r.pmax - a.peligro * .35));
    const o = opciones[0], peor = [...opciones].sort((a, b) => b.peligro - a.peligro)[0];
    return `<div class="vs-fila">
      <div class="vs-rival">${mini(rival)}<div><b>${esc(nombrePoke(rival))}</b><small class="vacio">Nv. ${nvR}${movsRival.length ? ' · ' + movsRival.map(v => esc(v[0])).join(', ') : ''}</small></div></div>
      <div class="vs-mejor">${mini(o.p)}<div><b>${esc(nombrePoke(o.p))}</b> con <b>${esc(o.mejor.mv[0])}</b> ${chip(o.mejor.mv[1])}
        <small>${pct(o.mejor.r.pmin)}–${pct(o.mejor.r.pmax)} % · ${textoGolpes(o.mejor.r.golpes)}${o.mejor.aprox ? ' · estimado' : ''}</small>
        <div class="barra-dano"><i style="width:${Math.min(100, o.mejor.r.pmax)}%"></i></div></div></div>
      <div class="vs-peligro ${peor.peligro >= 50 ? 'alto' : ''}">${peor.peligro >= 35 ? `⚠ Cuidado con <b>${esc(nombrePoke(peor.p))}</b>: ${esc(peor.movP)} le quita hasta ${pct(peor.peligro)} %` : '<span class="vacio">Ningún miembro corre mucho peligro</span>'}</div>
    </div>`;
  }).join('');
  const uid = 'v' + Math.random().toString(36).slice(2, 8);
  caja.innerHTML = `<h3>${titulo}</h3>
    <div class="opciones" style="margin-bottom:10px"><span><label for="nv${uid}">Nivel de tu equipo</label> <input id="nv${uid}" type="number" min="1" max="100" value="${nvEq}" class="num-in nvEq"></span>
    <span><input type="checkbox" id="mt${uid}" class="mtEq" ${conMT ? 'checked' : ''}> <label for="mt${uid}">Contar MT y tutores</label></span>
    <span class="vacio">Equipo: ${eq.map(p => esc(nombrePoke(p))).join(', ')}</span></div>
    ${filas || '<p class="vacio">No hay datos suficientes.</p>'}
    <p class="nota">Daño con la fórmula oficial (IV 31, sin EV, naturaleza neutra, sin objetos, habilidades ni clima). Tus movimientos: los que aprende por nivel hasta el nivel indicado${conMT ? ', más MT y tutores' : ''}. Los del rival: ${l.equipo.some(m => m.m && m.m.length) ? 'los que lleva en el juego' : 'sus 4 últimos movimientos por nivel (los equipos reales pueden variar)'}.</p>`;
  caja.querySelector('.nvEq').onchange = e => { guardarLS(clave, Math.max(1, Math.min(100, +e.target.value || nvMax))); liderVsEquipo(j, l, cajaDada, titulo); };
  caja.querySelector('.mtEq').onchange = e => { guardarLS('pokeguia.mtEq', e.target.checked); liderVsEquipo(j, l, cajaDada, titulo); };
};

// ===================== MI PARTIDA =====================
let subPart = 'ruta';
const jPart = () => juegoDe($('juegoPart').value);
function pintarPart() { $('contPart').dataset.m = 'p' + Math.random(); const f = {ruta, zonas, faltan, progreso, copia}[subPart] || (window.PART_EXTRA || {})[subPart]; if (f) f(jPart()); }

function sinDatos(j) { $('contPart').innerHTML = `<div class="extra"><p class="vacio">No hay datos de Pokémon salvajes para ${esc(j.nombre)}.</p></div>`; }
function nivelesLugar(u) {
  // Nivel típico de cada zona: los encuentros a pie; si solo hay pesca/surf, el nivel máximo (se llega más tarde)
  const especial = /Caña|Surf|agua|Buceo|Pesca|Errante|regalo|Huevo|Intercambio|Incursión|Grutas|Aventura|Escáner|Colosseum|channel|ranger|Cabezazo|Golpe Roca|Evento|Poké Flauta|Detector|Regadera/i;
  const niv = {}, resto = {};
  for (const encs of Object.values(u.p)) for (const e of encs) {
    if (!e[2]) continue;
    if (especial.test(e[1])) { if (!/regalo|Huevo|Intercambio|Colosseum|channel|ranger/i.test(e[1])) (resto[e[0]] ||= []).push(e[3] || e[2]); }
    else (niv[e[0]] ||= []).push(e[2]);
  }
  const med = {};
  for (const [l, v] of Object.entries(niv)) { v.sort((a, b) => a - b); med[l] = v[Math.floor(v.length / 2)]; }
  for (const [l, v] of Object.entries(resto)) if (!niv[l]) med[l] = Math.max(...v);   // solo pesca/surf: se llega con la mejor caña
  return med;
}

// Pasos de la partida: cada gimnasio (con el nivel de su Pokémon más fuerte), la Liga y después
function pasosRuta(j, u) {
  const med = nivelesLugar(u);
  const gims = (G[j.id] || []).filter(g => g.tipo === 'gym' || g.tipo === 'kahuna');
  const liga = (G[j.id] || []).filter(g => g.tipo === 'elite4' || g.tipo === 'champion');
  const as = g => Math.max(...g.lideres[0].equipo.map(m => m.nv || 0));
  const pasos = gims.map(g => ({g, nv: as(g)}));
  if (liga.length) pasos.push({liga, nv: Math.max(...liga.map(as))});
  pasos.push({fin: true, nv: Infinity});
  // Cada lugar va al primer paso cuyo nivel supera claramente a sus Pokémon salvajes
  // Una ciudad con gimnasio va en el paso de su gimnasio
  const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  const pasoCiudad = {};
  pasos.forEach((p, i) => { if (p.g) pasoCiudad[norm(p.g.lugar)] ??= i; });
  const lugaresPaso = pasos.map(() => []);
  for (const [l, n] of Object.entries(med)) {
    const nom = norm(u.locs[l] && u.locs[l][0]);
    let i = nom in pasoCiudad ? pasoCiudad[nom] : pasos.findIndex(p => n <= p.nv * .78);
    lugaresPaso[i < 0 ? pasos.length - 1 : i].push(+l);
  }
  return {med, pasos, lugaresPaso};
}

// ---- Ruta del juego ----
async function ruta(j) {
  const cont = $('contPart'); cont.dataset.m = 'ruta' + j.id;
  const u = await cargarUbic(j.id);
  if (cont.dataset.m !== 'ruta' + j.id) return;
  if (!u) return sinDatos(j);
  const cap = capturados(j.id);
  const {med, pasos, lugaresPaso} = pasosRuta(j, u);
  // Pokémon nuevos de cada paso
  const pidsLugar = {};
  for (const [pid, encs] of Object.entries(u.p)) for (const e of encs) (pidsLugar[e[0]] ||= new Set()).add(+pid);
  const vistos = new Set();
  const html = pasos.map((p, i) => {
    const ls = lugaresPaso[i].sort((a, b) => med[a] - med[b]);
    const nuevos = [];
    for (const l of ls) for (const pid of pidsLugar[l] || []) {
      const pk = D.pokemon.find(x => x.id === pid); if (!pk || vistos.has(pk.s)) continue;
      vistos.add(pk.s); nuevos.push(pk);
    }
    if (p.fin && !ls.length) return '';
    let cab;
    if (p.g) {
      const l = p.g.lideres[0], ob = obediencia(j.id, p.g);
      cab = `<div class="ruta-gim" style="--c:${COLOR[l.tipo] || '#9fa19f'}"><img src="${l.img}" alt="" loading="lazy" onerror="this.onerror=null;this.src='${fotoShowdown(l)}'">
        <div><small>${p.g.tipo === 'kahuna' ? 'Gran Prueba' : 'Gimnasio'} ${p.g.num} · ${esc(p.g.lugar)}</small><b>${esc(l.n)}</b> ${chip(l.tipo)}
        <small>Su Pokémon más fuerte: Nv. ${p.nv}${ob && ob.despues > ob.antes ? ` · después te obedecen hasta ${nivelTxt(ob.despues)}` : ''}</small></div></div>`;
    } else if (p.liga) cab = `<div class="ruta-gim" style="--c:#c9a227"><div><small>Final</small><b>Liga Pokémon</b><small>Alto Mando y Campeón · hasta Nv. ${p.nv}</small></div></div>`;
    else cab = `<div class="ruta-gim" style="--c:#6b7185"><div><small>Después</small><b>Zonas de nivel alto y posliga</b></div></div>`;
    const faltan = nuevos.filter(pk => !cap.has(pk.s)).length;
    return `<div class="ruta-paso"><div class="ruta-num">${i + 1}</div><div class="ruta-cuerpo">
      <h3>${p.g ? (p.g.tipo === 'kahuna' ? 'Antes de la Gran Prueba ' : 'Antes del gimnasio ') + p.g.num : p.liga ? 'Camino a la Liga' : 'Después de la Liga'}</h3>
      ${ls.length ? `<div class="chips ruta-lugares">${ls.map(l => `<button class="lugar-chip" data-l="${l}">${esc(u.locs[l] ? u.locs[l][0] : l)} <small>Nv. ~${med[l]}</small></button>`).join('')}</div>` : '<p class="vacio">Sin zonas nuevas con Pokémon salvajes.</p>'}
      ${nuevos.length ? `<div class="seccion" style="margin-top:10px">Pokémon nuevos (${nuevos.length}${faltan ? `, te faltan ${faltan}` : ', ¡los tienes todos!'})</div>
        <div class="minis">${nuevos.map(pk => `<button class="mini-b ${cap.has(pk.s) ? 'cap' : ''}" data-pid="${pk.id}" title="${esc(nombrePoke(pk))}">${mini(pk)}</button>`).join('')}</div>` : ''}
      ${cab}</div></div>`;
  }).join('');
  cont.innerHTML = `<div class="extra"><h2 class="titulo-grupo" style="margin-top:0">Ruta de ${esc(j.nombre)}</h2>
    <p class="nota" style="margin-top:0">Orden aproximado: cada zona se coloca antes del primer gimnasio cuyo nivel supera al de sus Pokémon salvajes. Pulsa una zona para ver qué sale allí o un Pokémon para ver su ficha.</p>
    <div class="ruta">${html}</div></div>`;
  enlacesComunes(cont, j);
}
function enlacesComunes(cont, j) {
  cont.querySelectorAll('[data-pid]').forEach(b => b.onclick = () => irAPokemon(j.id, +b.dataset.pid));
  cont.querySelectorAll('.lugar-chip').forEach(b => b.onclick = () => { zonaSel = b.dataset.l; $('subPart').querySelector('[data-s=zonas]').click(); });
}

// ---- Pokédex por zonas ----
let zonaSel = null;
async function zonas(j) {
  const cont = $('contPart'); cont.dataset.m = 'zonas' + j.id;
  const u = await cargarUbic(j.id);
  if (cont.dataset.m !== 'zonas' + j.id) return;
  if (!u) return sinDatos(j);
  const porLugar = {};
  for (const [pid, encs] of Object.entries(u.p)) for (const e of encs) (porLugar[e[0]] ||= []).push([+pid, e]);
  const ids = Object.keys(porLugar).sort((a, b) => (u.locs[a] ? u.locs[a][0] : a).localeCompare(u.locs[b] ? u.locs[b][0] : b, 'es', {numeric: true}));
  if (!ids.includes(String(zonaSel))) zonaSel = ids[0];
  const cap = capturados(j.id);
  const lista = porLugar[zonaSel] || [];
  const agr = new Map();
  for (const [pid, e] of lista) {
    const k = pid; if (!agr.has(k)) agr.set(k, []); agr.get(k).push(e);
  }
  const filas = [...agr.entries()].map(([pid, es]) => {
    const pk = D.pokemon.find(x => x.id === pid); if (!pk) return '';
    const met = [...new Set(es.map(e => e[1]))].join(', ');
    const nmin = Math.min(...es.map(e => e[2] || 0)), nmax = Math.max(...es.map(e => e[3] || e[2] || 0));
    const prob = es.map(e => e[6]).filter(x => x).reduce((a, b) => Math.max(a, b), 0);
    const vers = [...new Set(es.flatMap(e => e[4] || []))].join(', ');
    const cond = [...new Set(es.flatMap(e => e[5] || []))].join(', ');
    return `<tr class="${cap.has(pk.s) ? 'cap' : ''}"><td><input type="checkbox" data-cap="${pk.s}" ${cap.has(pk.s) ? 'checked' : ''} aria-label="Capturado"></td>
      <td><button class="enlace" data-pid="${pk.id}">${mini(pk)} ${esc(nombrePoke(pk))}</button></td>
      <td>${tiposEnGen(pk, genDe(j)).map(t => chip(t)).join(' ')}</td><td>${esc(met)}${cond ? `<br><small class="vacio">${esc(cond)}</small>` : ''}</td>
      <td>${nmin ? (nmin === nmax ? nmin : nmin + '–' + nmax) : '—'}</td><td>${prob ? prob + ' %' : '—'}</td><td>${esc(vers) || '<span class="vacio">Todas</span>'}</td></tr>`;
  }).join('');
  const n = agr.size, c = [...agr.keys()].filter(pid => { const pk = D.pokemon.find(x => x.id === pid); return pk && cap.has(pk.s); }).length;
  cont.innerHTML = `<div class="extra">
    <div class="fila-ctrl"><div style="flex:1;min-width:220px"><label for="zonaSel" class="etq-ctrl">Zona</label>
      <select id="zonaSel">${ids.map(id => `<option value="${id}" ${id === String(zonaSel) ? 'selected' : ''}>${esc(u.locs[id] ? u.locs[id][0] : id)} (${new Set(porLugar[id].map(x => x[0])).size})</option>`).join('')}</select></div>
      <div class="contador">${c} de ${n} capturados</div></div>
    <div class="tabla-mov-caja"><table class="tabla-zona"><thead><tr><th>✔</th><th>Pokémon</th><th>Tipo</th><th>Cómo</th><th>Nivel</th><th>Prob.</th><th>Edición</th></tr></thead><tbody>${filas}</tbody></table></div>
    <p class="nota">Marca la casilla para apuntarlo como capturado (se guarda igual que en la ficha del Pokémon).</p></div>`;
  $('zonaSel').onchange = e => { zonaSel = e.target.value; zonas(j); };
  cont.querySelectorAll('[data-cap]').forEach(x => x.onchange = () => { marcarCapturado(j.id, +x.dataset.cap, x.checked); zonas(j); });
  enlacesComunes(cont, j);
}

// ---- Me faltan ----
function especiesJuego(j) {
  const ent = j.nacional.length && $('nacional').checked ? j.nacional : j.dex.map(x => x[0]);
  return [...new Set(ent)].filter(s => D.especies[s]);
}
async function faltan(j) {
  const cont = $('contPart'); cont.dataset.m = 'faltan' + j.id;
  const u = await cargarUbic(j.id);
  if (cont.dataset.m !== 'faltan' + j.id) return;
  const cap = capturados(j.id), esp = especiesJuego(j), faltanS = esp.filter(s => !cap.has(s));
  if (!faltanS.length) { cont.innerHTML = `<div class="extra"><h2 class="titulo-grupo" style="margin-top:0">¡Pokédex completa!</h2><p>Tienes los ${esp.length} Pokémon de ${esc(j.nombre)}.</p></div>`; return; }
  const porLugar = {}, conLugar = new Set();
  if (u) for (const [pid, encs] of Object.entries(u.p)) {
    const pk = D.pokemon.find(x => x.id === +pid); if (!pk || cap.has(pk.s) || !faltanS.includes(pk.s)) continue;
    for (const e of encs) { (porLugar[e[0]] ||= new Map()).set(pk.s, pk); conLugar.add(pk.s); }
  }
  const lugares = Object.entries(porLugar).sort((a, b) => b[1].size - a[1].size);
  const sinLugar = faltanS.filter(s => !conLugar.has(s));
  // Para los que no salen en estado salvaje, ¿de qué se evolucionan?
  const nota = s => { const e = X.evo[s]; return e && e.de ? 'Evoluciona de ' + D.especies[e.de].n : 'Intercambio, evento o no disponible'; };
  cont.innerHTML = `<div class="extra"><h2 class="titulo-grupo" style="margin-top:0">Te faltan ${faltanS.length} de ${esp.length}</h2>
    <p class="nota" style="margin-top:0">Zonas ordenadas por cuántos Pokémon que te faltan puedes encontrar en ellas.</p>
    <div class="zonas-grid">${lugares.map(([l, m]) => `<div class="zona-card"><button class="lugar-chip" data-l="${l}"><b>${esc(u.locs[l] ? u.locs[l][0] : l)}</b> <span class="contador">${m.size}</span></button>
      <div class="minis">${[...m.values()].map(pk => `<button class="mini-b" data-pid="${pk.id}" title="${esc(nombrePoke(pk))}">${mini(pk)}</button>`).join('')}</div></div>`).join('')}</div>
    ${sinLugar.length ? `<h3 style="margin-top:18px">Sin encuentros en estado salvaje (${sinLugar.length})</h3>
      <div class="sin-lugar">${sinLugar.map(s => { const pk = base(s); return pk ? `<button class="enlace" data-pid="${pk.id}">${mini(pk)} <span><b>${esc(D.especies[s].n)}</b><small class="vacio">${esc(nota(s))}</small></span></button>` : ''; }).join('')}</div>` : ''}
    </div>`;
  enlacesComunes(cont, j);
}

// ---- Progreso ----
function progreso(j) {
  const gen = genDe(j), cap = capturados(j.id), esp = especiesJuego(j);
  const c = esp.filter(s => cap.has(s)).length, total = esp.length || 1, p = c / total * 100;
  const barras = (grupos) => grupos.map(([nom, color, tot, hechos]) => `<div class="prog-fila"><span>${nom}</span>
    <div class="barra"><i style="width:${tot ? hechos / tot * 100 : 0}%;background:${color}"></i></div><b>${hechos}/${tot}</b></div>`).join('');
  const {tipos} = tablaGen(gen);
  const porTipo = tipos.map(t => { const l = esp.filter(s => { const pk = base(s); return pk && tiposEnGen(pk, gen).includes(t); });
    return [chip(t), COLOR[t], l.length, l.filter(s => cap.has(s)).length]; }).filter(x => x[2]);
  const gens = [...new Set(esp.map(s => D.especies[s].g))].sort((a, b) => a - b);
  const porGen = gens.map(g => { const l = esp.filter(s => D.especies[s].g === g); return [`Gen ${g}`, 'var(--acento)', l.length, l.filter(s => cap.has(s)).length]; });
  const juegos = [...D.juegos].sort((a, b) => b.orden - a.orden).map(x => {
    const cx = capturados(x.id); if (!cx.size) return null;
    const ex = [...new Set(x.dex.map(d => d[0]))]; return [x, cx.size, ex.length];
  }).filter(Boolean);
  $('contPart').innerHTML = `<div class="extra prog-cab">
      <div class="anillo" style="--p:${p}"><b>${Math.round(p)} %</b><small>${c} / ${esp.length}</small></div>
      <div><h2 class="titulo-grupo" style="margin-top:0">${esc(j.nombre)}</h2>
      <p>${c === esp.length ? '¡Pokédex completa!' : `Te faltan <b>${esp.length - c}</b> Pokémon.`}</p>
      <p class="nota">Cuenta las especies de la Pokédex ${$('nacional').checked && j.nacional.length ? 'Nacional' : 'regional'} del juego.</p></div></div>
    <div class="prog-grid"><div class="extra"><h3 style="margin-top:0">Por tipo</h3>${barras(porTipo)}</div>
    <div class="extra"><h3 style="margin-top:0">Por generación</h3>${barras(porGen)}
      <h3>Otros juegos</h3>${juegos.length ? barras(juegos.map(([x, a, b]) => [esc(x.nombre), '#3fae5a', b, Math.min(a, b)])) : '<p class="vacio">Aún no has marcado capturados en ningún juego.</p>'}</div></div>`;
}

// ---- Copia de seguridad ----
function copia() {
  const claves = []; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.startsWith('pokeguia.')) claves.push(k); } } catch {}
  const nCap = claves.filter(k => k.startsWith(CLAVE_CAP)).reduce((a, k) => a + leerLS(k, []).length, 0);
  const nEq = claves.filter(k => k.startsWith(CLAVE_EQ)).length;
  $('contPart').innerHTML = `<div class="extra"><h2 class="titulo-grupo" style="margin-top:0">Copia de seguridad</h2>
    <p>Tu progreso se guarda solo en este navegador. Si borras los datos del navegador lo pierdes, así que guarda una copia de vez en cuando.</p>
    <p class="vacio">Ahora mismo hay ${nCap} capturados en total y ${nEq} equipos guardados.</p>
    <div class="fila-ctrl"><button class="boton" id="exportar" type="button">⬇ Descargar copia (.json)</button>
      <label class="boton boton-sec" for="importar">⬆ Cargar copia…</label><input type="file" id="importar" accept=".json,application/json" hidden></div>
    <p id="msgCopia" class="nota"></p></div>`;
  $('exportar').onclick = () => {
    const datos = {app: 'PokéGuía', fecha: new Date().toISOString(), datos: {}};
    claves.forEach(k => { try { datos.datos[k] = localStorage.getItem(k); } catch {} });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(datos, null, 1)], {type: 'application/json'}));
    a.download = 'pokeguia-copia-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a); a.click(); a.remove();
    $('msgCopia').textContent = 'Copia descargada.';
  };
  $('importar').onchange = async e => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const d = JSON.parse(await f.text());
      if (!d || !d.datos || typeof d.datos !== 'object') throw new Error('formato');
      const ks = Object.keys(d.datos).filter(k => k.startsWith('pokeguia.'));
      if (!confirm(`¿Cargar la copia del ${new Date(d.fecha).toLocaleDateString('es-ES')}? Sustituirá ${ks.length} datos guardados.`)) return;
      ks.forEach(k => { try { localStorage.setItem(k, d.datos[k]); } catch {} });
      copia(); $('msgCopia').textContent = `Copia cargada: ${ks.length} datos restaurados.`;
    } catch { $('msgCopia').textContent = 'Ese archivo no es una copia válida de PokéGuía.'; }
  };
}

// ===================== HERRAMIENTAS =====================
let subHer = 'dano';
const jHer = () => juegoDe($('juegoHer').value);
let pokesHer = [], porNombreHer = new Map();
function prepararHer() {
  const j = jHer();
  const vistos = new Set();
  pokesHer = pokesDelJuego(j).filter(p => !vistos.has(p.id) && vistos.add(p.id));
  porNombreHer = new Map(pokesHer.map(p => [nombrePoke(p).toLowerCase(), p]));
  $('listaHer').innerHTML = pokesHer.map(p => `<option value="${esc(nombrePoke(p))}">`).join('');
}
const estHer = leerLS('pokeguia.herramientas', {});
const recordar = (k, v) => { estHer[k] = v; guardarLS('pokeguia.herramientas', estHer); };
const pokeInput = (id, ph = 'Escribe un Pokémon…') => `<input type="search" id="${id}" list="listaHer" placeholder="${ph}" autocomplete="off" value="${esc(estHer[id] || '')}">`;
const leerPoke = id => porNombreHer.get(($(id).value || '').trim().toLowerCase());
function pintarHer() { prepararHer(); $('contHer').dataset.m = 'h' + Math.random(); const f = ({dano, comparar, stats, movs, crianza, quiz})[subHer] || (window.HER_EXTRA || {})[subHer]; if (f) f(jHer()); }
function alEscribir(ids, f) { ids.forEach(id => $(id).addEventListener('input', () => { recordar(id, $(id).value); f(); })); }

// ---- Calculadora de daño ----
async function dano(j) {
  const gen = genDe(j);
  const lado = (k, t) => `<div class="extra lado"><h3 style="margin-top:0">${t}</h3>${pokeInput('dp' + k)}
    <div class="fila-ctrl"><span><label class="etq-ctrl" for="dn${k}">Nivel</label><input id="dn${k}" type="number" min="1" max="100" value="${estHer['dn' + k] || 50}" class="num-in"></span>
    <span><label class="etq-ctrl" for="de${k}">Entrenamiento</label><select id="de${k}"><option value="0">Sin EV</option><option value="252" ${estHer['de' + k] === '252' ? 'selected' : ''}>EV al máximo</option></select></span>
    <span><label class="etq-ctrl" for="dt${k}">Naturaleza</label><select id="dt${k}"><option value="1">Neutra</option><option value="1.1" ${estHer['dt' + k] === '1.1' ? 'selected' : ''}>Sube la estadística (+10 %)</option><option value="0.9" ${estHer['dt' + k] === '0.9' ? 'selected' : ''}>Baja la estadística (−10 %)</option></select></span></div>
    <div id="dinfo${k}"></div></div>`;
  $('contHer').innerHTML = `<div class="dos-col">${lado('A', 'Atacante')}${lado('D', 'Defensor')}</div>
    <div class="extra"><div class="fila-ctrl"><div style="flex:1;min-width:220px"><label class="etq-ctrl" for="dmov">Movimiento</label><select id="dmov"></select></div>
    <button class="boton boton-sec" id="dswap" type="button">⇄ Cambiar lados</button></div><div id="dres"></div>
    <p class="nota">Fórmula oficial con IV 31. No tiene en cuenta objetos, habilidades, clima, golpes críticos ni teracristalización. En las generaciones 1 a 3 la categoría física o especial depende del tipo del movimiento.</p></div>`;
  const marca = $('contHer').dataset.m;
  const mj = await cargarMovs(j.id);
  if ($('contHer').dataset.m !== marca) return;
  let movAnt = estHer.dmov;
  const calc = () => {
    const pa = leerPoke('dpA'), pd = leerPoke('dpD');
    ['A', 'D'].forEach(k => { const p = k === 'A' ? pa : pd; $('dinfo' + k).innerHTML = p ? `<div class="poke-mini">${mini(p)}<div><b>${esc(nombrePoke(p))}</b><div class="chips">${tiposEnGen(p, gen).map(t => chip(t)).join('')}</div></div></div>` : ''; });
    // Movimientos del atacante
    const sel = $('dmov');
    let mids = (pa ? aprende(setPoke(mj, pa), 100) : []).map(String);
    if (!mids.length) mids = Object.keys(MV());
    mids = mids.filter(m => MV()[m] && MV()[m][3] && MV()[m][2] !== 'estado' && tablaGen(gen).t[MV()[m][1]]);
    mids.sort((a, b) => MV()[a][0].localeCompare(MV()[b][0], 'es'));
    const actual = sel.value || movAnt;
    sel.innerHTML = mids.map(m => `<option value="${m}">${esc(MV()[m][0])} · ${NOMBRE[MV()[m][1]]} · ${MV()[m][3]}</option>`).join('');
    if (mids.includes(String(actual))) sel.value = actual;
    else if (pa && pd) {   // propone el que más daño hace
      let mejor = null, mv = null;
      for (const m of mids) { const r = calcDano(pa, pd, +$('dnA').value, +$('dnD').value, MV()[m], gen); if (r && (!mejor || r.max > mejor.max)) { mejor = r; mv = m; } }
      if (mv) sel.value = mv;
    }
    if (!pa || !pd || !sel.value) { $('dres').innerHTML = '<p class="vacio">Elige el atacante y el defensor.</p>'; return; }
    const mv = MV()[sel.value];
    const nA = +$('dnA').value || 50, nD = +$('dnD').value || 50;
    const fis = gen <= 3 ? FISICOS.has(mv[1]) : mv[2] === 'físico';
    const r = calcDano(pa, pd, nA, nD, mv, gen, {eva: +$('deA').value, evd: +$('deD').value, evps: +$('deD').value, nata: +$('dtA').value, natd: +$('dtD').value});
    if (!r) { $('dres').innerHTML = '<p class="vacio">Este movimiento no hace daño directo.</p>'; return; }
    const color = r.pmax >= 100 ? '#d6584a' : r.pmax >= 50 ? '#e0a92a' : '#3fae5a';
    $('dres').innerHTML = `<div class="dano-res">
      <div class="dano-num"><b>${pct(r.pmin)}–${pct(r.pmax)} %</b><small>${r.min}–${r.max} PS de ${r.hp}</small></div>
      <div style="flex:1;min-width:220px"><div class="barra-dano grande"><i style="width:${Math.min(100, r.pmax)}%;background:${color}"></i><s style="width:${Math.min(100, r.pmin)}%"></s></div>
      <p><b>${textoGolpes(r.golpes)}</b> · ${textoEf(r.ef)}${r.stab > 1 ? ' · con bonificación por tipo (STAB ×1,5)' : ''} · ${fis ? 'físico (Ataque contra Defensa)' : 'especial (At. Esp. contra Def. Esp.)'}</p></div></div>`;
  };
  alEscribir(['dpA', 'dpD'], () => { $('dmov').value = ''; movAnt = null; calc(); });
  ['dnA', 'dnD', 'deA', 'deD', 'dtA', 'dtD'].forEach(id => $(id).addEventListener('change', () => { recordar(id, $(id).value); calc(); }));
  $('dmov').onchange = () => { recordar('dmov', $('dmov').value); calc(); };
  $('dswap').onclick = () => {
    for (const [a, b] of [['dpA', 'dpD'], ['dnA', 'dnD'], ['deA', 'deD'], ['dtA', 'dtD']]) { const v = $(a).value; $(a).value = $(b).value; $(b).value = v; recordar(a, $(a).value); recordar(b, $(b).value); }
    $('dmov').value = ''; movAnt = null; calc();
  };
  calc();
}

// ---- Comparador ----
function comparar(j) {
  const gen = genDe(j);
  $('contHer').innerHTML = `<div class="extra"><div class="fila-ctrl">${[1, 2, 3].map(i => `<div style="flex:1;min-width:180px">${pokeInput('cp' + i, i === 3 ? 'Opcional…' : 'Pokémon ' + i)}</div>`).join('')}</div></div><div id="cres"></div>`;
  const calc = () => {
    const ps = [1, 2, 3].map(i => leerPoke('cp' + i)).filter(Boolean);
    if (ps.length < 2) { $('cres').innerHTML = '<div class="extra"><p class="vacio">Elige al menos dos Pokémon del juego.</p></div>'; return; }
    const st = ps.map(p => statsEn(p.id, gen));
    const {tipos, t} = tablaGen(gen);
    const cols = ps.map((p, k) => {
      const ts = tiposEnGen(p, gen);
      const mu = tipos.map(a => [a, ts.reduce((x, d) => x * mult(t, a, d), 1)]);
      const tot = st[k].reduce((a, b) => a + b, 0), totMax = Math.max(...st.map(s => s.reduce((a, b) => a + b, 0)));
      const habs = habilidadesEn(p, gen).map(([a, o]) => esc((X.infoHab[a] || ['?'])[0]) + (o ? ' <small class="vacio">(oculta)</small>' : '')).join('<br>');
      return `<div class="extra cmp-col" style="--c:${COLOR[ts[0]]}">
        <img src="${sprite(p.id)}" alt="" class="cmp-img"><h3>${esc(nombrePoke(p))}</h3><div class="chips" style="justify-content:center">${ts.map(x => chip(x)).join('')}</div>
        <div class="cmp-stats">${st[k].map((v, i) => { const mx = Math.max(...st.map(s => s[i])); return `<div class="stat ${v === mx && ps.length > 1 ? 'top' : ''}"><span>${STAT_N[i]}</span><b>${v}</b><div class="barra"><i style="width:${Math.min(100, v / 2)}%;background:${v === mx ? '#3fae5a' : '#8a90a3'}"></i></div></div>`; }).join('')}
        <div class="stat ${tot === totMax ? 'top' : ''}"><span>Total</span><b>${tot}</b></div></div>
        <div class="seccion">Débil a</div><div class="chips">${mu.filter(x => x[1] > 1).sort((a, b) => b[1] - a[1]).map(([a, v]) => chip(a, v)).join('') || '<span class="vacio">Nada</span>'}</div>
        <div class="seccion">Resiste / inmune</div><div class="chips">${mu.filter(x => x[1] < 1).sort((a, b) => a[1] - b[1]).map(([a, v]) => chip(a, v)).join('') || '<span class="vacio">Nada</span>'}</div>
        ${gen >= 3 ? `<div class="seccion">Habilidades</div><p style="margin:0">${habs || '<span class="vacio">Sin datos</span>'}</p>` : ''}
        <button class="boton boton-sec" data-pid="${p.id}" type="button" style="margin-top:12px">Ver ficha</button></div>`;
    });
    $('cres').innerHTML = `<div class="cmp-grid n${ps.length}">${cols.join('')}</div>`;
    $('cres').querySelectorAll('[data-pid]').forEach(b => b.onclick = () => irAPokemon(j.id, +b.dataset.pid));
  };
  alEscribir(['cp1', 'cp2', 'cp3'], calc);
  calc();
}

// ---- Naturalezas, IV y EV ----
function stats(j) {
  const gen = genDe(j), ev0 = estHer.sev || [0, 0, 0, 0, 0, 0], iv0 = estHer.siv || [31, 31, 31, 31, 31, 31];
  $('contHer').innerHTML = `<div class="dos-col"><div class="extra">
    <h3 style="margin-top:0">Calculadora de estadísticas</h3>${pokeInput('sp')}
    <div class="fila-ctrl"><span><label class="etq-ctrl" for="snv">Nivel</label><input id="snv" type="number" min="1" max="100" value="${estHer.snv || 50}" class="num-in"></span>
    <span style="flex:1"><label class="etq-ctrl" for="snat">Naturaleza</label><select id="snat">${CR.nat.map((n, i) => `<option value="${i}" ${+estHer.snat === i ? 'selected' : ''}>${esc(n[0])}${n[1] ? ` (+${STAT_N[n[1]]}, −${STAT_N[n[2]]})` : ' (neutra)'}</option>`).join('')}</select></span></div>
    <table class="tabla-st"><thead><tr><th></th><th>Base</th><th>IV <small>(0–31)</small></th><th>EV <small>(0–252)</small></th><th>Final</th></tr></thead><tbody>
    ${STAT_N.map((n, i) => `<tr><th>${n}</th><td class="sb"></td><td><input type="number" min="0" max="31" class="num-in siv" value="${iv0[i]}"></td><td><input type="number" min="0" max="252" step="4" class="num-in sev" value="${ev0[i]}"></td><td class="sf"></td></tr>`).join('')}
    </tbody></table><p id="sevTot" class="nota"></p>
    ${gen <= 2 ? '<p class="nota">En las generaciones 1 y 2 no hay naturalezas y los IV/EV funcionaban de otra forma (DV de 0 a 15 y experiencia de estadística); el cálculo usa el sistema moderno.</p>' : ''}
    </div><div class="extra"><h3 style="margin-top:0">Tabla de naturalezas</h3>
    <div class="tabla-mov-caja"><table class="tabla-nat"><thead><tr><th>Naturaleza</th><th>Sube</th><th>Baja</th></tr></thead><tbody>
    ${CR.nat.map(n => `<tr><td><b>${esc(n[0])}</b></td><td class="sube">${n[1] ? STAT_N[n[1]] : '—'}</td><td class="baja">${n[2] ? STAT_N[n[2]] : '—'}</td></tr>`).join('')}</tbody></table></div></div></div>`;
  const calc = () => {
    const p = leerPoke('sp'), nv = Math.max(1, Math.min(100, +$('snv').value || 50)), nat = CR.nat[+$('snat').value] || ['', 0, 0];
    const iv = [...document.querySelectorAll('.siv')].map(x => Math.max(0, Math.min(31, +x.value || 0)));
    const ev = [...document.querySelectorAll('.sev')].map(x => Math.max(0, Math.min(252, +x.value || 0)));
    recordar('siv', iv); recordar('sev', ev); recordar('snv', nv); recordar('snat', $('snat').value);
    const tot = ev.reduce((a, b) => a + b, 0);
    $('sevTot').innerHTML = `EV usados: <b>${tot}</b> de 510${tot > 510 ? ' <b style="color:#d6584a">· te pasas del máximo</b>' : ` · quedan ${510 - tot}`}`;
    const b = p && X.stats[p.id] && statsEn(p.id, gen);
    document.querySelectorAll('.tabla-st tbody tr').forEach((tr, i) => {
      tr.querySelector('.sb').textContent = b ? b[i] : '—';
      const m = nat[1] === i ? 1.1 : nat[2] === i ? .9 : 1;
      const f = tr.querySelector('.sf');
      f.textContent = b ? statReal(b[i], i, nv, iv[i], ev[i], m) : '—';
      f.className = 'sf ' + (m > 1 ? 'sube' : m < 1 ? 'baja' : '');
    });
  };
  alEscribir(['sp'], calc);
  $('contHer').querySelectorAll('input[type=number], select').forEach(x => x.addEventListener('input', calc));
  calc();
}

// ---- Buscador de movimientos ----
async function movs(j) {
  const cont = $('contHer');
  cont.innerHTML = '<div class="extra"><p class="vacio">Cargando movimientos…</p></div>';
  const marca = cont.dataset.m;
  const mj = await cargarMovs(j.id);
  if (cont.dataset.m !== marca) return;
  if (!mj) { cont.innerHTML = '<div class="extra"><p class="vacio">No hay datos de movimientos para este juego.</p></div>'; return; }
  const enJuego = new Set(pokesHer.map(p => p.id));
  const quien = {};   // mid -> [[pid, método, detalle]]
  const add = (mid, pid, met, det) => (quien[mid] ||= []).push([pid, met, det]);
  for (const [pid, mp] of Object.entries(mj.p)) {
    if (!enJuego.has(+pid)) continue;
    (mp.n || []).forEach(([l, m]) => add(m, +pid, 'n', l));
    (mp.m || []).forEach(([c, m]) => add(m, +pid, 'm', c));
    (mp.h || []).forEach(m => add(m, +pid, 'h', ''));
    (mp.t || []).forEach(m => add(Array.isArray(m) ? m[1] : m, +pid, 't', ''));
  }
  const mids = Object.keys(quien).filter(m => MV()[m]).sort((a, b) => MV()[a][0].localeCompare(MV()[b][0], 'es'));
  const {tipos} = tablaGen(genDe(j));
  cont.innerHTML = `<div class="extra"><div class="fila-ctrl">
    <div style="flex:2;min-width:220px"><label class="etq-ctrl" for="mbus">Movimiento</label><input type="search" id="mbus" list="listaMovs" placeholder="Ej.: Terremoto" value="${esc(estHer.mbus || '')}" autocomplete="off"></div>
    <div style="flex:1;min-width:150px"><label class="etq-ctrl" for="mtipo">o lista por tipo</label><select id="mtipo"><option value="">—</option>${tipos.map(t => `<option value="${t}">${NOMBRE[t]}</option>`).join('')}</select></div>
    <span><input type="checkbox" id="msolo" ${estHer.msolo ? 'checked' : ''}> <label for="msolo">Solo mi equipo</label></span></div>
    <datalist id="listaMovs">${mids.map(m => `<option value="${esc(MV()[m][0])}">`).join('')}</datalist></div><div id="mres"></div>`;
  const porNombre = new Map(mids.map(m => [MV()[m][0].toLowerCase(), m]));
  const calc = () => {
    recordar('mbus', $('mbus').value); recordar('msolo', $('msolo').checked);
    const tipo = $('mtipo').value, res = $('mres');
    if (tipo) {
      const l = mids.filter(m => MV()[m][1] === tipo);
      res.innerHTML = `<div class="extra"><h3 style="margin-top:0">Movimientos de tipo ${NOMBRE[tipo]} en ${esc(j.nombre)} (${l.length})</h3><div class="tabla-mov-caja"><table class="tabla-zona">
        <thead><tr><th>Movimiento</th><th>Categoría</th><th>Potencia</th><th>Precisión</th><th>Lo aprenden</th></tr></thead><tbody>
        ${l.map(m => { const v = MV()[m]; return `<tr><td><button class="enlace" data-mov="${esc(v[0])}"><b>${esc(v[0])}</b></button></td><td class="cl ${v[2]}">${v[2]}</td><td>${v[3] ?? '—'}</td><td>${v[4] ?? '—'}</td><td>${new Set(quien[m].map(x => x[0])).size}</td></tr>`; }).join('')}</tbody></table></div></div>`;
      res.querySelectorAll('[data-mov]').forEach(b => b.onclick = () => { $('mtipo').value = ''; $('mbus').value = b.dataset.mov; calc(); });
      return;
    }
    const mid = porNombre.get($('mbus').value.trim().toLowerCase());
    if (!mid) { res.innerHTML = `<div class="extra"><p class="vacio">Escribe el nombre de un movimiento (hay ${mids.length} en este juego) o elige un tipo.</p></div>`; return; }
    const v = MV()[mid], eq = new Set(leerEquipo(j.id));
    let l = quien[mid];
    if ($('msolo').checked) l = l.filter(x => eq.has(x[0]));
    const grupos = [['n', 'Por nivel'], ['m', 'Con MT / MO / DT'], ['t', 'Con tutor'], ['h', 'Movimiento huevo']];
    const bloque = ([k, t]) => { const xs = l.filter(x => x[1] === k); if (!xs.length) return '';
      if (k === 'n') xs.sort((a, b) => a[2] - b[2]);
      const unico = new Map(); xs.forEach(x => { if (!unico.has(x[0])) unico.set(x[0], x); });
      return `<div class="seccion">${t} (${unico.size})</div><div class="sin-lugar">${[...unico.values()].map(([pid, , d]) => { const p = D.pokemon.find(x => x.id === pid);
        return p ? `<button class="enlace ${eq.has(pid) ? 'en-eq' : ''}" data-pid="${pid}">${mini(p)} <span><b>${esc(nombrePoke(p))}</b>${d !== '' ? `<small class="vacio">${k === 'n' ? (d ? 'Nivel ' + d : 'Al evolucionar / recordar') : esc(d)}</small>` : ''}</span></button>` : ''; }).join('')}</div>`; };
    res.innerHTML = `<div class="extra"><div class="mov-cab"><h2 style="margin:0">${esc(v[0])}</h2>${chip(v[1])}<span class="cl ${v[2]}">${v[2]}</span>
      <span>Potencia <b>${v[3] ?? '—'}</b></span><span>Precisión <b>${v[4] ?? '—'}</b></span><span>PP <b>${v[5] ?? '—'}</b></span></div>
      ${grupos.map(bloque).join('') || '<p class="vacio">Ningún Pokémon de tu equipo lo aprende.</p>'}
      <p class="nota">Los Pokémon de tu equipo salen resaltados. Datos del movimiento: valores actuales.</p></div>`;
    res.querySelectorAll('[data-pid]').forEach(b => b.onclick = () => irAPokemon(j.id, +b.dataset.pid));
  };
  $('mbus').addEventListener('input', () => { $('mtipo').value = ''; calc(); });
  $('mtipo').onchange = calc; $('msolo').onchange = calc;
  calc();
}

// ---- Crianza ----
async function crianza(j) {
  const gen = genDe(j), cont = $('contHer');
  if (gen < 2) { cont.innerHTML = '<div class="extra"><p class="vacio">La crianza (guardería con huevos) empieza en la 2.ª generación. Elige otro juego.</p></div>'; return; }
  cont.innerHTML = `<div class="extra">${pokeInput('crp')}</div><div id="crres"></div>`;
  const marca = cont.dataset.m;
  const mj = await cargarMovs(j.id);
  if (cont.dataset.m !== marca) return;
  const calc = () => {
    const p = leerPoke('crp'), res = $('crres');
    if (!p) { res.innerHTML = '<div class="extra"><p class="vacio">Elige un Pokémon para ver sus grupos huevo, con quién puede criar y qué movimientos huevo tiene.</p></div>'; return; }
    const [grs, ciclos, sexo] = CR.e[p.s] || [[], 0, -1];
    let b = p.s; while (X.evo[b] && X.evo[b].de) b = X.evo[b].de;
    const sale = base(b), esBebe = (X.bebe || []).includes(b);
    const desconocido = grs.includes(15), ditto = grs.includes(13);
    const sexoTxt = sexo < 0 ? 'Sin sexo' : sexo === 0 ? '100 % macho' : sexo === 8 ? '100 % hembra' : `${pct((8 - sexo) / 8 * 100)} % macho · ${pct(sexo / 8 * 100)} % hembra`;
    const pasos = gen >= 8 ? ciclos * 128 : ciclos * (gen <= 3 ? 256 : 255);
    let compat = [];
    if (!desconocido && !ditto) {
      const vistos = new Set();
      compat = pokesHer.filter(x => { const g2 = (CR.e[x.s] || [[]])[0]; if (vistos.has(x.s) || !g2.some(g => grs.includes(g))) return false; vistos.add(x.s); return true; });
    }
    const mp = setPoke(mj, sale || p);
    const huevo = (mp && mp.h) || [];
    const padres = mid => compat.filter(x => { const m2 = setPoke(mj, x); return m2 && (m2.n || []).some(([, m]) => m === mid); }).slice(0, 8);
    res.innerHTML = `<div class="dos-col"><div class="extra"><div class="poke-mini">${mini(p)}<div><h3 style="margin:0">${esc(nombrePoke(p))}</h3>
      <div class="chips">${grs.map(g => `<span class="etq-grupo">${esc(CR.grupos[g] || g)}</span>`).join('')}</div></div></div>
      <div class="datos-cr"><div><small>Del huevo sale</small><b>${sale ? esc(nombrePoke(sale)) : '—'}</b>${esBebe && gen >= 3 ? '<small class="vacio">Algunos bebés necesitan que el padre lleve un incienso</small>' : ''}</div>
      <div><small>Eclosión</small><b>${ciclos} ciclos</b><small class="vacio">≈ ${pasos.toLocaleString('es-ES')} pasos${gen >= 9 ? ' (en Escarlata/Púrpura los huevos se hacen en un pícnic)' : ''}</small></div>
      <div><small>Sexo</small><b>${sexoTxt}</b></div></div>
      ${desconocido ? '<p class="aviso-cr">No puede criar: grupo Desconocido (legendarios, bebés y algunos especiales).</p>' : ''}
      ${ditto ? '<p class="aviso-cr">Ditto cría con cualquier Pokémon que pueda criar, menos con otro Ditto.</p>' : ''}
      ${sexo < 0 && !ditto && !desconocido ? '<p class="aviso-cr">Al no tener sexo, solo puede criar con Ditto.</p>' : ''}
      ${sexo === 8 ? '<p class="nota">Al ser siempre hembra, los huevos son de su especie aunque el padre sea de otra.</p>' : ''}</div>
      <div class="extra"><h3 style="margin-top:0">Movimientos huevo en ${esc(j.nombre)} (${huevo.length})</h3>
      ${huevo.length ? huevo.map(mid => { const v = MV()[mid]; if (!v) return ''; const pa = padres(mid);
        return `<div class="mov-huevo"><div><b>${esc(v[0])}</b> ${chip(v[1])}</div><small class="vacio">${pa.length ? 'Lo pasan por nivel: ' + pa.map(x => esc(nombrePoke(x))).join(', ') : 'Por cadena de crianza o MT'}</small></div>`; }).join('') : '<p class="vacio">No tiene movimientos huevo en este juego (o no hay datos).</p>'}</div></div>
      ${compat.length ? `<div class="extra"><h3 style="margin-top:0">Puede criar con (${compat.length} especies de este juego, además de Ditto)</h3>
        <div class="minis">${compat.map(x => `<button class="mini-b" data-pid="${x.id}" title="${esc(nombrePoke(x))}">${mini(x)}</button>`).join('')}</div>
        <p class="nota">Tienen que ser de distinto sexo; el huevo es de la especie de la madre.</p></div>` : ''}`;
    res.querySelectorAll('[data-pid]').forEach(b2 => b2.onclick = () => { $('crp').value = nombrePoke(D.pokemon.find(x => x.id === +b2.dataset.pid)); recordar('crp', $('crp').value); calc(); });
  };
  alEscribir(['crp'], calc);
  calc();
}

// ---- Quiz ----
let quizModo = 'tipos', quizRacha = 0, quizAciertos = 0, quizTotal = 0;
function quiz(j) {
  const rec = leerLS('pokeguia.quiz', {tipos: 0, quien: 0});
  $('contHer').innerHTML = `<div class="extra"><div class="fila-ctrl"><div class="seg" id="quizModo">
    <button type="button" data-m="tipos" class="${quizModo === 'tipos' ? 'on' : ''}">Tabla de tipos</button><button type="button" data-m="quien" class="${quizModo === 'quien' ? 'on' : ''}">¿Quién es ese Pokémon?</button></div>
    <div class="quiz-marcador"><span>Aciertos <b id="qAc">${quizAciertos}/${quizTotal}</b></span><span>Racha <b id="qRacha">${quizRacha}</b></span><span>Récord <b id="qRec">${rec[quizModo]}</b></span></div></div>
    <div id="quizCaja" class="quiz-caja"></div></div>`;
  $('quizModo').querySelectorAll('button').forEach(b => b.onclick = () => { quizModo = b.dataset.m; quizRacha = quizAciertos = quizTotal = 0; quiz(j); });
  const al = l => l[Math.floor(Math.random() * l.length)];
  const responder = (ok, explicacion) => {
    quizTotal++; if (ok) { quizAciertos++; quizRacha++; } else quizRacha = 0;
    if (quizRacha > rec[quizModo]) { rec[quizModo] = quizRacha; guardarLS('pokeguia.quiz', rec); }
    $('qAc').textContent = quizAciertos + '/' + quizTotal; $('qRacha').textContent = quizRacha; $('qRec').textContent = rec[quizModo];
    const f = $('quizFeed'); f.className = 'quiz-feed ' + (ok ? 'ok' : 'mal');
    f.innerHTML = `<b>${ok ? '¡Correcto!' : 'Fallo'}</b> ${explicacion} <button class="boton" id="qSig" type="button">Siguiente ➜</button>`;
    $('qSig').onclick = () => quiz(j); $('qSig').focus();
  };
  const caja = $('quizCaja'), gen = genDe(j);
  if (quizModo === 'tipos') {
    const {tipos, t} = tablaGen(gen);
    const a = al(tipos), d1 = al(tipos), d2 = Math.random() < .5 ? al(tipos.filter(x => x !== d1)) : null;
    const defs = d2 ? [d1, d2] : [d1], v = defs.reduce((x, d) => x * mult(t, a, d), 1);
    const ops = d2 ? [0, .25, .5, 1, 2, 4] : [0, .5, 1, 2];
    caja.innerHTML = `<p class="quiz-preg">Un ataque de tipo ${chip(a)} contra un Pokémon ${defs.map(x => chip(x)).join(' ')}…</p>
      <div class="quiz-ops">${ops.map(o => `<button type="button" data-v="${o}">×${o === .25 ? '¼' : o === .5 ? '½' : o}</button>`).join('')}</div><div id="quizFeed" class="quiz-feed"></div>
      <p class="nota">Tabla de la ${gen}.ª generación (${esc(j.nombre)}).</p>`;
    caja.querySelectorAll('[data-v]').forEach(b => b.onclick = () => {
      caja.querySelectorAll('[data-v]').forEach(x => { x.disabled = true; if (+x.dataset.v === v) x.classList.add('ok'); });
      if (+b.dataset.v !== v) b.classList.add('mal');
      responder(+b.dataset.v === v, defs.map(d => `${NOMBRE[a]} contra ${NOMBRE[d]}: ×${multTxt(mult(t, a, d))}`).join(' · '));
    });
  } else {
    const l = pokesHer.filter(p => p.d);
    if (l.length < 4) { caja.innerHTML = '<p class="vacio">No hay suficientes Pokémon en este juego.</p>'; return; }
    const p = al(l), ops = [p];
    while (ops.length < 4) { const x = al(l); if (!ops.some(o => o.s === x.s)) ops.push(x); }
    ops.sort(() => Math.random() - .5);
    caja.innerHTML = `<div class="quiz-sombra"><img id="qImg" src="${sprite(p.id)}" alt="Silueta"></div>
      <div class="quiz-ops">${ops.map(o => `<button type="button" data-s="${o.s}">${esc(D.especies[o.s].n)}</button>`).join('')}</div><div id="quizFeed" class="quiz-feed"></div>`;
    caja.querySelectorAll('[data-s]').forEach(b => b.onclick = () => {
      caja.querySelectorAll('[data-s]').forEach(x => { x.disabled = true; if (+x.dataset.s === p.s) x.classList.add('ok'); });
      if (+b.dataset.s !== p.s) b.classList.add('mal');
      $('qImg').classList.add('ver');
      responder(+b.dataset.s === p.s, `Es <b>${esc(D.especies[p.s].n)}</b> (${tiposEnGen(p, gen).map(x => NOMBRE[x]).join(' / ')}).`);
    });
  }
}

// Utilidades para funciones2.js
window.PG = {calcDano, statReal, aprende, ultimos4, setPoke, pasosRuta, nivelesLugar, mini, leerLS, guardarLS, pct, textoGolpes, textoEf, base, mult, FISICOS,
  irZona: (jid, l) => { document.querySelector('[data-vista=vistaPart]').click(); $('juegoPart').value = jid; zonaSel = String(l); $('subPart').querySelector('[data-s=zonas]').click(); },
  irMov: (jid, nombre) => { document.querySelector('[data-vista=vistaHer]').click(); $('juegoHer').value = jid; recordar('mbus', nombre); $('subHer').querySelector('[data-s=movs]').click(); },
  repintarPart: () => pintarPart(), repintarHer: () => pintarHer(), pokesHer: () => pokesHer, leerPoke, pokeInput, alEscribir, recordar, estHer};

// ---------- Arranque ----------
rellenar($('juegoPart'), pintarPart);
rellenar($('juegoHer'), pintarHer);
pestanas('subPart', s => { subPart = s; pintarPart(); });
pestanas('subHer', s => { subHer = s; pintarHer(); });
document.addEventListener('vista', e => {
  const sincroniza = id => { if (!$(id).dataset.listo) { $(id).value = $('juego').value; $(id).dataset.listo = 1; } };
  if (e.detail === 'vistaPart') { sincroniza('juegoPart'); pintarPart(); }
  if (e.detail === 'vistaHer') { sincroniza('juegoHer'); pintarHer(); }
});
})();
