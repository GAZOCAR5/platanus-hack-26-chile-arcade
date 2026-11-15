// 31 Minutos de Terror - Platanus Hack 26 Arcade Challenge
// Fan homage to 31 Minutos (Aplaplac). Co-op stealth: escape the set before Tulio finds you.
// Spec: GAME_SPEC.md. Milestone H1: map, collisions, split screen, movement, darkness.

const W = 800;
const H = 600;
const T = 16; // tile size in px
const ZOOM = 2;
const SPEED = 80; // player px/s

// Arcade cabinet button - keyboard key mapping.
// The physical cabinet sends these exact key codes.
// DO NOT modify this mapping - it matches the real arcade cabinet wiring.
const CABINET_KEYS = {
  P1_U: ['w'], P1_D: ['s'], P1_L: ['a'], P1_R: ['d'],
  P1_1: ['u'], P1_2: ['i'], P1_3: ['o'],
  P1_4: ['j'], P1_5: ['k'], P1_6: ['l'],
  P2_U: ['ArrowUp'], P2_D: ['ArrowDown'], P2_L: ['ArrowLeft'], P2_R: ['ArrowRight'],
  P2_1: ['r'], P2_2: ['t'], P2_3: ['y'],
  P2_4: ['f'], P2_5: ['g'], P2_6: ['h'],
  START1: ['Enter'], START2: ['2'],
};

const KEY_TO_ARCADE = {};
for (const [code, keys] of Object.entries(CABINET_KEYS)) {
  for (const key of keys) KEY_TO_ARCADE[key.length === 1 ? key.toLowerCase() : key] = code;
}

// --- Input: held state + previous frame for edge detection ---
const held = Object.create(null);
let prev = Object.create(null);
const keyCode = (e) => KEY_TO_ARCADE[e.key.length === 1 ? e.key.toLowerCase() : e.key];
window.addEventListener('keydown', (e) => {
  const c = keyCode(e);
  if (c) held[c] = true;
  const ac = window.AC;
  if (ac && ac.state === 'suspended') ac.resume();
});
window.addEventListener('keyup', (e) => { const c = keyCode(e); if (c) held[c] = false; });
const pressed = (c) => held[c] && !prev[c];

