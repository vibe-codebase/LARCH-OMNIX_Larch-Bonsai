/**
 * A tree that grows a season at a time. Every growing tip puts out a new shoot each season, a little
 * shorter than the last and bending toward the light; now and then a tip forks. Clip a branch and it stops
 * there: the next season the stub buds back into two shoots, which is how a bonsai grower builds dense
 * pads of foliage from long, leggy growth. Everything is deterministic (each node's choices come from a
 * hash of its id and the season), so the faint preview of next season's growth is exactly what will grow.
 *
 * Units: the soil line is y = 0, up is +y, the tree lives roughly in x ∈ [-160, 160], y ∈ [0, 340].
 */
export type Species = 'juniper' | 'maple' | 'sakura';
export type Pad = { x: number; y: number; rx: number; ry: number };
export type Spec = {
  species: Species;
  seasons: number;
  /** the shape to grow into: a union of ellipses */
  pads: Pad[];
  /** the starting tree: a trunk (and maybe a branch or two), as polylines from the root */
  start: [number, number][][];
  /** chance a tip forks of its own accord each season */
  fork: number;
  /** length of new shoots */
  shoot: number;
  /** most tips the tree can feed at once */
  maxTips: number;
  seed: number;
};
export type Node = { id: number; parent: number; x: number; y: number; a: number; len: number; born: number; tip: boolean; clipped: boolean; alive: boolean; fixed: boolean };
export type Tree = { nodes: Node[]; season: number; nextId: number };

export const LEAF_R = 17;
const UP = Math.PI / 2;

