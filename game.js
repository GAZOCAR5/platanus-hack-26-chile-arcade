// Terremoto — Platanus Hack 26 Santiago
// E1: saqueo top-down en un edificio generado. Ver docs/GAME_SPEC.md.

const W = 800, H = 600, T = 32, GW = 50, GH = 15, NF = 14, FG = GH * T + 240, LOOT_S = 60, SLOTS = 6;

// DO NOT replace existing keys — they match the physical arcade cabinet wiring.
// To add local testing shortcuts, append extra keys to any array.
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
  for (const key of keys) KEYBOARD_TO_ARCADE[normalizeIncomingKey(key)] = arcadeCode;
}

// id: [nombre, espacios, categoría]  a=agua c=comida h=herramienta p=persona e=easter egg
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
  abuela: ['La abuela', 4, 'p'], perro: ['Quiltro', 2, 'p'], gato: ['Gato', 1, 'p'], vecina: ['Vecina copuchenta', 3, 'p'],
  gaviota: ['Gaviota del Festival', 2, 'e'], peluca: ['Peluca de Leo Rey', 1, 'e'], terremoto: ['Terremoto (el trago)', 1, 'e'],
  volantin: ['Volantín con hilo curado', 2, 'e'], bip: ['Tarjeta Bip con saldo', 1, 'e'], lucas: ['Billete de 20 lucas', 1, 'e'],
  moai: ['Moai de souvenir', 3, 'e'], completo: ['Completo a medio comer', 1, 'e'], polera: ['Polera "Yo sobreviví al 27F"', 1, 'e'],
  huaso: ['Sombrero de huaso', 1, 'e'], loteria: ['Cartón de lotería premiado', 1, 'e'], cueca: ['Pañuelo de cueca', 1, 'e'],
  copa: ['Réplica de la Copa América', 2, 'e'],
};
const CAT = { a: 0x3b9cff, c: 0xff9a3b, h: 0x2ec4a0, p: 0xff6fae, e: 0xffd23b };
const EGGS = Object.keys(ITEMS).filter((k) => ITEMS[k][2] == 'e');
const LOOT = Object.keys(ITEMS).filter((k) => 'ach'.includes(ITEMS[k][2]));
const COMMON = ['botella', 'lata', 'marraqueta', 'linterna', 'pilas'];
// [nombre, color de piso, loot sesgado]
const THEMES = [
  ['Tu familia', 0x6b5a3c, ['bidon', 'lata', 'botiquin', 'frazada', 'abrelatas']],
  ['Abuelita', 0x7a5a6a, ['lata', 'porotos', 'manjar', 'botiquin', 'frazada', 'naipe', 'uslero']],
  ['Gamer', 0x3c3f6b, ['pilas', 'linterna', 'bebida', 'tallarines', 'cinta']],
  ['Conserje', 0x5a5a4a, ['linterna', 'cinta', 'cortaplumas', 'gas', 'radio', 'abrelatas']],
  ['Estudiante', 0x4a6b5a, ['tallarines', 'bebida', 'pisco', 'encendedor', 'marraqueta']],
  ['Doctora', 0x6b7a8a, ['botiquin', 'mascarilla', 'botella', 'bidon']],
  ['Tío del asado', 0x7a4a3c, ['charqui', 'encendedor', 'gas', 'pisco', 'marraqueta']],
  ['Airbnb vacío', 0x55555f, ['botella']],
  ['Hippie', 0x5a7a3c, ['guitarra', 'encendedor', 'porotos', 'botella', 'mapa']],
  ['Deportista', 0x3c6b7a, ['botella', 'bidon', 'charqui', 'sopaipillas']],
];
// color de piso por zona: 0 pasillo, 1..10 temas, 11 bunker, 12 PH
const FC = [0x3a3a44, ...THEMES.map((t) => t[1]), 0x4a2a2a, 0x8a7440];
const PC = [0xff6b4a, 0x9b7bff];
const FAMILY_FLOOR = 3;

