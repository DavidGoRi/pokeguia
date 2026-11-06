// PokéGuía, segunda tanda: rivales y villanos, objetos y MT, evoluciones del equipo, captura, mejores movimientos,
// equipo automático, varios equipos, Nuzlocke, shiny, búsqueda global, gritos y app instalable (PWA).
(function () {
const P = window.PG;
const R = window.RIVALES || {}, OB = window.OBJETOS || {nombres: {}, ident: {}, cat: {}, donde: {}, mt: {}};
const CR = window.CRIANZA || {e: {}};
const MV = () => window.MOVS || {};
const juegoDe = id => D.juegos.find(j => j.id === id);
const pk = id => D.pokemon.find(p => p.id === id);
const {mini, leerLS, guardarLS, pct} = P;
const imgObjeto = i => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${OB.ident[i]}.png`;
const enJuego = (j, s) => j.dex.some(d => d[0] === s) || j.nacional.includes(s);

// ===================== MEJORES MOVIMIENTOS =====================
// Elige 4 movimientos de ataque: potencia × precisión × STAB, ajustado a su mejor estadística de ataque, y luego cobertura.
function mejoresMovs(p, gen, mp, nivel, conMT) {
  const st = X.stats[p.id] ? statsEn(p.id, gen) : [0, 50, 0, 50, 0, 0], fisMejor = st[1] >= st[3];
  const {tipos, t} = tablaGen(gen), ts = tiposEnGen(p, gen);
  const cands = P.aprende(mp, nivel, conMT).map(id => [id, MV()[id]])
    .filter(([, v]) => v && v[3] && v[2] !== 'estado' && t[v[1]] && !/^(Hiperrayo|Gigaimpacto|Explosión|Autodestrucción|Rabia|Venganza|Contraataque|Manto Espejo|Cabezazo|Ataque Aéreo|Rayo Meteórico|Golpe Fantasma|Rodar|Bola Hielo|Puño Certero|Comesueños|Sorpresa|Última Baza|Bomba Sónica|Furia Dragón|Tinieblas|Movimiento Sísmico|Superdiente|Premonición|Deseo Oculto|Venganza|Represalia)$/.test(v[0]))
    .map(([id, v]) => {
      const fis = gen <= 3 ? P.FISICOS.has(v[1]) : v[2] === 'físico';
      const val = v[3] * ((v[4] || 100) / 100) * (ts.includes(v[1]) ? 1.5 : 1) * (fis === fisMejor ? 1 : .5) * (/Hiper|Gigaimpacto/.test(v[0]) ? .6 : 1);
      return {id, v, val};
    }).sort((a, b) => b.val - a.val);
  const elegidos = [], cubre = new Set();
  const cubreDe = v => tipos.filter(d => P.mult(t, v[1], d) >= 2);
  while (elegidos.length < 4 && cands.length) {
    let mejor = null, puntos = -1;
    for (const c of cands) {
      if (elegidos.some(e => e.v[1] === c.v[1])) continue;   // un movimiento por tipo
      const nuevos = cubreDe(c.v).filter(d => !cubre.has(d)).length;
      const pts = c.val / 100 + nuevos * .35;
      if (pts > puntos) { puntos = pts; mejor = c; }
    }
    if (!mejor) break;
    elegidos.push(mejor); cubreDe(mejor.v).forEach(d => cubre.add(d));
    cands.splice(cands.indexOf(mejor), 1);
  }
  const sinCubrir = tipos.filter(d => !cubre.has(d));
  const nadaHace = tipos.filter(d => elegidos.length && elegidos.every(e => P.mult(t, e.v[1], d) < 1));
  return {elegidos, cubre: [...cubre], sinCubrir, nadaHace};
}
const chipsMovs = r => r.elegidos.map(e => `<span class="mov-chip" style="--c:${COLOR[e.v[1]]}">${esc(e.v[0])}<small>${e.v[3]}</small></span>`).join('') || '<span class="vacio">Sin movimientos de ataque</span>';

function mejores(j) {
  const gen = +j.gen;
  $('contHer').innerHTML = `<div class="extra">${P.pokeInput('mbp')}
    <div class="fila-ctrl"><span><label class="etq-ctrl" for="mbn">Nivel</label><input id="mbn" type="number" min="1" max="100" value="${P.estHer.mbn || 50}" class="num-in"></span>
    <span><input type="checkbox" id="mbmt" ${P.estHer.mbmt !== false ? 'checked' : ''}> <label for="mbmt">Incluir MT y tutores</label></span></div></div><div id="mbres"></div>`;
  const calc = async () => {
    const p = P.leerPoke('mbp'); P.recordar('mbn', $('mbn').value); P.recordar('mbmt', $('mbmt').checked);
    if (!p) { $('mbres').innerHTML = '<div class="extra"><p class="vacio">Elige un Pokémon del juego.</p></div>'; return; }
    const mj = await cargarMovs(j.id);
    const r = mejoresMovs(p, gen, P.setPoke(mj, p), +$('mbn').value || 50, $('mbmt').checked);
    const st = statsEn(p.id, gen);
    $('mbres').innerHTML = `<div class="extra"><div class="poke-mini">${mini(p)}<div><h3 style="margin:0">${esc(nombrePoke(p))}</h3>
      <small class="vacio">Ataque ${st[1]} · At. Esp. ${st[3]} → mejor ${st[1] >= st[3] ? 'físico' : 'especial'}</small></div></div>
      <div class="mejores-lista">${r.elegidos.map(e => `<div class="mejor-mov"><b>${esc(e.v[0])}</b>${chip(e.v[1])}<span class="cl ${e.v[2]}">${e.v[2]}</span>
        <span>Potencia <b>${e.v[3]}</b></span><span>Precisión <b>${e.v[4] ?? '—'}</b></span></div>`).join('') || '<p class="vacio">No aprende movimientos de ataque con estas condiciones.</p>'}</div>
      <div class="seccion" style="margin-top:12px">Golpea muy eficazmente a</div><div class="chips">${r.cubre.map(x => chip(x)).join('') || '<span class="vacio">Nada</span>'}</div>
      ${r.nadaHace.length ? `<div class="seccion" style="margin-top:12px">Ningún movimiento les hace daño normal</div><div class="chips">${r.nadaHace.map(x => chip(x)).join('')}</div>` : ''}
      <p class="nota">Puntúa potencia, precisión, bonificación por tipo y si el movimiento usa su mejor estadística, y después busca cubrir el máximo de tipos sin repetir tipo. No tiene en cuenta efectos secundarios ni movimientos de estado.</p></div>`;
  };
  P.alEscribir(['mbp'], calc);
  $('mbn').onchange = calc; $('mbmt').onchange = calc;
  calc();
}

// ===================== CALCULADORA DE CAPTURA =====================
function captura(j) {
  const gen = +j.gen, e = P.estHer;
  $('contHer').innerHTML = `<div class="dos-col"><div class="extra">
    <h3 style="margin-top:0">Pokémon salvaje</h3>${P.pokeInput('cap')}
    <div class="fila-ctrl"><span><label class="etq-ctrl" for="capn">Nivel</label><input id="capn" type="number" min="1" max="100" value="${e.capn || 20}" class="num-in"></span>
    <span><label class="etq-ctrl" for="capt">Turno</label><input id="capt" type="number" min="1" max="99" value="${e.capt || 1}" class="num-in"></span>
    <span style="flex:1"><label class="etq-ctrl" for="cape">Estado</label><select id="cape"><option value="1">Ninguno</option><option value="sueno">Dormido o congelado</option><option value="1.5">Paralizado, quemado o envenenado</option></select></span></div>
    <label class="etq-ctrl" for="caph">Vida que le queda: <b id="caphv"></b></label><input id="caph" type="range" min="1" max="100" value="${e.caph || 100}" style="width:100%">
    <div class="opciones" style="margin-top:10px"><span><input type="checkbox" id="capnoche"> <label for="capnoche">De noche o en una cueva</label></span>
    <span><input type="checkbox" id="capagua"> <label for="capagua">Pescando o haciendo surf</label></span></div>
    <div id="capinfo"></div></div>
    <div class="extra"><h3 style="margin-top:0">Probabilidad con cada Poké Ball</h3><div id="capres"></div>
    <p class="nota">Fórmula de captura de la 3.ª generación en adelante (las de la 1.ª y 2.ª eran distintas y en Let's Go y Leyendas cambia el sistema). No incluye el bonus por nivel bajo de las últimas generaciones, el Amuleto de captura ni las capturas críticas.</p></div></div>`;
  if (e.cape) $('cape').value = e.cape;
  const calc = () => {
    ['capn', 'capt', 'caph', 'cape'].forEach(k => P.recordar(k, $(k).value));
    $('caphv').textContent = $('caph').value + ' %';
    const p = P.leerPoke('cap');
    if (!p) { $('capres').innerHTML = '<p class="vacio">Elige un Pokémon.</p>'; $('capinfo').innerHTML = ''; return; }
    const ratio = (CR.e[p.s] || [])[3] || 45, nv = +$('capn').value || 20, turno = +$('capt').value || 1, h = +$('caph').value / 100;
    const ts = tiposEnGen(p, gen), noche = $('capnoche').checked, agua = $('capagua').checked;
    const capt = capturados(j.id).has(p.s);
    const est = $('cape').value === 'sueno' ? (gen >= 5 ? 2.5 : 2) : +$('cape').value;
    $('capinfo').innerHTML = `<div class="poke-mini">${mini(p)}<div><b>${esc(nombrePoke(p))}</b><small class="vacio">Ratio de captura: ${ratio} de 255${capt ? ' · ya lo tienes (Acopio Ball funciona)' : ''}</small></div></div>`;
    const balls = [
      ['Poké Ball', 'poke-ball', 1, 1], ['Super Ball', 'great-ball', 1.5, 1], ['Ultra Ball', 'ultra-ball', 2, 1],
      ['Malla Ball', 'net-ball', (ts.includes('water') || ts.includes('bug')) ? (gen >= 7 ? 3.5 : 3) : 1, 3],
      ['Buceo Ball', 'dive-ball', agua ? 3.5 : 1, 3],
      ['Nido Ball', 'nest-ball', nv < 30 ? Math.max(1, (41 - nv) / 10) : 1, 3],
      ['Acopio Ball', 'repeat-ball', capt ? 3.5 : 1, 3],
      ['Turno Ball', 'timer-ball', gen >= 5 ? Math.min(4, 1 + (turno - 1) * 1229 / 4096 * 1) : Math.min(4, (turno + 10) / 10), 3],
      ['Ocaso Ball', 'dusk-ball', noche ? (gen >= 7 ? 3 : 3.5) : 1, 4],
      ['Veloz Ball', 'quick-ball', turno === 1 ? (gen >= 5 ? 5 : 4) : 1, 4],
      ['Lujo Ball', 'luxury-ball', 1, 3]
    ].filter(b => gen >= b[3]);
    const prob = m => {
      const a = Math.floor((3 - 2 * h) * ratio * m / 3 * est);
      if (a >= 255) return 1;
      const b = Math.floor(65536 / Math.pow(255 / Math.max(1, a), 3 / 16));
      return Math.pow(b / 65536, 4);
    };
    const filas = balls.map(b => [b, prob(b[2])]).sort((x, y) => y[1] - x[1]);
    $('capres').innerHTML = `<div class="capt-lista">${filas.map(([b, pr]) => `<div class="capt-fila"><img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${b[1]}.png" alt="">
      <span>${b[0]}${b[2] !== 1 ? ` <small class="vacio">×${pct(b[2])}</small>` : ''}</span><div class="barra"><i style="width:${pr * 100}%;background:${pr > .6 ? '#3fae5a' : pr > .25 ? '#e0a92a' : '#d6584a'}"></i></div>
      <b>${pr >= 1 ? '100 %' : pct(pr * 100) + ' %'}</b><small class="vacio">${pr >= 1 ? 'seguro' : '≈ ' + Math.ceil(1 / pr) + ' intentos'}</small></div>`).join('')}
      <div class="capt-fila"><img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/master-ball.png" alt=""><span>Master Ball</span><div class="barra"><i style="width:100%;background:#9141cb"></i></div><b>100 %</b><small class="vacio">siempre</small></div></div>`;
  };
  P.alEscribir(['cap'], calc);
  ['capn', 'capt', 'caph', 'cape', 'capnoche', 'capagua'].forEach(id => $(id).addEventListener('input', calc));
  calc();
}

// ===================== OBJETOS (pestaña propia) =====================
let filtroObj = '', catObj = '';
const textoDonde = e => typeof e === 'string' ? e : e.t;
const lugaresDonde = e => typeof e === 'string' ? [] : (e.l || []);
const normT = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
function descObjeto(i, jid) {
  const d = ((OB.items || {})[i] || {}).d || {};
  if (d[jid]) return d[jid];
  const ks = Object.keys(d).map(Number).sort((a, b) => a - b);
  const anteriores = ks.filter(k => k <= +jid);
  return d[(anteriores.length ? anteriores[anteriores.length - 1] : ks[ks.length - 1])] || '';
}
// Descripciones de WikiDex: dónde está el objeto dentro de cada lugar
const OL = () => window.OBJ_LUGAR || {};
const claveObj = (i, mt) => normT(i ? ((OB.items || {})[i] || {}).n || OB.nombres[i] || '' : (/^\d/.test(mt[0]) ? 'MT' : '') + mt[0]).replace(/\s+/g, ' ').trim();
const sinCeros = s => s.replace(/^tr(?=\s*\d)/, 'dt').replace(/^(mt|mo|dt)\s*0*/, '$1');
// Los nombres de PokeAPI y WikiDex a veces difieren en una letra («Restaurar Todo» / «Restaura todo»)
function casiIgual(a, b) {
  if (Math.abs(a.length - b.length) > 1 || a.length < 7) return false;
  let i = 0; while (i < a.length && a[i] === b[i]) i++;
  return a.slice(i + 1) === b.slice(i + 1) || a.slice(i) === b.slice(i + 1) || a.slice(i + 1) === b.slice(i);
}
// También sin espacios («Ultraball» / «Ultra Ball») y sin importar el orden («Máximo revivir» / «Revivir Máximo»)
const junto = s => s.replace(/[^a-z0-9]/g, '');
const ordenado = s => s.split(/[^a-z0-9]+/).filter(Boolean).sort().join('');
const mismaClave = (a, b) => a === b || sinCeros(a) === sinCeros(b) || junto(a) === junto(b) || ordenado(a) === ordenado(b) || casiIgual(junto(a), junto(b));
const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const mayus = s => s.charAt(0).toUpperCase() + s.slice(1);
// Descripción general cuando WikiDex no explica el punto exacto: se construye con los datos de Serebii
// Lugares nombrados en el texto de Serebii (sin notas ni prefijos de región)
function lugaresTexto(t) {
  const partes = [];
  let nivel = 0, act = '';
  for (const c of t.replace(/^Tienda:\s*/, '')) {
    if (c === '(') nivel++; if (c === ')') nivel--;
    if ((c === ',' || c === '·') && nivel === 0) { partes.push(act); act = ''; } else act += c;
  }
  partes.push(act);
  return partes.map(p => p.trim().replace(/^[A-Z][a-z]+:\s*/, '')).filter(p => p && !/Imprimeobjetos|premio por completar|Recogida/.test(p))
    .map(p => ({nombre: p.replace(/\s*\([^()]*\)\s*$/, '').trim(), nota: (p.match(/\(([^()]*)\)\s*$/) || [])[1] || ''})).filter(p => p.nombre);
}
function descGenerada(e, id, j, it, nombreForzado) {
  const t = textoDonde(e), tienda = /^Tienda:/.test(t);
  const lugar = nombreForzado || (id ? nombreLugarJ(j, id) : '');
  if (tienda) return `Se compra en la tienda${lugar ? ' de ' + lugar : ''}${it && it.p ? ` por ${it.p.toLocaleString('es-ES')} ₽` : ''}. Habla con el dependiente del mostrador de la tienda.`;
  let nota = '';
  if (lugar) { const m = t.match(new RegExp(escRe(lugar) + '\\s*\\(([^)]*)\\)')); if (m) nota = m[1].trim(); }
  const extra = [];
  if (/Imprimeobjetos/.test(t)) extra.push('también puede salir en el Imprimeobjetos de la academia');
  if (/premio por completar la Pokédex/i.test(t)) extra.push('te lo dan como premio por completar la Pokédex');
  if (/Recogida/.test(t)) extra.push('lo pueden encontrar los Pokémon con la habilidad Recogida');
  if (!id && !nombreForzado) return `Se consigue así: ${t.replace(/ · /g, '; ')}.${extra.length ? ' ' + mayus(extra.join('; ')) + '.' : ''}`;
  const mundoAbierto = ['24', '25', '30'].includes(j.id);
  let base;
  if (/Zahorí/i.test(nota)) base = `Está oculto en ${lugar}: no se ve a simple vista, usa el Zahorí para encontrarlo.`;
  else if (/nube de polvo/i.test(nota)) base = `Aparece al pisar las nubes de polvo que se forman en ${lugar}.`;
  else if (/oculto/i.test(nota)) base = `Está oculto en ${lugar}; no se ve a simple vista.`;
  else if (nota) base = `En ${lugar}: ${nota}.`;
  else if (mundoAbierto) base = `Aparece en ${lugar} como objeto en el suelo (un brillo o una Poké Ball); recógelo al pasar cerca.`;
  else base = `Está en ${lugar} como objeto en el suelo, dentro de una Poké Ball que puedes recoger.`;
  return base + (extra.length ? ' ' + mayus(extra.join('; ')) + '.' : '');
}
// Identificadores del mismo lugar (misma página de WikiDex: p. ej. las plantas de la Calle Victoria)
function mismoLugar(ident) {
  const pag = ((window.LUGAR_FOTOS || {})[ident] || {}).pag;
  return pag ? Object.keys(OL()).filter(k => ((window.LUGAR_FOTOS || {})[k] || {}).pag === pag) : [ident];
}
function detallesEn(ident, jid, clave) {
  const r = [];
  for (const k of new Set([ident, ...mismoLugar(ident)])) {
    const x = (OL()[k] || {})[jid];
    if (x) x.o.filter(o => mismaClave(o[0], clave)).forEach(o => r.push(o[2]));
  }
  return [...new Set(r)];
}
function lugaresWikidex(jid, clave) {
  return Object.entries(OL()).filter(([, v]) => v[jid] && v[jid].o.some(o => mismaClave(o[0], clave))).map(([id]) => id);
}
function nombreLugarJ(j, id) {
  const u = (window.UBIC || {})[j.id], l = u && Object.values(u.locs).find(x => x[1] === id);
  return nombreLugar(id) !== id ? nombreLugar(id) : (l ? l[0] : ((window.LUGAR_FOTOS || {})[id] || {}).pag || id);
}
function listaObjetos() {
  const j = juegoDe($('juegoObj').value), d = OB.donde[j.id] || {}, mts = OB.mt[j.id] || [];
  const cats = OB.cats || {evo: 'Para evolucionar', clave: 'Objetos clave'};
  const f = normT(($('busObj').value || '').trim()); filtroObj = $('busObj').value;
  const cumple = (...t) => !f || t.some(x => normT(x).includes(f));
  const lleva = (OB.llevan || {})[j.id] || {};
  const ids = [...new Set([...Object.keys(d), ...Object.keys(lleva)])].filter(i => (OB.items || {})[i] || OB.nombres[i]);
  const objs = ids.map(i => ({i, n: (OB.items?.[i]?.n) || OB.nombres[i] || i, c: (OB.items?.[i]?.c) || OB.cat[i], ls: d[i] || [],
      sub: d[i] ? textoDonde(d[i][0]) : 'Lo llevan Pokémon salvajes: ' + lleva[i].map(([pid]) => pk(pid) ? nombrePoke(pk(pid)) : '').filter(Boolean).slice(0, 3).join(', ')}))
    .filter(o => cumple(o.n, o.sub, ...o.ls.map(textoDonde))).sort((a, b) => a.n.localeCompare(b.n, 'es'));
  const filasMT = mts.filter(([n, mid, l]) => cumple('MT' + n, (MV()[mid] || [''])[0], l));
  const cuenta = c => c === 'mt' ? filasMT.length : objs.filter(o => o.c === c).length;
  const disponibles = [...Object.keys(cats), 'mt'].filter(c => cuenta(c));
  if (catObj && !disponibles.includes(catObj)) catObj = '';
  $('catObj').innerHTML = `<button type="button" data-c="" class="${!catObj ? 'on' : ''}">Todos <span>${objs.length + filasMT.length}</span></button>` +
    disponibles.map(c => `<button type="button" data-c="${c}" class="${catObj === c ? 'on' : ''}">${esc(c === 'mt' ? 'MT / DT' : cats[c])} <span>${cuenta(c)}</span></button>`).join('');
  $('catObj').querySelectorAll('button').forEach(b => b.onclick = () => { catObj = b.dataset.c; listaObjetos(); });
  const tarjetaObj = o => `<button type="button" class="obj-b" data-i="${o.i}"><img src="${imgObjeto(o.i)}" alt="" loading="lazy" onerror="this.style.visibility='hidden'">
    <span><b>${esc(o.n)}</b><small>${esc(o.sub)}</small></span></button>`;
  const tarjetaMT = ([n, mid, l], k) => { const v = MV()[mid] || ['?', 'normal'];
    return `<button type="button" class="obj-b" data-mt="${k}"><span class="mt-ico" style="background:${COLOR[v[1]] || '#888'}">${/^\d/.test(n) ? 'MT' : ''}${esc(n)}</span>
    <span><b>${esc(v[0])}</b><small>${esc(l || '—')}</small></span></button>`; };
  let html = '';
  const bloque = (titulo, cont, n) => `<div class="extra"><h2 class="titulo-grupo" style="margin-top:0">${esc(titulo)} <small class="vacio">(${n})</small></h2><div class="obj-lista">${cont}</div></div>`;
  for (const c of Object.keys(cats)) {
    if (catObj && catObj !== c) continue;
    const l = objs.filter(o => o.c === c); if (l.length) html += bloque(cats[c], l.map(tarjetaObj).join(''), l.length);
  }
  if ((!catObj || catObj === 'mt') && filasMT.length) html += bloque('MT / DT', filasMT.map(r => tarjetaMT(r, mts.indexOf(r))).join(''), filasMT.length);
  $('listaObj').innerHTML = html || `<div class="extra"><p class="vacio">${Object.keys(d).length || mts.length ? 'Nada coincide con la búsqueda.' : 'No hay datos de objetos para ' + esc(j.nombre) + '.'}</p></div>`;
  $('listaObj').querySelectorAll('[data-i]').forEach(b => b.onclick = () => fichaObjeto(j, b.dataset.i));
  $('listaObj').querySelectorAll('[data-mt]').forEach(b => b.onclick = () => fichaObjeto(j, null, mts[+b.dataset.mt]));
}

// Mapas reales de zonas del juego en los que aparece alguno de estos lugares
function mapasConLugares(j, ids) {
  return (MAPAS_JUEGO[j.id] || []).filter(k => MAPAS[k] && MAPAS[k].fondo && !MAPAS[k].puntos)
    .map(k => [k, ids.filter(i => enMapa(MAPAS[k], i))]).filter(([, l]) => l.length).sort((a, b) => b[1].length - a[1].length);
}
function idsDelJuego(j, ids) {   // de los candidatos, los que usa este juego (en sus zonas, mapas o fotos)
  const u = (window.UBIC || {})[j.id], enUbic = new Set(u ? Object.values(u.locs).map(x => x[1]) : []);
  const sirve = i => enUbic.has(i) || (MAPAS_JUEGO[j.id] || []).some(k => MAPAS[k] && enMapa(MAPAS[k], i)) || ((window.LUGAR_FOTOS || {})[i] && (OL()[i] || {})[j.id]);
  const prefijo = {'25': 'sv:', '23': 'bdsp:', '24': 'la:', '30': 'za:'}[j.id];
  const l = ids.filter(sirve);
  // Si hay versión con el prefijo del juego (sv:, la:...), se prefiere esa
  return [...new Set(l.map(i => prefijo && !i.startsWith(prefijo) && l.includes(prefijo + i.split(':').pop()) ? prefijo + i.split(':').pop() : i))];
}

async function fichaObjeto(j, i, mt) {
  await cargarUbic(j.id);
  let d = $('dlgObj');
  if (!d) { d = document.createElement('dialog'); d.id = 'dlgObj'; document.body.appendChild(d); d.addEventListener('click', e => { if (e.target === d) d.close(); }); }
  const it = i ? ((OB.items || {})[i] || {n: OB.nombres[i], c: OB.cat[i]}) : null;
  const v = mt ? (MV()[mt[1]] || ['?', 'normal', 'estado', null, null, null]) : null;
  const titulo = it ? it.n : `${/^\d/.test(mt[0]) ? 'MT' : ''}${mt[0]} · ${v[0]}`;
  const icono = it ? `<img src="${imgObjeto(i)}" alt="" onerror="this.style.visibility='hidden'">` : `<span class="mt-ico" style="background:${COLOR[v[1]]};width:56px;height:56px;border-radius:14px;display:grid;place-items:center;color:#fff;font:800 .9rem Outfit">${/^\d/.test(mt[0]) ? 'MT' : ''}${esc(mt[0])}</span>`;
  const clave = claveObj(i, mt);
  const entradas = [...(it ? (OB.donde[j.id] || {})[i] || [] : [{t: mt[2] || 'Sin datos', l: mt[3] || []}])];
  // Lugares que solo conoce WikiDex (con su descripción) se añaden como entradas propias
  const cubiertos = new Set(entradas.flatMap(e => idsDelJuego(j, lugaresDonde(e)).flatMap(mismoLugar)));
  const nombresCubiertos = new Set(entradas.flatMap(e => [...idsDelJuego(j, lugaresDonde(e)).map(id => normT(nombreLugarJ(j, id))), ...(e.l ? lugaresTexto(textoDonde(e)).map(p => normT(p.nombre)) : [])]));
  for (const id of lugaresWikidex(j.id, clave)) {
    const n = normT(nombreLugarJ(j, id));
    if (cubiertos.has(id) || nombresCubiertos.has(n)) continue;
    nombresCubiertos.add(n); mismoLugar(id).forEach(k => cubiertos.add(k));
    entradas.push({t: nombreLugarJ(j, id), l: [id], wd: true});
  }
  const sub = it ? esc((OB.cats || {})[it.c] || '') : 'Máquina técnica';
  // Para qué sirve
  let usos = '';
  if (it) {
    const evs = ((OB.evo || {})[i] || []).filter(([s]) => D.especies[s]);
    if (evs.length) {
      const enEste = evs.filter(([s]) => enJuego(j, s) || +D.especies[s].g <= +j.gen);
      usos += `<div><div class="seccion">Sirve para evolucionar</div><div class="od-evo">${(enEste.length ? enEste : evs).map(([s, como]) => {
        const de = (X.evo[s] || {}).de, p = (POR_ESPECIE[s] || []).find(x => x.d) || {id: s};
        return `<button type="button" data-pid="${p.id}" title="${esc(metodoEvo(s, j) || '')}"><img src="${sprite(p.id)}" alt="">${de ? esc(D.especies[de].n) + ' → ' : ''}${esc(D.especies[s].n)}<small class="vacio">&nbsp;(${como === 'usar' ? 'usándolo' : 'llevándolo equipado'})</small></button>`; }).join('')}</div></div>`;
    }
    const lleva = ((OB.llevan || {})[j.id] || {})[i] || [];
    if (lleva.length) usos += `<div><div class="seccion">Lo llevan Pokémon salvajes</div><div class="od-evo">${lleva.sort((a, b) => b[1] - a[1]).map(([pid, r]) => { const p = pk(pid);
      return p ? `<button type="button" data-pid="${pid}"><img src="${sprite(pid)}" alt="">${esc(nombrePoke(p))} <small class="vacio">&nbsp;${r} %</small></button>` : ''; }).join('')}</div></div>`;
  } else if (v) {
    const mj = await cargarMovs(j.id);
    const aprenden = mj ? Object.entries(mj.p).filter(([, mp]) => (mp.m || []).some(([, m]) => m === mt[1])).length : 0;
    usos = `<div class="od-datos">${chip(v[1])}<span class="cl ${v[2]}">${v[2]}</span><span>Potencia <b>${v[3] ?? '—'}</b></span><span>Precisión <b>${v[4] ?? '—'}</b></span><span>PP <b>${v[5] ?? '—'}</b></span>
      ${aprenden ? `<span>La aprenden <b>${aprenden}</b> Pokémon</span>` : ''}<button class="boton boton-sec" type="button" id="odMov">Ver quién la aprende</button></div>`;
  }
  const desc = it ? descObjeto(i, j.id) : '';
  const datos = it ? [it.p ? `<span>Precio de venta en tienda: <b>${it.p.toLocaleString('es-ES')} ₽</b></span>` : '', `<span>${sub}</span>`].join('') : '';
  d.innerHTML = `<div class="od-cab"><div class="od-img">${icono}</div><div><small class="vacio">${sub} · ${esc(j.nombre)}</small><h2>${esc(titulo)}</h2></div><button class="cerrar" aria-label="Cerrar">✕</button></div>
    <div class="od-cuerpo">
      ${desc ? `<p class="od-desc">${esc(desc)}</p>` : ''}
      ${datos ? `<div class="od-datos">${datos}</div>` : ''}
      ${usos}
      <div><div class="seccion">Dónde se consigue en ${esc(j.nombre)}</div>
        ${entradas.length ? entradas.map((e, k) => { const ids = idsDelJuego(j, lugaresDonde(e));
          const tienda = /^Tienda:/.test(textoDonde(e));
          let det = ids.flatMap(id => { const ds = detallesEn(id, j.id, clave);
              if (tienda) return [[id, descGenerada(e, id, j, it), true], ...ds.map(d => [id, 'Además: ' + d, false])];
              return ds.length ? ds.map(d => [id, d, false]) : [[id, descGenerada(e, id, j, it), true]]; });
          // Lugares del texto que no se han podido enlazar: también llevan su línea
          const conLinea = new Set(ids.map(id => normT(nombreLugarJ(j, id))));
          for (const p of (e.wd ? [] : lugaresTexto(textoDonde(e)))) {
            if (conLinea.has(normT(p.nombre))) continue;
            conLinea.add(normT(p.nombre));
            // Se busca el lugar por su nombre en WikiDex antes de dar una descripción general
            const k = !tienda && Object.keys(OL()).find(x => OL()[x][j.id] && normT(nombreLugarJ(j, x)) === normT(p.nombre));
            const ds = k ? detallesEn(k, j.id, clave) : [];
            if (ds.length) ds.forEach(d => det.push(['@' + p.nombre, d, false]));
            else det.push(['@' + p.nombre, descGenerada(e, null, j, it, p.nombre), true]);
          }
          if (!det.length) det = [[null, descGenerada(e, null, j, it), true]];
          const vistos = new Set(); det = det.filter(([id, d]) => { const k = (id && id[0] === '@' ? id.slice(1) : id ? nombreLugarJ(j, id) : '') + '|' + d; return !vistos.has(k) && vistos.add(k); });
          return `<div class="od-lugar"><div class="od-texto"><p>${e.wd ? '<b>' + esc(textoDonde(e)) + '</b>' : esc(textoDonde(e))}</p><ul class="od-det">${det.map(([id, d, gen]) =>
            `<li class="${gen ? 'gen' : ''}">📍 ${id && (id[0] === '@' || ids.length > 1 || !e.wd) ? `<b>${esc(id[0] === '@' ? id.slice(1) : nombreLugarJ(j, id))}:</b> ` : ''}${esc(d)}${gen ? ' <small class="vacio">(descripción general)</small>' : ''}</li>`).join('')}</ul></div>${ids.length ? `<button class="boton" type="button" data-mapa="${k}">🗺 Ver en el mapa</button>` : ''}</div>`; }).join('')
        : `<p class="vacio">${((OB.llevan || {})[j.id] || {})[i] ? 'No tiene un sitio fijo: se consigue de los Pokémon salvajes que lo llevan (arriba). Usa Ladrón o Antojo, o captúralos.' : 'No hay datos de dónde conseguirlo en este juego.'}</p>`}</div>
      <div id="odMapa"></div>
    </div>`;
  d.querySelector('.cerrar').onclick = () => d.close();
  d.querySelectorAll('[data-pid]').forEach(b => b.onclick = () => { d.close(); irAPokemon(j.id, +b.dataset.pid); });
  if ($('odMov')) $('odMov').onclick = () => { d.close(); P.irMov(j.id, v[0]); };
  d.querySelectorAll('[data-mapa]').forEach(b => b.onclick = () => {
    d.querySelectorAll('[data-mapa]').forEach(x => x.classList.toggle('boton-sec', x !== b));
    const e = entradas[+b.dataset.mapa];
    mapaObjeto(j, idsDelJuego(j, lugaresDonde(e)), $('odMapa'), null, clave, id => descGenerada(e, id, j, it), /^Tienda:/.test(textoDonde(e)));
    $('odMapa').scrollIntoView({behavior: 'smooth', block: 'start'});
  });
  if (!d.open) d.showModal();
  d.scrollTop = 0;
}

function mapaObjeto(j, ids, caja, elegido, clave, generar, tienda) {
  const mapas = mapasConLugares(j, ids);
  const actual = elegido && mapas.some(([k]) => k === elegido) ? elegido : (mapas[0] || [])[0];
  const fotos = ids.map(id => [id, (window.LUGAR_FOTOS || {})[id]]);
  const nombre = id => { const u = (window.UBIC || {})[j.id]; const l = u && Object.values(u.locs).find(x => x[1] === id); return nombreLugar(id) !== id ? nombreLugar(id) : (l ? l[0] : id); };
  const fig = (src, pie) => `<figure><img src="${src}" alt="${esc(pie)}" referrerpolicy="no-referrer" loading="lazy" onload="if(this.naturalWidth<420)this.style.imageRendering='pixelated'" onerror="this.closest('figure').remove()"><figcaption>${esc(pie)}</figcaption></figure>`;
  const padre = id => window.zonaPadre && zonaPadre(j.id, id);
  caja.innerHTML = `<div class="od-mapa">
    ${mapas.length > 1 ? `<div class="pestanas">${mapas.map(([k, l]) => `<button data-m="${k}" class="${k === actual ? 'activa' : ''}">${esc(MAPAS[k].nombre.replace(/\s*\(mapa real\)/i, ''))} <span>(${l.length})</span></button>`).join('')}</div>` : ''}
    ${actual ? `<div class="mapa-caja">${svgMapa(MAPAS[actual], new Set(ids), null)}</div>
      <p class="nota">En rojo, ${ids.length > 1 ? 'los lugares' : 'el lugar'} donde se consigue${ids.some(padre) ? ' (las cuevas y edificios se marcan en la ruta o ciudad donde están)' : ''}. Mapa real: Pokéarth (serebii.net).</p>`
      : `<p class="vacio">Este juego no tiene un mapa con zonas para marcarlo${['25', '30'].includes(j.id) ? ' (el mapa de ' + (j.id === '25' ? 'Paldea' : 'Luminalia') + ' de Serebii solo tiene puntos de Pokémon)' : ''}. Abajo tienes el mapa de situación de WikiDex.</p>`}
    ${fotos.map(([id, lf]) => { const det = clave && !tienda ? detallesEn(id, j.id, clave) : [], marcas = ((OL()[id] || {})[j.id] || {}).i || [];
      const lineas = det.length ? det.map(d => `<li>📍 ${esc(d)}</li>`) : generar ? [`<li class="gen">📍 ${esc(generar(id))} <small class="vacio">(descripción general)</small></li>`] : [];
      return `<h3 style="margin:14px 0 0">${esc(nombre(id))}${padre(id) ? ` <small class="vacio">(en ${esc(nombreLugar(padre(id)))})</small>` : ''}</h3>
      ${lineas.length ? `<ul class="od-det od-det-grande">${lineas.join('')}</ul>` : ''}
      ${lf || marcas.length ? `<div class="od-fotos">${marcas.map(u => fig(u, 'Objetos de este lugar marcados (WikiDex)')).join('')}${lf && lf.mapa ? fig(lf.mapa, 'Situación en el mapa (WikiDex)') : ''}${lf && fotoLugarJuego(lf, j.id) ? fig(fotoLugarJuego(lf, j.id), 'Captura del lugar en el juego (WikiDex)') : ''}</div>`
        : '<p class="vacio">No hay imágenes de este lugar.</p>'}`; }).join('')}
    <p class="nota">Descripciones de dónde está cada objeto: WikiDex. Las capturas muestran el lugar en general.</p></div>`;
  caja.querySelectorAll('.pestanas button').forEach(b => b.onclick = () => mapaObjeto(j, ids, caja, b.dataset.m, clave));
}

(function () {
  const sel = $('juegoObj');
  [...D.juegos].sort((a, b) => b.orden - a.orden).forEach(j => { const o = document.createElement('option'); o.value = j.id; o.textContent = `${j.nombre} — Gen ${j.gen}`; sel.appendChild(o); });
  sel.addEventListener('change', listaObjetos);
  $('busObj').addEventListener('input', listaObjetos);
  document.addEventListener('vista', e => {
    if (e.detail !== 'vistaObj') return;
    if (!sel.dataset.listo) { sel.value = $('juego').value; sel.dataset.listo = 1; }
    $('busObj').value = filtroObj; listaObjetos();
  });
})();
window.irObjeto = (jid, nombre) => { filtroObj = nombre; catObj = ''; $('juegoObj').value = jid; $('juegoObj').dataset.listo = 1; document.querySelector('[data-vista=vistaObj]').click(); };

// ===================== NUZLOCKE =====================
const ESTADOS_NZ = [['equipo', 'En el equipo'], ['caja', 'En la caja'], ['muerto', 'Muerto'], ['fallido', 'Fallido (huyó o lo debilitaste)']];
async function nuzlocke(j) {
  const cont = $('contPart'); cont.dataset.m = 'nz' + j.id;
  const u = await cargarUbic(j.id);
  if (cont.dataset.m !== 'nz' + j.id) return;
  if (!u) { cont.innerHTML = `<div class="extra"><p class="vacio">No hay datos de zonas para ${esc(j.nombre)}.</p></div>`; return; }
  const clave = 'pokeguia.nuzlocke.' + j.id, nz = leerLS(clave, {zonas: {}});
  const {pasos, lugaresPaso, med} = P.pasosRuta(j, u);
  const porLugar = {};
  for (const [pid, encs] of Object.entries(u.p)) for (const e of encs) {
    if (/Intercambio|Evento|regalo|Huevo/i.test(e[1])) continue;
    (porLugar[e[0]] ||= new Set()).add(+pid);
  }
  const familia = s => (X.cad || {})[s] || s;
  const usadas = {};
  for (const [l, z] of Object.entries(nz.zonas)) if (z.pid && z.estado !== 'fallido') { const p = pk(z.pid); if (p) (usadas[familia(p.s)] ||= []).push(l); }
  const etiqueta = i => pasos[i].g ? `Antes del gimnasio ${pasos[i].g.num}` : pasos[i].liga ? 'Camino a la Liga' : 'Después';
  const vivos = Object.values(nz.zonas).filter(z => z.pid && (z.estado === 'equipo' || z.estado === 'caja')).length;
  const muertos = Object.entries(nz.zonas).filter(([, z]) => z.estado === 'muerto');
  const fallidos = Object.values(nz.zonas).filter(z => z.estado === 'fallido').length;
  const filas = lugaresPaso.map((ls, i) => ls.filter(l => porLugar[l]).sort((a, b) => med[a] - med[b]).map(l => {
    const z = nz.zonas[l] || {}, opciones = [...porLugar[l]].map(pk).filter(Boolean).sort((a, b) => nombrePoke(a).localeCompare(nombrePoke(b), 'es'));
    const p = z.pid && pk(z.pid), rep = p && (usadas[familia(p.s)] || []).length > 1;
    return `<tr class="nz-${z.estado || 'nada'}" data-l="${l}"><td><b>${esc(u.locs[l] ? u.locs[l][0] : l)}</b><br><small class="vacio">${etiqueta(i)}</small></td>
      <td>${p ? mini(p) : ''}<select class="nz-p"><option value="">—</option>${opciones.map(o => `<option value="${o.id}" ${o.id === z.pid ? 'selected' : ''}>${esc(nombrePoke(o))}${(usadas[familia(o.s)] || []).some(x => x !== String(l)) ? ' (repetido)' : ''}</option>`).join('')}</select>
        ${rep ? '<small class="aviso-nz">⚠ Especie repetida: con la cláusula de duplicados puedes volver a intentarlo</small>' : ''}</td>
      <td><input class="nz-mote" type="text" maxlength="12" placeholder="Mote" value="${esc(z.mote || '')}"></td>
      <td><select class="nz-e"><option value="">—</option>${ESTADOS_NZ.map(([k, n]) => `<option value="${k}" ${z.estado === k ? 'selected' : ''}>${n}</option>`).join('')}</select></td></tr>`;
  }).join('')).join('');
  cont.innerHTML = `<div class="extra"><h2 class="titulo-grupo" style="margin-top:0">Nuzlocke en ${esc(j.nombre)}</h2>
    <div class="nz-resumen"><div><b>${vivos}</b><small>vivos</small></div><div><b>${muertos.length}</b><small>muertos</small></div><div><b>${fallidos}</b><small>zonas fallidas</small></div>
    <div><b>${Object.values(nz.zonas).filter(z => z.pid || z.estado).length}</b><small>zonas usadas</small></div></div>
    <details class="nz-reglas"><summary>Reglas básicas</summary><ol><li>Solo puedes capturar el <b>primer Pokémon</b> que encuentres en cada zona. Si huye o lo debilitas, la zona queda fallida.</li>
      <li>Si un Pokémon se debilita, se considera <b>muerto</b>: no puedes volver a usarlo.</li><li>Ponle <b>mote</b> a todos.</li>
      <li>Cláusula de duplicados (opcional): si el primero es de una familia que ya tienes, puedes intentarlo con el siguiente.</li>
      <li>Si todo tu equipo se debilita, pierdes el reto.</li></ol></details>
    <div class="fila-ctrl"><button class="boton" id="nzEquipo" type="button">Usar los «En el equipo» como Mi equipo</button><button class="boton boton-sec" id="nzReset" type="button">Empezar de nuevo</button></div>
    <div class="tabla-mov-caja"><table class="tabla-zona tabla-nz"><thead><tr><th>Zona</th><th>Primer encuentro</th><th>Mote</th><th>Estado</th></tr></thead><tbody>${filas}</tbody></table></div>
    ${muertos.length ? `<h3>🪦 Cementerio</h3><div class="cementerio">${muertos.map(([l, z]) => { const p = pk(z.pid); return p ? `<div>${mini(p, ' style="filter:grayscale(1)"')}<b>${esc(z.mote || nombrePoke(p))}</b><small class="vacio">${esc(u.locs[l] ? u.locs[l][0] : '')}</small></div>` : ''; }).join('')}</div>` : ''}
    <p class="nota">Las zonas salen en el orden aproximado de la partida. Se guarda en este navegador (y entra en la copia de seguridad).</p></div>`;
  const guardar = () => guardarLS(clave, nz);
  cont.querySelectorAll('tr[data-l]').forEach(tr => {
    const l = tr.dataset.l, z = () => (nz.zonas[l] ||= {});
    tr.querySelector('.nz-p').onchange = e => { z().pid = +e.target.value || 0; if (z().pid && !z().estado) z().estado = 'equipo'; guardar(); nuzlocke(j); };
    tr.querySelector('.nz-mote').onchange = e => { z().mote = e.target.value; guardar(); };
    tr.querySelector('.nz-e').onchange = e => { z().estado = e.target.value; guardar(); nuzlocke(j); };
  });
  $('nzEquipo').onclick = () => {
    const eq = Object.values(nz.zonas).filter(z => z.estado === 'equipo' && z.pid).map(z => z.pid).slice(0, 6);
    if (!eq.length) { alert('No tienes ningún Pokémon marcado como «En el equipo».'); return; }
    guardarEquipo(j.id, eq); alert(`Guardado como Mi equipo de ${j.nombre}: ${eq.map(id => nombrePoke(pk(id))).join(', ')}.`);
  };
  $('nzReset').onclick = () => { if (confirm('¿Borrar todo el Nuzlocke de este juego?')) { guardarLS(clave, {zonas: {}}); nuzlocke(j); } };
}

// ===================== SHINY =====================
function infoShiny(j) {
  const id = j.id, g = +j.gen;
  if (g < 2) return {base: null};
  const m = [];
  let base = g <= 5 ? '1/8192' : '1/4096', amuleto = null;
  if (['3', '4'].includes(id)) m.push('Huevo de padres variocolores (Gyarados rojo del Lago de la Furia): 1/64');
  if (g === 4 || id === '23') m.push('Método Masuda (padres de distinto idioma): ' + (g === 4 ? '1/1638' : '1/683'), 'Poké Radar encadenando la misma especie (cadena de 40: ≈ 1/200)');
  if (g === 5) { m.push('Método Masuda: 1/1365'); if (id === '14') { amuleto = '1/2731'; m.push('Masuda + Amuleto Iris: 1/1024'); } }
  if (g >= 6) { amuleto = '1/1365'; m.push('Método Masuda: 1/683 (con Amuleto Iris: 1/512)'); }
  if (id === '15') m.push('Pesca encadenada (hasta ≈ 1/100)', 'Poké Radar (cadena de 40: ≈ 1/100)', 'Hordas (5 Pokémon a la vez)', 'Safari Amigo: 1/512');
  if (id === '16') m.push('DexNav (búsqueda con nivel de búsqueda alto)', 'Hordas (5 Pokémon a la vez)');
  if (['17', '18'].includes(id)) m.push('Cadenas de llamadas de auxilio (SOS): hasta ≈ 1/273 con Amuleto Iris');
  if (id === '18') m.push('Ultraumbral (Ultraespacio): más probabilidad cuanto más lejos llegues');
  if (id === '19') { amuleto = '1/1365'; m.push('Combos de captura (31 o más con Amuleto Iris e Incienso Atrayente: ≈ 1/273)'); }
  if (id === '20') m.push('Contador de combates de la Pokédex (500+ derrotados: hasta 1/683)', 'Aventuras Dinamax: 1/300 (1/100 con Amuleto Iris)', 'Brillos de la Pokédex (Pokémon con aura)');
  if (id === '24') m.push('Apariciones masivas y Brotes masivos', 'Investigación de la especie a nivel 10 y completa (+1 y +2 tiradas)', 'Amuleto Iris (+3 tiradas)');
  if (id === '25') m.push('Apariciones masivas (60 derrotados: +2 tiradas)', 'Sándwich con Poder Brillo 3 (+3 tiradas)', 'Todo junto con Amuleto Iris: ≈ 1/512');
  if (id === '30') m.push('Amuleto Iris (+tiradas)');
  if (id === '32') return {base: null, nota: 'Pokémon Champions es un juego de combates: los Pokémon vienen de otros juegos.'};
  return {base, amuleto, m};
}
function shiny(j) {
  const gen = +j.gen, info = infoShiny(j);
  if (!info.base) { $('contPart').innerHTML = `<div class="extra"><p class="vacio">${info.nota || 'Los Pokémon variocolores (shiny) aparecen a partir de la 2.ª generación.'}</p></div>`; return; }
  const clave = 'pokeguia.shiny.' + j.id, tengo = new Set(leerLS(clave, []));
  const vistos = new Set(), pokes = pokesDelJuego(j).filter(p => p.d && !vistos.has(p.s) && vistos.add(p.s));
  const filtro = P.estHer.shinyF || '';
  const lista = pokes.filter(p => filtro === 'si' ? tengo.has(p.s) : filtro === 'no' ? !tengo.has(p.s) : true);
  $('contPart').innerHTML = `<div class="dos-col"><div class="extra"><h3 style="margin-top:0">Probabilidad en ${esc(j.nombre)}</h3>
      <div class="datos-cr"><div><small>Normal</small><b>${info.base}</b></div>${info.amuleto ? `<div><small>Con Amuleto Iris</small><b>${info.amuleto}</b></div>` : ''}</div>
      ${info.m.length ? `<ul class="cambios-lista">${info.m.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}</div>
    <div class="extra prog-cab"><div class="anillo" style="--p:${tengo.size / Math.max(1, pokes.length) * 100}"><b>${tengo.size}</b><small>de ${pokes.length}</small></div>
      <div><p>Pulsa un Pokémon para marcarlo como conseguido en variocolor.</p>
      <select id="shinyF"><option value="">Todos</option><option value="si" ${filtro === 'si' ? 'selected' : ''}>Los que tengo</option><option value="no" ${filtro === 'no' ? 'selected' : ''}>Me faltan</option></select></div></div></div>
    <div class="extra"><div class="shiny-grid">${lista.map(p => `<button class="shiny-b ${tengo.has(p.s) ? 'on' : ''}" data-s="${p.s}" title="${esc(nombrePoke(p))}">
      <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/${p.id}.png" alt="" loading="lazy"
        onerror="this.onerror=null;this.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${p.id}.png'"><span>${esc(D.especies[p.s].n)}</span></button>`).join('')}</div>
    <p class="nota">Imágenes variocolor de PokeAPI (necesitan internet). Se guarda en este navegador.</p></div>`;
  $('shinyF').onchange = e => { P.recordar('shinyF', e.target.value); shiny(j); };
  $('contPart').querySelectorAll('.shiny-b').forEach(b => b.onclick = () => {
    const s = +b.dataset.s; tengo.has(s) ? tengo.delete(s) : tengo.add(s); guardarLS(clave, [...tengo]);
    b.classList.toggle('on', tengo.has(s)); $('contPart').querySelector('.anillo').style.setProperty('--p', tengo.size / pokes.length * 100);
    $('contPart').querySelector('.anillo b').textContent = tengo.size;
  });
}

window.PART_EXTRA = {nuzlocke, shiny};
window.HER_EXTRA = {mejores, captura};

// ===================== RIVALES Y VILLANOS (en Gimnasios) =====================
let modoGim = 'gim';
(function () {
  const lista = $('listaGim');
  const seg = document.createElement('div');
  seg.className = 'seg'; seg.id = 'modoGim'; seg.style.margin = '16px 0 0';
  seg.innerHTML = '<button type="button" data-m="gim" class="on">Gimnasios y Liga</button><button type="button" data-m="riv">Rivales y villanos</button>';
  lista.before(seg);
  const caja = document.createElement('div'); caja.id = 'rivalesGim'; caja.hidden = true; lista.before(caja);
  seg.querySelectorAll('button').forEach(b => b.onclick = () => { modoGim = b.dataset.m; aplicarModo(); });
  $('juegoGim').addEventListener('change', () => { if (modoGim === 'riv') pintarRivales(); });
})();
function aplicarModo() {
  document.querySelectorAll('#modoGim button').forEach(b => b.classList.toggle('on', b.dataset.m === modoGim));
  $('listaGim').hidden = $('detalleGim').hidden = modoGim !== 'gim';
  $('rivalesGim').hidden = modoGim !== 'riv';
  if (modoGim === 'riv') pintarRivales();
}
function pintarRivales() {
  const j = juegoDe($('juegoGim').value), gen = +j.gen, gs = R[j.id];
  const caja = $('rivalesGim');
  if (!gs || !gs.length) { caja.innerHTML = `<div class="extra"><p class="vacio">No tengo datos de rivales ni villanos de ${esc(j.nombre)}.</p></div>`; return; }
  const {tipos, t} = tablaGen(gen);
  let n = 0;
  caja.innerHTML = gs.map(g => `<h2 class="titulo-grupo">${esc(g.grupo)}</h2><div class="riv-lista">${g.combates.map(c => {
    const k = n++;
    const nvs = c.equipo.map(m => m.nv).filter(Boolean);
    return `<details class="riv-card" data-k="${k}"><summary><div class="riv-sum"><b>${esc(c.titulo)}</b><small class="vacio">${esc(c.entrenador)}${c.nota ? ' · ' + esc(c.nota) : ''}${nvs.length ? ' · Nv. ' + Math.min(...nvs) + (Math.max(...nvs) !== Math.min(...nvs) ? '–' + Math.max(...nvs) : '') : ''}</small></div>
      <div class="minis">${c.equipo.map(m => { const p = pk(m.pid) || pk(m.s); return p ? mini(p) : ''; }).join('')}</div></summary><div class="riv-det"></div></details>`; }).join('')}</div>`).join('') +
    `<p class="nota">${gs[0].fuente === 'pret' ? 'Datos sacados del código de los juegos originales (proyectos de desensamblado pret). Los nombres de los combates son los del código.' : 'Datos de Serebii (serebii.net).'} Si el rival depende de tu inicial, cada variante sale como un combate aparte.</p>`;
  const todos = gs.flatMap(g => g.combates);
  caja.querySelectorAll('.riv-card').forEach(d => d.addEventListener('toggle', () => {
    if (!d.open || d.dataset.listo) return; d.dataset.listo = 1;
    const c = todos[+d.dataset.k], det = d.querySelector('.riv-det');
    const miembros = c.equipo.map(m => {
      const p = pk(m.pid) || pk(m.s); if (!p) return '';
      const ts = tiposEnGen(p, gen), deb = tipos.map(a => [a, ts.reduce((x, y) => x * P.mult(t, a, y), 1)]).filter(x => x[1] >= 2).sort((a, b) => b[1] - a[1]);
      return `<div class="miembro" style="--c:${COLOR[ts[0]]}"><div class="top">${mini(p)}<div><h4>${esc(nombrePoke(p))}</h4><small class="vacio">${m.nv ? 'Nivel ' + m.nv : ''}${m.o ? ' · ' + esc(m.o) : ''}</small>
        <div class="chips" style="margin-top:4px">${ts.map(x => chip(x)).join('')}</div></div></div>
        ${m.m && m.m.length ? `<div class="fila"><span class="e">Movimientos</span>${m.m.map(id => MV()[id] ? `<span class="mov-chip" style="--c:${COLOR[MV()[id][1]]}">${esc(MV()[id][0])}</span>` : '').join('')}</div>` : ''}
        <div class="fila"><span class="e">Débil a</span>${deb.map(([a, v]) => chip(a, v)).join('') || '<span class="vacio">Nada</span>'}</div></div>`;
    }).join('');
    det.innerHTML = `<div class="equipo">${miembros}</div><div class="resumen vs-riv"></div>`;
    liderVsEquipo(j, {n: c.titulo + d.dataset.k, equipo: c.equipo.map(m => ({...m, pid: (pk(m.pid) || pk(m.s) || {}).id}))}, det.querySelector('.vs-riv'), 'Tu equipo contra este combate');
  }));
}

// ===================== MI EQUIPO: varios equipos, evoluciones, equipo automático =====================
const CLAVE_EQS = 'pokeguia.equipos.';
function equipos(jid) {
  let e = leerLS(CLAVE_EQS + jid, null);
  if (!e || !e.lista) { e = {activo: 'Equipo 1', lista: {'Equipo 1': leerEquipo(jid)}}; guardarLS(CLAVE_EQS + jid, e); }
  return e;
}
function barraEquipos() {
  const jid = $('juegoEq').value, e = equipos(jid);
  e.lista[e.activo] = leerEquipo(jid); guardarLS(CLAVE_EQS + jid, e);
  let barra = $('barraEq');
  if (!barra) { barra = document.createElement('div'); barra.id = 'barraEq'; barra.className = 'fila-ctrl'; $('huecos').before(barra); }
  barra.innerHTML = `<div style="flex:1;min-width:180px"><label class="etq-ctrl" for="selEq">Equipo guardado</label><select id="selEq">${Object.keys(e.lista).map(n => `<option ${n === e.activo ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></div>
    <button class="boton boton-sec" type="button" id="eqNuevo">＋ Nuevo</button><button class="boton boton-sec" type="button" id="eqRen">Renombrar</button><button class="boton boton-sec" type="button" id="eqBorrar" ${Object.keys(e.lista).length < 2 ? 'disabled' : ''}>Borrar</button>`;
  const cambiar = nombre => { const x = equipos(jid); x.lista[x.activo] = leerEquipo(jid); x.activo = nombre; guardarLS(CLAVE_EQS + jid, x); guardarEquipo(jid, x.lista[nombre] || []); mostrarEquipo(); };
  $('selEq').onchange = ev => cambiar(ev.target.value);
  $('eqNuevo').onclick = () => { const n = (prompt('Nombre del equipo nuevo:', 'Equipo ' + (Object.keys(e.lista).length + 1)) || '').trim(); if (!n) return;
    const x = equipos(jid); if (x.lista[n]) { alert('Ya hay un equipo con ese nombre.'); return; } x.lista[x.activo] = leerEquipo(jid); x.lista[n] = []; guardarLS(CLAVE_EQS + jid, x); cambiar(n); };
  $('eqRen').onclick = () => { const x = equipos(jid), n = (prompt('Nuevo nombre:', x.activo) || '').trim(); if (!n || n === x.activo || x.lista[n]) return;
    x.lista[n] = x.lista[x.activo]; delete x.lista[x.activo]; x.activo = n; guardarLS(CLAVE_EQS + jid, x); barraEquipos(); };
  $('eqBorrar').onclick = () => { const x = equipos(jid); if (!confirm(`¿Borrar el equipo «${x.activo}»?`)) return; delete x.lista[x.activo]; const n = Object.keys(x.lista)[0]; x.activo = n; guardarLS(CLAVE_EQS + jid, x); guardarEquipo(jid, x.lista[n]); mostrarEquipo(); };
}

async function evolucionesEquipo() {
  const jid = $('juegoEq').value, j = juegoDe(jid), gen = +j.gen;
  let caja = $('evoEq');
  if (!caja) { caja = document.createElement('div'); caja.id = 'evoEq'; $('analisisEq').after(caja); }
  const eq = leerEquipo(jid).map(pk).filter(Boolean);
  if (!eq.length) { caja.innerHTML = ''; return; }
  const niveles = leerLS('pokeguia.niveles.' + jid, {});
  const mj = await cargarMovs(jid);
  const filas = eq.map(p => {
    const nv = niveles[p.id] || 50;
    const sig = Object.entries(X.evo || {}).filter(([s, e]) => e.de === p.s && D.especies[s] && D.especies[s].g <= gen && enJuego(j, +s)).map(([s]) => +s);
    const evo = sig.map(s => {
      const txt = metodoEvo(s, j) || '';
      const m = txt.match(/Nivel (\d+)/), req = m ? +m[1] : null;
      let estado = '';
      if (req) estado = nv >= req ? '<b class="sube">¡Ya puede evolucionar!</b>' : `<span class="vacio">Faltan ${req - nv} niveles</span>`;
      const obj = Object.entries(OB.nombres).sort((a, b) => b[1].length - a[1].length).find(([i, n]) => n && txt.toLowerCase().includes(n.toLowerCase()));
      const donde = obj && (OB.donde[jid] || {})[obj[0]];
      const pe = (POR_ESPECIE[s] || []).find(x => x.d);
      return `<div class="evo-sig">${pe ? mini(pe) : ''}<div><b>${esc(D.especies[s].n)}</b><small>${esc(txt) || 'Método especial'}</small>${estado}
        ${donde ? `<small class="vacio">📍 ${esc(OB.nombres[obj[0]])}: ${esc(donde.slice(0, 2).map(textoDonde).join(' · '))}</small>` : ''}</div></div>`;
    }).join('');
    const mm = mejoresMovs(p, gen, P.setPoke(mj, p), nv, true);
    return `<div class="evo-fila"><div class="evo-yo">${mini(p)}<div><b>${esc(nombrePoke(p))}</b><label class="vacio">Nv. <input type="number" min="1" max="100" value="${nv}" class="num-in nv-eq" data-pid="${p.id}"></label></div></div>
      <div class="evo-col2"><div class="seccion">Evolución</div>${evo || '<span class="vacio">No evoluciona más en este juego</span>'}</div>
      <div class="evo-col2"><div class="seccion">Movimientos recomendados</div><div class="chips">${chipsMovs(mm)}</div></div></div>`;
  }).join('');
  caja.innerHTML = `<div class="extra"><h2 class="titulo-grupo" style="margin-top:0">Evoluciones y movimientos de tu equipo</h2>${filas}
    <p class="nota">Pon el nivel de cada uno para saber si ya puede evolucionar. Movimientos recomendados: los mejores de los que puede aprender a ese nivel (con MT y tutores).</p></div>`;
  caja.querySelectorAll('.nv-eq').forEach(i => i.onchange = () => { const n = leerLS('pokeguia.niveles.' + jid, {}); n[i.dataset.pid] = Math.max(1, Math.min(100, +i.value || 50)); guardarLS('pokeguia.niveles.' + jid, n); evolucionesEquipo(); });
}

async function equipoAuto() {
  const jid = $('juegoEq').value, j = juegoDe(jid), gen = +j.gen;
  let caja = $('autoEq');
  if (!caja) { caja = document.createElement('div'); caja.id = 'autoEq'; $('analisisEq').before(caja); }
  const u = await cargarUbic(jid);
  if (!u) { caja.innerHTML = ''; return; }
  const {pasos, lugaresPaso} = P.pasosRuta(j, u);
  const etq = (p, i) => p.g ? `Hasta el gimnasio ${p.g.num} (${p.g.lideres[0].n})` : p.liga ? 'Hasta la Liga Pokémon' : 'Partida completa';
  const sel = P.estHer['auto' + jid] ?? pasos.length - 1;
  caja.innerHTML = `<div class="extra"><h2 class="titulo-grupo" style="margin-top:0">Equipo automático</h2>
    <div class="fila-ctrl"><div style="flex:1;min-width:200px"><label class="etq-ctrl" for="autoHasta">Pokémon disponibles</label><select id="autoHasta">${pasos.map((p, i) => `<option value="${i}" ${i === +sel ? 'selected' : ''}>${esc(etq(p, i))}</option>`).join('')}</select></div>
    <span><input type="checkbox" id="autoLeg" checked> <label for="autoLeg">Sin legendarios</label></span>
    <button class="boton" id="autoGen" type="button">✨ Generar</button></div><div id="autoRes"></div></div>`;
  $('autoGen').onclick = () => {
    const hasta = +$('autoHasta').value; P.recordar('auto' + jid, hasta);
    const cap = isFinite(pasos[hasta].nv) ? pasos[hasta].nv : 100;
    const lugares = new Set(lugaresPaso.slice(0, hasta + 1).flat());
    const dondeEsp = {};
    for (const [pid, encs] of Object.entries(u.p)) for (const e of encs) if (lugares.has(e[0]) && !/Intercambio|Evento/i.test(e[1])) { const p = pk(+pid); if (p) dondeEsp[p.s] ||= u.locs[e[0]] ? u.locs[e[0]][0] : ''; }
    const {tipos, t} = tablaGen(gen);
    // Evoluciona mientras sea por nivel ≤ límite o con objeto
    const evoluciona = s => { let x = s; for (let k = 0; k < 3; k++) {
      const sig = Object.entries(X.evo || {}).filter(([y, e]) => e.de === x && D.especies[y] && D.especies[y].g <= gen && enJuego(j, +y)).map(([y]) => +y);
      const ok = sig.find(y => { const m = (metodoEvo(y, j) || '').match(/Nivel (\d+)/); return m ? +m[1] <= cap : /Piedra|piedra/.test(metodoEvo(y, j) || '') && hasta >= 2; });
      if (!ok) break; x = ok; } return x; };
    const legs = new Set(X.leg || []);
    const cand = new Map();
    for (const s of Object.keys(dondeEsp).map(Number)) {
      const fin = evoluciona(s), p = (POR_ESPECIE[fin] || []).find(x => x.d);
      if (!p || ($('autoLeg').checked && legs.has(fin))) continue;
      const fam = (X.cad || {})[fin] || fin, bst = statsEn(p.id, gen).reduce((a, b) => a + b, 0);
      if (!cand.has(fam) || cand.get(fam).bst < bst) cand.set(fam, {p, bst, de: s, donde: dondeEsp[s]});
    }
    const elegidos = [];
    const lista = [...cand.values()];
    while (elegidos.length < 6 && lista.length) {
      let mejor = null, pts = -1;
      for (const c of lista) {
        const ts = tiposEnGen(c.p, gen);
        let f = c.bst;
        const repetidos = ts.filter(x => elegidos.some(e => tiposEnGen(e.p, gen).includes(x))).length;
        f *= Math.pow(.6, repetidos);
        const debil = tipos.filter(a => ts.reduce((x, y) => x * P.mult(t, a, y), 1) >= 2);
        const comunes = debil.filter(a => elegidos.filter(e => tiposEnGen(e.p, gen).reduce((x, y) => x * P.mult(t, a, y), 1) >= 2).length >= 2).length;
        f *= Math.pow(.85, comunes);
        if (f > pts) { pts = f; mejor = c; }
      }
      elegidos.push(mejor); lista.splice(lista.indexOf(mejor), 1);
    }
    $('autoRes').innerHTML = elegidos.length ? `<div class="auto-grid">${elegidos.map(c => `<div class="auto-card" style="--c:${COLOR[tiposEnGen(c.p, gen)[0]]}">${mini(c.p)}
      <div><b>${esc(nombrePoke(c.p))}</b><div class="chips">${tiposEnGen(c.p, gen).map(x => chip(x)).join('')}</div>
      <small class="vacio">Total ${c.bst}${c.de !== c.p.s ? ' · evoluciona de ' + esc(D.especies[c.de].n) : ''}${c.donde ? ' · ' + esc(c.donde) : ''}</small></div></div>`).join('')}</div>
      <div class="fila-ctrl"><button class="boton" id="autoUsar" type="button">Guardar como equipo nuevo</button></div>
      <p class="nota">Elige los Pokémon salvajes disponibles hasta ese punto (evolucionados si llegan por nivel), con buenas estadísticas, tipos variados y sin acumular las mismas debilidades.</p>`
      : '<p class="vacio">No hay suficientes Pokémon disponibles hasta ese punto.</p>';
    if ($('autoUsar')) $('autoUsar').onclick = () => {
      const x = equipos(jid); x.lista[x.activo] = leerEquipo(jid);
      let n = 'Automático'; let k = 2; while (x.lista[n]) n = 'Automático ' + k++;
      x.lista[n] = elegidos.map(c => c.p.id); x.activo = n; guardarLS(CLAVE_EQS + jid, x); guardarEquipo(jid, x.lista[n]); mostrarEquipo();
    };
  };
}
let tEq = null;
new MutationObserver(() => { clearTimeout(tEq); tEq = setTimeout(() => { if ($('vistaEq').hidden) return; barraEquipos(); evolucionesEquipo(); if (!$('autoEq') || $('autoEq').dataset.j !== $('juegoEq').value) { equipoAuto(); setTimeout(() => $('autoEq') && ($('autoEq').dataset.j = $('juegoEq').value), 0); } }, 60); })
  .observe($('huecos'), {childList: true, subtree: true});

// ===================== GRITOS =====================
new MutationObserver(() => {
  const foto = document.querySelector('#ficha .foto');
  if (!foto || foto.querySelector('.btn-grito')) return;
  const pid = +$('pokemon').value, gen = +(juegoDe($('juego').value) || {gen: 9}).gen;
  const b = document.createElement('button');
  b.className = 'btn-grito'; b.type = 'button'; b.title = 'Escuchar su grito'; b.innerHTML = '🔊 Grito';
  b.onclick = () => {
    const base = 'https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/';
    const a = new Audio(base + (gen <= 5 ? 'legacy/' : 'latest/') + pid + '.ogg');
    a.volume = .6;
    a.onerror = () => { if (!a.src.includes('latest')) { const a2 = new Audio(base + 'latest/' + pid + '.ogg'); a2.volume = .6; a2.play().catch(() => {}); } };
    a.play().catch(() => {});
  };
  foto.appendChild(b);
}).observe($('ficha'), {childList: true, subtree: true});

// ===================== BÚSQUEDA GLOBAL =====================
(function () {
  const cab = document.querySelector('.cab');
  const caja = document.createElement('div'); caja.className = 'busca-global';
  caja.innerHTML = '<input type="search" id="buscaG" placeholder="Busca un Pokémon, movimiento, zona, líder…" autocomplete="off" aria-label="Búsqueda global"><kbd>/</kbd><div class="bg-sug" id="sugG" hidden></div>';
  cab.querySelector('.vistas').before(caja);
  const norm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const jAct = () => juegoDe($('juego').value);
  let indice = [], jIdx = null, sel = 0, res = [];
  async function construir() {
    const j = jAct(); if (jIdx === j.id) return; jIdx = j.id;
    indice = [];
    for (const [s, e] of Object.entries(D.especies)) {
      const p = (POR_ESPECIE[s] || []).find(x => x.d); if (!p) continue;
      indice.push({t: e.n, k: 'Pokémon', img: sprite(p.id), go: () => { const jj = enJuego(j, +s) ? j : [...D.juegos].sort((a, b) => b.orden - a.orden).find(x => enJuego(x, +s)) || j; irAPokemon(jj.id, p.id); }});
    }
    for (const t of TIPOS) indice.push({t: NOMBRE[t], k: 'Tipo', color: COLOR[t], go: () => {
      const jt = juegoDe($('juegoTab').dataset.listo ? $('juegoTab').value : $('juego').value) || j;
      $('juegoTab').value = tablaGen(+jt.gen).tipos.includes(t) ? jt.id : [...D.juegos].sort((a, b) => b.orden - a.orden).find(x => x.megas !== undefined && +x.gen >= 6 && x.id !== '32').id;
      $('juegoTab').dataset.listo = 1; estTab.modo = 'def'; estTab.sel = [t]; document.querySelector('[data-vista=vistaTab]').click(); }});
    const vistosMov = new Set();
    for (const [id, v] of Object.entries(MV())) if (!vistosMov.has(v[0])) { vistosMov.add(v[0]); indice.push({t: v[0], k: 'Movimiento', color: COLOR[v[1]], go: () => P.irMov(j.id, v[0])}); }
    (G[j.id] || []).forEach((g, i) => g.lideres.forEach(l => indice.push({t: l.n, k: g.tipo === 'gym' ? 'Líder · ' + g.lugar : g.tipo === 'elite4' ? 'Alto Mando' : g.tipo === 'champion' ? 'Campeón' : 'Kahuna', img: l.img,
      go: () => { document.querySelector('[data-vista=vistaGim]').click(); $('juegoGim').value = j.id; modoGim = 'gim'; aplicarModo(); gimSel = i; liderSel = 0; mostrarListaGim(); }})));
    for (const [i, n] of Object.entries(OB.nombres)) if ((OB.donde[j.id] || {})[i]) indice.push({t: n, k: 'Objeto', img: imgObjeto(i), go: () => irObjeto(j.id, n)});
    const u = await cargarUbic(j.id);
    if (u) for (const [l, v] of Object.entries(u.locs)) indice.push({t: v[0], k: 'Zona', go: () => P.irZona(j.id, l)});
  }
  const inp = $('buscaG'), sug = $('sugG');
  const pintar = () => {
    const q = norm(inp.value.trim());
    if (!q) { sug.hidden = true; return; }
    const emp = [], cont = [];
    for (const x of indice) { const n = norm(x.t); if (n.startsWith(q)) emp.push(x); else if (n.includes(q)) cont.push(x); if (emp.length > 30) break; }
    res = [...emp, ...cont].slice(0, 12); sel = 0;
    sug.innerHTML = res.length ? res.map((x, i) => `<button type="button" class="sug-i ${i === sel ? 'on' : ''}" data-i="${i}">${x.img ? `<img src="${x.img}" alt="" loading="lazy">` : `<i style="background:${x.color || 'var(--acento)'}"></i>`}<span>${esc(x.t)}</span><small>${esc(x.k)}</small></button>`).join('')
      : '<p class="vacio" style="padding:10px 14px;margin:0">Sin resultados en este juego.</p>';
    sug.hidden = false;
    sug.querySelectorAll('.sug-i').forEach(b => b.onmousedown = e => { e.preventDefault(); ir(+b.dataset.i); });
  };
  const ir = i => { const x = res[i]; if (!x) return; inp.value = ''; sug.hidden = true; inp.blur(); x.go(); window.scrollTo({top: 0, behavior: 'smooth'}); };
  inp.addEventListener('focus', async () => { await construir(); pintar(); });
  inp.addEventListener('input', async () => { await construir(); pintar(); });
  inp.addEventListener('blur', () => setTimeout(() => sug.hidden = true, 150));
  inp.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); sel = (sel + (e.key === 'ArrowDown' ? 1 : res.length - 1)) % Math.max(1, res.length);
      sug.querySelectorAll('.sug-i').forEach((b, i) => b.classList.toggle('on', i === sel)); }
    else if (e.key === 'Enter') { e.preventDefault(); ir(sel); }
    else if (e.key === 'Escape') { sug.hidden = true; inp.blur(); }
  });
  document.addEventListener('keydown', e => { if (e.key === '/' && !/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); inp.focus(); } });
  $('juego').addEventListener('change', () => { jIdx = null; });
})();

