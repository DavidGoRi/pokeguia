// Nivel máximo al que obedecen los Pokémon según las medallas/sellos (fuente: WikiDex, artículo "Obediencia").
// base: sin medallas. caps[n-1]: nivel máximo tras ganar el gimnasio n (100 = todos obedecen).
// porNumero: el límite depende del número de medallas, no de cuáles (Sinnoh, Paldea, Let's Go).
window.OBEDIENCIA = (() => {
  const kanto = { base: 10, caps: [10, 30, 30, 50, 50, 70, 70, 100] };
  const johto = { base: 10, caps: [10, 30, 30, 50, 70, 70, 70, 100], nota: 'Las medallas de Kanto no cambian el límite.' };
  const hoenn = { base: 10, caps: [10, 30, 30, 50, 50, 70, 70, 100] };
  const sinnoh = { base: 20, caps: [20, 30, 30, 50, 50, 70, 70, 100], porNumero: true };
  const cadaUna = (base) => ({ base, caps: [base + 10, base + 20, base + 30, base + 40, base + 50, base + 60, base + 70, 100] });
  return {
    '1': kanto, '2': kanto, '7': kanto,
    '19': { base: 10, caps: [20, 30, 40, 50, 60, 70, 80, 100], porNumero: true },
    '3': johto, '4': johto,
    '10': { base: 10, caps: [20, 30, 30, 50, 50, 70, 70, 100], nota: 'Las medallas de Kanto no cambian el límite.' },
    '5': hoenn, '6': hoenn,
    '16': cadaUna(10),
    '8': sinnoh, '9': sinnoh, '23': sinnoh,
    '11': cadaUna(10), '14': cadaUna(10),
    '15': { base: 20, caps: [30, 40, 50, 60, 70, 80, 90, 100] },
    '20': { base: 20, caps: [30, 40, 50, 60, 70, 80, 90, 100] },
    '25': { base: 20, caps: [25, 30, 35, 40, 45, 50, 55, 100], porNumero: true },
    // Alola: sellos de las grandes pruebas; todos obedecen tras ganar la Liga
    '17': { base: 20, caps: [35, 50, 65, 80], sellos: true, final: 'Tras ganar la Liga Pokémon obedecen todos.' },
    '18': { base: 20, caps: [35, 50, 65, 80], sellos: true, final: 'Tras ganar la Liga Pokémon obedecen todos.' }
  };
})();