// --- Storage (arcade bridge, localStorage fallback) ---
function getStorage() {
  if (window.platanusArcadeStorage) return window.platanusArcadeStorage;
  return {
    async get(k) {
      try {
        const raw = window.localStorage.getItem(k);
        return raw === null ? { found: false, value: null } : { found: true, value: JSON.parse(raw) };
      } catch { return { found: false, value: null }; }
    },
    async set(k, v) { try { window.localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  };
}

// --- Map ---
// '#' wall, ' ' void, '.' floor, 'x' solid prop, 'H' hiding spot, 'N' noise object,
// 'T' task point, 'K' exit keypad, 'E' exit door, '1'/'2' player spawns, 'Z' Tulio spawn,
// 'p' Policarpo, 'm' Mario Hugo, 'c' Calcetin con Rombos Man.
// Rooms: bodega (NW), control (NE), pasillo (center), camarin (W), estudio (E), salida (S).
const MAP = [
  '################################################',
  '#..................#........#..................#',
  '#..................#........#..................#',
  '#..xx.T.......xx...#......T.#...xxxxx..xxxxx...#',
  '#..x.....N.....x...#........#..................#',
  '#..................#........#................H.#',
  '#..............................................#',
  '#.............H................m...............#',
  '#....H....Z........#........#..................#',
  '#..................#........#.........N........#',
  '#..x...............#........#....T.........T...#',
  '#...x.......T..x...#........#..................#',
  '#..................#........#..................#',
  '#..................#.H......#..................#',
  '#########..#########........#########..#########',
  '#..................#........#..................#',
  '#..................#........#..................#',
  '#.H..xxxx....c.....#......N.#...p............T.#',
  '#..................#........#.....xxxxxxxx.....#',
  '#....................................H.........#',
  '#........N.....................................#',
  '#..................#........#..................#',
  '#...............T..#........#.......1..2..N....#',
  '#.H................#........#..T...............#',
  '#...........H......####..####................H.#',
  '#..................##......##..................#',
  '#####################......#####################',
  '                    #......#                    ',
  '                    #......#                    ',
  '                    #......#                    ',
  '                    #K.....#                    ',
  '                    #......#                    ',
  '                    #.....H#                    ',
  '                    #......#                    ',
  '                    #......#                    ',
  '                    ###EE###                    ',
];
const MW = MAP[0].length;
const MH = MAP.length;
const SOLID = '# xHNTKEpmc'; // everything except floor and spawns
const tileAt = (tx, ty) => (tx < 0 || ty < 0 || tx >= MW || ty >= MH ? ' ' : MAP[ty][tx]);
let DOOR = false; // exit door open
const blocks = (c) => SOLID.includes(c) && !(DOOR && c === 'E');
const solidAt = (px, py) => blocks(tileAt(Math.floor(px / T), Math.floor(py / T)));

// --- Sprites as palette matrices ('.' = transparent). Provisional art: colors to validate. ---
const SPR = {
  bodoque: {
    pal: { 1: 0xd8343a, 2: 0xf2a6a6, 3: 0xffffff, 4: 0x1a1010 },
    rows: [
      '...11......11...',
      '...121....121...',
      '...121....121...',
      '...121....121...',
      '....11111111....',
      '...1111111111...',
      '...1341111341...',
      '...1331111331...',
      '...1111441111...',
      '....11111111....',
      '.....222222.....',
      '....12222221....',
      '....12222221....',
      '.....222222.....',
    ],
  },
  juanin: {
    pal: { 1: 0xf0b030, 2: 0x8a5a20, 3: 0xffffff, 4: 0x1a1010 },
    rows: [
      '................',
      '.......44.......',
      '......4444......',
      '.....111111.....',
      '....11111111....',
      '...1133113311...',
      '...1134113411...',
      '...1111111111...',
      '...1111441111...',
      '....11111111....',
      '.....222222.....',
      '....12222221....',
      '....12222221....',
      '.....222222.....',
    ],
  },
  tulio: {
    pal: { 1: 0x3a4a7a, 2: 0xc03030, 3: 0xffffff, 4: 0x2a1a10, 5: 0xe8b890, 6: 0x802020 },
    rows: [
      '.....4444444....',
      '....444444444...',
      '....4555555544..',
      '....5555555554..',
      '....5335553354..',
      '....5345553454..',
      '....5555555555..',
      '....5555665555..',
      '.....55555555...',
      '......555555....',
      '....11122111....',
      '...1111221111...',
      '...1111221111...',
      '...1111111111...',
    ],
  },
};
// Two walk frames share the body; only the feet differ.
const FEET = [['.....44..44.....', '....444..444....'], ['....44....44....', '...444....444...']];

function makeSprite(scene, key, rows, pal) {
  const g = scene.add.graphics();
  rows.forEach((r, y) => {
    for (let x = 0; x < r.length; x++) {
      const c = pal[r[x]];
      if (c !== undefined) g.fillStyle(c).fillRect(x, y, 1, 1);
    }
  });
  g.generateTexture(key, T, T);
  g.destroy();
}

// Simple procedural tiles/props (placeholder art until H5).
function makeTile(scene, key, draw) {
  const g = scene.add.graphics();
  draw(g);
  g.generateTexture(key, T, T);
  g.destroy();
}

function makeTextures(scene) {
  if (scene.textures.exists('floor')) return; // already built (scene restart)
  for (const [k, s] of Object.entries(SPR)) {
    FEET.forEach((f, i) => makeSprite(scene, k + i, s.rows.concat(f), s.pal));
  }
  const tr = SPR.tulio.rows;
  // Glowing eyes drawn above the darkness, and a red-eyed variant for the screamer.
  makeSprite(scene, 'eyes', tr.map((r) => r.replace(/[^3]/g, '.')), { 3: 0xffd0d0 });
  makeSprite(scene, 'scream', tr, { ...SPR.tulio.pal, 3: 0xff2020, 4: 0x000000 });
  makeTile(scene, 'floor', (g) => {
    g.fillStyle(0x2a2118).fillRect(0, 0, T, T);
    g.fillStyle(0x221a12).fillRect(0, 7, T, 1).fillRect(0, 15, T, 1).fillRect(5, 0, 1, 7).fillRect(11, 8, 1, 7);
  });
  makeTile(scene, 'wall', (g) => {
    g.fillStyle(0x3b3550).fillRect(0, 0, T, T);
    g.fillStyle(0x2c2740).fillRect(0, 5, T, 1).fillRect(0, 11, T, 1).fillRect(7, 0, 1, 5).fillRect(3, 6, 1, 5).fillRect(11, 6, 1, 5);
    g.fillStyle(0x4d4668).fillRect(0, 0, T, 2);
  });
  makeTile(scene, 'x', (g) => { // prop box
    g.fillStyle(0x6b4a2a).fillRect(1, 2, 14, 13);
    g.fillStyle(0x4a321c).fillRect(1, 2, 14, 2).fillRect(7, 4, 2, 11);
  });
  makeTile(scene, 'H', (g) => { // hiding spot (curtain/crate)
    g.fillStyle(0x5a1f3a).fillRect(1, 0, 14, 16);
    g.fillStyle(0x7a2f52).fillRect(3, 0, 2, 16).fillRect(8, 0, 2, 16).fillRect(13, 0, 2, 16);
  });
  makeTile(scene, 'N', (g) => { // noise object (radio)
    g.fillStyle(0x8a8a20).fillRect(2, 5, 12, 9);
    g.fillStyle(0x1a1a10).fillCircle(6, 10, 2).fillRect(10, 7, 3, 2);
    g.fillStyle(0xcccccc).fillRect(11, 1, 1, 4);
  });
  makeTile(scene, 'T', (g) => { // task station
    g.fillStyle(0x203a2a).fillRect(1, 3, 14, 12);
    g.fillStyle(0x50ff90).fillRect(3, 5, 10, 5);
    g.fillStyle(0x80ffb0).fillRect(3, 11, 2, 2).fillRect(7, 11, 2, 2).fillRect(11, 11, 2, 2);
  });
  makeTile(scene, 'K', (g) => { // keypad
    g.fillStyle(0x50505a).fillRect(3, 1, 10, 14);
    g.fillStyle(0xe1ff00);
    for (let i = 0; i < 9; i++) g.fillRect(5 + (i % 3) * 2, 4 + Math.floor(i / 3) * 3, 1, 1);
  });
  makeTile(scene, 'E', (g) => { // exit door
    g.fillStyle(0x8a2020).fillRect(0, 0, T, T);
    g.fillStyle(0xff5050).fillRect(0, 0, T, 2);
  });
  makeTile(scene, 'npc', (g) => { // generic NPC placeholder (tinted per character)
    g.fillStyle(0xffffff).fillCircle(8, 6, 5).fillRect(4, 10, 8, 6);
    g.fillStyle(0x000000).fillRect(5, 5, 2, 2).fillRect(9, 5, 2, 2);
  });
  // Soft light discs used to "erase" darkness: normal and hidden (tighter vignette).
  makeLight(scene, 'light', T * 3);
  makeLight(scene, 'lightS', T * 1.5);
}

function makeLight(scene, key, r) {
  const cv = scene.textures.createCanvas(key, r * 2, r * 2);
  const ctx = cv.getContext();
  const grd = ctx.createRadialGradient(r, r, 0, r, r, r);
  grd.addColorStop(0, 'rgba(0,0,0,1)');
  grd.addColorStop(0.6, 'rgba(0,0,0,0.85)');
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, r * 2, r * 2);
  cv.refresh();
}

// --- Rooms (tile rects, interior) used by Tulio's patrol ---
const ROOMS = [
  [1, 1, 18, 13], // bodega
  [29, 1, 46, 13], // control
  [20, 1, 27, 23], // pasillo
  [1, 15, 18, 25], // camarin
  [29, 15, 46, 25], // estudio
  [21, 25, 26, 34], // salida
];
const CAPTIVE = { x: 2 * T + 8, y: 12 * T + 8 }; // where kidnapped players are left (bodega)
const walkable = (tx, ty) => !blocks(tileAt(tx, ty));
const BLOCK_SIGHT = '# x';

// Line of sight: sample the segment every 4px against sight-blocking tiles.
function losClear(ax, ay, bx, by) {
  const n = Math.ceil(Math.hypot(bx - ax, by - ay) / 4);
  for (let i = 1; i < n; i++) {
    const x = ax + ((bx - ax) * i) / n, y = ay + ((by - ay) * i) / n;
    if (BLOCK_SIGHT.includes(tileAt(Math.floor(x / T), Math.floor(y / T)))) return false;
  }
  return true;
}

// BFS on the tile grid. A solid goal (hiding spot, noise object) is reached from any adjacent tile.
function bfs(sx, sy, gx, gy) {
  const k = (x, y) => y * MW + x;
  const from = new Map([[k(sx, sy), -1]]);
  const q = [[sx, sy]];
  const goalSolid = !walkable(gx, gy);
  while (q.length) {
    const [x, y] = q.shift();
    if ((x === gx && y === gy) || (goalSolid && Math.abs(x - gx) + Math.abs(y - gy) === 1)) {
      const path = [];
      for (let c = k(x, y); c !== -1; c = from.get(c)) path.unshift({ x: (c % MW) * T + 8, y: Math.floor(c / MW) * T + 8 });
      return path;
    }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (walkable(nx, ny) && !from.has(k(nx, ny))) { from.set(k(nx, ny), k(x, y)); q.push([nx, ny]); }
    }
  }
  return [];
}

// --- Procedural audio ---
function sfxScream(scene) {
  const ctx = scene.sound.context;
  if (!ctx) return;
  const t = ctx.currentTime, len = Math.floor(ctx.sampleRate * 0.6);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) * 0.35;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.connect(ctx.destination);
  src.start(t);
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(900, t);
  o.frequency.exponentialRampToValueAtTime(90, t + 0.6);
  g.gain.setValueAtTime(0.25, t);
  g.gain.linearRampToValueAtTime(0, t + 0.6);
  o.connect(g).connect(ctx.destination);
  o.start(t);
  o.stop(t + 0.6);
}

const NPC_TINT = { p: 0x6fa8ff, m: 0x9fe070, c: 0xff9ad0 };

