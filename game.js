
(() => {
const W = 800, H = 600, T = 32, GW = 50, GH = 15, NF = 11, FG = GH * T + 240, LOOT_S = 60, SLOTS = 6;
const GOLD = 0xffd23b, GOLDS = '#ffd23b', SQ = 'square', TRI = 'triangle', WHITE = 0xffffff, WHT = '#fff', BLK = '#000', ORS = '#ff9a3b';
const MRND = Math.random, MMAX = Math.max, MMIN = Math.min, MFLOOR = Math.floor, REDS = '#ff4a4a', TEALS = '#2ec4a0', GRAYS = '#999', INK = 0x111111, SAW = 'sawtooth', RED = 0xd62828, SHADE = '#000000aa';
const rect = (s, ...a) => s.add.rectangle(...a);
Object.assign(Phaser.GameObjects.GameObject.prototype, { o(x = 0.5, y = x) { return this.setOrigin(x, y); }, T(v) { return this.setText(v); }, V(v) { return this.setVisible(v); }, C(v) { return this.setColor(v); }, S(w, c) { return this.setStrokeStyle(w, c); } });

const CABINET_KEYS = {
  P1_U: ['w'],
  P1_D: ['s'],
  P1_L: ['a'],
  P1_R: ['d'],
  P1_1: ['u'],
  P1_2: ['i'],
  P1_3: ['o'],
  P1_4: ['j'],
  P1_5: ['k'],
  P1_6: ['l'],
  P2_U: ['ArrowUp'],
  P2_D: ['ArrowDown'],
  P2_L: ['ArrowLeft'],
  P2_R: ['ArrowRight'],
  P2_1: ['r'],
  P2_2: ['t'],
  P2_3: ['y'],
  P2_4: ['f'],
  P2_5: ['g'],
  P2_6: ['h'],
  START1: ['Enter'],
  START2: ['2'],
};

const KEYBOARD_TO_ARCADE = {};
for (const [arcadeCode, keys] of Object.entries(CABINET_KEYS)) {
  for (const key of keys) KEYBOARD_TO_ARCADE[key.toLowerCase()] = arcadeCode;
}

const ITEMS = {
  bidon: ['Bidón de 5 L', 3, 'a'], botella: ['Botella de agua', 1, 'a'], bebida: ['Bebida de 3 L', 2, 'a'],
  lata: ['Lata de atún', 1, 'c'], porotos: ['Porotos en tarro', 1, 'c'], tallarines: ['Tallarines', 1, 'c'],
  marraqueta: ['Marraquetas', 1, 'c'], charqui: ['Charqui', 1, 'c'], manjar: ['Tarro de manjar', 1, 'c'],
  sopaipillas: ['Sopaipillas frías', 1, 'c'],
  linterna: ['Linterna', 1, 'h'], pilas: ['Pilas', 1, 'h'], radio: ['Radio a pilas', 2, 'h'],
  botiquin: ['Botiquín', 2, 'h'], encendedor: ['Encendedor', 1, 'h'], abrelatas: ['Abrelatas', 1, 'h'],
  cortaplumas: ['Cortaplumas', 1, 'h'], cinta: ['Cinta americana', 1, 'h'], frazada: ['Frazada', 2, 'h'],
  mapa: ['Mapa de Santiago', 1, 'h'], gas: ['Balón de gas', 4, 'h'], mascarilla: ['Mascarilla', 1, 'h'],
  uslero: ['Uslero de la abuela', 1, 'h'], naipe: ['Naipe para carioca', 1, 'h'], guitarra: ['Guitarra', 3, 'h'],
  pisco: ['Pisco', 1, 'h'],
  abuela: ['La abuela', 4, 'p'], perro: ['Quiltro', 2, 'p'], gato: ['Gato', 1, 'p'], vecina: ['Vecina copuchenta', 3, 'p'], pato: ['Don Pato, el conserje', 3, 'p'],
  gaviota: ['Gaviota del Festival', 2, 'e'], peluca: ['Peluca de Leo Rey', 1, 'e'], terremoto: ['Terremoto (el trago)', 1, 'e'],
  volantin: ['Volantín con hilo curado', 2, 'e'], bip: ['Tarjeta Bip con saldo', 1, 'e'], lucas: ['Billete de 20 lucas', 1, 'e'],
  moai: ['Moai de souvenir', 3, 'e'], completo: ['Completo a medio comer', 1, 'e'], polera: ['Polera "Yo sobreviví al 27F"', 1, 'e'],
  huaso: ['Sombrero de huaso', 1, 'e'], loteria: ['Cartón de lotería premiado', 1, 'e'], cueca: ['Pañuelo de cueca', 1, 'e'],
  copa: ['Réplica de la Copa América', 2, 'e'],
};
const EGGS = Object.keys(ITEMS).filter((k) => ITEMS[k][2] == 'e');
const LOOT = Object.keys(ITEMS).filter((k) => 'ach'.includes(ITEMS[k][2]));
const COMMON = ['botella', 'lata', 'marraqueta', 'linterna', 'pilas'];
const THEMES = [
  ['Tu familia', 0xb06a32, ['bidon', 'lata', 'botiquin', 'frazada', 'abrelatas'], 'cocina dorm'],
  ['Abuelita', 0xb0507a, ['lata', 'porotos', 'manjar', 'botiquin', 'frazada', 'naipe', 'uslero'], 'living dorm'],
  ['Gamer', 0x4a4ad0, ['pilas', 'linterna', 'bebida', 'tallarines', 'cinta'], 'gamer living'],
  ['Conserje', 0x7a8a3a, ['linterna', 'cinta', 'cortaplumas', 'gas', 'radio', 'abrelatas'], 'living bano'],
  ['Estudiante', 0x2fa07a, ['tallarines', 'bebida', 'pisco', 'encendedor', 'marraqueta'], 'gamer cocina'],
  ['Doctora', 0x5aa0c8, ['botiquin', 'mascarilla', 'botella', 'bidon'], 'cocina bano'],
  ['Tío del asado', 0xc04a3a, ['charqui', 'encendedor', 'gas', 'pisco', 'marraqueta'], 'asado living'],
  ['Airbnb vacío', 0x8a8aa0, ['botella'], 'nada vacio'],
  ['Hippie', 0x7ab03a, ['guitarra', 'encendedor', 'porotos', 'botella', 'mapa'], 'living dorm'],
  ['Deportista', 0x2a8ab0, ['botella', 'bidon', 'charqui', 'sopaipillas'], 'cocina dorm'],
];
const FC = [0x2b2d55, ...THEMES.map((t) => t[1]), 0x4a4f58, 0xd0a030];
const PC = [0xff6b4a, 0x9b7bff];
const FAMILY_FLOOR = 3;

const any = (s, c) => pressed(s, 'P1_' + c) | pressed(s, 'P2_' + c), sp = (s) => pressed(s, 'START1') | pressed(s, 'START2');
const rnd = (n) => MFLOOR(MRND() * n);
const pick = (a) => a[rnd(a.length)];
const fy = (f) => (NF - 1 - f) * FG;
const fl = (f) => (f == 0 ? '-3' : f == NF - 1 ? 'PH' : '' + f);
const hy = (f) => 60 + (NF - 1 - f) * 48;
const txt = (s, x, y, str, size, color, f) =>
  s.add.text(x, y, str, { fontFamily: f || 'monospace', fontSize: size + 'px', color: color || WHT });
const HF = 'Impact,"Arial Black",sans-serif';
const big = (s, x, y, str, size, color, sh = '#d62828') =>
  txt(s, x, y, str, size, color, HF).setStroke(BLK, size / 7).setShadow(size / 16, size / 16, sh, 0, true, true);
const crt = (s) => { const g = s.add.graphics().fillStyle(0, 0.22); for (let y = 0; y < H; y += 3) g.fillRect(0, y, W, 1); return g; };
const stars = (g, n, h) => { for (let i = 0; i < n; i++) g.fillStyle(WHITE, MRND() * 0.7).fillRect(rnd(W), rnd(h), 2, 2); return g; };

new Phaser.Game({
  type: Phaser.AUTO,
  width: W,
  height: H,
  parent: 'game-root',
  backgroundColor: '#000000',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: W, height: H },
  scene: { create, update },
});

function create() {
  const s = this;
  s.st = { ph: 'title' };
  s.WL = s.add.layer();
  s.UL = s.add.layer();
  createControls(s);
  const g = stars(s.add.graphics().fillGradientStyle(0x07061a, 0x07061a, 0x3a1030, 0x3a1030).fillRect(0, 0, W, H), 70, 380);
  for (let x = 0; x < W; ) {
    const w = 40 + rnd(50), h = 60 + rnd(130);
    g.fillStyle(0x1a1433).fillRect(x, 556 - h, w - 4, h);
    for (let wy = 566 - h; wy < 548; wy += 14) for (let wx = x + 6; wx < x + w - 14; wx += 12) rnd(3) || g.fillStyle(GOLD, 0.6).fillRect(wx, wy, 5, 7);
    x += w;
  }
  g.fillStyle(0x050409).fillRect(0, 556, W, 44);
  s.st.mi = 0;
  s.modeB = [0, 1].map((i) => rect(s, W / 2 + (i ? 130 : -130), 262, 230, 66));
  s.modeT = [0, 1].map((i) =>
    big(s, W / 2 + (i ? 130 : -130), 262, (i ? '2 JUGADORES' : '1 JUGADOR') + '\nSTART', 22, WHT, BLK).o().setAlign('center'));
  const go = big(s, W / 2, 322, '◄ ►  ELEGIR        B1  ¡A CORRER!', 20, WHT, BLK).o();
  s.rankT = [0, 1].map((i) => txt(s, 130 + i * 340, 364, '', 16, '#e8e6ff').setLineSpacing(6));
  s.title = s.add.container(0, 0, [
    g,
    big(s, W / 2, 40, 'PLATANUS HACK 26  ·  ARCADE', 16, TEALS, BLK).o(),
    big(s, W / 2, 112, '¡AGARRA LA TELE!', 84, GOLDS).o(),
    txt(s, W / 2, 190, 'Santiago, 03:34. Viene el megaterremoto.', 16, '#d8d4ff')
      .o().setAlign('center').setStroke(BLK, 4),
    ...s.modeB,
    ...s.modeT,
    go,
    ...[0, 1].map((i) => rect(s, 250 + i * 340, 412, 290, 124, 0, 0.7).S(2, GOLD)),
    ...[0, 1].map((i) => big(s, 250 + i * 340, 350, 'RANKING ' + (i + 1) + 'P', 20, GOLDS).o()),
    ...s.rankT,
    crt(s),
  ]);
  s.UL.add(s.title);
  s.time.addEvent({ delay: 2200, loop: true, callback: () => s.st.ph == 'title' && s.cameras.main.shake(180, 0.006) });
  s.tweens.add({ targets: go, alpha: 0.25, duration: 500, yoyo: true, repeat: -1 });
  drawMode(s);
  (RANK ? Promise.resolve(RANK) : loadRank()).then((r) => {
    RANK = r;
    if (s.rankT[0].active) s.rankT.forEach((t, i) => t.T(rankLines(RANK[i + 1])));
  });
}

function drawMode(s) {
  s.modeB.forEach((b, i) => b.setFillStyle(i == s.st.mi ? RED : 0x15121f).S(3, i == s.st.mi ? GOLD : 0x3a3550).setScale(i == s.st.mi ? 1.06 : 1));
  s.modeT.forEach((t, i) => t.C(i == s.st.mi ? WHT : '#6a6680'));
}


const RK = 'terremoto-ranking-v1', RMAX = 8;
let RANK = null;
const store = () =>
  window.platanusArcadeStorage || {
    async get(k) {
      const v = localStorage.getItem(k);
      return v ? { found: true, value: JSON.parse(v) } : { found: false };
    },
    async set(k, v) { localStorage.setItem(k, JSON.stringify(v)); },
  };
const okRow = (r) => r && typeof r.n == 'string' && r.n.length <= 3 && Number.isFinite(r.s) && Number.isFinite(r.d);
const clean = (a) => (Array.isArray(a) ? a.filter(okRow).sort((x, y) => y.s - x.s).slice(0, RMAX) : []);

async function loadRank() {
  try {
    const r = await store().get(RK), v = r && r.found && r.value;
    return { 1: clean(v && v[1]), 2: clean(v && v[2]) };
  } catch {
    return { 1: [], 2: [] };
  }
}

const rankLines = (a) =>
  a.slice(0, 5).map((r, i) => i + 1 + '. ' + r.n.padEnd(3) + '  ' + String(r.s).padStart(6) + '  ' + r.d + 'd').join('\n') || 'Sin puntajes todavía';
const qualifies = (np, sc) => sc > 0 && RANK && (RANK[np].length < RMAX || sc > RANK[np][RMAX - 1].s);


function genFloor(f, extra) {
  const g = new Uint8Array(GW * GH).fill(1), d = new Uint8Array(GW * GH), items = [], labels = [], rugs = [], furn = [], F = { g, d, items, labels, rugs, furn };
  const set = (x, y, v, t) => { g[y * GW + x] = v; if (t !== undefined) d[y * GW + x] = t; };
  const open = (x0, y0, x1, y1, t) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, 0, t); };
  const put = (k, xy) => xy && items.push({ k, f, x: xy[0] * T + T / 2, y: xy[1] * T + T / 2 });
  const free = (x0, y0, x1, y1) => {
    for (let i = 0; i < 40; i++) {
      const x = x0 + rnd(x1 - x0 + 1), y = y0 + rnd(y1 - y0 + 1);
      if (g[y * GW + x] == 0 && !items.some((it) => it.x == x * T + T / 2 && it.y == y * T + T / 2)) return [x, y];
    }
  };
  const place = (k, cx, by, dir) => {
    const [w, h] = FURN[k];
    for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) set(cx + i, by + dir * j, 4);
    furn.push([k, (cx + w / 2) * T, (by + (dir * (h - 1)) / 2 + 0.5) * T, dir]);
  };
  const fill = (x0, x1, by, dir, room) => {
    for (const k of ROOMS[room]) if (x0 + FURN[k][0] - 1 <= x1) { place(k, x0, by, dir); x0 += FURN[k][0]; }
  };

  if (f == 0) {
    open(1, 1, 16, 13, 11);
    set(1, 6, 2);
    for (const [k, x, y, dr] of [['estante', 3, 1, 1], ['estante', 5, 1, 1], ['tanque', 8, 1, 1], ['tanque', 9, 1, 1], ['generador', 13, 1, 1],
      ['camarote', 3, 13, -1], ['camarote', 4, 13, -1], ['camarote', 6, 13, -1], ['mesa', 11, 13, -1], ['estante', 14, 13, -1]]) place(k, x, y, dr);
    labels.push([4, 3, 'BUNKER: aquí se vacía la mochila']);
    return F;
  }

  open(1, 6, 48, 8, 0);
  if (f < NF - 1) set(1, 6, 2);
  set(1, 8, 3);

  if (f == NF - 1) {
    open(4, 1, 48, 13, 12);
    open(2, 6, 4, 8, 12);
    open(21, 1, 33, 13, 10);
    open(35, 1, 48, 13, 2);
    for (let y = 1; y <= 13; y++) if (y < 6 || y > 8) set(20, y, 1), set(34, y, 1);
    for (let y = 4; y <= 10; y++) for (let x = 23; x <= 31; x++) set(x, y, 5);
    fill(5, 19, 1, 1, 'living');
    place('piano', 13, 1, 1);
    fill(5, 19, 13, -1, 'cocina');
    fill(35, 47, 1, 1, 'dorm');
    fill(35, 47, 13, -1, 'bano');
    for (let x = 22; x < 32; x += 2) place('reposera', x, 1, 1);
    place('barra', 25, 13, -1);
    rugs.push([12 * T, 7.5 * T, 9 * T, 3 * T, 0.1], [41.5 * T, 7.5 * T, 7 * T, 3 * T, -0.1]);
    for (let i = 0; i < 6; i++) put(pick(EGGS), free(5, 2, 47, 12));
    for (let i = 0; i < 6; i++) put(pick(LOOT), free(5, 2, 47, 12));
    labels.push([6, 2, 'PH · Mansión del cuico']);
    return F;
  }

  let n = 0;
  for (const [y0, y1, dr] of [[1, 4, 5], [10, 13, 9]]) {
    for (let x = 5; x <= 41; n++) {
      const x1 = MMIN(x + 8 + rnd(5), 47);
      if (x1 - x < 6) break;
      const family = f == FAMILY_FLOOR && n == 0, ti = family ? 0 : 1 + rnd(THEMES.length - 1), th = THEMES[ti];
      open(x, y0, x1, y1, ti + 1);
      const sx = x + 3 + rnd(x1 - x - 5);
      const top = dr == 5, by = top ? y0 : y1, dir = top ? 1 : -1, [ra, rb] = th[3].split(' ');
      rugs.push([((x + sx) / 2) * T, (top ? y0 + 3 : y0 + 1) * T, (sx - x) * T * 0.7, 1.6 * T, (MRND() - 0.5) * 0.3]);
      for (let y = y0; y <= y1; y++) set(sx, y, 1);
      set(sx, top ? y0 + 2 + rnd(2) : y0 + rnd(2), 0, ti + 1);
      fill(x, sx - 1, by, dir, ra);
      fill(sx + 1, x1, by, dir, rb);
      let dx;
      do dx = x + 1 + rnd(x1 - x - 1); while (dx == sx);
      set(dx, dr, 0, ti + 1);
      const k = family ? 3 : ti == 7 ? 1 : 2 + rnd(3);
      for (let i = 0; i < k; i++) put(MRND() < 0.6 ? pick(th[2]) : pick(COMMON), free(x, y0, x1, y1));
      if (family) { put('abuela', free(x, y0, x1, y1)); put('perro', free(x, y0, x1, y1)); }
      if (MRND() < (f / NF) * 0.5) put(pick(EGGS), free(x, y0, x1, y1));
      if (n == 0) for (const p of extra[f] || []) put(p, free(x, y0, x1, y1));
      labels.push([dx, dr == 5 ? 6 : 8, fl(f) + 'ABCDEFGH'[n] + ' ' + th[0]]);
      x = x1 + 2;
    }
  }
  return F;
}