const rnd = (n) => Math.floor(Math.random() * n);
const pick = (a) => a[rnd(a.length)];
const fy = (f) => (NF - 1 - f) * FG;
const fl = (f) => (f == 0 ? '-3' : f == NF - 1 ? 'PH' : '' + f);
const hy = (f) => 60 + (NF - 1 - f) * 38;
const txt = (s, x, y, str, size, color) =>
  s.add.text(x, y, str, { fontFamily: 'monospace', fontSize: size + 'px', color: color || '#fff' });

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
  s.title = s.add.container(0, 0, [
    txt(s, W / 2, 170, 'TERREMOTO', 72, '#ffd23b').setOrigin(0.5),
    txt(s, W / 2, 250, 'Alerta sísmica: 60 segundos para bajar al bunker', 18).setOrigin(0.5),
    txt(s, W / 2, 330, 'START1: 1 jugador   ·   START2: 2 jugadores', 20, '#2ec4a0').setOrigin(0.5),
    txt(s, W / 2, 380, 'Joystick: moverse   B1: tomar   B2: soltar', 16, '#aaa').setOrigin(0.5),
  ]);
  s.UL.add(s.title);
}

// ---------- generación del edificio ----------

function genFloor(f, extra) {
  const g = new Uint8Array(GW * GH).fill(1), d = new Uint8Array(GW * GH), items = [], labels = [];
  const set = (x, y, v, t) => { g[y * GW + x] = v; if (t !== undefined) d[y * GW + x] = t; };
  const open = (x0, y0, x1, y1, t) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, 0, t); };
  const put = (k, xy) => xy && items.push({ k, f, x: xy[0] * T + T / 2, y: xy[1] * T + T / 2 });
  const free = (x0, y0, x1, y1) => { // tile libre al azar dentro del rectángulo
    for (let i = 0; i < 40; i++) {
      const x = x0 + rnd(x1 - x0 + 1), y = y0 + rnd(y1 - y0 + 1);
      if (g[y * GW + x] == 0 && !items.some((it) => it.x == x * T + T / 2 && it.y == y * T + T / 2)) return [x, y];
    }
  };
  const furnish = (x0, y0, x1, y1, n, avoid) => { // muebles solo en filas de borde: el centro siempre queda libre
    for (let i = 0; i < n; i++) {
      const x = x0 + rnd(x1 - x0 + 1), y = rnd(2) ? y0 : y1;
      if (!avoid.includes(x) && g[y * GW + x] == 0) set(x, y, 4);
    }
  };

  if (f == 0) {
    open(1, 1, 22, 13, 11);
    set(1, 6, 2);
    labels.push([4, 2, 'BUNKER -3: aquí se vacía la mochila']);
    return { g, d, items, labels };
  }

  open(1, 6, 48, 8, 0);
  if (f < NF - 1) set(1, 6, 2);
  set(1, 8, 3);

  if (f == NF - 1) {
    open(4, 1, 48, 13, 12);
    open(1, 6, 4, 8, 12);
    for (let y = 4; y <= 10; y++) for (let x = 22; x <= 32; x++) set(x, y, 5);
    furnish(5, 1, 47, 13, 14, []);
    for (let i = 0; i < 3; i++) put(pick(EGGS), free(5, 2, 47, 12));
    for (let i = 0; i < 6; i++) put(pick(LOOT), free(5, 2, 47, 12));
    labels.push([6, 2, 'PH · Mansión del cuico']);
    return { g, d, items, labels };
  }

  let n = 0;
  for (const [y0, y1, dr] of [[1, 4, 5], [10, 13, 9]]) {
    for (let x = 5; x <= 41; n++) {
      const x1 = Math.min(x + 8 + rnd(5), 47);
      if (x1 - x < 6) break;
      const family = f == FAMILY_FLOOR && n == 0, ti = family ? 0 : 1 + rnd(THEMES.length - 1), th = THEMES[ti];
      open(x, y0, x1, y1, ti + 1);
      const sx = x + 3 + rnd(x1 - x - 5);
      for (let y = y0; y <= y1; y++) set(sx, y, 1);
      set(sx, y0 + 1 + rnd(2), 0, ti + 1);
      let dx;
      do dx = x + 1 + rnd(x1 - x - 1); while (dx == sx);
      set(dx, dr, 0, ti + 1);
      furnish(x, y0, x1, y1, 3, [sx, dx]);
      const k = family ? 3 : ti == 7 ? 1 : 2 + rnd(3);
      for (let i = 0; i < k; i++) put(Math.random() < 0.6 ? pick(th[2]) : pick(COMMON), free(x, y0, x1, y1));
      if (family) { put('abuela', free(x, y0, x1, y1)); put('perro', free(x, y0, x1, y1)); }
      if (Math.random() < (f / NF) * 0.5) put(pick(EGGS), free(x, y0, x1, y1));
      if (n == 0) for (const p of extra[f] || []) put(p, free(x, y0, x1, y1));
      labels.push([dx, dr == 5 ? 4 : 10, fl(f) + 'ABCDEFGH'[n] + ' ' + th[0]]);
      x = x1 + 2;
    }
  }
  return { g, d, items, labels };
}