function tone(scene, f, dur = 0.08, type = 'square', vol = 0.06) {
  const ctx = scene.sound.context;
  if (!ctx) return;
  const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type;
  o.frequency.value = f;
  g.gain.setValueAtTime(vol, t);
  g.gain.linearRampToValueAtTime(0, t + dur);
  o.connect(g).connect(ctx.destination);
  o.start(t);
  o.stop(t + dur);
}
const ok = (sc) => tone(sc, 880, 0.08);
const bad = (sc) => tone(sc, 110, 0.25, 'sawtooth', 0.08);
const jingle = (sc) => [523, 659, 784, 1047].forEach((f, i) => sc.time.delayedCall(i * 90, () => tone(sc, f, 0.12)));

// --- Tasks (minigames). Each runs in a panel over the player's half of the screen. ---
// init(s) sets state; upd(s, p, dt, sc) returns true when solved; draw(g, s, sc) renders at panel center (0,0).
const COLS = [0xff4040, 0x40a0ff, 0xffe040, 0x40ff80];
const DIRS = ['U', 'R', 'D', 'L'];
const pr = (p, k) => pressed(p.pre + k);
const TASKS = {
  wires: {
    title: 'CABLES DEL ESTUDIO',
    help: 'ARRIBA/ABAJO + 1: UNE LOS COLORES',
    init: (s) => { s.r = Phaser.Utils.Array.Shuffle([0, 1, 2, 3]); s.cur = 0; s.side = 0; s.pick = -1; s.done = []; },
    upd(s, p, dt, sc) {
      if (pr(p, 'U')) s.cur = (s.cur + 3) % 4;
      if (pr(p, 'D')) s.cur = (s.cur + 1) % 4;
      if (pr(p, '1')) {
        if (!s.side) {
          if (!s.done.includes(s.cur)) { s.pick = s.cur; s.side = 1; ok(sc); }
        } else {
          if (s.r[s.cur] === s.pick && !s.done.includes(s.pick)) { s.done.push(s.pick); ok(sc); } else bad(sc);
          s.side = 0;
        }
      }
      return s.done.length === 4;
    },
    draw(g, s) {
      for (let i = 0; i < 4; i++) {
        g.fillStyle(COLS[i]).fillRect(-130, -70 + i * 40, 24, 16);
        g.fillStyle(COLS[s.r[i]]).fillRect(106, -70 + i * 40, 24, 16);
      }
      g.lineStyle(4, 0xffffff);
      for (const c of s.done) g.lineStyle(4, COLS[c]).lineBetween(-106, -62 + c * 40, 106, -62 + s.r.indexOf(c) * 40);
      if (s.side) g.lineStyle(2, COLS[s.pick]).lineBetween(-106, -62 + s.pick * 40, 100, -62 + s.cur * 40);
      g.lineStyle(2, 0xffffff).strokeRect(s.side ? 102 : -134, -74 + s.cur * 40, 32, 24);
    },
  },
  tune: {
    title: 'SINTONIZAR LA SENAL',
    help: 'IZQ/DER: MANTEN LA AGUJA EN VERDE',
    init: (s) => { s.x = 0.5; s.v = 0; s.t = 0; s.ph = 0; },
    upd(s, p, dt) {
      s.ph += dt;
      s.v = (s.v + (Math.random() - 0.5) * dt * 3) * 0.98;
      const push = ((held[p.pre + 'R'] ? 1 : 0) - (held[p.pre + 'L'] ? 1 : 0)) * dt * 0.8;
      s.x = Phaser.Math.Clamp(s.x + s.v * dt + push, 0, 1);
      s.c = 0.5 + 0.3 * Math.sin(s.ph * 0.7);
      if (Math.abs(s.x - s.c) < 0.1) s.t += dt;
      return s.t >= 3;
    },
    draw(g, s) {
      g.fillStyle(0x222222).fillRect(-140, -20, 280, 30);
      g.fillStyle(0x30a050).fillRect(-140 + (s.c - 0.1) * 280, -20, 56, 30);
      g.fillStyle(0xffffff).fillRect(-141 + s.x * 280, -28, 3, 46);
      g.fillStyle(0xe1ff00).fillRect(-140, 40, (Math.min(s.t, 3) / 3) * 280, 8);
    },
  },
  simon: {
    title: 'CONSOLA DE EFECTOS',
    help: 'MIRA Y REPITE CON EL JOYSTICK',
    init: (s) => { s.seq = Array.from({ length: 6 }, () => Phaser.Math.Between(0, 3)); s.n = 4; s.i = 0; s.show = -0.5; s.lit = -1; s.lt = 0; },
    upd(s, p, dt, sc) {
      if (s.show !== null) {
        s.show += dt;
        const k = Math.floor(s.show / 0.5);
        const lit = s.show >= 0 && k < s.n && s.show % 0.5 < 0.35 ? s.seq[k] : -1;
        if (lit >= 0 && lit !== s.lit) tone(sc, 300 + lit * 120, 0.2);
        s.lit = lit;
        if (k >= s.n) { s.show = null; s.i = 0; }
        return false;
      }
      s.lt -= dt;
      if (s.lt <= 0) s.lit = -1;
      for (let d = 0; d < 4; d++) {
        if (!pr(p, DIRS[d])) continue;
        s.lit = d;
        s.lt = 0.2;
        if (d === s.seq[s.i]) {
          tone(sc, 300 + d * 120, 0.15);
          if (++s.i === s.n) { if (++s.n > 6) return true; s.show = -0.6; }
        } else { bad(sc); s.show = -0.6; }
      }
      return false;
    },
    draw(g, s) {
      [[0, -55], [55, 0], [0, 55], [-55, 0]].forEach(([x, y], d) => {
        g.fillStyle(COLS[d], s.lit === d ? 1 : 0.25).fillRect(x - 22, y - 22, 44, 44);
      });
      for (let i = 0; i < 6; i++) g.fillStyle(i < s.n - 1 ? 0xe1ff00 : 0x333333).fillRect(-50 + i * 18, 95, 10, 6);
    },
  },
  lights: {
    title: 'CALIBRAR LOS FOCOS',
    help: '1 CUANDO LA BARRA ESTE AL CENTRO (x3)',
    init: (s) => { s.x = 0; s.d = 1; s.sp = 0.8; s.h = 0; },
    upd(s, p, dt, sc) {
      s.x += s.d * s.sp * dt;
      if (s.x > 1 || s.x < 0) { s.d *= -1; s.x = Phaser.Math.Clamp(s.x, 0, 1); }
      if (pr(p, '1')) {
        if (Math.abs(s.x - 0.5) < 0.07) { s.h++; s.sp *= 1.3; ok(sc); } else { s.h = 0; bad(sc); }
      }
      return s.h >= 3;
    },
    draw(g, s) {
      g.fillStyle(0x222222).fillRect(-140, -15, 280, 30);
      g.fillStyle(0x30a050).fillRect(-20, -15, 40, 30);
      g.fillStyle(0xffffff).fillRect(-142 + s.x * 280, -24, 4, 48);
      for (let i = 0; i < 3; i++) g.fillStyle(i < s.h ? 0xe1ff00 : 0x333333).fillCircle(-30 + i * 30, 50, 8);
    },
  },
  gen: {
    title: 'GENERADOR (ENTRE LOS DOS)',
    help: 'CADA UNO EN UNA PALANCA: ALTERNEN 1',
    init() {},
    upd(s, p, dt, sc) {
      const G = sc.gen;
      if (G.at[0] && G.at[1] && pr(p, '1')) {
        if (G.turn === p.lever) { G.fill += 0.06; G.turn = 1 - p.lever; tone(sc, 200 + G.fill * 400, 0.06); } else bad(sc);
      }
      return G.fill >= 1;
    },
    draw(g, s, sc) {
      const G = sc.gen;
      g.fillStyle(0x222222).fillRect(-140, -10, 280, 24);
      g.fillStyle(0xe1ff00).fillRect(-140, -10, Math.min(G.fill, 1) * 280, 24);
      g.fillStyle(G.at[0] && G.at[1] ? 0x40ff80 : 0xff4040).fillCircle(0, 50, 8);
    },
  },
};
const TIME = 300; // seconds until "on air"
const SCORE_KEY = '31mdt:scores';
const midi = (n) => 440 * 2 ** ((n - 69) / 12);
// Original eerie loop in A minor: 16 eighth-note steps, 0 = rest.
const BASS = [45, 0, 45, 0, 40, 0, 40, 0, 41, 0, 41, 0, 40, 0, 44, 0];
const MEL = [69, 0, 0, 72, 0, 71, 0, 0, 68, 0, 0, 0, 64, 0, 0, 0];
function music(sc, dt, fast) {
  const m = sc.mus || (sc.mus = { t: 0, i: 0 });
  if ((m.t -= dt) > 0) return;
  const d = fast ? 0.17 : 0.32;
  m.t = d;
  const b = BASS[m.i], n = MEL[m.i];
  if (b) tone(sc, midi(b), d * 0.9, 'triangle', 0.06);
  if (n) tone(sc, midi(n), d * 1.6, 'square', 0.018);
  m.i = (m.i + 1) % 16;
}