function reachableAll(F, f) {
  if ((f < NF - 1 && F.g[6 * GW + 1] != 2) || (f > 0 && F.g[8 * GW + 1] != 3)) return false;
  const start = F.g[8 * GW + 1] == 3 ? 8 * GW + 1 : 6 * GW + 1, seen = new Uint8Array(GW * GH), q = [start];
  seen[start] = 1;
  while (q.length) {
    const i = q.pop();
    for (const j of [i - 1, i + 1, i - GW, i + GW]) if (!seen[j] && F.g[j] != 1 && F.g[j] < 4) { seen[j] = 1; q.push(j); }
  }
  return F.items.every((it) => seen[MFLOOR(it.y / T) * GW + MFLOOR(it.x / T)]) && [6, 8].every((r) => seen[r * GW + 1] || F.g[r * GW + 1] == 1);
}

function paint(g, rec, ol) {
  for (const cmd of rec.split('|')) {
    const [k, ...a] = cmd.split(' '), n = a.map(Number), col = parseInt(a[a.length - 1].replace(/./g, '$&$&'), 16);
    if (k == 'R') g.rotateCanvas(n[0]);
    else if (k == 'l') g.lineStyle(2, col).lineBetween(n[0], n[1], n[2], n[3]);
    else {
      g.fillStyle(col);
      g.lineStyle(ol, 0, 0.85);
      if (k == 'c') g.fillCircle(n[0], n[1], n[2]).strokeCircle(n[0], n[1], n[2]);
      if (k == 'e') g.fillEllipse(n[0], n[1], n[2], n[3]).strokeEllipse(n[0], n[1], n[2], n[3]);
      if (k == 'r') g.fillRect(n[0], n[1], n[2], n[3]).strokeRect(n[0], n[1], n[2], n[3]);
      if (k == 'o') g.fillRoundedRect(n[0], n[1], n[2], n[3], 3).strokeRoundedRect(n[0], n[1], n[2], n[3], 3);
      if (k == 't') g.fillTriangle(n[0], n[1], n[2], n[3], n[4], n[5]).strokeTriangle(n[0], n[1], n[2], n[3], n[4], n[5]);
    }
  }
}
const FURN = {
  cama: [2, 2, 'o -30 -30 60 60 643|o -26 -27 24 14 eee|o 2 -27 24 14 eee|o -27 -10 54 38 a44|r -27 -10 54 6 c66'],
  velador: [1, 1, 'o -12 -12 24 24 864|c 0 0 6 fe6'],
  closet: [2, 1, 'o -31 -14 62 28 543|r -1 -13 2 26 321|c -6 0 2 ccc|c 6 0 2 ccc'],
  sofa: [3, 1, 'o -47 -10 94 24 549|o -47 -15 94 9 659|o -48 -12 10 26 435|o 38 -12 10 26 435'],
  tele: [2, 1, 'o -28 -12 56 8 222|o -25 -11 50 5 36d|o -8 -4 16 7 333'],
  mesa: [2, 2, 'c 0 -24 7 532|c 0 24 7 532|c -24 0 7 532|c 24 0 7 532|o -19 -19 38 38 a75|c -7 0 4 eee|c 8 -4 4 eee'],
  encimera: [3, 1, 'o -47 -15 94 30 ccd|o -40 -10 26 20 9ab|c 22 -6 5 333|c 34 6 5 333|c 10 6 5 333'],
  refri: [1, 1, 'o -13 -15 26 30 ddd|r -12 0 24 1 99a|r 7 -11 2 7 99a'],
  planta: [1, 1, 'c 0 0 11 742|c -4 -4 8 3a3|c 5 3 8 4a4|c 0 -6 7 373'],
  escritorio: [2, 1, 'o -30 -15 60 22 555|o -14 -13 28 6 3cf|o -10 -5 20 4 222|c 0 11 6 c33'],
  librero: [1, 1, 'o -14 -15 28 22 753|r -10 -13 4 18 c44|r -4 -13 4 18 48c|r 2 -13 4 18 cc4|r 8 -13 3 18 4a4'],
  tina: [2, 2, 'o -28 -28 56 52 eef|o -22 -22 44 40 8cf'],
  wc: [1, 1, 'o -8 -15 16 8 eef|e 0 2 16 20 eef'],
  reposera: [1, 2, 'o -11 -30 22 60 fff|r -11 -24 22 6 e55|r -11 -8 22 6 e55|r -11 8 22 6 e55'],
  piano: [2, 2, 'o -30 -28 60 56 111|r -27 14 54 12 fff|r -20 14 2 7 111|r -10 14 2 7 111|r 0 14 2 7 111|r 10 14 2 7 111|r 20 14 2 7 111'],
  barra: [3, 1, 'o -47 -13 94 26 742|c -24 0 5 fd3|c 0 0 5 fd3|c 24 0 5 fd3'],
  estante: [2, 1, 'o -30 -14 60 26 778|c -16 -2 6 f93|o 2 -9 8 14 39f|o 14 -9 8 14 39f'],
  tanque: [1, 1, 'c 0 0 13 789|c 0 0 8 9ab'],
  generador: [2, 1, 'o -30 -13 60 26 6a4|o -26 -9 20 18 333|c 12 0 8 333|c 12 0 3 fd3'],
  camarote: [1, 2, 'o -13 -30 26 60 556|o -11 -27 22 24 a44|o -11 3 22 24 a44|o -9 -26 18 6 eee|o -9 4 18 6 eee'],
};
const ROOMS = {
  cocina: ['encimera', 'refri', 'mesa', 'planta'], dorm: ['cama', 'velador', 'closet', 'planta'],
  living: ['sofa', 'tele', 'librero', 'planta'], bano: ['tina', 'wc', 'planta'], gamer: ['escritorio', 'cama', 'librero'],
  asado: ['barra', 'refri', 'mesa'], vacio: ['cama'], nada: [],
};
const RUG = [0x8a3b3b, 0x3b5a8a, 0x8a7a3b, 0x3b7a5a, 0x6b3b8a];

