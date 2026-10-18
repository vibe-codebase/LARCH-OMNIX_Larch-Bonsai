import Phaser from 'phaser';
import * as A from './art';
import { LEVELS, starsFor, type Level } from './levels';
import { clip, clone, grow, plan, plant, score, trim, type Node, type Tree } from './sim';
import { sound } from '../audio/sound';

export type Result = { score: number; best: number; stars: number; cuts: number };
export type Finish = { level: Level; result: Result };
type Hooks = { onFinish?: (f: Finish) => void; onFirstAction?: () => void; onHaptic?: (s: 'light' | 'medium' | 'success' | 'warning') => void };
export type HudState = { year: number; years: number; score: number; best: number; undo: number; growing: boolean; done: boolean; cuts: number };

/** Bridge between React and the Phaser scene. */
export const garden = {
  hooks: {} as Hooks,
  scene: null as GardenScene | null,
  reducedMotion: false,
  show(mode: 'menu' | 'play', level: Level) { this.scene?.show(mode, level); },
  setPaused(p: boolean) { this.scene?.setPaused(p); },
  state(): HudState | null { return this.scene?.hudState() ?? null; },
  grow() { this.scene?.growYear(); },
  finish() { this.scene?.finish(); },
  undo() { this.scene?.undo(); },
  debug() { return this.scene?.debugState(); },
  /** QA only: CSS position of a node, and the grower's cuts for this year. */
  qaNode(id: number) { return this.scene?.qaNode(id); },
  qaPlan() { return this.scene?.qaPlan(); },
  /** QA only: the finishing trim, done for you. */
  qaTrim() { this.scene?.qaTrim(); },
};
(window as unknown as { __garden: typeof garden }).__garden = garden;

const VIEW_W = 360;
const SHOWCASE = ['j8', 'm8', 'c4', 'j4', 'm5', 'c6'];
type Fall = { segs: [number, number, number, number, number][]; leaves: [number, number][]; px: number; py: number; t: number; spin: number };

export class GardenScene extends Phaser.Scene {
  level: Level = LEVELS[0];
  private mode: 'menu' | 'play' = 'menu';
  private paused = false;
  private finished = false;
  private acted = false;
  private texSeq = 0;
  private r = 2;
  private viewW = VIEW_W;
  private viewH = 700;
  private tree!: Tree;
  private undoStack: Tree[] = [];
  private cuts = 0;
  private k = 1;
  private ox = 180;
  private oy = 500;
  private growT = 1;
  private dirty = true;
  private treeTex!: Phaser.Textures.CanvasTexture;
  private kit!: A.LeafKit;
  private g!: Phaser.GameObjects.Graphics;
  private fx!: Phaser.GameObjects.Graphics;
  private swipe: { pts: [number, number][]; t0: number } | null = null;
  private trails: { pts: [number, number][]; t: number }[] = [];
  private falls: Fall[] = [];
  private petals: { x: number; y: number; vx: number; vy: number; t: number; s: number }[] = [];
  private clock = 0;
  private live = 0;
  private demo: { cuts: { season: number; id: number }[]; wait: number; stage: 'cut' | 'grow' | 'trim' | 'hold' } | null = null;

  constructor() { super('garden'); }