// Autocheck: cada objeto y cada escalera se alcanza desde la escalera de llegada.
function reachableAll(F) {
  const start = F.g[8 * GW + 1] == 3 ? 8 * GW + 1 : 6 * GW + 1, seen = new Uint8Array(GW * GH), q = [start];
  seen[start] = 1;
  while (q.length) {
    const i = q.pop();
    for (const j of [i - 1, i + 1, i - GW, i + GW]) if (!seen[j] && F.g[j] != 1 && F.g[j] < 4) { seen[j] = 1; q.push(j); }
  }
  return F.items.every((it) => seen[Math.floor(it.y / T) * GW + Math.floor(it.x / T)]) && [6, 8].every((r) => seen[r * GW + 1] || F.g[r * GW + 1] == 1);
}

function drawFloor(s, f, F) {
  const gr = s.make.graphics({ add: false });
  gr.fillStyle(0x15151c).fillRect(0, 0, GW * T, GH * T);
  for (let i = 0; i < GW * GH; i++) {
    const c = F.g[i], x = (i % GW) * T, y = Math.floor(i / GW) * T;
    if (c == 1) continue;
    gr.fillStyle(c == 4 ? 0x5a4636 : c == 5 ? 0x2a7fd6 : FC[F.d[i]]).fillRect(x, y, T, T);
    gr.lineStyle(1, 0x000000, 0.15).strokeRect(x, y, T, T);
    if (c == 2 || c == 3) {
      gr.fillStyle(0x777788).fillRect(x + 2, y + 2, T - 4, T - 4).fillStyle(0xffffff);
      c == 2 ? gr.fillTriangle(x + 16, y + 6, x + 6, y + 26, x + 26, y + 26) : gr.fillTriangle(x + 16, y + 26, x + 6, y + 6, x + 26, y + 6);
    }
  }
  gr.generateTexture('f' + f, GW * T, GH * T);
  gr.destroy();
  s.WL.add(s.add.image(0, fy(f), 'f' + f).setOrigin(0));
  for (const [x, y, l] of F.labels) s.WL.add(txt(s, x * T, fy(f) + y * T + 8, l, 11, '#ffffffaa'));
}

// ---------- partida ----------