function drawFloor(s, f, F) {
  const gr = s.make.graphics({ add: false });
  gr.fillStyle(0x0e0b1e).fillRect(0, 0, GW * T, GH * T);
  for (let i = 0; i < GW * GH; i++) {
    const c = F.g[i], x = (i % GW) * T, y = MFLOOR(i / GW) * T;
    if (c == 1) {
      if (F.g[i + GW] != 1 && i + GW < GW * GH) gr.fillStyle(0x4a3f8a).fillRect(x, y + T - 9, T, 9).fillStyle(0x8a7fe0).fillRect(x, y + T - 9, T, 2);
      continue;
    }
    gr.fillStyle(c == 5 ? 0x2a7fd6 : FC[F.d[i]]).fillRect(x, y, T, T);
    if ((x + y) / T % 2) gr.fillStyle(0x000000, 0.07).fillRect(x, y, T, T);
    if (F.d[i] && F.d[i] < 11) gr.fillStyle(0, 0.1).fillRect(x, y + 10, T, 1).fillRect(x, y + 21, T, 1);
    if (c == 5) gr.fillStyle(0x7fc0ff, 0.6).fillRect(x + 4 + (i % 3) * 6, y + 6 + (i % 4) * 6, 12, 2);
    if (c == 2 || c == 3) {
      gr.fillStyle(0x777788).fillRect(x + 2, y + 2, T - 4, T - 4).fillStyle(WHITE);
      const a = c == 2 ? 6 : 26;
      gr.fillTriangle(x + 16, y + a, x + 6, y + 32 - a, x + 26, y + 32 - a);
    }
  }
  for (const [x, y, w, h, a] of F.rugs) {
    gr.save().translateCanvas(x, y).rotateCanvas(a).fillStyle(RUG[(x + y) % 5], 0.85).fillRect(-w / 2, -h / 2, w, h);
    gr.lineStyle(2, WHITE, 0.3).strokeRect(-w / 2 + 4, -h / 2 + 4, w - 8, h - 8).restore();
  }
  for (const [k, x, y, dir] of F.furn) {
    gr.save().translateCanvas(x, y).rotateCanvas(dir < 0 ? Math.PI : 0);
    gr.fillStyle(0, 0.3).fillRoundedRect(4 - (FURN[k][0] * T) / 2, 5 - (FURN[k][1] * T) / 2, FURN[k][0] * T - 2, FURN[k][1] * T - 2, 6);
    paint(gr, FURN[k][2], 2);
    gr.restore();
  }
  if (!f) {
    for (let y = 4 * T; y < 9 * T; y += 8) gr.fillStyle((y / 8) % 2 ? GOLD : INK).fillRect(2 * T, y, 8, 8);
    for (const x of [6, 11, 15]) gr.fillStyle(0xff3030).fillCircle(x * T, T - 5, 4).fillStyle(0xff3030, 0.2).fillCircle(x * T, T - 5, 12);
  }
  gr.generateTexture('f' + f, GW * T, GH * T);
  gr.destroy();
  s.WL.add(s.add.image(0, fy(f), 'f' + f).o(0));
  for (const [x, y, l] of F.labels) s.WL.add(txt(s, x * T, fy(f) + y * T + 8, l, 11, '#ffffffaa'));
}

const ICON = {
  bidon: 'o -9 -10 18 20 39f|o -5 -13 10 5 26d|c 4 -6 3 fff|r -7 -4 3 12 9cf',
  botella: 'R .6|o -4 -10 8 18 7cf|r -2 -13 4 4 fff',
  bebida: 'c 0 0 9 622|c 0 0 4 d22|c 0 0 2 fff',
  lata: 'c 0 0 8 ccd|c 0 0 6 f93|o -2 -5 4 6 888',
  porotos: 'c 0 0 8 ccd|c 0 0 6 632|c -2 -1 2 a63|c 2 2 2 a63',
  tallarines: 'R -.3|o -10 -6 20 12 fd6|l -8 -3 8 -3 eb4|l -8 1 8 1 eb4',
  marraqueta: 'R -.4|e -4 0 12 8 eb7|e 4 0 12 8 da6|l -8 0 8 0 a63',
  charqui: 'R .3|o -9 -7 18 4 731|o -9 -2 18 4 842|o -9 3 18 4 621',
  manjar: 'c 0 0 8 b73|c 0 0 6 fff|c 0 0 3 b73',
  sopaipillas: 'c -4 -2 6 e93|c 4 3 6 d82|c -3 5 5 e93',
  linterna: 'R -.5|o -10 -3 15 6 333|o 4 -5 5 10 555|c 9 0 3 fe6',
  pilas: 'R .2|o -7 -8 6 16 222|o 1 -8 6 16 222|r -7 -8 6 5 ea2|r 1 -8 6 5 ea2',
  radio: 'o -10 -7 20 14 445|c -4 0 4 222|r 2 -4 6 3 9cf|l 8 -7 13 -12 999',
  botiquin: 'o -9 -8 18 16 fff|r -2 -5 4 10 d22|r -5 -2 10 4 d22',
  encendedor: 'R .4|o -3 -7 6 14 f33|r -3 -9 6 3 aaa',
  abrelatas: 'R -.6|o -10 -2 14 4 999|c 6 0 4 777|c 6 0 2 333',
  cortaplumas: 'R .3|o -9 -3 16 6 d22|r -7 -1 4 2 fff|t 7 -2 13 0 7 2 ccc',
  cinta: 'c 0 0 8 99a|c 0 0 4 223',
  frazada: 'R .25|o -10 -8 20 16 838|r -10 -3 20 3 b5b|r -10 3 20 2 b5b',
  mapa: 'R -.2|r -10 -7 20 14 eec|l -3 -7 -3 7 bba|l 3 -7 3 7 bba|c 5 -2 2 d22',
  gas: 'c 0 0 11 fa2|c 0 0 5 c71|c 0 0 2 666',
  mascarilla: 'l -8 -2 -12 -5 aab|l 8 -2 12 -5 aab|o -8 -5 16 10 eef',
  uslero: 'R .6|o -9 -3 18 6 c94|o -13 -2 4 4 a72|o 9 -2 4 4 a72',
  naipe: 'R -.3|o -7 -9 12 16 fff|R .5|o -5 -9 12 16 fff|c 1 -1 2 d22',
  guitarra: 'R -.7|e -4 0 14 12 c72|e 3 0 10 9 c72|c -3 0 2 310|r 6 -1 8 2 310',
  pisco: 'R .4|o -4 -10 8 18 dd9|r -2 -13 4 4 c94|r -4 -3 8 5 36b',
  abuela: 'R .8|e 0 0 14 24 96b|c 1 0 7 fcb|c -3 0 5 ccc|c -7 0 3 bbb',
  perro: 'R -.4|l -10 0 -14 -4 a73|e -2 0 20 12 a73|c 8 0 5 a73|e 7 -5 6 4 532|e 7 5 6 4 532',
  gato: 'R .5|l -8 0 -12 6 99a|e -1 0 16 10 99a|c 7 0 4 99a|t 8 -6 5 -2 10 -3 99a',
  vecina: 'R -.3|e 0 0 14 24 c4a|c 1 0 7 fcb|c -2 0 6 92d',
  pato: 'R 1.2|e 0 0 14 24 36a|c 1 0 7 fcb|c -1 0 7 25b|e 6 0 6 10 25b',
  gaviota: 't -11 -2 0 -1 -4 -8 eef|t 11 -2 0 -1 4 -8 eef|t -11 -2 11 -2 0 4 eef|o -3 4 6 5 fd3',
  peluca: 'c -3 -3 5 111|c 3 -3 5 222|c -4 3 5 222|c 4 3 5 111|c 0 0 5 111|c 0 -6 4 222',
  terremoto: 'c 0 0 9 dde|c 0 0 7 fd6|c -2 -2 3 fff|l 2 2 9 -9 f44',
  volantin: 'R .785|r -8 -8 16 16 f33|r -8 -8 8 8 fd3|l 0 0 10 10 fff',
  bip: 'R -.3|o -10 -6 20 13 39d|r -10 -3 20 2 fd3|c 6 3 2 fff',
  lucas: 'R .2|r -11 -6 22 12 9c8|c 0 0 4 586|r -9 -4 3 8 7a6',
  moai: 'o -7 -10 14 20 778|r -5 -4 4 2 445|r 1 -4 4 2 445|r -1 -2 2 7 445',
  completo: 'R .5|o -11 -4 22 8 eb7|o -9 -2 18 4 c42|r -7 -3 14 2 3a3',
  polera: 't -11 -6 -6 -9 -6 -1 eee|t 11 -6 6 -9 6 -1 eee|o -7 -9 14 18 eee|r -5 -2 10 3 d22',
  huaso: 'c 0 0 12 432|c 0 0 7 321|c 0 0 5 432',
  loteria: 'R .2|r -9 -11 18 22 fff|r -7 -8 14 3 f80|c -3 1 2 333|c 3 1 2 333|c 0 6 2 333',
  cueca: 'R .5|t -10 -8 10 -8 0 10 eef|t -5 -6 5 -6 0 4 d22',
  copa: 'c 0 0 9 fd3|c 0 0 6 c92|c 0 0 3 fd3',
};
function icons(s) {
  if (s.textures.exists('halo')) return;
  for (const k in ITEMS) {
    const g = s.make.graphics({ add: false }).translateCanvas(16, 16);
    g.fillStyle(0, 0.35).fillEllipse(0, 1, 26, 20);
    paint(g, ICON[k], 1.2);
    g.generateTexture('i' + k, 32, 32).destroy();
  }
  const g = s.make.graphics({ add: false });
  for (let r = 19; r > 8; r -= 2) g.fillStyle(GOLD, 0.05).fillCircle(20, 20, r);
  g.lineStyle(2, GOLD, 0.9).strokeCircle(20, 20, 14).generateTexture('halo', 40, 40).clear();
  g.fillStyle(WHITE).fillRect(0, 0, 4, 4).generateTexture('px', 4, 4).destroy();
  const c = s.textures.createCanvas('dark', 1600, 1300), x = c.context, gr = x.createRadialGradient(800, 650, 70, 800, 650, 300);
  gr.addColorStop(0, 'rgba(20,0,40,0)');
  gr.addColorStop(1, 'rgba(20,0,40,.8)');
  x.fillStyle = gr;
  x.fillRect(0, 0, 1600, 1300);
  c.refresh();
}