const hash = (a: number, b: number, c: number) => {
  let h = Math.imul(a + 0x9e3779b9, 374761393) ^ Math.imul(b + 17, 668265263) ^ Math.imul(c + 5, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
};

export function plant(spec: Spec): Tree {
  const nodes: Node[] = [{ id: 0, parent: -1, x: 0, y: 0, a: UP, len: 0, born: 0, tip: false, clipped: false, alive: true, fixed: true }];
  let id = 1;
  for (const line of spec.start) {
    // each polyline starts at an existing node (the nearest one to its first point)
    let parent = nodes.reduce((b, n) => (Math.hypot(n.x - line[0][0], n.y - line[0][1]) < Math.hypot(b.x - line[0][0], b.y - line[0][1]) ? n : b), nodes[0]);
    for (let k = 1; k < line.length; k++) {
      const [x, y] = line[k], a = Math.atan2(y - parent.y, x - parent.x);
      const n: Node = { id: id++, parent: parent.id, x, y, a, len: Math.hypot(x - parent.x, y - parent.y), born: 0, tip: k === line.length - 1, clipped: false, alive: true, fixed: true };
      parent.tip = false;
      nodes.push(n); parent = n;
    }
  }
  return { nodes, season: 0, nextId: id };
}
export const clone = (t: Tree): Tree => ({ nodes: t.nodes.map((n) => ({ ...n })), season: t.season, nextId: t.nextId });
export const tips = (t: Tree) => t.nodes.filter((n) => n.alive && (n.tip || n.clipped));

/**
 * What will grow next season: [parent, angle, length][]. Growing tips extend; a clipped stub buds back into
 * two; and along last season's new wood, side buds break into shoots, alternating sides.
 */
export function plan(spec: Spec, t: Tree): { from: Node; a: number; len: number }[] {
  const s = t.season + 1, out: { from: Node; a: number; len: number }[] = [];
  const kids = new Map<number, number>();
  for (const q of t.nodes) if (q.alive) kids.set(q.parent, (kids.get(q.parent) ?? 0) + 1);
  const toLight = (a: number) => a + (UP - a) * 0.12;
  const buds: { n: Node; kind: 'tip' | 'stub' | 'side'; prio: number }[] = [];
  for (const n of t.nodes) {
    if (!n.alive || n.id === 0) continue;
    if (n.clipped) buds.push({ n, kind: 'stub', prio: 2 });
    else if (n.tip) buds.push({ n, kind: 'tip', prio: 1 });
    else if (!n.fixed && n.born >= t.season - 1 && (kids.get(n.id) ?? 0) === 1) buds.push({ n, kind: 'side', prio: 0 });
    else if (n.fixed && t.season === 0 && (kids.get(n.id) ?? 0) === 1 && n.y > 40) buds.push({ n, kind: 'side', prio: 0 });
  }
  // the tree can only feed so many shoots: stubs and tips first, higher ones before lower
  buds.sort((p, q) => q.prio - p.prio || q.n.y - p.n.y || p.n.id - q.n.id);
  let budget = spec.maxTips;
  for (const { n, kind } of buds) {
    if (budget <= 0) break;
    const r1 = hash(n.id, s, spec.seed), r2 = hash(n.id, s, spec.seed + 1), r3 = hash(n.id, s, spec.seed + 2);
    const len = spec.shoot * (0.82 + r3 * 0.3);
    if (kind === 'stub') {
      const spread = 0.55 + r1 * 0.35;
      out.push({ from: n, a: toLight(n.a + spread), len: len * 0.8 }, { from: n, a: toLight(n.a - spread), len: len * 0.8 }); budget -= 2;
    } else if (kind === 'tip') {
      out.push({ from: n, a: toLight(n.a + (r2 - 0.5) * 0.4), len }); budget--;
      if (r1 < spec.fork * 0.6) { const side = r2 < 0.5 ? 1 : -1; out.push({ from: n, a: toLight(n.a + side * (0.7 + r3 * 0.3)), len: len * 0.8 }); budget--; }
    } else if (r1 < spec.fork) {
      // a side bud breaks: alternate sides along the branch
      const side = (n.id % 2 ? 1 : -1) * (r2 < 0.85 ? 1 : -1);
      out.push({ from: n, a: toLight(n.a + side * (0.75 + r3 * 0.35)), len: len * 0.75 }); budget--;
    }
  }
  return out;
}

/** Grow a season. */
export function grow(spec: Spec, t: Tree) {
  const p = plan(spec, t);
  t.season++;
  for (const g of p) {
    g.from.tip = false; g.from.clipped = false;
    // a shoot is two internodes, the second bending a little further toward the light
    let from = g.from;
    for (const [k, a] of [[0, g.a], [1, g.a + (UP - g.a) * 0.1]] as const) {
      const x = from.x + Math.cos(a) * g.len / 2, y = Math.max(8, from.y + Math.sin(a) * g.len / 2); // never into the soil
      const n: Node = { id: t.nextId++, parent: from.id, x, y, a: Math.atan2(y - from.y, x - from.x), len: g.len, born: t.season, tip: k === 1, clipped: false, alive: true, fixed: false };
      t.nodes.push(n); from = n;
    }
  }
}

/** Clip the branch ending at node `id`: it and everything beyond it go; its parent becomes a stub that will bud back. */
export function clip(t: Tree, id: number): number {
  const n = t.nodes.find((q) => q.id === id);
  if (!n || !n.alive || n.fixed) return 0;
  const kids = new Map<number, Node[]>();
  for (const q of t.nodes) if (q.alive) { const a = kids.get(q.parent); if (a) a.push(q); else kids.set(q.parent, [q]); }
  let removed = 0;
  const st = [n];
  while (st.length) { const q = st.pop()!; q.alive = false; removed++; for (const c of kids.get(q.id) ?? []) st.push(c); }
  const par = t.nodes.find((q) => q.id === n.parent)!;
  // a stub with no other living shoots buds back
  if (!t.nodes.some((q) => q.alive && q.parent === par.id)) { par.clipped = true; par.tip = false; }
  return removed;
}

/** Where the leaves are: on shoots of the last two seasons, and on every growing point. */
export function leafNodes(t: Tree) {
  return t.nodes.filter((n) => n.alive && n.id > 0 && (n.born >= t.season - 2 || n.tip || n.clipped) && !(n.fixed && !n.tip));
}

// ── scoring ─────────────────────────────────────────────────────────────
export const GRID = 4;
const X0 = -180, X1 = 180, Y0 = 0, Y1 = 380;
const GW = (X1 - X0) / GRID, GH = (Y1 - Y0) / GRID;
export const inPads = (pads: Pad[], x: number, y: number) => pads.some((p) => ((x - p.x) / p.rx) ** 2 + ((y - p.y) / p.ry) ** 2 <= 1);
/** The shape as a mask on the scoring grid (cached per spec). */
const padCache = new WeakMap<Spec, Uint8Array>();
function padMask(spec: Spec) {
  let m = padCache.get(spec);
  if (!m) {
    m = new Uint8Array(GW * GH);
    for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) if (inPads(spec.pads, X0 + (i + 0.5) * GRID, Y0 + (j + 0.5) * GRID)) m[j * GW + i] = 1;
    padCache.set(spec, m);
  }
  return m;
}
/** The foliage as a mask on the scoring grid. */
export function leafMask(t: Tree) {
  const m = new Uint8Array(GW * GH), R = LEAF_R / GRID;
  for (const n of leafNodes(t)) {
    const ci = (n.x - X0) / GRID - 0.5, cj = (n.y - Y0) / GRID - 0.5;
    for (let j = Math.max(0, Math.ceil(cj - R)); j <= Math.min(GH - 1, Math.floor(cj + R)); j++) {
      const dj = j - cj, w = Math.sqrt(Math.max(0, R * R - dj * dj));
      for (let i = Math.max(0, Math.ceil(ci - w)); i <= Math.min(GW - 1, Math.floor(ci + w)); i++) m[j * GW + i] = 1;
    }
  }
  return m;
}
/** How well the foliage fills the shape: the overlap of the two areas over their union. */
export function score(spec: Spec, t: Tree) {
  const a = padMask(spec), b = leafMask(t);
  let inter = 0, uni = 0;
  for (let k = 0; k < a.length; k++) { if (a[k] & b[k]) inter++; if (a[k] | b[k]) uni++; }
  return uni ? inter / uni : 0;
}