// Validates whatever comes back from storage: the shape may have changed between releases.
async function loadScores() {
  try {
    const r = await getStorage().get(SCORE_KEY);
    const v = r && r.found && Array.isArray(r.value) ? r.value : [];
    return v.filter((e) => e && typeof e.n === 'string' && Number.isFinite(e.s)).slice(0, 5);
  } catch { return []; }
}

// NPC lines: the famous quotes are placeholders for the user to fill in; the second line is a gameplay hint.
const NPC_INFO = {
  p: { name: 'POLICARPO', pitch: 520, lines: ['[FRASE C\u00c9LEBRE DE POLICARPO]', 'El generador de la bodega mete mucho ruido. Tulio lo oye.'] },
  m: { name: 'MARIO HUGO', pitch: 760, lines: ['[FRASE C\u00c9LEBRE DE MARIO HUGO]', 'Si te equivocas de c\u00f3digo en la puerta, suena la alarma.'] },
  c: { name: 'CALCET\u00cdN CON ROMBOS MAN', pitch: 380, lines: ['[FRASE C\u00c9LEBRE DE CALCET\u00cdN CON ROMBOS MAN]', 'Esc\u00f3ndete antes de que te vea. Si te ve entrar, te saca.'] },
};
const INTRO = [
  'Termin\u00f3 el noticiero. Se apagaron las luces.',
  'Tulio cerr\u00f3 el set. Nadie se va hasta que \u00e9l lo diga.',
  'Hagan las tareas, armen el c\u00f3digo y escapen.',
];

// --- Tulio tuning (px/s, px, s) ---
const TU = { patrol: 55, investigate: 70, chase: 92, search: 60, view: 6 * T, fov: Math.PI * 70 / 180, lose: 1.5, searchT: 5 };
const NOISE_R = 10 * T;

// --- Play scene ---
class Play extends Phaser.Scene {
  constructor() { super('play'); }

  w(o) { this.world.add(o); return o; }

  create() {
    makeTextures(this);
    this.world = this.add.layer();
    this.ui = this.add.layer();
    this.pts = { T: [], H: [], N: [], K: [], E: [], npc: [] };
    this.stats = { distract: 0, survived: 0, rescue: 0 };
    this.over = false;
    DOOR = false;
    this.left = TIME;
    this.rage = false;
    this.done = 0;

    // Static map baked into one texture; interactive props are separate images.
    const bg = this.w(this.add.renderTexture(0, 0, MW * T, MH * T).setOrigin(0));
    const spawn = {};
    for (let y = 0; y < MH; y++) {
      for (let x = 0; x < MW; x++) {
        const c = MAP[y][x];
        const px = x * T + 8, py = y * T + 8;
        if (c === ' ') continue;
        bg.draw(c === '#' ? 'wall' : 'floor', px - 8, py - 8);
        if (c === 'x') bg.draw('x', px - 8, py - 8);
        if ('HNTKE'.includes(c)) this.pts[c].push({ x: px, y: py, img: this.w(this.add.image(px, py, c)) });
        if ('pmc'.includes(c)) this.pts.npc.push({ id: c, x: px, y: py, img: this.w(this.add.image(px, py, 'npc').setTint(NPC_TINT[c])) });
        if ('12Z'.includes(c)) spawn[c] = { x: px, y: py };
      }
    }

    this.players = [
      this.makePlayer('bodoque', spawn[1], 'P1_', 0),
      this.makePlayer('juanin', spawn[2], 'P2_', 1),
    ];

    const tz = spawn.Z;
    this.tu = {
      spr: this.w(this.add.sprite(tz.x, tz.y, 'tulio0').setDepth(10)),
      eyes: this.w(this.add.image(tz.x, tz.y, 'eyes').setDepth(101)),
      mark: this.w(this.add.text(tz.x, tz.y - 14, '', { fontFamily: 'monospace', fontSize: '10px', color: '#ff4040' }).setOrigin(0.5).setDepth(102)),
      st: 'patrol', path: [], face: 0, wait: 0, step: 0, target: null, last: null, lost: 0, timer: 0, repath: 0, chased: false, calm: 0, foot: 0, hb: 0,
    };

    // Darkness: redrawn each frame; lights erased around players and Tulio's lantern cone.
    this.dark = this.w(this.add.renderTexture(0, 0, MW * T, MH * T).setOrigin(0).setDepth(100));
    this.cone = this.make.graphics({ add: false });

    // Split screen: one camera per player, plus a UI camera that ignores the world.
    const camA = this.cameras.main.setViewport(0, 0, W / 2, H);
    const camB = this.cameras.add(W / 2, 0, W / 2, H);
    this.cams = [camA, camB];
    this.cams.forEach((cam, i) => {
      cam.setZoom(ZOOM).setBounds(0, 0, MW * T, MH * T).setRoundPixels(true).setBackgroundColor(0x000000);
      cam.startFollow(this.players[i].spr, true, 0.15, 0.15);
      cam.ignore(this.ui);
    });
    this.cameras.add(0, 0, W, H).ignore(this.world);

    this.ui.add(this.add.rectangle(W / 2, H / 2, 2, H, 0xe1ff00));
    this.txt(W / 4, 8, 'P1 BODOQUE', '#ff7a7a');
    this.txt((W * 3) / 4, 8, 'P2 JUAN\u00cdN', '#f0b030');
    this.clock = this.txt(W / 2, H - 24, 'AL AIRE EN 5:00', '#e1ff00');
    this.hints = this.players.map((p) => this.txt(W / 4 + p.i * (W / 2), H - 48, '', '#b8c48d'));
    this.codeTxt = this.players.map((p) => this.txt(W / 4 + p.i * (W / 2), 28, '', '#e1ff00'));
    this.setupTasks();
    for (const p of this.players) {
      const c = this.add.container(W / 4 + p.i * (W / 2), H - 140).setVisible(false);
      p.dlg = {
        c,
        img: this.add.image(-148, 0, 'npc').setScale(3),
        name: this.add.text(-112, -36, '', { fontFamily: 'monospace', fontSize: '12px', color: '#e1ff00' }),
        body: this.add.text(-112, -18, '', { fontFamily: 'monospace', fontSize: '13px', color: '#ffffff', wordWrap: { width: 270 } }),
      };
      c.add([this.add.rectangle(0, 0, 380, 100, 0x000000).setStrokeStyle(2, 0xffffff), p.dlg.img, p.dlg.name, p.dlg.body]);
      this.ui.add(c);
    }
    this.intro = { i: 0, n: 0, box: this.add.container(W / 2, H / 2) };
    this.intro.txt = this.add.text(0, 0, '', { fontFamily: 'monospace', fontSize: '18px', color: '#ffffff', align: 'center', wordWrap: { width: 560 } }).setOrigin(0.5);
    this.intro.box.add([this.add.rectangle(0, 0, 620, 130, 0x000000).setStrokeStyle(2, 0xffffff), this.intro.txt, this.add.text(0, 48, '1: SEGUIR', { fontFamily: 'monospace', fontSize: '11px', color: '#b8c48d' }).setOrigin(0.5)]);
    this.ui.add(this.intro.box);
  }