// ===================== MAPAS REALES: cuevas y mazmorras =====================
// Los mapas de Serebii solo tienen ciudades y rutas. Las cuevas, bosques, torres... se colocan en la zona real
// más cercana según la posición que tenían en el mapa esquemático (que ya no se muestra).
(function () {
  for (const [jid, keys] of Object.entries(window.MAPAS_JUEGO || {})) {
    const reales = keys.filter(k => MAPAS[k] && MAPAS[k].fondo && !MAPAS[k].puntos), esq = keys.filter(k => MAPAS[k] && !MAPAS[k].fondo);
    reales.forEach(k => { enMapa(MAPAS[k], ''); MAPAS[k]._padre ||= {}; });
    const enReal = id => reales.some(k => !MAPAS[k]._padre[id] && (MAPAS[k]._areas || []).some(a => a.ids.includes(id)));
    for (const ke of esq) {
      const S = MAPAS[ke]; enMapa(S, '');
      const pos = {};
      for (const [id, n] of Object.entries(S._nodos || {})) pos[id] = [n[0], n[1]];
      for (const [id, [a, b]] of (S.rutas || [])) if (pos[a] && pos[b] && !pos[id]) pos[id] = [(pos[a][0] + pos[b][0]) / 2, (pos[a][1] + pos[b][1]) / 2];
      for (const z of (S.zonas || [])) { if (!pos[z.id]) pos[z.id] = [z.x, z.y]; (z.hijos || []).forEach(h => { if (!pos[h]) pos[h] = [z.x, z.y]; }); }
      let R = null, mejorN = 0;
      for (const kr of reales) { const n = Object.keys(pos).filter(id => (MAPAS[kr]._areas || []).some(a => a.ids.includes(id))).length; if (n > mejorN) { mejorN = n; R = MAPAS[kr]; } }
      if (!R || mejorN < 3) continue;
      const areaDe = id => R._areas.find(a => a.ids.includes(id));
      for (const [id, [x, y]] of Object.entries(pos)) {
        if (enReal(id) || R._padre[id]) continue;
        let area = null, d = Infinity;
        for (const [id2, [x2, y2]] of Object.entries(pos)) {
          if (id2 === id || R._padre[id2]) continue;
          const a = areaDe(id2); if (!a) continue;
          const dd = (x - x2) ** 2 + (y - y2) ** 2; if (dd < d) { d = dd; area = a; }
        }
        if (!area) continue;
        area.ids.push(id);
        R._padre[id] = area.ids[0];
      }
    }
  }
  // Correcciones a mano: dónde está de verdad cada lugar
  const FIJO = {
    'petalburg-woods': 'hoenn-route-104', 'jagged-pass': 'hoenn-route-112', 'fiery-path': 'hoenn-route-112', 'mt-pyre': 'hoenn-route-122',
    'seafloor-cavern': 'hoenn-route-128', 'shoal-cave': 'hoenn-route-125', 'new-mauville': 'hoenn-route-110', 'abandoned-ship': 'hoenn-route-108',
    'sky-pillar': 'hoenn-route-131', 'hoenn-safari-zone': 'hoenn-route-121', 'desert-ruins': 'hoenn-route-111', 'mirage-tower': 'hoenn-route-111',
    'team-magma-hideout': 'hoenn-route-112', 'magma-hideout': 'hoenn-route-112', 'scorched-slab': 'hoenn-route-120', 'island-cave': 'hoenn-route-105',
    'ancient-tomb': 'hoenn-route-120', 'desert-underpass': 'hoenn-route-114', 'hoenn-altering-cave': 'hoenn-route-103', 'artisan-cave': 'battle-frontier',
    'sea-mauville': 'hoenn-route-108', 'mirage-island': 'hoenn-route-130', 'cerulean-cave': 'cerulean-city', 'monean-chamber': 'tanoby-ruins',
    'scufib-chamber': 'tanoby-ruins', 'viapos-chamber': 'tanoby-ruins', 'pastoria-city': 'sinnoh-route-213', 'great-marsh': 'sinnoh-route-213',
    'wayward-cave': 'sinnoh-route-206', 'oreburgh-gate': 'sinnoh-route-203', 'ruin-maniac-cave': 'sinnoh-route-214', 'maniac-tunnel': 'sinnoh-route-214',
    'trophy-garden': 'sinnoh-route-212', 'liberty-garden': 'castelia-city', 'distortion-world': 'turnback-cave'
  };
  for (const m of Object.values(MAPAS)) {
    if (!m || !m._padre) continue;
    for (const [id, dest] of Object.entries(FIJO)) {
      if (!m._padre[id]) continue;
      const nueva = m._areas.find(a => a.ids[0] === dest || (a.ids.includes(dest) && !m._padre[dest]));
      if (!nueva) continue;
      const vieja = m._areas.find(a => a.ids.includes(id));
      if (vieja) vieja.ids.splice(vieja.ids.indexOf(id), 1);
      nueva.ids.push(id); m._padre[id] = nueva.ids[0];
    }
  }
})();
window.zonaPadre =(jid, id) => { for (const k of (MAPAS_JUEGO[jid] || [])) { const p = MAPAS[k] && MAPAS[k]._padre && MAPAS[k]._padre[id]; if (p) return p; } return null; };

// ===================== APP INSTALABLE (PWA) =====================
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
})();