/** The finishing trim: clip away every branch that never reaches into the shape, where it leaves the wood that does. */
export function trim(spec: Spec, t: Tree) {
  const alive = t.nodes.filter((n) => n.alive);
  const reach = new Map<number, boolean>();
  for (let k = alive.length - 1; k >= 0; k--) {
    // ids grow outward, so children come after their parents: walk backwards to gather each subtree
    const n = alive[k];
    const r = (reach.get(n.id) ?? false) || inPads(spec.pads, n.x, n.y);
    reach.set(n.id, r);
    if (r && n.parent >= 0) reach.set(n.parent, true);
  }
  for (const n of alive) {
    if (!n.alive || n.fixed || reach.get(n.id)) continue;
    const par = t.nodes[idIndex(t, n.parent)];
    if (par && par.alive) clip(t, n.id);
  }
}
const idIndex = (t: Tree, id: number) => { let lo = 0, hi = t.nodes.length - 1; while (lo <= hi) { const m = (lo + hi) >> 1; if (t.nodes[m].id === id) return m; if (t.nodes[m].id < id) lo = m + 1; else hi = m - 1; } return -1; };

/** Let the tree grow out its remaining seasons untouched, trim it, and score it. */
export function rollout(spec: Spec, t0: Tree) {
  const t = clone(t0);
  while (t.season < spec.seasons) grow(spec, t);
  trim(spec, t);
  return score(spec, t);
}

/**
 * The grower: each season, after the growth, it tries every cut and keeps the one that most improves how
 * the tree will look if left to grow out and then trimmed, a few cuts a season. Used to check each tree can
 * be grown into its shape and to set the stars.
 */
export function growWithGrower(spec: Spec, cutsPerSeason = 6) {
  const t = plant(spec), cuts: { season: number; id: number }[] = [];
  const improve = () => {
    for (let k = 0; k < cutsPerSeason; k++) {
      const base = rollout(spec, t);
      let best = base, bestId = -1;
      for (const n of t.nodes) {
        if (!n.alive || n.fixed) continue;
        const c = clone(t); clip(c, n.id);
        const sc = rollout(spec, c);
        if (sc > best + 1e-4) { best = sc; bestId = n.id; }
      }
      if (bestId < 0) break;
      clip(t, bestId); cuts.push({ season: t.season, id: bestId });
    }
  };
  improve();
  for (let s = 0; s < spec.seasons; s++) { grow(spec, t); if (t.season < spec.seasons) improve(); }
  trim(spec, t);
  return { tree: t, score: score(spec, t), cuts };
}

/** Replay a recorded set of cuts (season, node id), then the finishing trim. */
export function replay(spec: Spec, cuts: { season: number; id: number }[]) {
  const t = plant(spec);
  for (let s = 0; s <= spec.seasons; s++) {
    for (const c of cuts) if (c.season === s) clip(t, c.id);
    if (s < spec.seasons) grow(spec, t);
  }
  trim(spec, t);
  return t;
}