  txt(x, y, s, col, size = 14) {
    const t = this.add.text(x, y, s, { fontFamily: 'monospace', fontSize: size + 'px', color: col, align: 'center' }).setOrigin(0.5, 0);
    this.ui.add(t);
    return t;
  }

  makePlayer(key, at, pre, i) {
    const spr = this.w(this.add.sprite(at.x, at.y, key + '0').setDepth(10));
    return { key, spr, pre, i, step: 0, hide: null, seenHide: false, caught: false, out: false, res: 0, task: null };
  }

  // Axis-separated move with a small feet hitbox so players slide along walls.
  move(p, dx, dy) {
    const hit = (x, y) => solidAt(x - 5, y + 2) || solidAt(x + 5, y + 2) || solidAt(x - 5, y + 7) || solidAt(x + 5, y + 7);
    const s = p.spr;
    if (dx && !hit(s.x + dx, s.y)) s.x += dx;
    if (dy && !hit(s.x, s.y + dy)) s.y += dy;
  }

  near(list, s, r) {
    let best = null, bd = r;
    for (const o of list) {
      const d = Math.hypot(o.x - s.x, o.y - s.y);
      if (d < bd) { bd = d; best = o; }
    }
    return best;
  }

  // --- Tulio perception ---
  canSee(p) {
    if (p.hide || p.caught || p.out) return false;
    if (this.rage) return true; // on air: Tulio hunts everyone in the open
    const t = this.tu.spr, s = p.spr;
    const d = Math.hypot(s.x - t.x, s.y - t.y);
    if (d > TU.view) return false;
    const close = d < T * 1.2; // feels anyone right next to him
    const a = Phaser.Math.Angle.Wrap(Math.atan2(s.y - t.y, s.x - t.x) - this.tu.face);
    return (close || Math.abs(a) <= TU.fov / 2) && losClear(t.x, t.y, s.x, s.y);
  }

  goTo(x, y) {
    const t = this.tu.spr;
    this.tu.path = bfs(Math.floor(t.x / T), Math.floor(t.y / T), Math.floor(x / T), Math.floor(y / T));
  }

  setState(st) {
    const u = this.tu;
    if (u.st === 'chase' && st !== 'chase') u.chased = true;
    u.st = st;
    u.wait = 0;
    u.mark.setText(st === 'chase' ? '!' : st === 'patrol' ? '' : '?');
  }

  randomIn(r) {
    for (let i = 0; i < 30; i++) {
      const tx = Phaser.Math.Between(r[0], r[2]), ty = Phaser.Math.Between(r[1], r[3]);
      if (walkable(tx, ty)) return { x: tx * T + 8, y: ty * T + 8 };
    }
    return { x: r[0] * T + 8, y: r[1] * T + 8 };
  }

  pickPatrol() {
    const inRoom = (r, s) => s.x >= r[0] * T && s.x < (r[2] + 1) * T && s.y >= r[1] * T && s.y < (r[3] + 1) * T;
    const wts = ROOMS.map((r) => (this.players.some((p) => !p.caught && inRoom(r, p.spr)) ? 2 : 1));
    let n = Math.random() * wts.reduce((a, b) => a + b);
    const r = ROOMS[wts.findIndex((wt) => (n -= wt) < 0)];
    const pt = this.randomIn(r);
    this.goTo(pt.x, pt.y);
  }

  // Noise event: pulls Tulio unless he is actively watching his chase target.
  noise(x, y, r) {
    const u = this.tu, t = u.spr;
    const ring = this.w(this.add.circle(x, y, 4).setStrokeStyle(1, 0xe1ff00).setDepth(102));
    this.tweens.add({ targets: ring, radius: 40, alpha: 0, duration: 900, onComplete: () => ring.destroy() });
    if (Math.hypot(x - t.x, y - t.y) > r) return;
    if (u.st === 'chase') {
      if (this.canSee(u.target)) return;
      this.stats.distract++;
    }
    this.setState('investigate');
    u.last = { x, y };
    this.goTo(x, y);
  }

  capture(p) {
    const u = this.tu;
    this.closeTask(p);
    this.endTalk(p);
    p.res = 0;
    p.caught = true;
    p.hide = null;
    p.seenHide = false;
    p.spr.setVisible(true).setTint(0x606060).setPosition(CAPTIVE.x, CAPTIVE.y);
    u.chased = false;
    u.calm = 2;
    u.target = null;
    this.setState('patrol');
    u.path = [];
    // Screamer over the caught player's half of the screen. No strobe: one zoom-in, then fade.
    const f = this.add.image(W / 4 + p.i * (W / 2), H / 2, 'scream').setScale(6);
    this.ui.add(f);
    this.tweens.add({ targets: f, scale: 24, duration: 600, ease: 'Quad.easeIn', onComplete: () => this.tweens.add({ targets: f, alpha: 0, duration: 300, onComplete: () => f.destroy() }) });
    sfxScream(this);
    if (this.players.every((q) => q.caught)) this.end(false);
  }