function start(s, np) {
  const st = s.st;
  s.title.V(false);
  const extra = {};
  (extra[2 + rnd(NF - 3)] ||= []).push('gato');
  (extra[2 + rnd(NF - 3)] ||= []).push('vecina');
  st.floors = [];
  for (let f = 0; f < NF; f++) {
    let F;
    do F = genFloor(f, extra); while (!reachableAll(F, f));
    st.floors.push(F);
    drawFloor(s, f, F);
  }
  st.items = st.floors.flatMap((F) => F.items);
  icons(s);
  for (const it of st.items) {
    it.h = s.add.image(it.x, it.y + fy(it.f), 'halo').setDepth(4);
    it.o = s.add.image(it.x, it.y + fy(it.f), 'i' + it.k).setAngle(rnd(7) * 15 - 45).setDepth(1);
    if (ITEMS[it.k][2] == 'e') s.tweens.add({ targets: it.o, scale: 1.2, duration: 500, yoyo: true, repeat: -1 });
    s.WL.add([it.h, it.o]);
  }
  s.tweens.add({ targets: st.items.map((it) => it.h), alpha: 0.35, duration: 700, yoyo: true, repeat: -1 });

  s.UL.add(rect(s, 720, 0, 80, H, 0x0d0d12).o(0));
  st.timer = txt(s, 760, 8, '60', 30, GOLDS).o(0.5, 0);
  s.UL.add(st.timer);
  for (let f = 0; f < NF; f++) {
    s.UL.add(rect(s, 724, hy(f), 72, 40, f == 0 ? 0x6b1d1d : f == NF - 1 ? 0x8a6d1a : 0x2a2a36).o(0));
    s.UL.add(txt(s, 727, hy(f) + 2, fl(f), 10, '#ffffff88'));
  }
  st.bunker = [];
  st.msg = txt(s, 360, 92, '', 16, GOLDS).o().setBackgroundColor(SHADE);
  s.UL.add(st.msg);

  const F3 = st.floors[FAMILY_FLOOR];
  st.P = [];
  for (let i = 0; i < np; i++) {
    let x, y;
    do { x = 6 + rnd(6); y = 2 + rnd(2); } while (F3.g[y * GW + x] != 0);
    const bag = rect(s, -12, 0, 8, 18, 0x7a4a2c).S(2, INK);
    const hands = [-13, 13].map((hy2) => s.add.circle(3, hy2, 3.5, 0xf0c8a8).S(1, INK));
    const body = s.add.graphics().fillStyle(PC[i]).fillEllipse(0, 0, 16, 28).lineStyle(2, INK).strokeEllipse(0, 0, 16, 28)
      .fillStyle(0xf0c8a8).fillCircle(1, 0, 7).lineStyle(1.5, INK).strokeCircle(1, 0, 7)
      .fillStyle(i ? 0xf2f2f2 : GOLD).fillEllipse(4, 0, 18, 20).strokeEllipse(4, 0, 18, 20).fillCircle(-1, 0, 8.5).strokeCircle(-1, 0, 8.5)
      .fillStyle(0, 0.25).fillRect(-9, -1, 17, 2).fillStyle(WHITE, 0.5).fillEllipse(-3, -4, 6, 4);
    const o = s.add.container(0, 0, [s.add.ellipse(0, 0, 36, 34, 0, 0.35), bag, ...hands, body]).setRotation(Math.PI / 2).setDepth(2);
    const vx = np == 1 ? 0 : i * 362, vw = np == 1 ? 720 : 358;
    const p = {
      k: 'P' + (i + 1) + '_', f: FAMILY_FLOOR, x: x * T + T / 2, y: y * T + T / 2, bag: [], alive: 1, lock: 0, da: 0, cd: 0, o, bg: bag, hands,
      dot: s.add.circle(740 + i * 22, 0, 6, PC[i]).S(2, WHITE),
      lt: txt(s, 0, 0, '', 12).o(0.5, 1).setBackgroundColor(SHADE).setDepth(5),
      dk: s.add.image(0, 0, 'dark').setDepth(3),
      bt: txt(s, vx + 8, H - 24, '', 13).setBackgroundColor(SHADE),
    };
    s.WL.add([o, p.lt]);
    s.UL.add([p.dot, p.bt]);
    const cam = i ? s.cameras.add(vx, 0, vw, H) : s.cameras.main.setViewport(vx, 0, vw, H);
    cam.startFollow(o, true, 0.12, 0.12).ignore(s.UL);
    s.WL.add(p.dk);
    p.cam = cam;
    st.P.push(p);
  }
  if (np == 2) s.UL.add(rect(s, 358, 0, 4, H, WHITE).o(0));
  for (const p of st.P) for (const q of st.P) if (p != q) p.cam.ignore(q.dk);
  st.dust = s.add.particles(0, 0, 'px', { emitZone: { source: new Phaser.Geom.Rectangle(-320, -280, 640, 560) }, speedY: { min: 30, max: 90 },
    lifespan: 1400, scale: { start: 1, end: 0 }, alpha: { start: 0.8, end: 0 }, tint: 0xbbaa99, emitting: false }).setDepth(2.5);
  st.spark = s.add.particles(0, 0, 'px', { speed: { min: 40, max: 130 }, lifespan: 450, scale: { start: 1.2, end: 0 }, tint: GOLD, emitting: false }).setDepth(4);
  s.WL.add([st.dust, st.spark]);
  st.hud = s.cameras.add(0, 0, W, H).ignore(s.WL);
  s.UL.add(crt(s));
  st.left = LOOT_S;
  st.ni = st.sh = st.at = 0;
  st.ph = 'alert';
  const g = s.add.graphics().fillStyle(0, 0.93).fillRect(0, 0, W, H)
    .fillStyle(0x2a2a33).fillRoundedRect(40, 40, 260, 520, 40).lineStyle(3, 0x6a6a80).strokeRoundedRect(40, 40, 260, 520, 40)
    .fillStyle(0x0b0b16).fillRoundedRect(50, 50, 240, 500, 32)
    .fillStyle(0).fillRoundedRect(135, 60, 70, 20, 10)
    .fillStyle(WHITE, 0.8).fillRoundedRect(120, 534, 100, 5, 3)
    .fillStyle(0xf2f2f7, 0.92).fillRoundedRect(60, 392, 220, 56, 14)
    .lineStyle(1.5, WHITE).strokeRoundedRect(238, 64, 22, 11, 3).fillStyle(RED).fillRect(240, 66, 4, 7);
  const card = s.add.graphics().fillStyle(RED).fillRoundedRect(60, 180, 220, 200, 18).fillStyle(GOLD).fillTriangle(82, 192, 72, 210, 92, 210);
  const go = txt(s, 550, 552, 'B1 o START: ¡A CORRER!', 18, GOLDS).o();
  s.tweens.add({ targets: [card, go], alpha: 0.6, duration: 450, yoyo: true, repeat: -1 });
  const a = [g, card, go, txt(s, 66, 63, 'SOS', 11, GOLDS), txt(s, 170, 92, '03:34', 60).o(0.5, 0),
    txt(s, 100, 195, 'ALERTA DE EMERGENCIA', 12, GOLDS),
    txt(s, 74, 226, 'Megaterremoto inminente en Santiago. Baja al búnker -3 con todo lo que puedas.', 15).setWordWrapWidth(196),
    big(s, 170, 352, 'TIENES 60 SEGUNDOS', 20, GOLDS, BLK).o(),
    txt(s, 74, 401, 'Mamá', 12, '#d62828'), txt(s, 74, 420, '¿Dónde estái? Contesta', 13, '#111'),
    big(s, 550, 40, '¿CÓMO SE JUEGA?', 30, WHT).o(0.5, 0)];
  [[GOLD, 'AGARRA TODO', '*B1* toma, *B2* suelta, *B3* dash (peso < 3).\n*Agua*, *comida*, *herramientas*... ¡y *gente*!\nCada cosa *pesa [n]*: en la mochila caben *6*.'],
    [0xff9a3b, 'BAJA AL BÚNKER -3', 'Por las *escaleras*. Ahí la mochila se\n*vacía sola*. Haz *varios viajes*.'],
    [0xff4a4a, 'ANTES DE 60 SEGUNDOS', 'Si el terremoto te pilla *fuera del búnker*,\n*no la cuentas*.'],
    [0x2ec4a0, 'SOBREVIVE', 'Reparte *agua y comida*, usa lo que trajiste\ny aguanta hasta el *rescate*.'],
  ].forEach(([c, t, d], i) => {
    const y = 104 + i * 104;
    g.lineStyle(4, c, 0.5).lineBetween(360, y, 360, i < 3 ? y + 104 : y).fillStyle(c).fillCircle(360, y + 14, 20);
    a.push(txt(s, 360, y + 15, i + 1, 24, BLK, HF).o(), big(s, 394, y, t, 22, hx(c), BLK));
    d.split('\n').forEach((l, j) => {
      let x = 394;
      l.split('*').forEach((p, k) => {
        const w = txt(s, x, y + 32 + j * 19, p, 14, k % 2 ? hx(c) : '#ddd').setFontStyle(k % 2 ? 'bold' : '');
        x += w.width;
        a.push(w);
      });
    });
  });
  st.alert = s.add.container(0, 0, a);
  s.UL.add(st.alert);
  alarm(s);
}

const NOTIFS = [
  [50, 'Familia (47)', 'Tía Gloria: peor que el del 60'],
  [44, 'Conserje', 'NO usen el ascensor'],
  [26, 'Vecino del 7B', '¿Alguien ha visto a mi gato?'],
  [20, 'ALERTA', 'Ondas sísmicas: 20 segundos'],
  [9, 'Mamá', 'TE QUIERO. BAJA YA.'],
  [4, 'ALERTA', 'Agáchate, cúbrete y afírmate'],
];

function notify(s, from, m) {
  const red = from == 'ALERTA';
  const c = s.add.container(360, -40, [
    rect(s, 0, 0, 440, 52, red ? RED : 0xf2f2f7).S(2, 0x000000),
    txt(s, -208, -21, from, 13, red ? GOLDS : '#d62828'),
    txt(s, -208, -3, m, 15, red ? WHT : '#111'),
  ]);
  s.UL.add(c);
  s.tweens.add({ targets: c, y: 34, duration: 250, hold: 2200, yoyo: true, onComplete: () => c.destroy() });
  red ? alarm(s, 2) : tone(s, 1320, 0.15, 'sine', 0.15);
}

const used = (p) => p.bag.reduce((a, it) => a + ITEMS[it.k][1], 0);
const tileAt = (f, x, y) => {
  const tx = MFLOOR(x / T), ty = MFLOOR(y / T);
  return tx < 0 || ty < 0 || tx >= GW || ty >= GH ? 1 : s_floors[f].g[ty * GW + tx];
};
let s_floors;
const blocked = (f, x, y) => [[-10, -10], [10, -10], [-10, 10], [10, 10]].some(([a, b]) => {
  const c = tileAt(f, x + a, y + b);
  return c == 1 || c >= 4;
});

function nearest(st, p, r) {
  let best, bd = r;
  for (const it of st.items) {
    if (it.taken || it.f != p.f) continue;
    const dd = Math.hypot(it.x - p.x, it.y - p.y);
    if (dd < bd) { bd = dd; best = it; }
  }
  return best;
}

function stepPlayer(s, p, t, dt) {
  const st = s.st, h = (c) => (s.ctl.held[p.k + c] ? 1 : 0);
  let vx = h('R') - h('L'), vy = h('D') - h('U');
  if (pressed(s, p.k + '3') && t > p.cd) used(p) > 2 ? tone(s, 140, 0.2, SAW, 0.15) : (p.da = t + 200, p.cd = t + 900, tone(s, 700, 0.15, SAW, 0.08));
  if (t < p.lock) vx = vy = 0;
  else if (t < p.da && !(vx || vy)) { vx = Math.cos(p.o.rotation); vy = Math.sin(p.o.rotation); }
  const m = Math.hypot(vx, vy) || 1, sp = ((170 - 12 * used(p)) * (t < p.da ? 3 : 1) * dt) / 1000;
  if (!blocked(p.f, p.x + (vx / m) * sp, p.y)) p.x += (vx / m) * sp;
  if (!blocked(p.f, p.x, p.y + (vy / m) * sp)) p.y += (vy / m) * sp;

  const c = tileAt(p.f, p.x, p.y);
  if ((c == 2 || c == 3) && t >= p.lock) {
    p.f += c == 2 ? 1 : -1;
    p.x = 2 * T + T / 2;
    p.y = (c == 2 ? 6 : 8) * T + T / 2;
    p.lock = t + (st.left < 20 ? 800 : 450);
    [600, 480].forEach((fq, j) => tone(s, fq, 0.05, SQ, 0.06, j * 0.12));
  }
  if (p.f == 0 && p.bag.length) {
    p.bag.forEach((it, j) => {
      const n = st.bunker.length + j, r = 13 * Math.sqrt(n), x = 6 * T + r * Math.cos(n * 2.4), y = 7 * T + fy(0) + r * Math.sin(n * 2.4);
      s.tweens.add({ targets: it.o.setPosition(p.x, p.y + fy(0)).V(true), x, y, angle: '+=360', delay: j * 150, duration: 600, ease: 'Back.easeOut',
        onComplete: () => st.spark.explode(10, x, y) });
    });
    st.bunker.push(...p.bag);
    arp(s, [523, 659, 784], 0.08);
    p.bag = [];
  }

  const near = nearest(st, p, 30);
  if (pressed(s, p.k + '1') && near) {
    if (used(p) + ITEMS[near.k][1] > SLOTS) { st.msg.T('Mochila llena (B2 suelta)'); st.msgT = 1500; tone(s, 140, 0.2, SAW, 0.15); }
    else { near.taken = 1; near.o.V(near.h.V(false).visible); st.spark.explode(14, near.o.x, near.o.y); p.bag.push(near); tone(s, 880, 0.08, TRI, 0.15); }
  }
  if (pressed(s, p.k + '2') && p.bag.length) {
    const it = p.bag.pop();
    Object.assign(it, { taken: 0, f: p.f, x: p.x, y: p.y });
    for (const o of [it.o, it.h]) o.setPosition(p.x, p.y + fy(p.f)).V(true);
    tone(s, 330, 0.08, TRI, 0.15);
  }

  const wy = p.y + fy(p.f), show = nearest(st, p, 40), mv = vx || vy, scared = st.left < 20;
  if (mv) p.o.rotation = Phaser.Math.Angle.RotateTo(p.o.rotation, Math.atan2(vy, vx), 0.25);
  const sw = mv ? Math.sin(t / 70) * 4 : 0, u = used(p), jit = scared ? MRND() - 0.5 : 0;
  p.o.setPosition(p.x + jit, wy + jit);
  p.dk.setPosition(p.x, wy).setScale(p.bag.some((it) => it.k == 'linterna') ? 1.6 : 1).setAlpha(scared ? 0.85 + MRND() * 0.15 : 1);
  p.hands[0].x = 3 + sw;
  p.hands[1].x = 3 - sw;
  p.bg.setSize(8 + u, 18 + u * 1.5).setPosition(-12 - u / 2, 0);
  p.lt.V(!!show);
  if (show) p.lt.T(ITEMS[show.k][0] + ' [' + ITEMS[show.k][1] + ']').setPosition(show.x, show.y + fy(show.f) - 12);
  p.dot.y = hy(p.f) + 20;
  p.bt.T(p.k.slice(0, 2) + ' ' + u + '/' + SLOTS + (st.P[1] ? '' : ' ' + p.bag.map((it) => ITEMS[it.k][0]).join(', ')));
}

