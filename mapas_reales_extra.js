// Mapas reales (imágenes de Pokéarth, serebii.net; solo para uso personal).
// - Kanto a Kalos: zonas de cada lugar sacadas del mapa interactivo de Serebii (mapas_reales.js).
// - Alola, Galar e Hisui: posiciones colocadas a mano sobre la imagen (aproximadas).
// - Paldea, Noroteo, Terario y Luminalia: puntos exactos de aparición de cada Pokémon (mapas_puntos/*.js).
(function () {
  const TAM = { kanto: [200, 618], johto: [166, 144], hoenn: [306, 221], sinnoh: [216, 168], unova: [256, 168], kalos: [320, 210] };
  const NOMBRE = { kanto: 'Kanto e Islas Sete', johto: 'Johto', hoenn: 'Hoenn', sinnoh: 'Sinnoh', unova: 'Teselia', kalos: 'Kalos' };
  for (const [r, d] of Object.entries(window.MAPAS_REALES || {})) {
    MAPAS['real_' + r] = { nombre: NOMBRE[r] + ' (mapa real)', fondo: { img: d.img, w: TAM[r][0], h: TAM[r][1], pixel: true }, areas: d.zonas };
  }
  // La imagen de Kanto lleva debajo las Islas Sete: se separan en dos mapas
  if (MAPAS.real_kanto) {
    const k = MAPAS.real_kanto;
    MAPAS.real_sevii = { nombre: 'Islas Sete (mapa real)', fondo: { ...k.fondo, recorte: [0, 150, 200, 468] }, areas: k.areas };
    k.nombre = 'Kanto (mapa real)';
    k.fondo = { ...k.fondo, recorte: [0, 0, 200, 150] };
  }

  // Galar (728x1420): Galar, Isla de la Armadura (círculo derecho) y Nieves de la Corona (abajo)
  MAPAS.real_galar = { nombre: 'Galar (mapa real)', fondo: { img: 'mapas_reales/galar.jpg', w: 728, h: 1420 }, rutas: [],
    nodos: {
      'wyndon':[190,130,'c'], 'galar-battle-tower':[240,165,'l'], 'galar-route-10':[195,300,'l'], 'circhester':[312,368,'c'],
      'galar-route-9':[340,420,'l'], 'spikemuth':[360,485,'c'], 'hammerlocke':[190,478,'c'], 'energy-plant':[196,455,'l'],
      'galar-route-7':[250,492,'l'], 'galar-route-8':[268,435,'l'], 'ballonlea':[75,338,'c'], 'glimwood-tangle':[95,385,'l'],
      'stow-on-side':[92,445,'c'], 'galar-route-6':[110,478,'l'], 'motostoke':[185,652,'c'], 'motostoke-outskirts':[245,655,'l'],
      'galar-route-3':[107,656,'l'], 'galar-mine':[70,630,'l'], 'galar-route-4':[67,600,'l'], 'turffield':[70,565,'c'],
      'galar-route-5':[150,578,'l'], 'hulbury':[285,575,'c'], 'galar-mine-no-2':[285,622,'l'], 'wedgehurst':[200,905,'c'],
      'galar-route-2':[235,885,'l'], 'galar-route-1':[200,945,'l'], 'postwick':[232,960,'c'], 'slumbering-weald':[132,982,'l'],
      'stony-wilderness':[140,560,'l'], 'dusty-bowl':[160,522,'l'], 'giants-mirror':[140,600,'l'], 'hammerlocke-hills':[232,522,'l'],
      'giants-cap':[168,582,'l'], 'lake-of-outrage':[128,528,'l'], 'bridge-field':[205,560,'l'], 'motostoke-riverbank':[215,620,'l'],
      'meetup-spot':[185,830,'l'], 'rolling-fields':[148,792,'l'], 'dappled-grove':[140,760,'l'], 'watchtower-ruins':[150,728,'l'],
      'east-lake-axewell':[222,760,'l'], 'west-lake-axewell':[176,762,'l'], 'axews-eye':[200,742,'l'], 'south-lake-miloch':[190,710,'l'],
      'north-lake-miloch':[175,690,'l'], 'giants-seat':[222,700,'l'], 'galar-wild-area-max-dens':[200,775,'l'], 'roaming-galar-wild-area':[160,700,'l'],
      // Isla de la Armadura
      'master-dojo':[590,442,'c'], 'fields-of-honor':[482,470,'l'], 'soothing-wetlands':[482,540,'l'], 'forest-of-focus':[560,520,'l'],
      'challenge-beach':[592,470,'l'], 'brawlers-cave':[585,428,'l'], 'challenge-road':[600,448,'l'], 'loop-lagoon':[500,582,'l'],
      'training-lowlands':[560,560,'l'], 'potbottom-desert':[602,540,'l'], 'workout-sea':[448,500,'l'], 'stepping-stone-sea':[602,600,'l'],
      'insular-sea':[440,570,'l'], 'honeycalm-sea':[500,430,'l'], 'honeycalm-island':[508,420,'l'], 'courageous-cavern':[580,412,'l'],
      'warm-up-tunnel':[540,562,'l'], 'isle-of-armor-caves':[555,592,'l'], 'roaming-isle-of-armor':[520,500,'l'],
      // Nieves de la Corona
      'freezington':[112,1190,'c'], 'slippery-slope':[115,1140,'l'], 'frostpoint-field':[125,1232,'l'], 'giants-bed':[200,1150,'l'],
      'old-cemetery':[150,1172,'l'], 'snowslide-slope':[232,1100,'l'], 'tunnel-to-the-top':[205,1088,'l'], 'path-to-the-peak':[205,1062,'l'],
      'crown-shrine':[200,1035,'l'], 'dyna-tree-hill':[200,1050,'l'], 'giants-foot':[262,1215,'l'], 'roaring-sea-caves':[330,1205,'l'],
      'frigid-sea':[362,1185,'l'], 'three-point-pass':[160,1252,'l'], 'ballimere-lake':[200,1350,'l'], 'lakeside-cave':[180,1320,'l'],
      'galar-iceberg-ruins':[272,1168,'l'], 'galar-iron-ruins':[190,1222,'l'], 'galar-rock-peak-ruins':[100,1160,'l'],
      'split-decision-ruins':[265,1290,'l'], 'max-lair':[205,1345,'l'], 'roaming-crown-tundra':[150,1300,'l']
    } };

  // La imagen de Galar se separa en tres mapas (misma imagen, distinto recorte)
  const g = MAPAS.real_galar;
  MAPAS.real_armadura = { ...g, nombre: 'Isla de la Armadura (mapa real)', fondo: { ...g.fondo, recorte: [410, 385, 270, 250] } };
  MAPAS.real_corona = { ...g, nombre: 'Nieves de la Corona (mapa real)', fondo: { ...g.fondo, recorte: [40, 1005, 380, 410] } };
  g.fondo = { ...g.fondo, recorte: [0, 80, 400, 930] };
  // En cada recorte solo cuentan los lugares que caen dentro
  const todosGalar = g.nodos;
  for (const k of ['real_galar', 'real_armadura', 'real_corona']) {
    const m = MAPAS[k], [x0, y0, w0, h0] = m.fondo.recorte;
    m.nodos = Object.fromEntries(Object.entries(todosGalar).filter(([, [x, y]]) => x >= x0 && x <= x0 + w0 && y >= y0 && y <= y0 + h0));
  }

  // Hisui (640x360): cinco zonas; los lugares de cada zona se reparten dentro (posición aproximada)
  const h = MAPAS.hisui;
  const zh = { 'la:obsidian-fieldlands':[245,245,60,42], 'la:crimson-mirelands':[455,225,62,38], 'la:cobalt-coastlands':[515,125,70,42],
               'la:coronet-highlands':[335,165,52,48], 'la:alabaster-icelands':[262,68,62,42] };
  MAPAS.real_hisui = { nombre: 'Hisui (mapa real)', fondo: { img: 'mapas_reales/hisui.jpg', w: 640, h: 360 }, rutas: [],
    nodos: { 'la:jubilife-village':[196,196,'c'] },
    zonas: h.zonas.map(([id, , , , , hijos]) => [id, ...zh[id], hijos]) };

  // Alola (400x240): cada isla del esquema se lleva a su isla en la imagen
  const a = MAPAS.alola;
  const islaReal = { 'Melemele':[100,28,86,80], 'Akala':[232,18,72,92], 'Ula-Ula':[300,115,88,98], 'Poni':[26,76,64,64] };
  const nod = {};
  for (const [id, [x, y, t]] of Object.entries(a.nodos)) {
    const isla = a.islas.find(([, ix, iy, iw, ih]) => x >= ix && x <= ix + iw && y >= iy && y <= iy + ih);
    if (!isla) continue;
    const [n, ix, iy, iw, ih] = isla, [rx, ry, rw, rh] = islaReal[n];
    nod[id] = [rx + (x - ix) / iw * rw, ry + (y - iy) / ih * rh, t];
  }
  // las rutas del esquema se convierten en puntos en mitad de su recorrido
  for (const [id, pts] of a.rutas) {
    const ps = pts.map(p => typeof p === 'string' ? a.nodos[p] : p).filter(Boolean);
    const mx = ps.reduce((s, p) => s + p[0], 0) / ps.length, my = ps.reduce((s, p) => s + p[1], 0) / ps.length;
    const isla = a.islas.find(([, ix, iy, iw, ih]) => mx >= ix && mx <= ix + iw && my >= iy && my <= iy + ih);
    if (!isla) continue;
    const [n, ix, iy, iw, ih] = isla, [rx, ry, rw, rh] = islaReal[n];
    nod[id] = [rx + (mx - ix) / iw * rw, ry + (my - iy) / ih * rh, 'l'];
  }
  MAPAS.real_alola = { nombre: 'Alola (mapa real)', fondo: { img: 'mapas_reales/alola.png', w: 400, h: 240 }, rutas: [], nodos: nod };

  // Mapas con puntos exactos de aparición
  const P = { paldea: 'Paldea', kitakami: 'Noroteo', terarium: 'Área Cero (Terario)', lumiosecity: 'Ciudad Luminalia' };
  for (const [r, n] of Object.entries(P))
    MAPAS['real_' + r] = { nombre: n + ' (mapa real)', fondo: { img: 'mapas_reales/' + r + '.jpg', w: 1024, h: 1024 }, puntos: r };

  // Orden de mapas por juego: primero los reales, después los esquemas
  const REAL = { '1':['real_kanto'], '2':['real_kanto'], '7':['real_kanto','real_sevii'], '19':['real_kanto'], '3':['real_johto','real_kanto'],
    '4':['real_johto','real_kanto'], '10':['real_johto','real_kanto'], '5':['real_hoenn'], '6':['real_hoenn'], '16':['real_hoenn'],
    '8':['real_sinnoh'], '9':['real_sinnoh'], '23':['real_sinnoh'], '11':['real_unova'], '14':['real_unova'], '15':['real_kalos'],
    '17':['real_alola'], '18':['real_alola'], '20':['real_galar','real_armadura','real_corona'], '24':['real_hisui'],
    '25':['real_paldea','real_kitakami','real_terarium'], '30':['real_lumiosecity'] };
  for (const [j, l] of Object.entries(REAL)) MAPAS_JUEGO[j] = [...l, ...(MAPAS_JUEGO[j] || [])];
})();