  updateTulio(dt) {
    const u = this.tu, t = u.spr;
    u.calm = Math.max(0, u.calm - dt);
    const seen = u.calm ? [] : this.players.filter((p) => this.canSee(p));

    if (seen.length && u.st !== 'chase') {
      seen.sort((a, b) => Math.hypot(a.spr.x - t.x, a.spr.y - t.y) - Math.hypot(b.spr.x - t.x, b.spr.y - t.y));
      u.target = seen[0];
      u.lost = 0;
      u.last = { x: u.target.spr.x, y: u.target.spr.y };
      this.setState('chase');
    }

    let speed = TU[u.st] * (1 + 0.05 * this.done);
    if (u.st === 'chase') {
      const p = u.target;
      if (p.caught || p.out) { this.setState('patrol'); u.path = []; }
      else if (p.hide && p.seenHide) {
        // Saw them hide: walk to the spot and pull them out.
        if (Math.hypot(p.hide.x - t.x, p.hide.y - t.y) < T * 1.3) return this.capture(p);
        if ((u.repath -= dt) <= 0) { u.repath = 0.5; this.goTo(p.hide.x, p.hide.y); }
      } else if (this.canSee(p)) {
        u.lost = 0;
        u.last = { x: p.spr.x, y: p.spr.y };
        if (Math.hypot(p.spr.x - t.x, p.spr.y - t.y) < 10) return this.capture(p);
        if ((u.repath -= dt) <= 0) { u.repath = 0.5; this.goTo(p.spr.x, p.spr.y); }
      } else if ((u.lost += dt) > TU.lose || p.hide) {
        this.setState('search');
        u.timer = TU.searchT;
        this.goTo(u.last.x, u.last.y);
      }
    } else if (!u.path.length) {
      // Arrived somewhere: look around, then decide what next.
      u.wait += dt;
      u.face += Math.sin(u.wait * 3) * dt * 2;
      if (u.st === 'patrol' && u.wait > 1.5) { u.wait = 0; this.pickPatrol(); }
      else if (u.st === 'investigate' && u.wait > 3) { this.setState('search'); u.timer = TU.searchT; }
      else if (u.st === 'search' && u.wait > 0.8) {
        u.wait = 0;
        // Searching: sometimes checks a nearby hiding spot, otherwise wanders near the last clue.
        const h = Math.random() < 0.25 && this.near(this.pts.H, u.last, T * 4);
        if (h) {
          u.check = h;
          this.goTo(h.x, h.y);
        } else {
          const r = 3;
          this.goTo(u.last.x + Phaser.Math.Between(-r, r) * T, u.last.y + Phaser.Math.Between(-r, r) * T);
        }
      }
    }

    if (u.st === 'search') {
      const c = u.check;
      if (c && Math.hypot(c.x - t.x, c.y - t.y) < T * 1.3) {
        u.check = null;
        const p = this.players.find((q) => q.hide === c);
        if (p) return this.capture(p);
      }
      if ((u.timer -= dt) <= 0) {
        if (u.chased) this.stats.survived++;
        u.chased = false;
        this.setState('patrol');
        u.path = [];
      }
    }

    // Follow path.
    const nx = u.path[0];
    if (nx) {
      const dx = nx.x - t.x, dy = nx.y - t.y, d = Math.hypot(dx, dy), s = speed * dt;
      if (d <= s) { t.setPosition(nx.x, nx.y); u.path.shift(); }
      else { t.x += (dx / d) * s; t.y += (dy / d) * s; }
      u.face = Phaser.Math.Angle.RotateTo(u.face, Math.atan2(dy, dx), 8 * dt);
      if (dx) t.setFlipX(dx < 0);
      u.step += dt;
    }
    t.setTexture('tulio' + (Math.floor(u.step * 5) % 2));
    u.eyes.setPosition(t.x, t.y).setFlipX(t.flipX);
    u.mark.setPosition(t.x, t.y - 14);

    // Audio warnings: footsteps by distance, heartbeat when he is close.
    const alive = this.players.filter((p) => !p.caught && !p.out);
    const d = alive.length ? Math.min(...alive.map((p) => Math.hypot(p.spr.x - t.x, p.spr.y - t.y))) : 1e9;
    if (nx && (u.foot -= dt) <= 0) {
      u.foot = u.st === 'chase' ? 0.25 : 0.42;
      if (d < 12 * T) tone(this, 70, 0.07, 'sine', 0.15 * (1 - d / (12 * T)));
    }
    if ((u.hb -= dt) <= 0 && d < 5 * T) {
      u.hb = 0.35 + (d / (5 * T)) * 0.6;
      tone(this, 55, 0.08, 'sine', 0.12);
      this.time.delayedCall(140, () => tone(this, 50, 0.08, 'sine', 0.09));
    }
  }


  // --- Tasks, keypad and panels ---
  setupTasks() {
    const A = Phaser.Utils.Array;
    this.code = [0, 1, 2, 3].map(() => Phaser.Math.Between(0, 9));
    this.got = [0, 0, 0, 0];
    const slots = A.Shuffle([0, 1, 2, 3]);
    // The co-op generator always uses the two bodega stations; the rest get 3 random tasks.
    const bod = this.pts.T.filter((t) => t.x < 19 * T && t.y < 14 * T);
    const rest = A.Shuffle(this.pts.T.filter((t) => !bod.includes(t)));
    const names = A.Shuffle(['wires', 'tune', 'simon', 'lights']).slice(0, 3);
    this.tasks = [{ name: 'gen', slot: slots[0], pts: bod }, ...names.map((n, i) => ({ name: n, slot: slots[i + 1], pts: [rest[i]] }))];
    this.gen = { fill: 0, at: [null, null], turn: 0 };
    this.pts.T.forEach((t) => t.img.setTint(0x303030));
    const live = [];
    for (const k of this.tasks) for (const pt of k.pts) { pt.task = k; pt.img.clearTint(); live.push(pt.img); }
    this.tweens.add({ targets: live, alpha: 0.55, yoyo: true, repeat: -1, duration: 700 });

    for (const p of this.players) {
      const c = this.add.container(W / 4 + p.i * (W / 2), H / 2).setVisible(false);
      const t = (y, size, col) => this.add.text(0, y, '', { fontFamily: 'monospace', fontSize: size + 'px', color: col, align: 'center' }).setOrigin(0.5);
      p.pan = { c, g: this.add.graphics(), title: t(-118, 16, '#ffffff'), info: t(-88, 14, '#e1ff00'), help: t(118, 12, '#b8c48d') };
      c.add([this.add.rectangle(0, 0, 360, 280, 0x000000).setStrokeStyle(2, 0xffffff), p.pan.g, p.pan.title, p.pan.info, p.pan.help]);
      this.ui.add(c);
    }
    this.refreshCode();
  }

  refreshCode() {
    const s = '[ ' + this.code.map((d, i) => (this.got[i] ? d : '_')).join(' ') + ' ]';
    this.codeTxt.forEach((t) => t.setText(s));
  }

  openTask(p, k, pt) {
    p.task = k;
    p.s = {};
    p.msg = 0;
    if (k.name === 'pad') { p.s.w = [0, 0, 0, 0]; p.s.c = 0; } else TASKS[k.name].init(p.s);
    if (k.name === 'gen') { p.lever = k.pts.indexOf(pt); this.gen.at[p.lever] = p; }
    const def = TASKS[k.name] || { title: 'PUERTA DE EMERGENCIA', help: 'JOYSTICK: ELIGE EL CODIGO / 1: PROBAR' };
    p.pan.title.setText(def.title);
    p.pan.help.setText(def.help + '\n2: SALIR');
    p.pan.info.setText('').setFontSize(14).setY(-88);
    p.pan.g.clear();
    p.pan.c.setVisible(true);
  }

  closeTask(p) {
    if (!p.task) return;
    if (p.task.name === 'gen' && this.gen.at[p.lever] === p) this.gen.at[p.lever] = null;
    p.task = null;
    p.pan.c.setVisible(false);
  }

  // Show a message in the panel for a moment, then close it.
  flash(p, s, col = '#e1ff00') {
    p.msg = 1.4;
    p.pan.g.clear();
    p.pan.info.setText(s).setFontSize(26).setY(0).setColor(col);
  }

