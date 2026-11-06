// Mapas esquemáticos (dibujados a mano, no son los mapas oficiales).
// nodos: identificador -> [x, y, tipo]  (c = ciudad/pueblo, l = lugar)
// rutas: [identificador, [puntos]]  (un punto es un nodo o [x, y]); "m" al final = ruta marina
window.MAPAS = {
kanto: { nombre: 'Kanto', w: 112, h: 92, ox: -12,
  nodos: {
    'pallet-town':[22,62,'c'], 'viridian-city':[22,45,'c'], 'pewter-city':[22,18,'c'], 'cerulean-city':[62,16,'c'],
    'vermilion-city':[62,52,'c'], 'lavender-town':[84,30,'c'], 'celadon-city':[44,30,'c'], 'saffron-city':[62,30,'c'],
    'fuchsia-city':[52,68,'c'], 'cinnabar-island':[22,80,'c'], 'indigo-plateau':[6,12,'c'],
    'viridian-forest':[22,31,'l'], 'mt-moon':[42,13,'l'], 'rock-tunnel':[86,20,'l'], 'digletts-cave':[28,38,'l'],
    'seafoam-islands':[38,82,'l'], 'cerulean-cave':[56,10,'l'], 'kanto-power-plant':[92,38,'l'], 'pokemon-tower':[90,27,'l'],
    'pokemon-mansion':[16,78,'l'], 'kanto-safari-zone':[52,61,'l'], 'kanto-victory-road-1':[6,24,'l'],
    'kanto-victory-road-2':[6,24,'l'], 'ss-anne':[68,58,'l'], 'kanto-underground-path':[56,38,'l'], 'mt-silver':[-6,40,'l'],
    'roaming-kanto':[96,84,'l']
  },
  rutas: [
    ['kanto-route-1',['pallet-town','viridian-city']], ['kanto-route-2',['viridian-city','pewter-city']],
    ['kanto-route-3',['pewter-city',[36,18],'mt-moon']], ['kanto-route-4',['mt-moon','cerulean-city']],
    ['kanto-route-24',['cerulean-city',[62,4]]], ['kanto-route-25',[[62,4],[80,4]]],
    ['kanto-route-5',['cerulean-city','saffron-city']], ['kanto-route-6',['saffron-city','vermilion-city']],
    ['kanto-route-7',['celadon-city','saffron-city']], ['kanto-route-8',['saffron-city','lavender-town']],
    ['kanto-route-9',['cerulean-city',[84,16]]], ['kanto-route-10',[[84,16],'lavender-town']],
    ['kanto-route-11',['vermilion-city',[82,52]]], ['kanto-route-12',['lavender-town',[84,60]]],
    ['kanto-route-13',[[84,60],[74,62]]], ['kanto-route-14',[[74,62],[70,70]]], ['kanto-route-15',[[70,70],'fuchsia-city']],
    ['kanto-route-16',['celadon-city',[32,30]]], ['kanto-route-17',[[32,30],[32,62]]], ['kanto-route-18',[[32,62],[42,68],'fuchsia-city']],
    ['kanto-sea-route-19',['fuchsia-city',[52,82]],'m'], ['kanto-sea-route-20',[[52,82],'cinnabar-island'],'m'],
    ['kanto-sea-route-21',['cinnabar-island','pallet-town'],'m'], ['kanto-route-22',['viridian-city',[8,45]]],
    ['kanto-route-23',[[8,45],[6,34],'indigo-plateau']], ['kanto-route-28',[[8,45],[-6,42]]]
  ]
},
johto: { nombre: 'Johto', w: 120, h: 76, ox: -8,
  nodos: {
    'new-bark-town':[86,60,'c'], 'cherrygrove-city':[66,62,'c'], 'violet-city':[62,34,'c'], 'azalea-town':[48,66,'c'],
    'goldenrod-city':[36,46,'c'], 'ecruteak-city':[40,20,'c'], 'olivine-city':[18,30,'c'], 'cianwood-city':[4,48,'c'],
    'mahogany-town':[62,20,'c'], 'blackthorn-city':[86,22,'c'],
    'lake-of-rage':[62,5,'l'], 'sprout-tower':[67,30,'l'], 'ruins-of-alph':[54,48,'l'], 'union-cave':[56,62,'l'],
    'slowpoke-well':[52,70,'l'], 'ilex-forest':[40,64,'l'], 'national-park':[36,32,'l'], 'burned-tower':[36,16,'l'],
    'bell-tower':[44,14,'l'], 'whirl-islands':[12,56,'l'], 'mt-mortar':[51,24,'l'], 'ice-path':[78,22,'l'],
    'dark-cave':[72,38,'l'], 'dragons-den':[92,16,'l'], 'tohjo-falls':[100,60,'l'], 'team-rocket-hq':[62,25,'l'],
    'johto-safari-zone':[-4,24,'l'], 'safari-zone-gate':[-4,30,'l'], 'roaming-johto':[100,72,'l']
  },
  rutas: [
    ['johto-route-29',['new-bark-town','cherrygrove-city']], ['johto-route-30',['cherrygrove-city',[68,42]]],
    ['johto-route-31',[[68,42],'violet-city']], ['johto-route-32',['violet-city',[58,58]]], ['johto-route-33',['union-cave','azalea-town']],
    ['johto-route-34',[[38,60],'goldenrod-city']], ['johto-route-35',['goldenrod-city','national-park']],
    ['johto-route-36',['national-park',[44,32],'violet-city']], ['johto-route-37',[[44,32],'ecruteak-city']],
    ['johto-route-38',['ecruteak-city',[24,20]]], ['johto-route-39',[[24,20],'olivine-city']],
    ['johto-sea-route-40',['olivine-city',[10,44]],'m'], ['johto-sea-route-41',[[10,44],'whirl-islands','cianwood-city'],'m'],
    ['johto-route-42',['ecruteak-city','mt-mortar','mahogany-town']], ['johto-route-43',['mahogany-town','lake-of-rage']],
    ['johto-route-44',['mahogany-town','ice-path']], ['johto-route-45',['blackthorn-city',[88,48]]],
    ['johto-route-46',[[88,48],[80,60]]], ['johto-route-47',['cianwood-city',[-4,40]]], ['johto-route-48',[[-4,40],'safari-zone-gate']],
    ['kanto-route-27',['new-bark-town','tohjo-falls']], ['kanto-route-26',['tohjo-falls',[100,28]]]
  ]
},
hoenn: { nombre: 'Hoenn', w: 104, h: 74, ox: -2,
  nodos: {
    'littleroot-town':[40,62,'c'], 'oldale-town':[40,52,'c'], 'petalburg-city':[26,52,'c'], 'rustboro-city':[10,36,'c'],
    'dewford-town':[10,68,'c'], 'slateport-city':[46,62,'c'], 'mauville-city':[46,38,'c'], 'verdanturf-town':[32,38,'c'],
    'fallarbor-town':[24,12,'c'], 'lavaridge-town':[30,24,'c'], 'fortree-city':[58,12,'c'], 'lilycove-city':[78,24,'c'],
    'mossdeep-city':[94,30,'c'], 'sootopolis-city':[82,44,'c'], 'pacifidlog-town':[62,66,'c'], 'ever-grande-city':[98,54,'c'],
    'petalburg-woods':[12,46,'l'], 'rusturf-tunnel':[22,36,'l'], 'granite-cave':[4,64,'l'], 'meteor-falls':[12,20,'l'],
    'jagged-pass':[36,22,'l'], 'fiery-path':[40,28,'l'], 'mt-pyre':[72,40,'l'], 'seafloor-cavern':[86,52,'l'],
    'cave-of-origin':[80,40,'l'], 'hoenn-victory-road':[98,48,'l'], 'shoal-cave':[90,22,'l'], 'new-mauville':[54,42,'l'],
    'abandoned-ship':[32,70,'l'], 'sky-pillar':[80,64,'l'], 'hoenn-safari-zone':[70,30,'l'], 'desert-ruins':[50,22,'l'],
    'mirage-tower':[42,18,'l'], 'team-aqua-hideout':[82,20,'l'], 'team-magma-hideout':[36,18,'l'], 'magma-hideout':[36,18,'l'],
    'scorched-slab':[64,34,'l'], 'island-cave':[56,72,'l'], 'ancient-tomb':[62,38,'l'], 'desert-underpass':[16,6,'l'],
    'hoenn-altering-cave':[8,10,'l'], 'artisan-cave':[60,8,'l'], 'sea-mauville':[60,48,'l'], 'roaming-hoenn':[100,70,'l'],
    'southern-island':[60,70,'l'], 'mirage-island':[4,72,'l'], 'hoenn-battle-frontier':[72,56,'l'],
    'mossdeep-space-center':[98,34,'l'], 'battle-resort':[104,62,'l']
  },
  zonas: [['mirage-spot-island',-6,40,6,22,['mirage-spot-forest','mirage-spot-cave','mirage-spot-mountain','trackless-forest',
    'pathless-plain','nameless-cavern','fabled-cave','gnarled-den','crescent-isle']]],
  rutas: [
    ['hoenn-route-101',['littleroot-town','oldale-town']], ['hoenn-route-102',['oldale-town','petalburg-city']],
    ['hoenn-route-103',['oldale-town',[42,44]]], ['hoenn-route-104',['petalburg-city',[12,52],'petalburg-woods','rustboro-city']],
    ['hoenn-route-105',[[12,54],[6,60]],'m'], ['hoenn-route-106',[[6,60],'dewford-town'],'m'],
    ['hoenn-route-107',['dewford-town',[28,68]],'m'], ['hoenn-route-108',[[28,68],[38,68]],'m'],
    ['hoenn-route-109',[[38,68],'slateport-city'],'m'], ['hoenn-route-110',['slateport-city','mauville-city']],
    ['hoenn-route-111',['mauville-city',[46,6]]], ['hoenn-route-112',[[46,26],'lavaridge-town']],
    ['hoenn-route-113',['fallarbor-town',[46,10]]], ['hoenn-route-114',['fallarbor-town',[14,16],'meteor-falls']],
    ['hoenn-route-115',['rustboro-city','meteor-falls']], ['hoenn-route-116',['rustboro-city','rusturf-tunnel']],
    ['hoenn-route-117',['verdanturf-town','mauville-city']], ['hoenn-route-118',['mauville-city',[58,38]]],
    ['hoenn-route-119',[[58,38],'fortree-city']], ['hoenn-route-120',['fortree-city',[68,18],[68,36]]],
    ['hoenn-route-121',[[68,36],[74,30],'lilycove-city']], ['hoenn-route-122',[[72,38],[74,46]],'m'],
    ['hoenn-route-123',[[74,46],[58,40]]], ['hoenn-route-124',['lilycove-city',[88,30]],'m'],
    ['hoenn-route-125',['mossdeep-city',[94,20]],'m'], ['hoenn-route-126',[[76,44],'sootopolis-city',[88,40]],'m'],
    ['hoenn-route-127',[[88,40],[90,48]],'m'], ['hoenn-route-128',[[90,48],'ever-grande-city'],'m'],
    ['hoenn-route-129',[[92,56],[84,66]],'m'], ['hoenn-route-130',[[84,66],[74,66]],'m'],
    ['hoenn-route-131',[[74,66],'pacifidlog-town'],'m'], ['hoenn-route-132',['pacifidlog-town',[56,66]],'m'],
    ['hoenn-route-133',[[56,66],[52,64]],'m'], ['hoenn-route-134',[[52,64],'slateport-city'],'m']
  ]
},
sinnoh: { nombre: 'Sinnoh', w: 108, h: 96, ox: -4,
  nodos: {
    'twinleaf-town':[18,80,'c'], 'sandgem-town':[28,76,'c'], 'jubilife-city':[26,58,'c'], 'canalave-city':[8,56,'c'],
    'oreburgh-city':[44,58,'c'], 'floaroma-town':[22,42,'c'], 'eterna-city':[42,26,'c'], 'hearthome-city':[62,52,'c'],
    'solaceon-town':[64,66,'c'], 'veilstone-city':[84,44,'c'], 'pastoria-city':[80,74,'c'], 'celestic-town':[62,32,'c'],
    'sunyshore-city':[98,70,'c'], 'snowpoint-city':[42,4,'c'], 'sinnoh-pokemon-league':[98,40,'c'], 'resort-area':[92,8,'c'],
    'oreburgh-mine':[46,64,'l'], 'valley-windworks':[34,40,'l'], 'eterna-forest':[32,28,'l'], 'fuego-ironworks':[14,38,'l'],
    'mt-coronet':[54,40,'l'], 'great-marsh':[80,68,'l'], 'solaceon-ruins':[68,68,'l'], 'sinnoh-victory-road':[98,46,'l'],
    'ravaged-path':[34,58,'l'], 'oreburgh-gate':[38,58,'l'], 'stark-mountain':[86,22,'l'], 'turnback-cave':[58,22,'l'],
    'snowpoint-temple':[38,0,'l'], 'wayward-cave':[44,48,'l'], 'ruin-maniac-cave':[78,40,'l'], 'trophy-garden':[64,60,'l'],
    'iron-island':[0,48,'l'], 'old-chateau':[36,32,'l'], 'lake-verity':[14,74,'l'], 'lake-valor':[84,62,'l'],
    'lake-acuity':[46,10,'l'], 'valor-lakefront':[88,60,'l'], 'acuity-lakefront':[44,14,'l'], 'lost-tower':[70,58,'l'],
    'spear-pillar':[54,34,'l'], 'sinnoh-hall-of-origin-1':[54,34,'l'], 'floaroma-meadow':[18,44,'l'],
    'sendoff-spring':[56,26,'l'], 'flower-paradise':[100,28,'l'], 'maniac-tunnel':[74,40,'l'], 'newmoon-island':[8,66,'l'],
    'trainers-school':[24,54,'l'], 'roaming-sinnoh':[100,90,'l'], 'bdsp:grand-underground':[50,70,'l'],
    'bdsp:ramanas-park':[84,10,'l'], 'distortion-world':[58,36,'l']
  },
  rutas: [
    ['sinnoh-route-201',['twinleaf-town',[26,70]]], ['sinnoh-route-202',[[26,70],'jubilife-city']],
    ['sinnoh-route-203',['jubilife-city','oreburgh-gate']], ['sinnoh-route-204',['jubilife-city','floaroma-town']],
    ['sinnoh-route-205',['floaroma-town','valley-windworks',[32,34],'eterna-city']], ['sinnoh-route-206',['eterna-city',[46,46]]],
    ['sinnoh-route-207',['oreburgh-city',[50,52]]], ['sinnoh-route-208',[[52,52],'hearthome-city']],
    ['sinnoh-route-209',['hearthome-city','solaceon-town']], ['sinnoh-route-210',['solaceon-town',[70,42],'celestic-town']],
    ['sinnoh-route-211',['eterna-city',[54,30],'celestic-town']], ['sinnoh-route-212',['hearthome-city',[60,76],'pastoria-city']],
    ['sinnoh-route-213',['pastoria-city',[96,78]]], ['sinnoh-route-214',['veilstone-city',[86,58]]],
    ['sinnoh-route-215',[[70,42],'veilstone-city']], ['sinnoh-route-216',[[54,22],[46,16]]],
    ['sinnoh-route-217',[[46,16],'snowpoint-city']], ['sinnoh-route-218',['jubilife-city','canalave-city']],
    ['sinnoh-route-219',['sandgem-town',[28,88]]], ['sinnoh-sea-route-220',[[28,88],[40,88]],'m'],
    ['sinnoh-route-221',[[40,88],[50,88]]], ['sinnoh-route-222',['valor-lakefront','sunyshore-city']],
    ['sinnoh-sea-route-223',['sunyshore-city','sinnoh-pokemon-league'],'m'], ['sinnoh-route-224',['sinnoh-pokemon-league',[104,30]]],
    ['sinnoh-route-225',[[84,16],[78,24]]], ['sinnoh-sea-route-226',[[76,10],[60,10]],'m'],
    ['sinnoh-route-227',[[84,16],'stark-mountain']], ['sinnoh-route-228',[[76,10],[76,24]]],
    ['sinnoh-route-229',['resort-area',[100,14]]], ['sinnoh-sea-route-230',[[84,16],'resort-area'],'m']
  ]
},
unova: { nombre: 'Teselia', w: 112, h: 86, ox: -4,
  nodos: {
    'nuvema-town':[88,72,'c'], 'accumula-town':[88,58,'c'], 'striaton-city':[72,40,'c'], 'nacrene-city':[56,40,'c'],
    'castelia-city':[52,66,'c'], 'nimbasa-city':[52,30,'c'], 'driftveil-city':[30,34,'c'], 'mistralton-city':[22,16,'c'],
    'icirrus-city':[36,6,'c'], 'opelucid-city':[66,8,'c'], 'lacunosa-town':[86,14,'c'], 'undella-town':[98,20,'c'],
    'aspertia-city':[16,78,'c'], 'virbank-city':[34,76,'c'], 'floccesy-town':[16,64,'c'], 'humilau-city':[100,42,'c'],
    'dreamyard':[74,34,'l'], 'pinwheel-forest':[58,50,'l'], 'desert-resort':[42,48,'l'], 'relic-castle':[38,50,'l'],
    'cold-storage':[32,40,'l'], 'chargestone-cave':[20,24,'l'], 'twist-mountain':[30,8,'l'], 'dragonspiral-tower':[34,0,'l'],
    'unova-victory-road':[78,2,'l'], 'unova-victory-road-2':[78,2,'l'], 'celestial-tower':[56,22,'l'], 'giant-chasm':[84,24,'l'],
    'moor-of-icirrus':[40,12,'l'], 'wellspring-cave':[84,50,'l'], 'mistralton-cave':[14,10,'l'], 'challengers-cave':[72,0,'l'],
    'undella-bay':[104,24,'l'], 'liberty-garden':[44,82,'l'], 'p2-laboratory':[66,80,'l'], 'driftveil-drawbridge':[38,32,'l'],
    'village-bridge':[78,12,'l'], 'marvelous-bridge':[66,32,'l'], 'abundant-shrine':[104,10,'l'], 'lostlorn-forest':[62,24,'l'],
    'castelia-sewers':[48,62,'l'], 'floccesy-ranch':[16,58,'l'], 'virbank-complex':[38,80,'l'], 'reversal-mountain':[60,14,'l'],
    'strange-house':[88,10,'l'], 'relic-passage':[40,44,'l'], 'clay-tunnel':[24,30,'l'], 'seaside-cave':[104,36,'l'],
    'nature-sanctuary':[106,46,'l'], 'underground-ruins':[26,28,'l']
  },
  rutas: [
    ['unova-route-1',['nuvema-town','accumula-town']], ['unova-route-2',['accumula-town',[88,40],'striaton-city']],
    ['unova-route-3',['striaton-city','nacrene-city']], ['unova-route-4',['castelia-city',[50,46],'nimbasa-city']],
    ['unova-route-5',['nimbasa-city','driftveil-drawbridge']], ['unova-route-6',['driftveil-city',[24,24]]],
    ['unova-route-7',['mistralton-city','twist-mountain']], ['unova-route-8',['icirrus-city',[46,8]]],
    ['unova-route-9',[[50,8],'opelucid-city']], ['unova-route-10',[[72,10],'unova-victory-road']],
    ['unova-route-11',['opelucid-city','village-bridge']], ['unova-route-12',['village-bridge','lacunosa-town']],
    ['unova-route-13',['lacunosa-town','undella-town']], ['unova-route-14',['undella-town',[96,32]]],
    ['unova-route-15',[[96,32],'marvelous-bridge']], ['unova-route-16',['nimbasa-city','lostlorn-forest']],
    ['unova-route-17',[[60,74],[66,78]],'m'], ['unova-route-18',[[66,78],[72,82]]],
    ['unova-route-19',['aspertia-city','floccesy-town']], ['unova-route-20',['floccesy-town',[34,64],'virbank-city']],
    ['unova-route-21',['humilau-city',[106,52]],'m'], ['unova-route-22',['humilau-city',[86,40]]],
    ['unova-route-23',[[70,6],[76,2]]]
  ]
},
kalos: { nombre: 'Kalos', w: 104, h: 80, ox: -2,
  nodos: {
    'vaniville-town':[62,76,'c'], 'aquacorde-town':[60,68,'c'], 'santalune-city':[56,56,'c'], 'lumiose-city':[52,44,'c'],
    'camphrier-town':[36,46,'c'], 'cyllage-city':[12,52,'c'], 'ambrette-town':[16,62,'c'], 'geosenge-town':[20,36,'c'],
    'shalour-city':[24,20,'c'], 'coumarine-city':[46,20,'c'], 'laverre-city':[60,20,'c'], 'dendemille-town':[76,22,'c'],
    'anistar-city':[90,22,'c'], 'couriway-town':[90,40,'c'], 'snowbelle-city':[74,6,'c'], 'kiloude-city':[98,64,'c'],
    'santalune-forest':[58,62,'l'], 'parfum-palace':[36,36,'l'], 'reflection-cave':[24,28,'l'], 'tower-of-mastery':[18,16,'l'],
    'frost-cavern':[80,14,'l'], 'pokemon-village':[66,4,'l'], 'kalos-victory-road':[82,50,'l'], 'azure-bay':[38,12,'l'],
    'glittering-cave':[8,68,'l'], 'connecting-cave':[22,50,'l'], 'team-flare-secret-hq':[52,40,'l'], 'terminus-cave':[94,32,'l'],
    'lost-hotel':[68,26,'l'], 'sea-spirits-den':[96,48,'l'], 'friend-safari':[98,70,'l'], 'unknown-dungeon':[66,2,'l'],
    'roaming-kalos':[100,78,'l'], 'kalos-berry-fields':[46,28,'l']
  },
  rutas: [
    ['kalos-route-2',['aquacorde-town','santalune-forest']], ['kalos-route-3',['santalune-forest','santalune-city']],
    ['kalos-route-4',['santalune-city','lumiose-city']], ['kalos-route-5',['lumiose-city',[44,48],'camphrier-town']],
    ['kalos-route-6',['camphrier-town','parfum-palace']], ['kalos-route-7',['camphrier-town',[28,48],'connecting-cave']],
    ['kalos-route-8',['cyllage-city','ambrette-town']], ['kalos-route-9',['ambrette-town','glittering-cave']],
    ['kalos-route-10',['cyllage-city',[16,42],'geosenge-town']], ['kalos-route-11',['geosenge-town','reflection-cave']],
    ['kalos-route-12',['shalour-city','azure-bay','coumarine-city']], ['kalos-route-13',['coumarine-city',[48,34],'lumiose-city']],
    ['kalos-route-14',['lumiose-city',[58,32],'laverre-city']], ['kalos-route-15',['laverre-city','lost-hotel','dendemille-town']],
    ['kalos-route-16',['dendemille-town',[70,38],'lumiose-city']], ['kalos-route-17',['dendemille-town','frost-cavern','anistar-city']],
    ['kalos-route-18',['anistar-city','terminus-cave','couriway-town']], ['kalos-route-19',['couriway-town',[82,40],[80,8],'snowbelle-city']],
    ['kalos-route-20',['snowbelle-city','pokemon-village']], ['kalos-route-21',['snowbelle-city',[78,30],'kalos-victory-road']],
    ['kalos-route-22',['santalune-city',[46,54]]]
  ]
},
alola: { nombre: 'Alola', w: 104, h: 76, ox: -2,
  islas: [['Melemele',0,0,36,36],['Akala',46,0,56,38],['Ula-Ula',0,40,46,34],['Poni',54,40,48,34]],
  nodos: {
    'iki-town':[18,6,'c'], 'hauoli-city':[22,28,'c'], 'heahea-city':[54,22,'c'], 'paniola-town':[64,12,'c'],
    'konikoni-city':[86,30,'c'], 'malie-city':[8,52,'c'], 'tapu-village':[36,58,'c'], 'seafolk-village':[60,46,'c'],
    'kalae-bay':[4,30,'l'], 'melemele-sea':[32,34,'l'], 'mahalo-trail':[22,2,'l'], 'ruins-of-conflict':[26,4,'l'],
    'ten-carat-hill':[32,10,'l'], 'hauoli-cemetery':[12,22,'l'], 'melemele-meadow':[4,8,'l'], 'seaward-cave':[8,4,'l'],
    'verdant-cavern--trial-site':[10,14,'l'], 'verdant-cavern':[10,14,'l'], 'alola-berry-fields':[14,18,'l'],
    'hano-beach':[66,34,'l'], 'royal-avenue':[72,26,'l'], 'memorial-hill':[92,26,'l'], 'paniola-ranch':[62,6,'l'],
    'wela-volcano-park':[66,30,'l'], 'brooklet-hill':[80,4,'l'], 'lush-jungle':[78,14,'l'], 'ruins-of-life':[98,22,'l'],
    'akala-outskirts':[96,32,'l'], 'digletts-tunnel':[88,24,'l'], 'heahea-beach':[50,26,'l'], 'secluded-shore':[14,70,'l'],
    'haina-desert':[42,58,'l'], 'ulaula-meadow':[30,42,'l'], 'malie-garden':[6,58,'l'], 'mount-hokulani':[16,42,'l'],
    'blush-mountain':[26,70,'l'], 'ruins-of-abundance':[44,54,'l'], 'lake-of-the-sunne':[26,48,'l'], 'lake-of-the-moone':[26,48,'l'],
    'mount-lanakila':[22,46,'l'], 'ulaula-beach':[10,64,'l'], 'poni-meadow':[78,42,'l'], 'poni-wilds':[64,50,'l'],
    'ancient-poni-path':[70,50,'l'], 'poni-breaker-coast':[76,52,'l'], 'poni-grove':[72,60,'l'], 'poni-plains':[82,62,'l'],
    'poni-coast':[94,64,'l'], 'poni-gauntlet':[70,68,'l'], 'vast-poni-canyon':[84,46,'l'], 'altar-of-the-sunne':[90,42,'l'],
    'altar-of-the-moone':[90,42,'l'], 'ruins-of-hope':[76,56,'l'], 'resolution-cave':[96,48,'l'], 'exeggutor-island':[56,42,'l'],
    'aether-paradise':[42,36,'l'], 'sandy-cave':[90,70,'l'], 'dividing-peak-tunnel':[64,22,'l'],
    'thrifty-megamart':[26,24,'l'], 'poke-pelago':[100,2,'l'], 'team-rockets-castle':[100,8,'l'], 'trainers-school':[24,32,'l']
  },
  zonas: [['ultra-space',40,74,6,4,['ultra-space-wilds','ultra-megalopolis']]],
  rutas: [
    ['alola-route-1',[[30,30],[26,18],'iki-town']], ['alola-route-2',['hauoli-city',[10,20]]], ['alola-route-3',[[10,20],[6,6]]],
    ['alola-route-4',['heahea-city','paniola-town']], ['alola-route-5',['paniola-town',[76,8]]],
    ['alola-route-6',['paniola-town',[70,24]]], ['alola-route-7',[[58,30],'wela-volcano-park']],
    ['alola-route-8',['royal-avenue',[80,28]]], ['alola-route-9',[[80,28],'konikoni-city']],
    ['alola-route-10',['malie-city',[12,44]]], ['alola-route-11',['malie-city',[16,64]]], ['alola-route-12',[[16,64],[26,68]]],
    ['alola-route-13',[[26,68],[34,62]]], ['alola-route-14',[[34,62],[42,66]]], ['alola-route-15',['tapu-village',[40,48]]],
    ['alola-route-16',[[40,48],[34,44]]], ['alola-route-17',[[36,44],[38,40]]]
  ]
},
galar: { nombre: 'Galar', w: 104, h: 100, ox: -2,
  nodos: {
    'postwick':[52,94,'c'], 'wedgehurst':[52,84,'c'], 'motostoke':[68,60,'c'], 'turffield':[12,76,'c'], 'hulbury':[88,72,'c'],
    'stow-on-side':[22,36,'c'], 'ballonlea':[8,16,'c'], 'hammerlocke':[48,32,'c'], 'circhester':[64,14,'c'],
    'spikemuth':[92,14,'c'], 'wyndon':[46,2,'c'],
    'slumbering-weald':[40,96,'l'], 'meetup-spot':[50,74,'l'], 'rolling-fields':[40,70,'l'], 'dappled-grove':[34,64,'l'],
    'watchtower-ruins':[30,58,'l'], 'east-lake-axewell':[56,68,'l'], 'west-lake-axewell':[46,66,'l'], 'axews-eye':[50,62,'l'],
    'south-lake-miloch':[46,56,'l'], 'north-lake-miloch':[44,50,'l'], 'giants-seat':[54,54,'l'], 'motostoke-riverbank':[60,58,'l'],
    'bridge-field':[56,46,'l'], 'stony-wilderness':[36,48,'l'], 'dusty-bowl':[40,42,'l'], 'giants-mirror':[32,44,'l'],
    'hammerlocke-hills':[56,40,'l'], 'giants-cap':[42,46,'l'], 'lake-of-outrage':[32,38,'l'], 'motostoke-outskirts':[74,64,'l'],
    'galar-mine':[26,80,'l'], 'galar-mine-no-2':[88,62,'l'], 'glimwood-tangle':[14,24,'l'], 'energy-plant':[50,28,'l'],
    'galar-wild-area-max-dens':[48,58,'l'], 'roaming-galar-wild-area':[38,60,'l'], 'galar-battle-tower':[52,6,'l']
  },
  rutas: [
    ['galar-route-1',['postwick','wedgehurst']], ['galar-route-2',['wedgehurst',[66,86]]],
    ['galar-route-3',['motostoke',[62,78],[32,80]]], ['galar-route-4',['galar-mine','turffield']],
    ['galar-route-5',['turffield',[24,88],[84,88],'hulbury']], ['galar-route-6',['hammerlocke',[28,38],'stow-on-side']],
    ['galar-route-7',['hammerlocke',[68,30]]], ['galar-route-8',[[68,30],'circhester']],
    ['galar-route-9',['circhester',[84,12],'spikemuth']], ['galar-route-10',['circhester',[54,6],'wyndon']]
  ]
}
};