function endLoot(s) {
  const st = s.st;
  for (const p of st.P) if (p.f != 0) p.alive = 0;
  st.ph = 'cine';
  st.ct = 0;
  st.mag = big(s, W / 2, H / 2, '6.0', 130, WHT).o();
  st.magL = big(s, W / 2, H / 2 - 120, 'MAGNITUD', 24, ORS, BLK).o();
  st.cine = s.add.container(0, 0, [rect(s, -100, -100, W + 200, H + 200, 0x000000).o(0), stars(s.add.graphics(), 140, H), st.magL, st.mag]);
  s.UL.add(st.cine);
  rumble(s, 7, 0.7);
}

function cine(s, dt) {
  const st = s.st, ct = (st.ct += dt);
  if (ct < 4500) {
    const v = 6 + 4 * (ct / 4500) ** 2;
    st.mag.T(v.toFixed(1)).setScale(1 + (v - 6) * 0.12).C(v > 8 ? REDS : v > 7 ? GOLDS : WHT);
    st.hud.shake(100, 0.001 * (v - 5) ** 2);
  } else if (ct < 6000) {
    st.mag.T(rnd(2) ? 10 + rnd(90) + '.' + rnd(10) : '?' + rnd(10) + '.?').C(REDS);
    st.hud.shake(100, 0.03);
  } else if (ct < 7000) {
    st.mag.T('???');
    st.hud.shake(100, 0.04);
  } else if (!st.earth) {
    st.mag.V(false);
    st.magL.V(false);
    st.earth = 1;
    earth(s);
    rumble(s, 1, 1);
    tone(s, 55, 1.2, SAW, 0.5);
  }
  if (ct > 8800 && !st.apo) {
    st.apo = big(s, W / 2, 515, 'COMIENZA EL APOCALIPSIS', 46, '#ff6b4a', BLK).o().setAlpha(0);
    st.cine.add(st.apo);
    s.tweens.add({ targets: st.apo, alpha: 1, scale: { from: 2.5, to: 1 }, duration: 500, ease: 'Back.easeOut', onComplete: () => st.hud.shake(250, 0.015) });
  }
  if (ct > 11500 || (ct > 1500 && sp(s))) startLog(s);
}

function earth(s) {
  const r = 110, zig = [], X = W / 2, Y = 250, add = (o, tw) => (s.st.cine.add(o), s.tweens.add({ targets: o, ...tw }));
  for (let i = 0; i <= 8; i++) zig.push({ x: i % 8 ? (i % 2 ? 14 : -14) : 0, y: -r + (i * r) / 4 });
  const core = s.add.circle(X, Y, 72, 0xff6b1a).S(10, GOLD);
  core.postFX?.addGlow(0xff4a1a, 8, 0, false, 0.1, 20);
  add(core, { scale: 0.88, duration: 300, yoyo: true, repeat: 9 });
  const half = (sd, lands) => {
    const pts = zig.map((p) => ({ ...p }));
    for (let i = 1; i < 24; i++) {
      const a = Math.PI / 2 - (i * Math.PI) / 24;
      pts.push({ x: sd * r * Math.cos(a), y: r * Math.sin(a) });
    }
    const g = s.add.graphics({ x: X, y: Y }).fillStyle(0x2a6fdb).fillPoints(pts, true).fillStyle(0x3bb36b);
    for (const [x, y, rr] of lands) g.fillCircle(sd * x, y, rr);
    g.lineStyle(5, 0x8fd0ff).strokePoints(pts, true).lineStyle(16, 0x7a4a2a).strokePoints(zig).lineStyle(7, 0xff6b1a).strokePoints(zig);
    add(g, { x: X + sd * 165, angle: sd * 24, duration: 2400, ease: 'Expo.easeOut' });
  };
  half(-1, [[55, -30, 30], [40, 50, 18]]);
  half(1, [[50, -45, 26], [62, 38, 22], [30, 8, 12]]);
  for (let i = 0; i < 50; i++) {
    const a = MRND() * 7, d = 150 + rnd(400);
    add(rect(s, X, Y, 3 + rnd(12), 3 + rnd(12), pick([0x2a6fdb, 0x3bb36b, 0x7a4a2a, 0xff6b1a, GOLD])),
      { x: X + Math.cos(a) * d, y: Y + Math.sin(a) * d, angle: rnd(900), alpha: 0, duration: 1500 + rnd(2000), ease: 'Cubic.easeOut' });
  }
  for (let i = 0; i < 2; i++) add(s.add.circle(X, Y, r).S(8 - i * 4, i ? WHITE : GOLD), { scale: 5, alpha: 0, duration: 1100, delay: i * 220 });
  add(rect(s, 0, 0, W, H, WHITE).o(0), { alpha: 0, duration: 700 });
}


const WATER = { bidon: 12, botella: 3, bebida: 6 };
const FOOD = { lata: 4, porotos: 4, tallarines: 5, marraqueta: 3, charqui: 6, manjar: 4, sopaipillas: 2, completo: 2 };
const FLAVOR = [
  'Afuera llueve ceniza.', 'Día tranquilo. Demasiado tranquilo.',
  'Contaron los tarros tres veces.', 'Sueñas con una sopaipilla pasada.', 'El techo cruje, pero aguanta.',
  'Discusión eterna: ¿completo o churrasco?',
  'Se juega al "veo veo". En la oscuridad.', 'Alguien cuenta las grietas del techo. Van 41.',
];
const CTX = [
  ['abuela', 'La abuela jura que el del 60 fue peor.'],
  ['perro', 'El quiltro le ladra a la escotilla toda la noche.'],
  ['gato', 'El gato ignora el apocalipsis con elegancia.'], ['vecina', 'La vecina ya sabe la vida de todos.'],
  ['pato', 'Don Pato sabe quién no paga gastos comunes.'],
  ['naipe', 'Carioca a la luz de la vela. Nadie baja la escala.'], ['radio', 'La radio da noticias entrecortadas.'],
  ['pisco', 'Alguien mira el pisco con demasiado cariño.'],
  ['moai', 'El Moai los mira desde la esquina. Juzga.'],
];
const MILE = {
  1: 'Primera noche bajo tierra. Nadie duerme.', 3: 'Ya no hay señal en ningún celular.',
  5: 'Murió el último celular. Ahora sí, solos.', 7: 'Una semana. Ya no se escuchan sirenas.',
  10: 'Alguien raya la pared: diez palitos.',
};
const EVENTS = [
  ['r', 'Réplica fuerte. El techo cruje y cae polvo.', '', [
    'Afirmar con cinta|cinta|.9||La cinta aguanta todo.|h|Cae una viga.',
    'Agacharse y cubrirse||.6||Pasó el susto.|h|Un golpe en la cabeza.',
    'Rezarle a San Expedito||.4||Funcionó, parece.|h|No funcionó.']],
  ['r', 'Réplica. Se rompe una cañería: agua turbia.', '', [
    'Hervirla con el encendedor|encendedor|.9|a+3|Sabe a cañería, pero sirve.|s|Igual cayó mal.',
    'Tomarla así no más||.4|a+3|Estómago de acero.|a+3 s|Alguien se enferma.',
    'Taparla con la frazada|frazada|1||Bunker seco.']],
  ['s', 'Saqueadores golpean la escotilla.', '#saq', [
    'Salir con el uslero|uslero|.8||Huyeron del uslero de la abuela.|h|Eran más.',
    'Que ladre el quiltro|perro|.85||El quiltro los espantó.|c-3|Se llevaron comida.',
    'Pasarles comida||1|c-3|Se fueron con tres raciones.']],
  ['s', 'Saqueadores ofrecen comida por algo brillante.', '', [
    'Darles la Gaviota del Festival|gaviota|1|c+5 -gaviota|La gaviota vale más que el oro.',
    'Ofrecer 20 lucas|lucas|.1|c+3 -lucas|Increíble, aceptaron.|-lucas|Se rieron y se lo llevaron.',
    'Rechazar||1||Se van refunfuñando.']],
  ['s', 'Un grupo pide refugio en el bunker.', '', [
    'Hacerte pasar por Leo Rey|peluca|1|c+4 a+2|Foto con Leo Rey a cambio de comida.',
    'Dejarlos entrar||.5|c+3 a+2|Traían provisiones.|c-3 a-3|Se comieron todo y se fueron.',
    'Negarse||1||Cierras con culpa.']],
  ['s', 'De noche intentan forzar la escotilla.', '', [
    'Asomar el Moai|moai|.9||El Moai impone respeto.',
    'Hacerse el muerto||.6||Se aburrieron.|c-3 a-2|Entraron y robaron.',
    'Pelear||.5||Los echaste a escobazos.|h|Alguien sale herido.']],
  ['m', 'Un perro callejero rasguña la puerta.', '', [
    'Darle de comer||.6|c-1 +radio|Vuelve con una radio en el hocico.|c-1 h|Te muerde el tobillo.',
    'Adoptarlo||.7|+perro c-1|Nuevo integrante del bunker.|h|No quería ser adoptado.',
    'Ignorarlo||1||Se va llorando. Tú también.']],
  ['m', 'Alguien amanece con fiebre.', 's', [
    'Usar el botiquín|botiquin|1|x|Paracetamol y a dormir.',
    'Darle pisco "medicinal"|pisco|.5|x -pisco|Santo remedio.|-pisco|Ahora tiene fiebre y caña.',
    'Esperar||.3|x|Se le pasó.||Sigue mal.']],
  ['m', 'Alguien se tuerce un tobillo.', 'h', [
    'Vendar con cinta|cinta|.9|x|Quedó como nuevo.||Quedó peor.',
    'Usar el botiquín|botiquin|1|x|Vendaje profesional.',
    'Aguantarse||.4|x|Era leve.||Cojea.']],
  ['m', 'Oscuridad total. No se ve nada.', '', [
    'Prender la linterna|linterna+pilas|1||Luz. Bendita luz.',
    'Cantar con la guitarra|guitarra|1|x|Suena "Gracias a la vida". Se emocionan.',
    'Aguantar a ciegas||.5||Nadie se tropezó.|h|Alguien se tropieza.']],
  ['m', 'Hay que salir a buscar provisiones.', '', [
    'Ir con linterna|linterna+pilas|.8|c+3 a+2|Encuentras un almacén intacto.|h|Te cae un ladrillo.',
    'Ir con el mapa|mapa|.7|c+2 a+3|Un súper saqueado a medias.|h|Te pierdes y vuelves herido.',
    'Ir a ciegas||.4|c+2|Algo es algo.|h|Vuelves cojeando.']],
  ['m', 'Una lata y ningún abrelatas a mano.', '', [
    'Abrirla con el cortaplumas|cortaplumas|1|c+2|Click. Porotos.',
    'Usar el abrelatas|abrelatas|1|c+2|Como la gente.',
    'A combos||.4|c+2|Se abrió.|h|Te cortas la mano.']],
  ['m', 'Un gato se cuela por una grieta.', '', [
    'Adoptarlo||.8|+gato|Ronronea. Sube el ánimo.|h|Te araña la cara.',
    'Echarlo||1||El gato te mira con desprecio.']],
  ['m', 'Es 18 de septiembre en el bunker.', '', [
    'Bailar cueca con el pañuelo|cueca|1|x|¡Viva Chile! Hasta el enfermo se para.',
    'Tomarse el terremoto|terremoto|1|x d -terremoto|Lloran de risa. Al otro día, caña brutal.',
    'Asado imaginario||1||Huele a nada, pero se agradece.']],
  ['m', 'La radio podría tener señal.', '', [
    'Prender la radio|radio+pilas|.8|e #radio|Los rescates avanzan por la ciudad.||Solo estática.',
    'Antena hechiza|cinta+frazada|.4|e|¡Hay rescates!||No funcionó.',
    'Dejarla||1||Silencio.']],
  ['s', 'Vuelven los saqueadores, con megáfono.', '', [
    'Asomar el Moai|moai|.9||Se alejan.|c-2|No les importó el Moai.',
    'Que ladre el quiltro|perro|.8||El quiltro suena como diez perros.|c-3|Le tiraron una salchicha. Traidor.',
    'Negociar por el ducto||.5|c-2|Se conforman con dos raciones.|c-4 a-2|Negociaste fatal.'], '#saq'],
  ['m', 'Por el ducto, el del 7B: "¿Han visto a mi gato?"', '', [
    'Devolverle el gato|gato|1|-gato c+4|Te pasa cuatro tarros. "¡Gracias!"',
    'Hacerse el leso||.6||Nadie dice nada. El gato tampoco.|#venganza|El gato maúlla. El vecino jura venganza.'], 'gato'],
  ['s', 'Vuelve el del 7B con su cuñado: "¡El Michi!"', '', [
    'Devolverlo|gato|1|-gato|Lo abraza llorando. Se van en paz.',
    'Pagarle con comida||1|c-3|Acepta tres tarros por el Michi.',
    'Pelear||.5||El cuñado era puro bulto.|h c-2|El cuñado no era puro bulto.'], '#venganza'],
  ['s', 'Una carta bajo la escotilla: "Sé que tienen agua."', '', [
    'Dejar agua afuera||1|a-2 #amigo|Una nota: "Gracias. Volveré."',
    'Ignorarla||1|#carta|Nadie duerme esa noche.',
    'Responder "NO"||1|#carta|Pasas la nota. Silencio.']],
  ['m', 'Golpecitos: es Don Pato, el conserje, el de la carta.', '', [
    'Dejarlo entrar||1|+pato c+3 +cortaplumas|Trae tarros, un cortaplumas y chismes.',
    'Solo darle las gracias||1|x|Te deja un remedio casero.'], '#amigo'],
  ['s', 'El de la carta volvió con amigos.', '', [
    'Asomar el uslero|uslero|.8||El uslero de la abuela es leyenda.|h a-2|Eran muchos.',
    'Darles agua||1|a-4|Se llevan cuatro raciones.',
    'Atrincherarse||.4||Se rinden al amanecer.|a-3 h|Entran y se llevan agua.'], '#carta'],
  ['m', 'Un influencer transmite un live del apocalipsis.', '', [
    'Salir con la peluca de Leo Rey|peluca|1|c+3 a+3 e|Viral. Mandan ayuda al "bunker de Leo Rey".',
    'Pedir ayuda en vivo||.5|c+2|Mandan un dron con comida.||Solo le dieron likes.',
    'Cerrarle la escotilla||1||Se corta el live. Paz.']],
  ['m', 'La abuela sabe hacer pan con casi nada.', '', [
    'Darle una ración de comida||.8|c-1 c+4|Pan amasado del apocalipsis. Huele a domingo.|c-1|Se quemó.',
    'Mejor no||1||La abuela no te habla en tres días.'], 'abuela'],
  ['m', 'El quiltro escarba como loco en una esquina.', '', [
    'Ayudarlo||.7|c+3|Un tarro de duraznos de los 80. Sigue bueno. Creo.|h|Una rata. Muerde.',
    'Retarlo||1||El quiltro te mira decepcionado.'], 'perro'],
  ['m', 'La vecina sabe dónde se volcó un camión de ayuda.', '', [
    'Ir con el mapa|mapa|.85|c+4 a+4|Era cierto. ¡Bendita copucha!|h|Era otro chisme.',
    'Ir a ciegas||.45|c+3 a+2|Lo encontraste.|h|Vuelves herido.',
    'No creerle||1||La vecina se ofende. Chisme nuevo: tú.'], 'vecina'],
  ['m', 'Aterriza un dron de reparto perdido.', '', [
    'Abrir el paquete||.6|+botiquin|¡Un botiquín! Gracias, algoritmo.||Era una funda de celular.',
    'Desarmarlo||1|+pilas|Pilas nuevas. Algo es algo.']],
  ['m', 'Radio: "Rescates en plazas de Santiago".', '', [
    'Marcar la plaza en el mapa|mapa|1|e e|Plaza Ñuñoa. Está cerca.',
    'Memorizarla||1|e|Repites "Plaza Ñuñoa" toda la noche.'], '#radio'],
];
const ENDINGS = [
  ['Se escucha un helicóptero.', [
    'Encumbrar el volantín|volantin|.85|r|Ven el volantín. ¡Rescate!||El hilo se cortó.',
    'Gritar y hacer señas||.35|r|¡Los vieron!|h|No los vieron.',
    'Esconderse||1||Se aleja.']],
  ['Pasa una caravana rumbo al sur.', [
    'Unirse con el mapa|mapa|.8|r|Llegan a un pueblo a salvo.|h|Se perdieron.',
    'Unirse a ciegas||.4|r|Llegan de milagro.|k|El viaje cobra una vida.',
    'Quedarse||1||Se pierde en el polvo.']],
  ['Radio: refugio en el cerro San Cristóbal.', [
    'Seguir la señal|radio+pilas|.8|r|La Virgen del cerro los recibe.|h|Se cortó la señal.',
    'Caminar a ciegas||.3|r|Llegaron de milagro.|h|Vuelven heridos.',
    'Ignorar||1||Mejor malo conocido.']],
  ['Golpean: ¿rescate o saqueadores?', [
    'Abrir con la peluca de Leo Rey|peluca|.9|r|Era un convoy. ¡A salvo!||Eran saqueadores fans.',
    'Abrir||.5|r|¡Rescate! Sales a la luz.|c-5 a-5|Saqueadores.',
    'No abrir||1||Silencio.']],
];