  create() {
    garden.scene = this;
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.down(p));
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => this.move(p));
    this.input.on('pointerup', () => this.up());
    this.input.on('pointerupoutside', () => this.up());
    this.scale.on('resize', () => this.rebuild());
    this.show('menu', LEVELS.find((l) => l.id === SHOWCASE[0])!);
  }
  isMenu() { return this.mode === 'menu'; }
  setPaused(p: boolean) { this.paused = p; this.swipe = null; }
  hudState(): HudState { return { year: this.tree.season, years: this.level.seasons, score: Math.round(this.live * 1000) / 1000, best: this.level.best, undo: this.undoStack.length, growing: this.growT < 1, done: this.finished, cuts: this.cuts }; }
  debugState() { return { ...this.hudState(), mode: this.mode, nodes: this.tree.nodes.filter((n) => n.alive).length }; }
  private css(x: number, y: number) { const z = this.cameras.main.zoom, kk = (this.game.canvas.clientWidth || VIEW_W) / this.scale.width; return { x: x * z * kk, y: y * z * kk }; }
  qaNode(id: number) { const n = this.tree.nodes.find((q) => q.id === id), p = n && this.tree.nodes.find((q) => q.id === n.parent); if (!n || !p) return null; const [x, y] = this.S((n.x + p.x) / 2, (n.y + p.y) / 2); const [ax, ay] = this.S(p.x, p.y), [bx, by] = this.S(n.x, n.y); return { mid: this.css(x, y), a: this.css(ax, ay), b: this.css(bx, by), alive: n.alive }; }
  qaPlan() { return this.level.cuts; }
  qaTrim() { this.undoStack.push(clone(this.tree)); trim(this.level, this.tree); this.afterChange(); }

  show(mode: 'menu' | 'play', level: Level) {
    this.mode = mode;
    this.level = level;
    this.paused = false; this.finished = false; this.acted = false;
    this.tree = plant(level); this.undoStack = []; this.cuts = 0; this.growT = 1;
    this.trails = []; this.falls = []; this.petals = []; this.swipe = null;
    this.demo = mode === 'menu' ? { cuts: level.cuts, wait: 1.2, stage: 'cut' } : null;
    this.rebuild();
  }

  // ── layout ────────────────────────────────────────────────────────────
  private tex(prefix: string, c: HTMLCanvasElement) { const key = `${prefix}-${++this.texSeq}`; this.textures.addCanvas(key, c); return key; }
  private S(x: number, y: number): [number, number] { return [this.ox + x * this.k, this.oy - y * this.k]; }
  private rebuild() {
    const stale = this.textures.getTextureKeys().filter((k) => /-\d+$/.test(k));
    this.tweens.killAll();
    this.children.removeAll(true);
    if (stale.length) this.events.once('postrender', () => stale.forEach((k) => this.textures.exists(k) && this.textures.remove(k)));
    const pw = this.scale.width, ph = this.scale.height, dpr = Math.min(2, window.devicePixelRatio || 1);
    const zoom = Math.min(pw / VIEW_W, ph / 620);
    this.r = Math.min(2, Math.max(1, zoom));
    this.viewW = pw / zoom; this.viewH = ph / zoom;
    const css = zoom / dpr, top = (this.mode === 'play' ? 76 : 150) / css, bottom = (this.mode === 'play' ? 150 : 190) / css;
    this.cameras.main.setZoom(zoom).centerOn(this.viewW / 2, this.viewH / 2);
    const l = this.level, m = A.MOODS[l.chapter], r = this.r, W = this.viewW, H = this.viewH;
    const avail = H - top - bottom;
    this.k = Math.max(0.5, Math.min(0.98, (W - 16) / 360, (avail - 34) / 330));
    this.ox = W / 2;
    this.oy = top + Math.min(avail - 30, 330 * this.k + Math.max(0, (avail - 34 - 330 * this.k) * 0.5));
    const potW = 150 * this.k + 40, potImg = A.pot(m, l.species, potW, r), potH = potImg.height / r - 14;
    const standY = this.oy + potH * 0.95;
    this.add.image(0, 0, this.tex('room', A.room(m, W, H, Math.min(r, 1.5), standY))).setOrigin(0, 0).setScale(1 / Math.min(r, 1.5));
    this.add.image(0, 0, this.tex('wash', A.wash(m, l.pads, this.k, Math.min(r, 1.5), W, H, this.ox, this.oy))).setOrigin(0, 0).setScale(1 / Math.min(r, 1.5));
    this.g = this.add.graphics();
    const key = `tree-${++this.texSeq}`;
    this.treeTex = this.textures.createCanvas(key, Math.round(W * r), Math.round(H * r))!;
    this.add.image(0, 0, key).setOrigin(0, 0).setScale(1 / r);
    this.add.image(this.ox, this.oy - 3, this.tex('pot', potImg)).setOrigin(0.5, 0).setScale(1 / r);
    this.fx = this.add.graphics();
    this.makeKit();
    this.live = score(l, this.tree);
    this.dirty = true;
  }
  private final() { return this.tree.season >= this.level.seasons; }
  private makeKit() { this.kit = A.leafKit(this.level.species, this.final(), this.final(), this.r * Math.max(1, this.k * 1.2)); }
  private paintTree() {
    const c = this.treeTex.context, r = this.r;
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, this.treeTex.width, this.treeTex.height);
    c.setTransform(r, 0, 0, r, 0, 0);
    A.drawTree(c, this.tree, A.MOODS[this.level.chapter], this.kit, this.k, this.ox, this.oy, this.growT);
    this.treeTex.refresh();
  }

  // ── input: swipe to clip, tap a branch to clip it ─────────────────────
  private world(p: Phaser.Input.Pointer): [number, number] { const w = this.cameras.main.getWorldPoint(p.x, p.y); return [w.x, w.y]; }
  private down(p: Phaser.Input.Pointer) {
    if (this.mode !== 'play' || this.paused || this.finished || this.growT < 1) return;
    this.swipe = { pts: [this.world(p)], t0: this.clock };
  }
  private move(p: Phaser.Input.Pointer) {
    if (!this.swipe) return;
    const q = this.world(p), last = this.swipe.pts[this.swipe.pts.length - 1];
    if (Math.hypot(q[0] - last[0], q[1] - last[1]) > 2) this.swipe.pts.push(q);
  }
  private up() {
    const sw = this.swipe; if (!sw) return;
    this.swipe = null;
    const pts = sw.pts, len = pts.reduce((a, p, i) => a + (i ? Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0), 0);
    const alive = this.tree.nodes.filter((n) => n.alive && !n.fixed);
    const byId = new Map(this.tree.nodes.map((n) => [n.id, n] as const));
    let hit: Node[] = [];
    if (len < 10) {
      // a tap: the nearest branch within reach
      const [x, y] = pts[0];
      let best: Node | null = null, bd = 13;
      for (const n of alive) { const p = byId.get(n.parent)!; const [ax, ay] = this.S(p.x, p.y), [bx, by] = this.S(n.x, n.y), d = segDist(x, y, ax, ay, bx, by); if (d < bd) { bd = d; best = n; } }
      if (best) hit = [best];
    } else {
      this.trails.push({ pts, t: 0 });
      for (const n of alive) {
        const p = byId.get(n.parent)!; const [ax, ay] = this.S(p.x, p.y), [bx, by] = this.S(n.x, n.y);
        for (let i = 1; i < pts.length; i++) if (cross(ax, ay, bx, by, pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1])) { hit.push(n); break; }
      }
    }
    if (!hit.length) { if (len >= 10) sound.swish(); return; }
    if (!this.acted) { this.acted = true; garden.hooks.onFirstAction?.(); }
    this.undoStack.push(clone(this.tree));
    hit.sort((a, b) => a.id - b.id);
    for (const n of hit) if (n.alive) this.cut(n);
    this.cuts++;
    sound.snip(hit.length); garden.hooks.onHaptic?.('light');
    this.afterChange();
  }
  /** Clip a branch, and let it fall from the tree. */
  private cut(n: Node) {
    const before = new Set(this.tree.nodes.filter((q) => q.alive).map((q) => q.id));
    clip(this.tree, n.id);
    const gone = this.tree.nodes.filter((q) => before.has(q.id) && !q.alive), byId = new Map(this.tree.nodes.map((q) => [q.id, q] as const));
    if (this.reduced() || !gone.length) return;
    const par = byId.get(n.parent)!, [px, py] = this.S(par.x, par.y);
    const fall: Fall = { segs: [], leaves: [], px, py, t: 0, spin: (n.x >= par.x ? 1 : -1) * (0.6 + Math.random() * 0.8) };
    for (const q of gone) { const p = byId.get(q.parent)!; const [ax, ay] = this.S(p.x, p.y), [bx, by] = this.S(q.x, q.y); fall.segs.push([ax - px, ay - py, bx - px, by - py, q.born]); if (q.born >= this.tree.season - 2) fall.leaves.push([bx - px, by - py]); }
    this.falls.push(fall);
  }
  private afterChange() { this.live = score(this.level, this.tree); this.dirty = true; }
  undo() {
    if (this.mode !== 'play' || this.finished || this.growT < 1) return;
    const t = this.undoStack.pop(); if (!t) return;
    this.tree = t; this.cuts = Math.max(0, this.cuts - 1); sound.undo(); this.afterChange();
  }
  growYear() {
    if (this.finished || this.growT < 1 || this.final()) return;
    if (!this.acted) { this.acted = true; garden.hooks.onFirstAction?.(); }
    grow(this.level, this.tree);
    this.undoStack = [];
    this.growT = 0;
    if (this.final()) this.makeKit();
    sound.grow(this.tree.season, this.level.seasons);
    garden.hooks.onHaptic?.('medium');
    this.afterChange();
  }
  finish() {
    if (this.finished || !this.final() || this.growT < 1) return;
    this.finished = true;
    const sc = score(this.level, this.tree), st = starsFor(sc, this.level.best);
    sound.finish(st); garden.hooks.onHaptic?.(st > 0 ? 'success' : 'warning');
    if (this.level.species !== 'juniper' && !this.reduced()) for (let k = 0; k < 40; k++) this.petals.push({ x: this.ox + (Math.random() - 0.5) * 300 * this.k, y: this.oy - (120 + Math.random() * 200) * this.k, vx: 10 + Math.random() * 20, vy: 10 + Math.random() * 20, t: -Math.random() * 2, s: Math.random() });
    this.time.delayedCall(1300, () => garden.hooks.onFinish?.({ level: this.level, result: { score: sc, best: this.level.best, stars: st, cuts: this.cuts } }));
  }

  // ── each frame ───────────────────────────────────────────────────────
  update(_t: number, dms: number) {
    const dt = Math.min(0.05, dms / 1000);
    this.clock += dt;
    if (this.mode === 'menu') this.runDemo(dt);
    if (this.growT < 1) { this.growT = Math.min(1, this.growT + dt / (this.reduced() ? 0.2 : 1.3)); this.dirty = true; }
    if (this.dirty) { this.dirty = false; this.paintTree(); }
    this.draw(dt);
  }
  private reduced() { return garden.reducedMotion; }
  private draw(dt: number) {
    const g = this.g, fx = this.fx, m = A.MOODS[this.level.chapter];
    g.clear(); fx.clear();
    // next year's growth, faintly, so it can be planned for
    if (this.mode === 'play' && !this.final() && this.growT >= 1 && !this.finished) {
      const pulse = 0.35 + 0.15 * Math.sin(this.clock * 2.5);
      for (const s of plan(this.level, this.tree)) {
        let [x, y] = [s.from.x, s.from.y];
        const a2 = s.a + (Math.PI / 2 - s.a) * 0.1;
        const p1: [number, number] = [x + Math.cos(s.a) * s.len / 2, Math.max(8, y + Math.sin(s.a) * s.len / 2)];
        const p2: [number, number] = [p1[0] + Math.cos(a2) * s.len / 2, Math.max(8, p1[1] + Math.sin(a2) * s.len / 2)];
        for (const [q0, q1] of [[[x, y], p1], [p1, p2]] as const) {
          const [ax, ay] = this.S(q0[0], q0[1]), [bx, by] = this.S(q1[0], q1[1]), L = Math.hypot(bx - ax, by - ay), n = Math.max(1, Math.floor(L / 4));
          for (let i = 0; i < n; i += 2) { const u0 = i / n, u1 = Math.min(1, (i + 1) / n); g.lineStyle(1.4, 0x5a8a4a, pulse); g.lineBetween(ax + (bx - ax) * u0, ay + (by - ay) * u0, ax + (bx - ax) * u1, ay + (by - ay) * u1); }
        }
        const [ex, ey] = this.S(p2[0], p2[1]); g.fillStyle(0x6a9a52, pulse * 0.8); g.fillCircle(ex, ey, 1.8);
        [x, y] = p2;
      }
    }
    // the blade's path
    const draws = this.swipe ? [{ pts: this.swipe.pts, t: 0 }, ...this.trails] : this.trails;
    this.trails = this.trails.filter((tr) => (tr.t += dt) < 0.35);
    for (const tr of draws) {
      if (tr.pts.length < 2) continue;
      const a = 1 - tr.t / 0.35;
      fx.lineStyle(2.4, 0xffffff, 0.55 * a); fx.beginPath(); fx.moveTo(tr.pts[0][0], tr.pts[0][1]); for (const p of tr.pts.slice(1)) fx.lineTo(p[0], p[1]); fx.strokePath();
      fx.lineStyle(1, 0x404850, 0.5 * a); fx.beginPath(); fx.moveTo(tr.pts[0][0], tr.pts[0][1]); for (const p of tr.pts.slice(1)) fx.lineTo(p[0], p[1]); fx.strokePath();
    }
    // clipped branches falling away
    const leafCol = this.level.species === 'maple' && this.final() ? 0xc8452e : this.level.species === 'sakura' && this.final() ? 0xf4b8c8 : 0x4f7a42;
    this.falls = this.falls.filter((f) => (f.t += dt) < 1.1);
    for (const f of this.falls) {
      const e = f.t / 1.1, ang = f.spin * e * 1.4, c = Math.cos(ang), s = Math.sin(ang), dx = f.px + f.spin * 14 * e, dy = f.py + 260 * e * e, a = 1 - e;
      const T = (x: number, y: number): [number, number] => [dx + x * c - y * s, dy + x * s + y * c];
      for (const sg of f.segs) { const [ax, ay] = T(sg[0], sg[1]), [bx, by] = T(sg[2], sg[3]); fx.lineStyle(1.6 * this.k + 0.4, Phaser.Display.Color.HexStringToColor(m.bark[1]).color, a); fx.lineBetween(ax, ay, bx, by); }
      for (const lf of f.leaves) { const [x, y] = T(lf[0], lf[1]); fx.fillStyle(leafCol, a * 0.9); fx.fillCircle(x, y, 5 * this.k); }
    }
    // blossom (or autumn leaves) drifting down at the end
    this.petals = this.petals.filter((p) => (p.t += dt) < 5);
    for (const p of this.petals) { if (p.t < 0) continue; p.x += (p.vx + Math.sin(p.t * 2 + p.s * 6) * 12) * dt; p.y += p.vy * dt; fx.fillStyle(leafCol, Math.min(1, (5 - p.t) / 1.5)); fx.fillEllipse(p.x, p.y, 4, 2.6 + Math.sin(p.t * 4) * 1); }
  }

  // ── attract mode: the grower shapes a tree, year by year ───────────────
  private runDemo(dt: number) {
    const d = this.demo; if (!d || this.growT < 1) return;
    d.wait -= dt; if (d.wait > 0) return;
    if (d.stage === 'cut') {
      const now = d.cuts.filter((c) => c.season === this.tree.season);
      for (const c of now) { const n = this.tree.nodes.find((q) => q.id === c.id); if (n?.alive) this.cut(n); }
      if (now.length) { sound.snip(now.length); this.afterChange(); }
      d.stage = this.final() ? 'trim' : 'grow'; d.wait = now.length ? 0.9 : 0.2;
    } else if (d.stage === 'grow') {
      grow(this.level, this.tree); this.growT = 0; if (this.final()) this.makeKit(); this.afterChange();
      d.stage = 'cut'; d.wait = 0.5;
    } else if (d.stage === 'trim') {
      const before = clone(this.tree); trim(this.level, this.tree);
      const gone = before.nodes.filter((n) => n.alive && !this.tree.nodes.find((q) => q.id === n.id)!.alive);
      this.tree = before; for (const n of gone) { const q = this.tree.nodes.find((x) => x.id === n.id)!; if (q.alive) this.cut(q); }
      this.afterChange(); d.stage = 'hold'; d.wait = 4;
    } else {
      const i = (SHOWCASE.indexOf(this.level.id) + 1) % SHOWCASE.length;
      this.show('menu', LEVELS.find((x) => x.id === SHOWCASE[i])!);
    }
  }
}