Object.assign(window.MAPAS, {
sevii: { nombre: 'Islas Sete', w: 104, h: 80, ox: -2,
  islas: [['Isla 1',10,0,22,48],['Isla 2',34,8,16,24],['Isla 3',48,34,22,22],['Isla 4',20,52,20,14],
          ['Isla 5',62,0,34,24],['Isla 6',74,28,26,36],['Isla 7',40,58,28,18],['',2,58,12,12],['',0,2,12,12]],
  nodos: {
    'one-island':[20,32,'c'], 'kindle-road':[22,18,'l'], 'mt-ember':[24,6,'l'], 'treasure-beach':[18,42,'l'],
    'cape-brink':[42,14,'l'], 'three-isle-port':[64,50,'l'], 'bond-bridge':[52,40,'l'], 'berry-forest':[56,52,'l'],
    'four-island':[32,58,'c'], 'icefall-cave':[25,61,'l'], 'five-island':[72,16,'c'], 'five-isle-meadow':[78,10,'l'],
    'memorial-pillar':[86,18,'l'], 'water-labyrinth':[68,6,'l'], 'resort-gorgeous':[86,4,'l'], 'lost-cave':[92,10,'l'],
    'green-path':[86,38,'l'], 'outcast-island':[94,32,'l'], 'water-path':[86,50,'l'], 'ruin-valley':[92,58,'l'],
    'pattern-bush':[80,34,'l'], 'kanto-altering-cave':[94,46,'l'], 'trainer-tower':[44,66,'l'], 'canyon-entrance':[56,62,'l'],
    'sevault-canyon':[62,64,'l'], 'tanoby-ruins':[58,72,'l'], 'monean-chamber':[46,72,'l'], 'liptoo-chamber':[50,72,'l'],
    'weepth-chamber':[54,74,'l'], 'dilford-chamber':[62,74,'l'], 'scufib-chamber':[64,70,'l'], 'rixy-chamber':[66,74,'l'],
    'viapos-chamber':[52,68,'l'], 'birth-island':[8,64,'l'], 'navel-rock':[6,8,'l']
  },
  rutas: [['kindle-road',['one-island','kindle-road','mt-ember']], ['bond-bridge',['bond-bridge','three-isle-port']],
          ['water-path',['green-path','water-path','ruin-valley']]]
},
armadura: { nombre: 'Isla de la Armadura', w: 104, h: 80, ox: -2,
  islas: [['',14,8,82,62]],
  nodos: {
    'master-dojo':[44,34,'c'], 'fields-of-honor':[30,40,'l'], 'soothing-wetlands':[40,50,'l'], 'forest-of-focus':[56,46,'l'],
    'challenge-beach':[60,28,'l'], 'brawlers-cave':[70,20,'l'], 'challenge-road':[78,26,'l'], 'loop-lagoon':[50,62,'l'],
    'training-lowlands':[70,40,'l'], 'potbottom-desert':[84,50,'l'], 'workout-sea':[40,14,'l'], 'stepping-stone-sea':[80,66,'l'],
    'insular-sea':[18,62,'l'], 'honeycalm-sea':[92,32,'l'], 'honeycalm-island':[96,22,'l'], 'courageous-cavern':[78,14,'l'],
    'warm-up-tunnel':[70,52,'l'], 'isle-of-armor-caves':[62,58,'l'], 'roaming-isle-of-armor':[26,18,'l']
  },
  rutas: []
},
corona: { nombre: 'Nieves de la Corona', w: 104, h: 84, ox: -2,
  islas: [['',8,2,88,78]],
  nodos: {
    'freezington':[40,72,'c'], 'slippery-slope':[40,60,'l'], 'frostpoint-field':[56,66,'l'], 'giants-bed':[50,46,'l'],
    'old-cemetery':[38,40,'l'], 'snowslide-slope':[56,30,'l'], 'tunnel-to-the-top':[60,22,'l'], 'path-to-the-peak':[64,14,'l'],
    'crown-shrine':[64,6,'l'], 'giants-foot':[72,48,'l'], 'roaring-sea-caves':[84,40,'l'], 'frigid-sea':[86,60,'l'],
    'three-point-pass':[28,54,'l'], 'ballimere-lake':[22,36,'l'], 'lakeside-cave':[16,28,'l'], 'dyna-tree-hill':[42,30,'l'],
    'galar-iceberg-ruins':[72,28,'l'], 'galar-iron-ruins':[30,20,'l'], 'galar-rock-peak-ruins':[24,64,'l'],
    'split-decision-ruins':[48,22,'l'], 'max-lair':[84,70,'l'], 'roaming-crown-tundra':[14,76,'l']
  },
  rutas: [['slippery-slope',['freezington','slippery-slope','giants-bed']], ['path-to-the-peak',['tunnel-to-the-top','path-to-the-peak','crown-shrine']]]
}
});