[[EVENTS, 3], [ENDINGS, 1]].forEach(([a, i]) => a.forEach((e) => (e[i] = e[i].map((o) => o.split('|')))));
const alive = (st) => st.ppl.filter((p) => p.st < 3);
const person = (n, k) => ({ n, k, st: 0, w: 1, f: 1, th: 0, hu: 0 });
const has = (st, req) => !req || req.split('+').every((k) => st.inv[k] > 0 || st.ppl.some((p) => p.k == k && p.st < 3));
const STATE = ['sano', 'herido', 'enfermo', 'muerto', 'se fue'];
const LIM = { w: 5, f: 12 };
const ENDING_DAY = 10;

const DAY_MS = 2600, CHOICE_MS = 25000, OUT_MS = 3800;
const SEV = [0x2ec4a0, GOLD, 0xff4a4a, 0x666666], hx = (n) => '#' + n.toString(16).padStart(6, '0');
const KIND = { q: ['RACIONES', 0x3b9cff], r: ['RÉPLICA', RED], s: ['SAQUEO', 0xff7a1a], m: ['EVENTO', 0x2ec4a0], f: ['FINAL', GOLD], x: ['FIN', 0x9b7bff] };
const names = (req) => req.split('+').map((k) => ITEMS[k][0]).join(' + ');

function startLog(s) {
  const st = s.st;
  st.cine.destroy();
  st.ph = 'log';
  st.s = s;
  st.inv = {};
  st.a = st.c = st.day = st.eb = st.lastR = 0;
  st.fl = {};
  st.used = {};
  st.fu = {};
  st.next = 2;
  st.rows = [];
  st.pplT = [];
  st.ppl = st.P.filter((p) => p.alive).map((p) => person(st.P.length == 1 ? 'Tú' : p.k.slice(0, 2)));
  for (const it of st.bunker) {
    if (ITEMS[it.k][2] == 'p') st.ppl.push(person(ITEMS[it.k][0], it.k));
    else st.inv[it.k] = (st.inv[it.k] || 0) + 1;
  }
  const inv = st.inv, cook = { porotos: inv.abrelatas || inv.cortaplumas, tallarines: inv.gas };
  for (const k in inv) {
    st.a += (WATER[k] || 0) * inv[k];
    if (FOOD[k] && (k in cook ? cook[k] : 1)) st.c += FOOD[k] * inv[k];
  }
  st.eggs = st.bunker.filter((it) => ITEMS[it.k][2] == 'e').length;

  s.UL.add([s.add.graphics().fillStyle(0x0c0a16).fillRect(0, 0, W, H).fillStyle(0x1c1638).fillRect(0, 0, W, 48).fillStyle(GOLD).fillRect(0, 48, W, 3),
    big(s, 20, 6, 'BITÁCORA DEL BUNKER', 28, GOLDS)]);
  st.logC = s.add.container();
  st.statC = s.add.container(0, 0, [
    rect(s, 516, 56, 268, 536, 0x15122a).o(0).S(2, 0x3b9cff),
    big(s, 532, 64, 'AGUA', 14, '#3b9cff', BLK),
    big(s, 652, 64, 'COMIDA', 14, ORS, BLK),
    txt(s, 532, 136, 'PERSONA', 11, '#8a86a8'),
    txt(s, 776, 136, 'RECIBE', 11, '#8a86a8').o(1, 0),
  ]);
  st.dayT = big(s, 780, 4, '', 32, WHT).o(1, 0);
  st.aT = big(s, 532, 80, '', 30, '#3b9cff', BLK);
  st.cT = big(s, 652, 80, '', 30, ORS, BLK);
  st.spT = [532, 652].map((x) => txt(s, x, 112, '', 12));
  st.rbar = [532, 652].map((x) => rect(s, x, 129, 0, 4).o(0));
  st.statC.add([st.dayT, st.aT, st.cT, ...st.spT, ...st.rbar]);
  st.card = s.add.container(264, 452).V(false);
  st.cardBg = rect(s, 0, 0, 480, 280, 0x16131f).S(3, GOLD);
  st.tag = rect(s, -224, -128, 110, 26, GOLD).o(0);
  st.tagT = txt(s, -269, -115, '', 17, BLK, HF).o();
  st.cardT = txt(s, -224, -90, '', 17).setWordWrapWidth(448);
  st.sel = rect(s, -230, 0, 460, 34, 0x2c2c38).o(0, 0.5).S(2, GOLD);
  st.optT = [0, 1, 2].map(() => txt(s, -210, 0, '', 16).o(0, 0.5).setWordWrapWidth(420));
  st.hint = txt(s, -224, 104, '', 14, GRAYS);
  st.rT = [0, 1, 2, 3, 4, 5, 6].map((i) => txt(s, -210, -38 + i * 22, '', 16).o(0, 0.5));
  st.bar = rect(s, -230, 128, 460, 6, GOLD).o(0, 0.5);
  st.card.add([rect(s, 8, 8, 480, 280, 0, 0.6), st.cardBg, st.tag, st.tagT, st.cardT, st.sel, ...st.optT, ...st.rT, st.hint, st.bar]);
  s.UL.add([st.logC, st.statC, st.card, crt(s)]);

  const n = alive(st).length;
  log(st, !n ? 'Nadie llegó al bunker.' : n == 1 ? 'Se cierra la escotilla. Estás solo en el bunker.' : 'Se cierra la escotilla. Son ' + n + ' en el bunker.', GOLDS);
  log(st, 'Raciones: ' + st.a + ' de agua y ' + st.c + ' de comida.', GOLDS);
  st.lt = DAY_MS;
  if (!n) gameOver(s, 'El apocalipsis empezó sin ' + (st.P.length > 1 ? 'ustedes.' : 'ti.'));
  else openRation(s, 'Primera noche. ¿Cómo se reparte?');
}

function log(st, m, col = '#cfcfe0') {
  const t = txt(st.s, 24, 0, m, 16, col).setWordWrapWidth(472);
  st.rows.push(t);
  st.logC.add(t);
  layoutLog(st);
  stat(st);
}

function layoutLog(st) {
  const max = (st.ev || st.over ? 300 : 584) - 60;
  while (st.rows.reduce((a, r) => a + r.height + 8, 0) > max) st.rows.shift().destroy();
  let y = 60;
  st.rows.forEach((r, i) => { r.y = y; y += r.height + 8; r.setAlpha(0.35 + (0.65 * (i + 1)) / st.rows.length); });
}

const sev = (p) => (p.st > 2 ? 3 : p.th >= LIM.w - 2 || p.hu >= LIM.f - 3 ? 2 : p.st || p.th || p.hu > 2 ? 1 : 0);

