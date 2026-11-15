// 31 Minutos de Terror — Platanus Hack 26 Arcade Challenge
// Fan homage to 31 Minutos (Aplaplac). Co-op stealth: escape the set before Tulio finds you.
// Spec: GAME_SPEC.md. Milestone H1: map, collisions, split screen, movement, darkness.

const W = 800;
const H = 600;
const T = 16; // tile size in px
const ZOOM = 2;
const SPEED = 80; // player px/s

// Arcade cabinet button → keyboard key mapping.
// The physical cabinet sends these exact key codes.
// DO NOT modify this mapping — it matches the real arcade cabinet wiring.
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
window.addEventListener('keydown', (e) => { const c = keyCode(e); if (c) held[c] = true; });
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
// 'p' Policarpo, 'm' Mario Hugo, 'c' Calcetín con Rombos Man.
// Rooms: bodega (NW), control (NE), pasillo (center), camarín (W), estudio (E), salida (S).
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
const solidAt = (px, py) => SOLID.includes(tileAt(Math.floor(px / T), Math.floor(py / T)));

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
  [1, 15, 18, 25], // camarín
  [29, 15, 46, 25], // estudio
  [21, 25, 26, 34], // salida
];
const CAPTIVE = { x: 2 * T + 8, y: 12 * T + 8 }; // where kidnapped players are left (bodega)
const walkable = (tx, ty) => !SOLID.includes(tileAt(tx, ty));
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
    this.stats = { distract: 0, survived: 0 };
    this.over = false;

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
      st: 'patrol', path: [], face: 0, wait: 0, step: 0, target: null, last: null, lost: 0, timer: 0, repath: 0, chased: false, calm: 0,
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
    this.txt((W * 3) / 4, 8, 'P2 JUANÍN', '#f0b030');
    this.clock = this.txt(W / 2, H - 24, 'AL AIRE EN 5:00', '#e1ff00');
    this.hints = this.players.map((p) => this.txt(W / 4 + p.i * (W / 2), H - 48, '', '#b8c48d'));
  }

  txt(x, y, s, col, size = 14) {
    const t = this.add.text(x, y, s, { fontFamily: 'monospace', fontSize: size + 'px', color: col, align: 'center' }).setOrigin(0.5, 0);
    this.ui.add(t);
    return t;
  }

  makePlayer(key, at, pre, i) {
    const spr = this.w(this.add.sprite(at.x, at.y, key + '0').setDepth(10));
    return { key, spr, pre, i, step: 0, hide: null, seenHide: false, caught: false };
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
    if (p.hide || p.caught) return false;
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
    if (this.players.every((q) => q.caught)) this.lose();
  }

  lose() {
    this.over = true;
    this.ui.add(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.75));
    this.txt(W / 2, H / 2 - 40, 'FUERA DEL AIRE', '#ff4040', 40);
    this.txt(W / 2, H / 2 + 20, 'START PARA REINTENTAR', '#e1ff00', 16);
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

    let speed = TU[u.st];
    if (u.st === 'chase') {
      const p = u.target;
      if (p.caught) { this.setState('patrol'); u.path = []; }
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
  }

  updatePlayer(p, dt) {
    let hint = '';
    if (!p.caught) {
      if (p.hide) {
        hint = '1: SALIR';
        if (pressed(p.pre + '1')) { p.hide = null; p.seenHide = false; p.spr.setVisible(true); }
      } else {
        let dx = (held[p.pre + 'R'] ? 1 : 0) - (held[p.pre + 'L'] ? 1 : 0);
        let dy = (held[p.pre + 'D'] ? 1 : 0) - (held[p.pre + 'U'] ? 1 : 0);
        if (dx && dy) { dx *= Math.SQRT1_2; dy *= Math.SQRT1_2; }
        this.move(p, dx * SPEED * dt, dy * SPEED * dt);
        if (dx) p.spr.setFlipX(dx < 0);
        if (dx || dy) p.step += dt;
        p.spr.setTexture(p.key + (Math.floor(p.step * 6) % 2));

        const h = this.near(this.pts.H, p.spr, T * 1.4);
        const n = this.near(this.pts.N.filter((o) => !o.used), p.spr, T * 2);
        if (h && !this.players.some((q) => q.hide === h)) {
          hint = '1: ESCONDERSE';
          if (pressed(p.pre + '1')) {
            // Hiding in plain sight of a chasing Tulio does not work.
            p.seenHide = this.tu.st === 'chase' && this.tu.target === p && this.canSee(p);
            p.hide = h;
            p.spr.setVisible(false);
          }
        }
        if (n) {
          hint += (hint ? '  ' : '') + '2: HACER RUIDO';
          if (pressed(p.pre + '2')) {
            n.used = true;
            n.img.setTint(0x444444);
            this.noise(n.x, n.y, NOISE_R);
          }
        }
      }
    } else hint = 'SECUESTRADO';
    this.hints[p.i].setText(hint);
  }

  update(time, delta) {
    const dt = Math.min(delta, 50) / 1000;
    if (this.over) {
      if (pressed('START1') || pressed('START2')) this.scene.restart();
    } else {
      for (const p of this.players) this.updatePlayer(p, dt);
      this.updateTulio(dt);
    }

    this.dark.fill(0x000000, 0.92);
    for (const p of this.players) {
      const k = p.hide ? 'lightS' : 'light', r = p.hide ? T * 1.5 : T * 3;
      this.dark.erase(k, Math.round(p.spr.x) - r, Math.round(p.spr.y) - r);
    }
    const t = this.tu.spr, f = this.tu.face, g = this.cone.clear().fillStyle(0x000000, 0.55);
    g.slice(t.x, t.y, TU.view, f - TU.fov / 2, f + TU.fov / 2).fillPath();
    this.dark.erase(this.cone);

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
  scene: [Play],
});