  finishTask(k) {
    k.done = true;
    this.got[k.slot] = 1;
    this.done++;
    jingle(this);
    for (const pt of k.pts) { this.tweens.killTweensOf(pt.img); pt.img.setAlpha(1).setTint(0x505050); }
    this.refreshCode();
    for (const p of this.players) if (p.task === k) this.flash(p, `ESCENA ${k.slot + 1}: ${this.code[k.slot]}`);
    if (k.name === 'gen') this.noise(k.pts[0].x, k.pts[0].y, 12 * T); // the generator is loud
  }

  updatePad(p) {
    const s = p.s;
    if (pr(p, 'L')) s.c = (s.c + 3) % 4;
    if (pr(p, 'R')) s.c = (s.c + 1) % 4;
    if (pr(p, 'U')) s.w[s.c] = (s.w[s.c] + 1) % 10;
    if (pr(p, 'D')) s.w[s.c] = (s.w[s.c] + 9) % 10;
    p.pan.info.setText(s.w.map((d, i) => (i === s.c ? `[${d}]` : ` ${d} `)).join(' ')).setFontSize(28).setY(-10);
    if (!pr(p, '1')) return;
    if (s.w.join() === this.code.join()) {
      DOOR = true;
      this.pts.E.forEach((e) => e.img.setVisible(false));
      jingle(this);
      this.flash(p, 'PUERTA ABIERTA');
    } else {
      // Wrong code sets off the alarm: Tulio comes running.
      [0, 1, 2, 3].forEach((i) => this.time.delayedCall(i * 200, () => tone(this, i % 2 ? 660 : 880, 0.18, 'square', 0.07)));
      const k = this.pts.K[0];
      this.noise(k.x, k.y, 14 * T);
      this.flash(p, 'CODIGO INCORRECTO', '#ff4040');
    }
  }

  updatePanel(p, dt) {
    if (p.msg > 0) {
      if ((p.msg -= dt) <= 0) this.closeTask(p);
      return;
    }
    if (pr(p, '2')) return this.closeTask(p); // leaving resets the task
    if (p.task.name === 'pad') return this.updatePad(p);
    const def = TASKS[p.task.name];
    if (def.upd(p.s, p, dt, this)) return this.finishTask(p.task);
    def.draw(p.pan.g.clear(), p.s, this);
    if (p.task.name === 'gen') {
      const G = this.gen;
      p.pan.info.setText(!(G.at[0] && G.at[1]) ? 'ESPERANDO A TU COMPANERO' : G.turn === p.lever ? 'TU TURNO: 1' : 'ESPERA...');
    }
  }

  updatePlayer(p, dt) {
    let hint = '';
    if (p.out) hint = 'AFUERA';
    else if (p.caught) hint = 'SECUESTRADO';
    else if (p.task) { this.updatePanel(p, dt); hint = p.task ? 'EN TAREA: VISIBLE' : ''; }
    else if (p.talk) { this.updateTalk(p, dt); hint = '1: SEGUIR'; }
    else if (p.hide) {
      hint = '1: SALIR';
      if (pr(p, '1')) { p.hide = null; p.seenHide = false; p.spr.setVisible(true); }
    } else {
      let dx = (held[p.pre + 'R'] ? 1 : 0) - (held[p.pre + 'L'] ? 1 : 0);
      let dy = (held[p.pre + 'D'] ? 1 : 0) - (held[p.pre + 'U'] ? 1 : 0);
      if (dx && dy) { dx *= Math.SQRT1_2; dy *= Math.SQRT1_2; }
      this.move(p, dx * SPEED * dt, dy * SPEED * dt);
      if (dx) p.spr.setFlipX(dx < 0);
      if (dx || dy) p.step += dt;
      p.spr.setTexture(p.key + (Math.floor(p.step * 6) % 2));

      if (DOOR && p.spr.y >= 35 * T) { p.out = true; p.spr.setVisible(false); return this.checkWin(); }

      const mate = this.players[1 - p.i];
      const rescue = mate.caught && Math.hypot(mate.spr.x - p.spr.x, mate.spr.y - p.spr.y) < T * 1.5;
      const k = !DOOR && this.near(this.pts.K, p.spr, T * 1.5);
      const t = this.near(this.pts.T.filter((o) => o.task && !o.task.done && !(o.task.name === 'gen' && this.gen.at[o.task.pts.indexOf(o)])), p.spr, T * 1.5);
      const npc = this.near(this.pts.npc, p.spr, T * 1.5);
      const h = this.near(this.pts.H.filter((o) => !this.players.some((q) => q.hide === o)), p.spr, T * 1.4);
      const n = this.near(this.pts.N.filter((o) => !o.used), p.spr, T * 2);
      if (rescue) {
        hint = 'MANTEN 1: RESCATAR';
        if (held[p.pre + '1']) {
          p.res += dt;
          hint = `RESCATANDO ${Math.floor((p.res / 3) * 100)}%`;
          if (p.res >= 3) { p.res = 0; mate.caught = false; mate.spr.clearTint(); this.stats.rescue++; jingle(this); }
        } else p.res = 0;
      } else if (k) {
        hint = '1: TECLADO';
        if (pr(p, '1')) this.openTask(p, { name: 'pad' });
      } else if (t) {
        hint = '1: TAREA';
        if (pr(p, '1')) this.openTask(p, t.task, t);
      } else if (npc) {
        hint = '1: HABLAR';
        if (pr(p, '1')) this.startTalk(p, npc);
      } else if (h) {
        hint = '1: ESCONDERSE';
        if (pr(p, '1')) {
          // Hiding in plain sight of a chasing Tulio does not work.
          p.seenHide = this.tu.st === 'chase' && this.tu.target === p && this.canSee(p);
          p.hide = h;
          p.spr.setVisible(false);
        }
      }
      if (n) {
        hint += (hint ? '  ' : '') + '2: HACER RUIDO';
        if (pr(p, '2')) {
          n.used = true;
          n.img.setTint(0x444444);
          this.noise(n.x, n.y, NOISE_R);
        }
      }
    }
    this.hints[p.i].setText(hint);
  }

  checkWin() {
    if (this.players.every((q) => q.out || q.caught)) this.end(true);
  }