function stat(st) {
  const s = st.s, ppl = alive(st);
  st.dayT.T('DÍA ' + st.day);
  [st.a, st.c].forEach((v, i) => {
    const n = ppl.filter((p) => (i ? p.f : p.w)).length, d = n ? MFLOOR(v / n) : 9, c = SEV[d > 3 ? 0 : d > 1 ? 1 : 2];
    [st.aT, st.cT][i].T(v).C(hx(c));
    st.spT[i].T(!n ? 'nadie recibe' : !d ? 'no alcanza' : d + (d == 1 ? ' día' : ' días')).C(hx(c));
    st.rbar[i].setSize(MMIN(d, 7) * 14 + 2, 4).setFillStyle(c);
  });
  st.pplT.forEach((t) => t.destroy());
  st.pplT = st.ppl.flatMap((p, i) => [
    s.add.circle(537, 159 + i * 20, 4, SEV[sev(p)]),
    txt(s, 546, 152 + i * 20, p.n + ': ' + (p.st > 2 ? STATE[p.st] : [p.st && STATE[p.st], p.th && 'sed ' + p.th, p.hu > 2 && 'hambre ' + p.hu].filter(Boolean).join(' · ') || 'bien'),
      12, hx(SEV[sev(p)])),
  ]);
  st.pplT.push(...ppl.map((p) => txt(s, 776, 152 + st.ppl.indexOf(p) * 20, ['A+C', 'A', 'C', 'nada'][mode(p)], 13, mode(p) ? ORS : '#9cc9ff').o(1, 0)));
  let n = 0, y = 168 + st.ppl.length * 20;
  st.pplT.push(txt(s, 532, y, 'BODEGA', 11, '#8a86a8'));
  for (const k in st.inv) if (!WATER[k] && !FOOD[k]) for (let j = 0; j < st.inv[k] && n < 36; j++, n++) st.pplT.push(s.add.image(552 + (n % 6) * 42, y + 38 + (n / 6 | 0) * 42, 'i' + k).setScale(1.3));
  st.statC.add(st.pplT);
}

function hit(st, from, to) {
  const c = st.ppl.filter((p) => p.st < 3 && (from < 0 || p.st == from));
  if (!c.length) return;
  const p = pick(c);
  p.st = to;
  if (to == 3) log(st, p.n == 'Tú' ? 'Moriste.' : p.n + ' murió.', REDS);
  if (!to) log(st, (p.n == 'Tú' ? 'Te recuperas' : p.n + ' se recupera') + '.', TEALS);
}

function apply(st, eff = '') {
  for (const e of eff.split(' ').filter(Boolean)) {
    const n = +e.slice(1), k = e.slice(1);
    if (e[0] == 'a') st.a = MMAX(0, st.a + n);
    else if (e[0] == 'c') st.c = MMAX(0, st.c + n);
    else if (e == 'h') hit(st, 0, 1);
    else if (e == 's') hit(st, 0, 2);
    else if (e == 'x') { hit(st, 1, 0); hit(st, 2, 0); }
    else if (e == 'k') hit(st, -1, 3);
    else if (e == 'd') { st.a = MMAX(0, st.a - alive(st).length); st.c = MMAX(0, st.c - alive(st).length); }
    else if (e == 'e') st.eb += 0.05;
    else if (e == 'r') st.won = 1;
    else if (e[0] == '#') st.fl[k] = 1;
    else if (e[0] == '+') ITEMS[k][2] == 'p' ? st.ppl.push(person(ITEMS[k][0], k)) : (st.inv[k] = (st.inv[k] || 0) + 1);
    else if (e[0] == '-') {
      const p = alive(st).find((q) => q.k == k);
      p ? (p.st = 4) : (st.inv[k] = MMAX(0, (st.inv[k] || 0) - 1));
    }
  }
}

const weight = (tp, d) => (tp == 'r' ? 4 / (d + 1) : tp == 's' && d > 1 && d < 6 ? 1.5 : 1);
const elig = (st, c) => !c || c.split(' ').every((t) => (t[0] == '#' ? st.fl[t.slice(1)] : has(st, t)));
const usable = (st, opts) => opts.filter((o) => o[1] && has(st, o[1])).length;
const wEv = (st, e) => weight(e[0], st.day) * (1 + 0.5 * usable(st, e[3])) * (e[4] && e[4][0] == '#' ? 8 : 1);
const wpick = (a, w) => {
  let r = MRND() * a.reduce((t, x) => t + w(x), 0);
  return a.find((x) => (r -= w(x)) <= 0) || a[0];
};

function flavor(st) {
  const ppl = alive(st), c = [...FLAVOR, ...CTX.filter(([k]) => has(st, k)).map((x) => x[1])];
  if (ppl.some((p) => p.st == 2)) c.push('Se escucha una tos que no para.');
  if (st.a < ppl.length * 2) c.push('El agua se mide con tapitas de bebida.');
  const f = c.filter((l) => !st.fu[l]), l = pick(f.length ? f : c);
  st.fu[l] = 1;
  return l;
}

function nextDay(s) {
  const st = s.st;
  st.day++;
  let short = 0;
  for (const p of alive(st)) {
    if (p.w && st.a > 0) { st.a--; p.th = 0; } else { p.th++; short |= p.w; }
    if (p.f && st.c > 0) { st.c--; p.hu = 0; } else { p.hu++; short |= p.f * 2; }
  }
  const mile = MILE[st.day];
  log(st, 'Día ' + st.day + ' · ' + (short ? ['', 'Falta agua.', 'Falta comida.', 'Falta agua y comida.'][short] : mile || flavor(st)), short ? ORS : mile ? WHT : '#cfcfe0');
  const sed = [], ham = [];
  for (const p of alive(st)) {
    if (p.th >= LIM.w || p.hu >= LIM.f) {
      p.st = 3;
      log(st, (p.n == 'Tú' ? 'Moriste' : p.n + ' murió') + (p.th >= LIM.w ? ' de sed.' : ' de hambre.'), REDS);
    } else (p.th >= LIM.w - 2 ? sed : p.hu >= LIM.f - 3 ? ham : []).push(p.n);
  }
  if (sed.length + ham.length) log(st, [sed.length && 'Sed: ' + sed.join(', '), ham.length && 'Hambre: ' + ham.join(', ')].filter(Boolean).join(' · '), ORS);
  for (const p of alive(st)) {
    if (p.st == 0 || MRND() > (p.st == 2 ? 0.2 : 0.12)) continue;
    if (st.inv.botiquin) { p.st = 0; log(st, 'El botiquín ' + (p.n == 'Tú' ? 'te salva.' : 'salva a ' + p.n + '.'), TEALS); if (MRND() < 0.3) st.inv.botiquin--; }
    else hit(st, p.st, 3);
  }
  const ppl = alive(st);
  if (!ppl.length) return gameOver(s, 'No sobrevivió nadie.');
  const weak = ppl.find((p) => (!p.w && p.th >= LIM.w - 2) || (!p.f && p.hu >= LIM.f - 3));
  if (weak && st.day > st.lastR) return openRation(s, weak.n + (weak.n == 'Tú' ? ' estás' : ' está') + ' muy débil. ¿Le das algo?');
  if (st.day >= ENDING_DAY && MRND() < 0.1 + st.eb) {
    const e = wpick(ENDINGS, (x) => 1 + 3 * usable(st, x[1]));
    return openCard(s, e[0], e[1], 'f');
  }
  if (st.day >= st.next) {
    st.next = st.day + 2 + rnd(2);
    let pool = EVENTS.filter((e, i) => !st.used[i] && elig(st, e[4]));
    if (!pool.length) { st.used = {}; pool = EVENTS.filter((e) => elig(st, e[4])); }
    const ev = wpick(pool, (e) => wEv(st, e));
    st.used[EVENTS.indexOf(ev)] = 1;
    apply(st, ev[2]);
    return openCard(s, ev[1], ev[3], ev[0]);
  }
  const nw = ppl.filter((p) => p.w).length, nf = ppl.filter((p) => p.f).length;
  if (ppl.some((p) => !p.w || !p.f) && st.day - st.lastR >= 2) openRation(s, 'Hay gente racionada. ¿Siguen así?');
  else if (((st.a && st.a < nw) || (st.c && st.c < nf)) && st.day - st.lastR >= 2) openRation(s, 'Mañana no alcanza para todos. ¿A quién le das?');
  else if (st.day - st.lastR >= 4 && st.a + st.c) openRation(s, 'Revisar las raciones. Quedan ' + st.a + ' de agua y ' + st.c + ' de comida.');
}

const RMODE = ['Agua y comida', 'Solo agua', 'Solo comida', 'Nada'];
const mode = (p) => (p.w ? (p.f ? 0 : 1) : p.f ? 2 : 3);

function openRation(s, why) {
  const st = s.st;
  st.lastR = st.day;
  st.rs = alive(st).map(mode).join();
  st.ev = { ration: 1, cur: 0, t: CHOICE_MS };
  setTag(st, 'q');
  st.cardT.T(why);
  st.optT.forEach((t) => t.T(''));
  tone(s, 660, 0.12, TRI, 0.15);
  drawRation(st);
}

function drawRation(st) {
  const ppl = alive(st).slice(0, 6), ev = st.ev;
  st.rT.forEach((t, i) =>
    t.T(i > ppl.length ? '' : (i == ev.cur ? '> ' : '  ') + (i < ppl.length ? ppl[i].n.padEnd(23) + RMODE[mode(ppl[i])] : 'LISTO'))
      .C(i == ev.cur ? GOLDS : i < ppl.length && mode(ppl[i]) ? ORS : WHT));
  st.sel.setSize(460, 22).setY(st.rT[ev.cur].y).V(true);
  st.hint.T('←→ cambiar   B1 listo').C('#9cc9ff');
}

function closeRation(st) {
  const ppl = alive(st), skip = ppl.filter((p) => !p.w || !p.f).map((p) => p.n);
  st.ev = null;
  st.card.V(false);
  st.rT.forEach((t) => t.T(''));
  st.sel.setSize(460, 34);
  st.lt = DAY_MS;
  if (ppl.map(mode).join() != st.rs) log(st, 'Se raciona a: ' + (skip.join(', ') || 'nadie') + '.', '#9cc9ff');
}

function openCard(s, text, opts, kind) {
  const st = s.st;
  st.ev = { opts, t: CHOICE_MS, cur: MMAX(0, opts.findIndex((o) => has(st, o[1]))) };
  setTag(st, kind);
  st.cardT.T(text);
  tone(s, 660, 0.12, TRI, 0.15);
  drawCard(st);
}

function setTag(st, kind) {
  const [l, c] = KIND[kind];
  st.tag.setFillStyle(c);
  st.cardBg.S(3, c);
  st.sel.setFillStyle(c, 0.22).S(2, c);
  st.bar.setFillStyle(c);
  st.tagT.T(l + (kind == 'x' ? '' : ' · DÍA ' + st.day));
  st.tag.width = l.length * 9 + (kind == 'x' ? 24 : 80);
  st.tagT.x = -224 + st.tag.width / 2;
  st.card.V(true);
  layoutLog(st);
}

function drawCard(st) {
  const ev = st.ev, y0 = -20 + MMAX(0, st.cardT.height - 30);
  st.optT.forEach((t, i) => {
    const o = ev.opts[i];
    if (!o) return t.T('');
    const ok = has(st, o[1]);
    t.setY(y0 + i * 40).T((i == ev.cur ? '> ' : '  ') + o[0] + (ok ? '' : ' (no tienes)'))
      .C(!ok ? '#666' : i == ev.cur ? GOLDS : WHT);
  });
  st.sel.V(true).setY(y0 + ev.cur * 40);
  const o = ev.opts[ev.cur];
  st.hint.T(has(st, o[1]) ? '↑ ↓ elegir    B1 confirmar' : 'Te falta: ' + names(o[1])).C(has(st, o[1]) ? GRAYS : ORS);
}

function diff(st, b) {
  const d = [];
  if (st.a != b.a) d.push('Agua ' + (st.a > b.a ? '+' : '') + (st.a - b.a));
  if (st.c != b.c) d.push('Comida ' + (st.c > b.c ? '+' : '') + (st.c - b.c));
  st.ppl.forEach((p, i) => d.push(i >= b.ppl.length ? '+ ' + p.n : p.st != b.ppl[i] ? p.n + ': ' + STATE[p.st] : ''));
  for (const k in st.inv) if (st.inv[k] != (b.inv[k] || 0)) d.push((st.inv[k] > (b.inv[k] || 0) ? '+ ' : '- ') + ITEMS[k][0]);
  return d.filter(Boolean).join('  ·  ');
}

function choose(s) {
  const st = s.st, o = st.ev.opts[st.ev.cur];
  if (!has(st, o[1])) return tone(s, 140, 0.2, SAW, 0.2);
  const win = MRND() < o[2], b = { a: st.a, c: st.c, ppl: st.ppl.map((p) => p.st), inv: { ...st.inv } }, m = win ? o[4] : o[6] || o[4];
  log(st, '» ' + o[0] + ': ' + m, win ? TEALS : '#ff6b4a');
  apply(st, win ? o[3] : o[5]);
  const d = diff(st, b);
  st.optT.forEach((t) => t.T(''));
  st.sel.V(false);
  st.optT[0].T(m).C(win ? TEALS : '#ff6b4a').setFontSize(20);
  st.optT[1].T(d).C(GOLDS).setFontSize(16);
  st.hint.T('B1 continuar').C(GRAYS);
  st.bar.width = 0;
  st.ev.out = OUT_MS;
  sfx(s, win);
}