function segDist(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy, t = L2 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / L2)) : 0;
  return Math.hypot(ax + dx * t - px, ay + dy * t - py);
}
function cross(ax: number, ay: number, bx: number, by: number, cx: number, cy: number, dx: number, dy: number) {
  const d = (bx - ax) * (dy - cy) - (by - ay) * (dx - cx);
  if (Math.abs(d) < 1e-9) return false;
  const u = ((cx - ax) * (dy - cy) - (cy - ay) * (dx - cx)) / d, v = ((cx - ax) * (by - ay) - (cy - ay) * (bx - ax)) / d;
  return u >= 0 && u <= 1 && v >= 0 && v <= 1;
}

export function startGame(parent: HTMLElement) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: '#e9e1d2',
    scale: { mode: Phaser.Scale.NONE, width: parent.clientWidth * dpr, height: parent.clientHeight * dpr, zoom: 1 / dpr },
    render: { antialias: true, pixelArt: false, powerPreference: 'high-performance' },
    audio: { noAudio: true },
    fps: { target: 60, smoothStep: false },
    input: { activePointers: 1 },
    scene: [GardenScene],
    banner: false,
  });
  const onResize = () => {
    const d = Math.min(window.devicePixelRatio || 1, 2);
    game.scale.setZoom(1 / d);
    game.scale.resize(parent.clientWidth * d, parent.clientHeight * d);
  };
  window.addEventListener('resize', onResize);
  return () => { window.removeEventListener('resize', onResize); game.destroy(true); };
}