// Mapas de mundo abierto: "zonas" son áreas grandes (elipses). Sus "hijos" se reparten dentro de la zona
// de forma aproximada (la posición exacta dentro de la zona no es la real).
Object.assign(window.MAPAS, {
paldea: { nombre: 'Paldea',
  zonas: [
    ['sv:great-crater-of-paldea',50,38,13,11], ['sv:south-province-area-one',46,68,6,5], ['sv:south-province-area-two',30,72,7,6],
    ['sv:south-province-area-three',64,78,7,5], ['sv:south-province-area-four',22,84,6,5], ['sv:south-province-area-five',74,66,6,5],
    ['sv:south-province-area-six',12,70,5,6], ['sv:west-province-area-one',24,56,7,6], ['sv:west-province-area-two',12,44,6,7],
    ['sv:west-province-area-three',18,28,7,6], ['sv:asado-desert',31,44,5,6], ['sv:tagtree-thicket',78,26,6,6],
    ['sv:east-province-area-one',82,60,6,5], ['sv:east-province-area-two',90,50,5,6], ['sv:east-province-area-three',86,38,6,5],
    ['sv:north-province-area-one',70,20,6,5], ['sv:north-province-area-two',60,10,6,5], ['sv:north-province-area-three',34,12,7,5],
    ['sv:casseroya-lake',22,16,7,6], ['sv:glaseado-mountain',48,20,8,6], ['sv:socarrat-trail',70,36,5,5],
    ['sv:south-paldean-sea',50,97,18,3], ['sv:west-paldean-sea',2,50,3,16], ['sv:east-paldean-sea',99,50,3,16], ['sv:north-paldean-sea',50,1,18,3]
  ],
  nodos: {
    'sv:mesagoza':[50,57,'c'], 'sv:cabo-poco':[40,91,'c'], 'sv:poco-path':[44,84,'l'], 'sv:inlet-grotto':[34,92,'l'],
    'sv:pokemon-league':[57,63,'c'], 'sv:naranja-academy':[49,54,'l'], 'sv:uva-academy':[51,54,'l'], 'sv:montenevera':[48,15,'c'],
    'sv:area-zero':[50,38,'l'], 'sv:area-zero-underdepths':[52,42,'l'], 'sv:alfornada-cavern':[12,86,'l'], 'sv:dalizapa-passage':[40,24,'l'],
    'sv:los-platos':[42,73,'c'], 'sv:artazon':[34,62,'c'], 'sv:levincia':[88,64,'c'], 'sv:cascarrafa':[26,40,'c'],
    'sv:porto-marinada':[8,46,'c'], 'sv:medali':[20,24,'c'], 'sv:zapapico':[76,40,'c'], 'sv:cortondo':[26,68,'c'], 'sv:alfornada':[16,90,'c']
  },
  rutas: []
},
kitakami: { nombre: 'Noroteo',
  zonas: [['sv:oni-mountain',48,30,10,8], ['sv:wistful-fields',22,60,8,6], ['sv:paradise-barrens',80,60,8,6],
          ['sv:timeless-woods',20,30,8,7], ['sv:kitakami-wilds',50,50,40,32]],
  nodos: {
    'sv:mossui-town':[40,60,'c'], 'sv:kitakami-road':[52,66,'l'], 'sv:apple-hills':[66,72,'l'], 'sv:loyalty-plaza':[60,54,'l'],
    'sv:reveler-s-road':[56,44,'l'], 'sv:kitakami-hall':[70,48,'c'], 'sv:dreaded-den':[36,24,'l'], 'sv:oni-s-maw':[52,20,'l'],
    'sv:crystal-pool':[44,40,'l'], 'sv:mossfell-confluence':[30,46,'l'], 'sv:fellhorn-gorge':[68,30,'l'], 'sv:infernal-pass':[60,22,'l'],
    'sv:chilling-waterhead':[76,18,'l']
  },
  rutas: []
},
terario: { nombre: 'Área Cero (Terario)',
  zonas: [['sv:savanna-biome',30,24,14,11], ['sv:coastal-biome',70,24,14,11], ['sv:canyon-biome',30,62,14,11], ['sv:polar-biome',70,62,14,11]],
  nodos: {
    'sv:central-plaza':[50,43,'c'], 'sv:savanna-plaza':[40,32,'l'], 'sv:coastal-plaza':[60,32,'l'], 'sv:canyon-plaza':[40,54,'l'],
    'sv:polar-plaza':[60,54,'l'], 'sv:chargestone-cavern':[82,74,'l'], 'sv:torchlit-labyrinth':[18,74,'l']
  },
  rutas: []
},
hisui: { nombre: 'Hisui',
  zonas: [
    ['la:obsidian-fieldlands',36,70,22,15,['la:aspiration-hill','la:horseshoe-plains','la:deertrack-path','la:deertrack-heights','la:obsidian-falls',
      'la:oreburrow-tunnel','la:nature-s-pantry','la:the-heartwood','la:grandtree-arena','la:grueling-grove','la:lake-verity','la:verity-cavern',
      'la:sandgem-flats','la:tidewater-dam','la:floaro-gardens','la:ramanas-island','la:fieldlands-camp','la:heights-camp','la:windswept-run',
      'la:worn-bridge','la:moss-rock']],
    ['la:crimson-mirelands',72,46,18,14,['la:golden-lowlands','la:solaceon-ruins','la:gapejaw-bog','la:sludge-mound','la:scarlet-bog',
      'la:bolderoll-slope','la:diamond-settlement','la:lake-valor','la:valor-cavern','la:cloudpool-ridge','la:shrouded-ruins','la:holm-of-trials',
      'la:droning-meadow','la:mirelands-camp','la:bogbound-camp','la:crossing-slope','la:cottonsedge-prairie','la:brava-arena','la:ursa-s-ring',
      'la:diamond-heath']],
    ['la:cobalt-coastlands',100,76,14,18,['la:ginkgo-landing','la:deadwood-haunt','la:hideaway-bay','la:tombolo-walk','la:veilstone-cape',
      'la:seagrass-haven','la:firespit-island','la:lava-dome-sanctum','la:spring-path','la:lunker-s-lair','la:islespy-shore','la:windbreak-stand',
      'la:tidal-passage','la:seaside-hollow','la:beachside-camp','la:coastlands-camp','la:castaway-shore','la:sand-s-reach','la:molten-arena',
      'la:aipom-hill','la:bathers-lagoon','la:tranquility-cove']],
    ['la:coronet-highlands',38,38,18,13,['la:turnback-cave','la:highlands-camp','la:heavenward-lookout','la:wayward-wood','la:ancient-quarry',
      'la:celestica-trail','la:lonely-spring','la:fabled-spring','la:bolderoll-ravine','la:stonetooth-rows','la:primeval-grotto',
      'la:clamberclaw-cliffs','la:celestica-ruins','la:moonview-arena','la:summit-camp','la:cloudcap-pass','la:wayward-cave','la:mountain-camp',
      'la:temple-of-sinnoh','la:sonorous-path','la:sacred-plaza','la:secret-hollow']],
    ['la:alabaster-icelands',40,8,24,11,['la:snowfields-camp','la:whiteout-valley','la:crevasse-passage','la:bonechill-wastes','la:avalugg-s-legacy',
      'la:glacier-terrace','la:lake-acuity','la:acuity-cavern','la:snowpoint-temple','la:hibernal-cave','la:icebound-falls','la:avalanche-slopes',
      'la:arena-s-approach','la:pearl-settlement','la:heart-s-crag','la:ice-column-chamber','la:icepeak-camp','la:ice-rock','la:icepeak-cavern',
      'la:icepeak-arena','la:snowfall-hot-spring']]
  ],
  nodos: { 'la:jubilife-village':[64,92,'c'] },
  rutas: []
},
luminalia: { nombre: 'Ciudad Luminalia',
  zonas: [
    ['za:vert-district',50,18,14,9,['za:vert-sector-1','za:vert-sector-2','za:vert-sector-3','za:vert-sector-4','za:vert-sector-5','za:vert-sector-6',
      'za:vert-sector-7','za:vert-sector-8','za:vert-sector-9','za:vert-plaza','za:vert-street']],
    ['za:bleu-district',80,38,10,13,['za:bleu-sector-1','za:bleu-sector-3','za:bleu-sector-4','za:bleu-sector-5','za:bleu-sector-6',
      'za:bleu-sector-7','za:bleu-sector-8','za:bleu-sector-9','za:bleu-street','za:aymlis-park','za:espace-vide']],
    ['za:magenta-district',70,72,12,10,['za:magenta-sector-1','za:magenta-sector-2','za:magenta-sector-3','za:magenta-sector-4','za:magenta-sector-6',
      'za:magenta-sector-7','za:magenta-sector-8','za:magenta-sector-9','za:magenta-plaza','za:magenta-street']],
    ['za:rouge-district',30,72,12,10,['za:rouge-sector-1','za:rouge-sector-2','za:rouge-sector-3','za:rouge-sector-4','za:rouge-sector-5',
      'za:rouge-sector-6','za:rouge-sector-7','za:rouge-sector-8','za:rouge-plaza','za:rouge-street','za:academie-etoile']],
    ['za:jaune-district',20,38,10,13,['za:jaune-sector-1','za:jaune-sector-2','za:jaune-sector-3','za:jaune-sector-4','za:jaune-sector-5',
      'za:jaune-sector-6','za:jaune-sector-7','za:jaune-sector-8','za:jaune-sector-9','za:jaune-sector-10','za:jaune-sector-11',
      'za:jaune-sector-12','za:jaune-street','za:saison-canalside']]
  ],
  nodos: (() => {
    const n = { 'za:centrico-plaza':[50,45,'c'], 'za:lumiose-city':[50,48,'l'], 'za:north-boulevard':[50,34,'l'], 'za:south-boulevard':[50,58,'l'],
      'za:vernal-avenue':[60,36,'l'], 'za:estival-avenue':[62,54,'l'], 'za:autumnal-avenue':[38,54,'l'], 'za:hibernal-avenue':[40,36,'l'],
      'za:saison-canal':[50,88,'l'], 'za:coulant-waterway':[92,58,'l'], 'za:pokemon-research-lab':[56,42,'l'], 'za:the-pokemon-research-lab':[56,42,'l'],
      'za:the-lumiose-museum':[44,42,'l'], 'za:quasartico-inc':[58,48,'l'], 'za:old-building':[42,48,'l'], 'za:lysandre-labs':[46,60,'l'],
      'za:the-sewers':[54,62,'l'], 'za:hyperspace-lumiose':[96,92,'l'] };
    // Zonas salvajes 1-20 repartidas en anillo alrededor del centro (posición aproximada)
    for (let i = 1; i <= 20; i++) {
      const a = (i - 1) / 20 * Math.PI * 2 - Math.PI / 2;
      n['za:wild-zone-' + i] = [50 + Math.cos(a) * 25, 45 + Math.sin(a) * 19, 'l'];
    }
    ['disaster-arena','hunting-grounds','sushi-paradise','second-sight-arena','infernal-arena','newmoon-nightmare','primordial-sea',
     'desolate-land','sky-pillar'].forEach((h, i) => n['za:hyperspace-' + h] = [70 + i * 3.4, 96, 'l']);
    return n;
  })(),
  rutas: []
}
});

// Mapas que usa cada juego
window.MAPAS_JUEGO = {
  '1':['kanto'], '2':['kanto'], '3':['johto','kanto'], '4':['johto','kanto'], '5':['hoenn'], '6':['hoenn'], '7':['kanto','sevii'],
  '8':['sinnoh'], '9':['sinnoh'], '10':['johto','kanto'], '11':['unova'], '14':['unova'], '15':['kalos'], '16':['hoenn'],
  '17':['alola'], '18':['alola'], '19':['kanto'], '20':['galar','armadura','corona'], '23':['sinnoh'], '24':['hisui'],
  '25':['paldea','kitakami','terario'], '30':['luminalia']
};