function stepLog(s, dt) {
  const st = s.st, ev = st.ev;
  const ok = () => any(s, '1') | sp(s);
  if (st.over) {
    const nm = st.nm, c = Phaser.Display.Color.HSVToRGB((st.s.time.now / 1500) % 1, 0.8, 1).color;
    if (st.won) st.cardBg.S(4, c), st.tag.setFillStyle(c);
    if (nm) {
      const h = any(s, 'R') - any(s, 'L'), v = any(s, 'U') - any(s, 'D');
      nm.i = MMAX(0, MMIN(2, nm.i + h));
      nm.l[nm.i] = (nm.l[nm.i] + v + 26) % 26;
      if (ok()) nm.i < 2 ? nm.i++ : saveScore(s);
      if (st.nm) drawName(st);
    } else if (sp(s)) s.scene.restart();
    return;
  }
  if (ev) {
    if (ev.out) {
      ev.out -= dt;
      if (ev.out <= 0 || (ev.out < OUT_MS - 600 && ok())) {
        st.ev = null;
        st.card.V(false);
        st.optT.forEach((t) => t.setFontSize(18));
        st.lt = DAY_MS;
        if (st.won) gameOver(s, '¡Sobrevivieron al apocalipsis!');
        else if (!alive(st).length) gameOver(s, 'No sobrevivió nadie.');
      }
      return;
    }
    ev.t -= dt;
    st.bar.width = 460 * MMAX(0, ev.t / CHOICE_MS);
    const tk = MFLOOR(ev.t / (ev.t < 5000 ? 500 : 1000));
    if (tk != ev.tk) { ev.tk = tk; tone(s, tk % 2 ? 1400 : 1000, 0.04, SQ, 0.015 + 0.12 * (1 - ev.t / CHOICE_MS)); }
    if (ev.ration) {
      const ppl = alive(st).slice(0, 6), n = ppl.length, v = any(s, 'D') - any(s, 'U'), h = any(s, 'R') - any(s, 'L');
      if (v) ev.cur = (ev.cur + v + n + 1) % (n + 1);
      if (h && ev.cur < n) {
        const p = ppl[ev.cur], m = (mode(p) + h + 4) % 4;
        p.w = m < 2;
        p.f = m % 2 == 0;
      }
      if (v || h) { tone(s, 520, 0.05, SQ, 0.08); drawRation(st); stat(st); }
      if (ev.t <= 0 || ok()) closeRation(st);
      return;
    }
    const step = any(s, 'D') ? 1 : any(s, 'U') ? -1 : 0;
    if (step) {
      ev.cur = (ev.cur + step + ev.opts.length) % ev.opts.length;
      tone(s, 520, 0.05, SQ, 0.08);
      drawCard(st);
    }
    if (ev.t <= 0) ev.cur = pick(ev.opts.map((o, i) => (has(st, o[1]) ? i : -1)).filter((i) => i >= 0));
    if (ev.t <= 0 || ok()) choose(s);
    return;
  }
  if ((st.lt -= dt) <= 0 || any(s, '1')) {
    st.lt = DAY_MS;
    nextDay(s);
  }
}

function gameOver(s, why) {
  const st = s.st, n = alive(st).length;
  st.over = 1;
  st.ev = null;
  st.score = st.day * 100 + st.eggs * 300 + n * 200 + (st.won ? 2000 : 0);
  setTag(st, 'x');
  sfx(s, st.won);
  st.sel.V(false);
  st.cardT.T(why);
  st.optT[0].T('Días ' + st.day + ' · Vivos ' + n + ' · Eggs ' + st.eggs).C(WHT).setY(-30);
  st.optT[1].T('PUNTAJE  ' + st.score).C(GOLDS).setFontSize(26).setY(14);
  st.optT[2].T('');
  st.hint.T('START para volver').C(GRAYS);
  st.bar.width = 0;
  if (qualifies(st.P.length, st.score)) {
    st.nm = { l: [0, 0, 0], i: 0 };
    drawName(st);
  }
}

const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
function drawName(st) {
  const { l, i } = st.nm;
  st.hint.T('INICIALES  ' + l.map((c, j) => (j == i ? '[' + ABC[c] + ']' : ' ' + ABC[c] + ' ')).join('') + '  ↑↓ ←→  B1 ok').C(GOLDS).setFontSize(18);
}

function saveScore(s) {
  const st = s.st, np = st.P.length, row = { n: st.nm.l.map((c) => ABC[c]).join(''), s: st.score, d: st.day };
  st.nm = null;
  RANK[np] = clean([...RANK[np], row]);
  store().set(RK, RANK).catch(() => {});
  st.hint.T('Quedaste #' + (RANK[np].indexOf(row) + 1) + ' en el ranking ' + np + 'P · START: volver').C(TEALS);
  arp(s, [523, 659, 784, 1047]);
}

function update(t, dt) {
  const s = this, st = s.st;
  dt = MMIN(dt, 50);
  music(s, ['title', 'loot', 'log'].indexOf(st.ph), ...(st.ph == 'loot' ? [0.4 + st.left / 100, st.left < 20 ? 3 : st.left < 40 ? 2 : 1] : []));
  if (st.ph == 'title') {
    const h = any(s, 'R') - any(s, 'L');
    if (h) { st.mi = h > 0 ? 1 : 0; drawMode(s); tone(s, 520, 0.05, SQ, 0.08); }
    if (pressed(s, 'START1')) start(s, 1);
    else if (pressed(s, 'START2')) start(s, 2);
    else if (any(s, '1')) start(s, st.mi + 1);
  } else if (st.ph == 'alert') {
    st.at += dt;
    if (st.at > 800 && any(s, '1') | sp(s)) {
      st.alert.destroy();
      st.ph = 'loot';
      siren(s);
    }
  } else if (st.ph == 'cine') {
    cine(s, dt);
  } else if (st.ph == 'loot') {
    s_floors = st.floors;
    st.left -= dt / 1000;
    for (const p of st.P) stepPlayer(s, p, t, dt);
    if (st.ni < NOTIFS.length && st.left <= NOTIFS[st.ni][0]) notify(s, ...NOTIFS[st.ni++].slice(1));
    const sec = Math.ceil(st.left);
    if (st.left < 10 && sec != st.tk) { st.tk = sec; tone(s, 1200, 0.04, SQ, 0.08); }
    if (st.left < 20 && (st.sh -= dt) <= 0) {
      const k = (20 - st.left) / 20;
      st.sh = 1500 - 900 * k + rnd(600);
      s.cameras.cameras.forEach((c) => c != st.hud && c.shake(400, 0.003 + 0.012 * k));
      for (const p of st.P) st.dust.explode(20 + 40 * k, p.x, p.y + fy(p.f));
      rumble(s, 0.6, 0.15 + 0.35 * k);
    }
    st.timer.T(MMAX(0, sec)).C(st.left < 10 ? REDS : GOLDS);
    if ((st.msgT -= dt) <= 0) st.msg.T('');
    const inBunker = st.P.every((p) => p.f == 0);
    if (inBunker && st.left < LOOT_S - 1 && sp(s)) st.left = 0;
    if (st.left <= 0) endLoot(s);
  } else if (st.ph == 'log') {
    stepLog(s, dt);
  }
  s.ctl.pressed = {};
}


function ac(s) {
  const c = s.sound.context;
  if (c && c.state == 'suspended') c.resume();
  return c;
}

function tone(s, f, d, type, v, at = 0) {
  const c = ac(s);
  if (!c) return;
  const o = c.createOscillator(), g = c.createGain(), t0 = c.currentTime + at;
  o.type = type;
  o.frequency.value = f;
  g.gain.setValueAtTime(v, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + d);
  o.connect(g).connect(c.destination);
  o.start(t0);
  o.stop(t0 + d);
}

const SONGS = [
  [0.2, 'SNSVVSOSQUXVR.N.SNVXZXUSOSXVURN.GJGLJLN.LJIEFILNSQNSVUSONOQSRNRU', ';G;G7C7C9E9E6B6B;G;G7C7C4@4@6B6B', 1],
  [0.2, 'GJNJILNL', '/./.2.1.', 1],
  [0.42, 'NQU.VUQ.USQSP.L.NQUZXVU.SPM.N...', '6=299@4;6=29186=', 2],
];
let MU = { k: -1 };
const hz = (c, tr = 0) => 440 * 2 ** ((c.charCodeAt(0) - 78 + tr) / 12);
function music(s, k, sp = 1, ly = 2) {
  const c = s.sound.context;
  if (!c || c.state != 'running') return;
  if (k != MU.k) MU = { k, i: 0, t: c.currentTime + 0.1 };
  if (k < 0) return;
  const [d, mel, bas, ev] = SONGS[k];
  MU.t = MMAX(MU.t, c.currentTime);
  while (MU.t < c.currentTime + 0.12) {
    const at = MU.t - c.currentTime, m = mel[MU.i % mel.length], b = bas[(MU.i / ev | 0) % bas.length];
    if (ly > 2) MU.u ??= MU.i;
    const tr = ly > 2 ? MMIN(8, ((MU.i - MU.u) / 8) | 0) : 0;
    if (ly > 1 && m != '.') tone(s, hz(m, tr), d * sp * 0.9, TRI, 0.16, at);
    else if (m == '.' && (MU.i / mel.length) & 1) tone(s, hz(b, [12, 19, 24, 19][MU.i % 4]), d * sp * 0.8, SQ, 0.03, at);
    if (MU.i % ev == 0 && b != '.') tone(s, hz(b, tr), d * sp * ev * 0.8, SQ, 0.04, at);
    if (k == 1 && MU.i % 2 == 0) tone(s, 3000, 0.02, SQ, 0.02, at);
    if (ly > 2 && MU.i % 4 == 0) tone(s, hz('Z', tr), d * sp, SQ, 0.03, at);
    MU.i++;
    MU.t += d * sp;
  }
}

const arp = (s, a, g = 0.1) => a.forEach((f, i) => tone(s, f, 0.15, TRI, 0.15, i * g));
function siren(s) {
  const c = ac(s), t = c?.currentTime;
  if (c) for (const m of [1, 1.19]) {
    const o = c.createOscillator(), g = c.createGain();
    o.type = SQ;
    [80, 360, 360, 55].forEach((f, i) => o.frequency.linearRampToValueAtTime(f * m, t + [0, 1.2, 1.8, 3][i]));
    g.gain.value = 0.014;
    g.gain.setValueAtTime(0.014, t + 2);
    g.gain.linearRampToValueAtTime(0, t + 3);
    o.connect(g).connect(c.destination);
    o.start(t);
    o.stop(t + 3);
  }
}
const sfx = (s, w) => (w ? arp(s, [784, 1568], 0.12) : (tone(s, 90, 0.35, TRI, 0.5), tone(s, 55, 0.25, SQ, 0.12)));
const alarm = (s, n = 6) => { for (let i = 0; i < n; i++) tone(s, i % 2 ? 960 : 1280, 0.28, SQ, 0.1, i * 0.3); };

function rumble(s, d, v) {
  const c = ac(s);
  if (!c) return;
  const n = c.createBufferSource(), b = c.createBuffer(1, c.sampleRate * d, c.sampleRate);
  const f = c.createBiquadFilter(), g = c.createGain(), t0 = c.currentTime, ch = b.getChannelData(0);
  for (let i = 0; i < ch.length; i++) ch[i] = MRND() * 2 - 1;
  n.buffer = b;
  f.type = 'lowpass';
  f.frequency.value = 140;
  g.gain.setValueAtTime(0.01, t0);
  g.gain.linearRampToValueAtTime(v, t0 + d * 0.85);
  g.gain.linearRampToValueAtTime(0, t0 + d);
  n.connect(f).connect(g).connect(c.destination);
  n.start();
}


function createControls(scene) {
  scene.ctl = { held: {}, pressed: {} };
  const onKeyDown = (event) => {
    const code = KEYBOARD_TO_ARCADE[('' + event.key).toLowerCase()];
    ac(scene);
    if (!code) return;
    if (!scene.ctl.held[code]) scene.ctl.pressed[code] = true;
    scene.ctl.held[code] = true;
  };
  const onKeyUp = (event) => {
    const code = KEYBOARD_TO_ARCADE[('' + event.key).toLowerCase()];
    if (code) scene.ctl.held[code] = false;
  };
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
}

function pressed(scene, code) {
  const v = scene.ctl.pressed[code];
  scene.ctl.pressed[code] = false;
  return v;
}

})();