  end(win) {
    this.over = true;
    const st = this.stats;
    const lost = this.players.filter((q) => q.caught).length;
    let score = this.done * 200 + st.survived * 500 + st.distract * 300 + st.rescue * 500;
    if (win) score += Math.max(0, Math.ceil(this.left)) * 10 + 2000 - lost * 2000; // leaving a partner behind costs
    this.score = Math.max(0, score);
    this.players.forEach((p) => this.closeTask(p));
    this.ui.add(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.8));
    this.txt(W / 2, 170, win ? '\u00a1SALIERON AL AIRE!' : 'FUERA DEL AIRE', win ? '#e1ff00' : '#ff4040', 36);
    this.txt(W / 2, 250, `TAREAS ${this.done}/4   DISTRACCIONES ${st.distract}\nPERSECUCIONES SOBREVIVIDAS ${st.survived}   RESCATES ${st.rescue}\n\nPUNTAJE ${this.score}`, '#ffffff', 16);
    this.phase = 'wait';
    loadScores().then((list) => {
      this.scores = list;
      if (this.score > 0 && (list.length < 5 || this.score > list[list.length - 1].s)) {
        this.phase = 'name';
        this.ini = { l: [0, 0, 0], c: 0 };
        this.nameLbl = this.txt(W / 2, 350, 'NUEVO R\u00c9CORD: ESCRIBAN SUS INICIALES', '#ffffff', 14);
        this.nameTxt = this.txt(W / 2, 375, '', '#e1ff00', 28);
        this.drawName();
      } else this.showRank();
    });
  }

  // --- Dialogue (Undertale-style typed text with a blip per letter) ---
  startTalk(p, npc) {
    const info = NPC_INFO[npc.id];
    p.talk = { info, i: 0, n: 0 };
    p.dlg.img.setTint(NPC_TINT[npc.id]);
    p.dlg.name.setText(info.name);
    p.dlg.body.setText('');
    p.dlg.c.setVisible(true);
  }

  endTalk(p) {
    p.talk = null;
    if (p.dlg) p.dlg.c.setVisible(false);
  }

  // Types `line` into `txt` at 30 chars/s; returns true once fully shown.
  type(o, line, txt, dt, pitch) {
    const before = Math.floor(o.n);
    o.n = Math.min(line.length, o.n + 30 * dt);
    const now = Math.floor(o.n);
    if (now > before && line[now - 1] !== ' ') tone(this, pitch, 0.03, 'square', 0.035);
    txt.setText(line.slice(0, now));
    return now >= line.length;
  }

  updateTalk(p, dt) {
    const tk = p.talk, lines = tk.info.lines;
    const full = this.type(tk, lines[tk.i], p.dlg.body, dt, tk.info.pitch);
    if (!pr(p, '1')) return;
    if (!full) { tk.n = lines[tk.i].length; return; }
    if (++tk.i >= lines.length) return this.endTalk(p);
    tk.n = 0;
  }

  updateIntro(dt) {
    const o = this.intro;
    const full = this.type(o, INTRO[o.i], o.txt, dt, 300);
    const go = ['P1_1', 'P2_1', 'START1', 'START2'].some(pressed);
    if (!go) return;
    if (!full) { o.n = INTRO[o.i].length; return; }
    if (++o.i < INTRO.length) { o.n = 0; return; }
    o.box.destroy();
    this.intro = null;
  }

  // --- End screen: initials and top 5 ---
  drawName() {
    const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    this.nameTxt.setText(this.ini.l.map((c, i) => (i === this.ini.c ? `[${A[c]}]` : ` ${A[c]} `)).join(''));
  }

  showRank() {
    this.phase = 'rank';
    if (this.nameTxt) { this.nameTxt.destroy(); this.nameLbl.destroy(); }
    const list = this.scores;
    const rows = list.map((e, i) => `${i + 1}. ${e.n}  ${String(e.s).padStart(6, ' ')}`).join('\n');
    this.txt(W / 2, 350, 'MEJORES EQUIPOS\n' + (rows || '---'), '#ffffff', 14);
    this.txt(W / 2, 500, 'START: VOLVER AL T\u00cdTULO', '#e1ff00', 16);
  }

  updateEnd() {
    if (this.phase === 'rank') {
      if (pressed('START1') || pressed('START2')) this.scene.start('title');
      return;
    }
    if (this.phase !== 'name') return;
    const o = this.ini, any = (k) => pressed('P1_' + k) || pressed('P2_' + k);
    if (any('U')) o.l[o.c] = (o.l[o.c] + 1) % 26;
    if (any('D')) o.l[o.c] = (o.l[o.c] + 25) % 26;
    if (any('L')) o.c = Math.max(0, o.c - 1);
    if (any('R') || any('1')) o.c++;
    if (o.c > 2) {
      const n = o.l.map((c) => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[c]).join('');
      this.scores = [...this.scores, { n, s: this.score }].sort((a, b) => b.s - a.s).slice(0, 5);
      getStorage().set(SCORE_KEY, this.scores).catch(() => {});
      return this.showRank();
    }
    this.drawName();
  }

  update(time, delta) {
    const dt = Math.min(delta, 50) / 1000;
    if (this.over) this.updateEnd();
    else if (this.intro) this.updateIntro(dt);
    else {
      music(this, dt, this.tu.st === 'chase' || this.rage);
      this.left -= dt;
      if (this.left <= 0 && !this.rage) {
        this.rage = true; // on air: Tulio hunts whoever is in the open
        this.clock.setText('\u00a1AL AIRE!').setColor('#ff4040');
      } else if (!this.rage) {
        const s = Math.ceil(this.left);
        this.clock.setText(`AL AIRE EN ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`);
      }
      const G = this.gen;
      if (!(G.at[0] && G.at[1])) G.fill = Math.max(0, G.fill - 0.1 * dt); // lever released: generator winds down
      for (const p of this.players) this.updatePlayer(p, dt);
      if (!this.over) this.updateTulio(dt);
    }

    this.dark.fill(0x000000, 0.92);
    for (const p of this.players) {
      if (p.out) continue;
      const k = p.hide ? 'lightS' : 'light', r = p.hide ? T * 1.5 : T * 3;
      this.dark.erase(k, Math.round(p.spr.x) - r, Math.round(p.spr.y) - r);
    }
    const t = this.tu.spr, f = this.tu.face, g = this.cone.clear().fillStyle(0x000000, 0.55);
    g.slice(t.x, t.y, TU.view, f - TU.fov / 2, f + TU.fov / 2).fillPath();
    this.dark.erase(this.cone);

    prev = { ...held };
  }
}

// --- Title scene ---
class Title extends Phaser.Scene {
  constructor() { super('title'); }

  create() {
    makeTextures(this);
    window.AC = this.sound.context;
    const t = (y, s, c, z) => this.add.text(W / 2, y, s, { fontFamily: 'monospace', fontSize: z + 'px', color: c, align: 'center' }).setOrigin(0.5);
    const tulio = this.add.image(W / 2, 240, 'tulio0').setScale(10);
    this.add.image(W / 2, 240, 'eyes').setScale(10);
    // Lantern flicker: a black veil that breathes over Tulio.
    const veil = this.add.rectangle(W / 2, 240, 200, 180, 0x000000, 0.6);
    this.tweens.add({ targets: veil, alpha: 0.95, duration: 140, yoyo: true, repeat: -1, repeatDelay: 900 });
    this.tweens.add({ targets: tulio, y: 244, duration: 1200, yoyo: true, repeat: -1 });
    t(60, '31 MINUTOS DE TERROR', '#e1ff00', 40);
    t(100, 'Escapen del set antes de que Tulio los encuentre', '#b8c48d', 14);
    t(350, 'JOYSTICK: MOVER   1: ACCI\u00d3N / ESCONDERSE   2: RUIDO', '#b8c48d', 12);
    const press = t(395, 'PRESIONA START', '#ffffff', 22);
    this.tweens.add({ targets: press, alpha: 0.2, duration: 500, yoyo: true, repeat: -1 });
    const rank = t(490, '', '#ffffff', 13);
    loadScores().then((l) => rank.setText(l.length ? 'MEJORES EQUIPOS\n' + l.map((e, i) => `${i + 1}. ${e.n}  ${e.s}`).join('\n') : ''));
    t(H - 14, 'Homenaje fan a 31 Minutos (Aplaplac). Juego no oficial.', '#666666', 11);
  }

  update(time, delta) {
    music(this, delta / 1000, false);
    if (pressed('START1') || pressed('START2')) this.scene.start('play');
    prev = { ...held };
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  width: W,
  height: H,
  parent: 'game-root',
  backgroundColor: '#000000',
  pixelArt: true,
  roundPixels: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [Title, Play],
});