function start(s, np) {
  const st = s.st;
  s.title.setVisible(false);
  const extra = {};
  (extra[2 + rnd(9)] ||= []).push('gato');
  (extra[2 + rnd(9)] ||= []).push('vecina');
  st.floors = [];
  for (let f = 0; f < NF; f++) {
    let F;
    do F = genFloor(f, extra); while (!reachableAll(F));
    st.floors.push(F);
    drawFloor(s, f, F);
  }
  st.items = st.floors.flatMap((F) => F.items);
  for (const it of st.items) {
    const [, , c] = ITEMS[it.k];
    it.o = c == 'p' ? s.add.circle(0, 0, 9, CAT[c]) : s.add.rectangle(0, 0, 16, 16, CAT[c]);
    it.o.setStrokeStyle(2, 0x000000).setPosition(it.x, it.y + fy(it.f));
    s.WL.add(it.o);
  }

  // HUD lateral: el edificio en corte
  s.UL.add(s.add.rectangle(720, 0, 80, H, 0x0d0d12).setOrigin(0));
  st.timer = txt(s, 760, 8, '60', 30, '#ffd23b').setOrigin(0.5, 0);
  s.UL.add(st.timer);
  for (let f = 0; f < NF; f++) {
    s.UL.add(s.add.rectangle(724, hy(f), 72, 34, f == 0 ? 0x6b1d1d : f == NF - 1 ? 0x8a6d1a : 0x2a2a36).setOrigin(0));
    s.UL.add(txt(s, 727, hy(f) + 2, fl(f), 10, '#ffffff88'));
  }
  st.bunker = [];
  st.msg = txt(s, 360, 40, '', 16, '#ffd23b').setOrigin(0.5);
  s.UL.add(st.msg);

  const F3 = st.floors[FAMILY_FLOOR];
  st.P = [];
  for (let i = 0; i < np; i++) {
    let x, y;
    do { x = 6 + rnd(6); y = 2 + rnd(2); } while (F3.g[y * GW + x] != 0);
    const o = s.add.container(0, 0, [
      s.add.circle(0, 0, 11, PC[i]).setStrokeStyle(2, 0x111111),
      s.add.circle(-4, -3, 3, 0xffffff),
      s.add.circle(4, -3, 3, 0xffffff),
    ]);
    const vx = np == 1 ? 0 : i * 362, vw = np == 1 ? 720 : 358;
    const p = {
      k: 'P' + (i + 1) + '_', f: FAMILY_FLOOR, x: x * T + T / 2, y: y * T + T / 2, bag: [], alive: 1, lock: 0, o,
      dot: s.add.circle(740 + i * 22, 0, 6, PC[i]).setStrokeStyle(2, 0xffffff),
      lt: txt(s, 0, 0, '', 12).setOrigin(0.5, 1).setBackgroundColor('#000000aa'),
      bt: txt(s, vx + 8, H - 24, '', 13).setBackgroundColor('#000000aa'),
    };
    s.WL.add([o, p.lt]);
    s.UL.add([p.dot, p.bt]);
    const cam = i ? s.cameras.add(vx, 0, vw, H) : s.cameras.main.setViewport(vx, 0, vw, H);
    cam.startFollow(o, true, 0.12, 0.12).ignore(s.UL);
    st.P.push(p);
  }
  if (np == 2) s.UL.add(s.add.rectangle(358, 0, 4, H, 0xffffff).setOrigin(0));
  s.cameras.add(0, 0, W, H).ignore(s.WL);
  st.left = LOOT_S;
  st.ph = 'loot';
}

const used = (p) => p.bag.reduce((a, it) => a + ITEMS[it.k][1], 0);
const tileAt = (f, x, y) => {
  const tx = Math.floor(x / T), ty = Math.floor(y / T);
  return tx < 0 || ty < 0 || tx >= GW || ty >= GH ? 1 : s_floors[f].g[ty * GW + tx];
};
let s_floors; // shortcut: referencia global al edificio actual, una sola escena
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

function say(st, m) {
  st.msg.setText(m);
  st.msgT = 1500;
}

function stepPlayer(s, p, t, dt) {
  const st = s.st, h = (c) => (s.ctl.held[p.k + c] ? 1 : 0);
  let vx = h('R') - h('L'), vy = h('D') - h('U');
  if (t < p.lock) vx = vy = 0;
  const m = Math.hypot(vx, vy) || 1, sp = ((170 - 12 * used(p)) * dt) / 1000;
  if (!blocked(p.f, p.x + (vx / m) * sp, p.y)) p.x += (vx / m) * sp;
  if (!blocked(p.f, p.x, p.y + (vy / m) * sp)) p.y += (vy / m) * sp;

  const c = tileAt(p.f, p.x, p.y);
  if ((c == 2 || c == 3) && t >= p.lock) {
    p.f += c == 2 ? 1 : -1;
    p.x = 2 * T + T / 2;
    p.y = (c == 2 ? 8 : 6) * T + T / 2;
    p.lock = t + 450;
  }
  if (p.f == 0 && p.bag.length) {
    say(st, 'Al bunker: ' + p.bag.map((it) => ITEMS[it.k][0]).join(', '));
    st.bunker.push(...p.bag);
    p.bag = [];
  }

  const near = nearest(st, p, 30);
  if (pressed(s, p.k + '1') && near) {
    if (used(p) + ITEMS[near.k][1] > SLOTS) say(st, 'Mochila llena: suelta algo (B2) o baja al bunker');
    else { near.taken = 1; near.o.setVisible(false); p.bag.push(near); }
  }
  if (pressed(s, p.k + '2') && p.bag.length) {
    const it = p.bag.pop();
    Object.assign(it, { taken: 0, f: p.f, x: p.x, y: p.y });
    it.o.setPosition(p.x, p.y + fy(p.f)).setVisible(true);
  }

  const wy = p.y + fy(p.f), show = nearest(st, p, 40);
  p.o.setPosition(p.x, wy);
  p.lt.setVisible(!!show);
  if (show) p.lt.setText(ITEMS[show.k][0] + ' [' + ITEMS[show.k][1] + ']').setPosition(show.x, show.y + fy(show.f) - 12);
  p.dot.y = hy(p.f) + 17;
  p.bt.setText(p.k.slice(0, 2) + ' ' + used(p) + '/' + SLOTS + ' ' + p.bag.map((it) => ITEMS[it.k][0]).join(', '));
}

function endLoot(s) {
  const st = s.st;
  st.ph = 'res';
  for (const p of st.P) if (p.f != 0) p.alive = 0;
  const count = {};
  for (const it of st.bunker) count[it.k] = (count[it.k] || 0) + 1;
  const list = Object.keys(count).map((k) => ITEMS[k][0] + (count[k] > 1 ? ' x' + count[k] : '')).join(' · ') || 'nada';
  const eggs = st.bunker.filter((it) => ITEMS[it.k][2] == 'e').length;
  s.UL.add(s.add.rectangle(0, 0, W, H, 0x000000, 0.88).setOrigin(0));
  s.UL.add(txt(s, W / 2, 90, 'COMIENZA EL APOCALIPSIS', 34, '#ff6b4a').setOrigin(0.5));
  s.UL.add(txt(s, W / 2, 150, st.P.map((p, i) => 'P' + (i + 1) + (p.alive ? ' llegó al bunker' : ' quedó afuera')).join('   ·   '), 18).setOrigin(0.5));
  s.UL.add(txt(s, 60, 200, 'En el bunker: ' + list, 15).setWordWrapWidth(680));
  s.UL.add(txt(s, W / 2, 500, 'Easter eggs: ' + eggs + '   ·   START para volver', 18, '#ffd23b').setOrigin(0.5));
}

function update(t, dt) {
  const s = this, st = s.st;
  dt = Math.min(dt, 50);
  if (st.ph == 'title') {
    if (pressed(s, 'START1')) start(s, 1);
    else if (pressed(s, 'START2')) start(s, 2);
  } else if (st.ph == 'loot') {
    s_floors = st.floors;
    st.left -= dt / 1000;
    for (const p of st.P) stepPlayer(s, p, t, dt);
    st.timer.setText(Math.max(0, Math.ceil(st.left))).setColor(st.left < 10 ? '#ff4a4a' : '#ffd23b');
    if ((st.msgT -= dt) <= 0) st.msg.setText('');
    const inBunker = st.P.every((p) => p.f == 0);
    if (inBunker && st.P.length && st.left < LOOT_S - 1 && (pressed(s, 'START1') || pressed(s, 'START2'))) st.left = 0;
    if (st.left <= 0) endLoot(s);
  } else if (st.ph == 'res' && (pressed(s, 'START1') || pressed(s, 'START2'))) {
    s.scene.restart();
  }
  s.ctl.pressed = Object.create(null);
}

// ---------- controles (del starter) ----------

function createControls(scene) {
  scene.ctl = { held: Object.create(null), pressed: Object.create(null) };
  const onKeyDown = (event) => {
    const code = KEYBOARD_TO_ARCADE[normalizeIncomingKey(event.key)];
    if (!code) return;
    if (!scene.ctl.held[code]) scene.ctl.pressed[code] = true;
    scene.ctl.held[code] = true;
  };
  const onKeyUp = (event) => {
    const code = KEYBOARD_TO_ARCADE[normalizeIncomingKey(event.key)];
    if (code) scene.ctl.held[code] = false;
  };
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  scene.events.once('shutdown', () => {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
  });
}

function pressed(scene, code) {
  const v = scene.ctl.pressed[code];
  scene.ctl.pressed[code] = false;
  return v;
}

function normalizeIncomingKey(key) {
  if (typeof key !== 'string' || key.length === 0) return '';
  return key === ' ' ? 'space' : key.toLowerCase();
}
