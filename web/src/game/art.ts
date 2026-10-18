/**
 * Bonsai art, painted with Canvas 2D: a paper wall in soft window light, a wooden stand, the pot, the
 * tree itself (bark that thickens with the weight of foliage it carries, and leaves drawn as tufts, maple
 * stars or blossom), and the shape to grow into, washed on the paper in pale ink.
 */
import { leafNodes, type Node, type Pad, type Species, type Tree } from './sim';

export type Mood = { wall: [string, string]; glow: string; ink: string; stand: [string, string]; pot: [string, string, string]; bark: [string, string] };
export const MOODS: Mood[] = [
  { wall: ['#efe7d6', '#ddd2bc'], glow: 'rgba(255,248,226,0.7)', ink: 'rgba(70,82,74,', stand: ['#5a3a26', '#3a2416'], pot: ['#7a4a32', '#5a3322', '#a8735a'], bark: ['#6b4a36', '#3d2a20'] },
  { wall: ['#f0e4d2', '#dccab0'], glow: 'rgba(255,236,204,0.75)', ink: 'rgba(110,64,48,', stand: ['#4a2e1e', '#2c1a10'], pot: ['#2f5a7a', '#1f3e56', '#6a94b4'], bark: ['#7a6a5e', '#4a3e36'] },
  { wall: ['#f4ecea', '#e2d4d4'], glow: 'rgba(255,240,240,0.75)', ink: 'rgba(120,80,96,', stand: ['#3e2a22', '#24160f'], pot: ['#e6ddd0', '#bcae9c', '#fff8ee'], bark: ['#5e3e36', '#34221c'] },
];

export function canvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h));
  return { c, g: c.getContext('2d')! };
}
const hash = (a: number, b: number) => { let h = Math.imul(a + 0x9e3779b9, 374761393) ^ Math.imul(b + 7, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; };

/** The paper wall: shoji grid, the glow of a window behind it, and the stand the pot sits on. */
export function room(m: Mood, W: number, H: number, r: number, standY: number) {
  const { c, g } = canvas(W * r, H * r);
  g.scale(r, r);
  const wall = g.createLinearGradient(0, 0, 0, H); wall.addColorStop(0, m.wall[0]); wall.addColorStop(1, m.wall[1]);
  g.fillStyle = wall; g.fillRect(0, 0, W, H);
  const glow = g.createRadialGradient(W * 0.6, H * 0.3, 0, W * 0.6, H * 0.3, H * 0.7);
  glow.addColorStop(0, m.glow); glow.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = glow; g.fillRect(0, 0, W, H);
  // paper fibres
  for (let k = 0; k < (W * H) / 60; k++) { const x = hash(k, 1) * W, y = hash(k, 2) * standY; g.strokeStyle = `rgba(120,100,70,${0.03 + hash(k, 3) * 0.04})`; g.lineWidth = 0.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (hash(k, 4) - 0.5) * 8, y + (hash(k, 5) - 0.5) * 3); g.stroke(); }
  // the shoji lattice, faint behind the paper
  g.strokeStyle = 'rgba(90,70,50,0.08)'; g.lineWidth = 2;
  for (let x = W / 2 - 3 * 72; x < W; x += 72) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, standY); g.stroke(); }
  for (let y = 60; y < standY; y += 96) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  // the stand: a low wooden table with a lit top edge
  const st = g.createLinearGradient(0, standY, 0, H); st.addColorStop(0, m.stand[0]); st.addColorStop(1, m.stand[1]);
  g.fillStyle = st; g.fillRect(0, standY, W, H - standY);
  for (let k = 0; k < 40; k++) { g.strokeStyle = `rgba(0,0,0,${0.08 + hash(k, 9) * 0.1})`; g.lineWidth = 0.8; const y = standY + 6 + hash(k, 10) * (H - standY - 6); g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(W * 0.3, y + 3, W * 0.6, y - 3, W, y + 2); g.stroke(); }
  g.fillStyle = 'rgba(255,240,220,0.35)'; g.fillRect(0, standY, W, 1.5);
  const sh = g.createLinearGradient(0, standY - 30, 0, standY); sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,0.08)');
  g.fillStyle = sh; g.fillRect(0, standY - 30, W, 30);
  return c;
}

/** The pot, w wide, its rim at the top of the canvas; soil showing in the rim. */
export function pot(m: Mood, species: Species, w: number, r: number) {
  const h = w * (species === 'juniper' ? 0.3 : species === 'maple' ? 0.26 : 0.34), { c, g } = canvas(w * r, (h + 14) * r);
  g.scale(r, r);
  g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(w / 2, h + 6, w * 0.48, 6, 0, 0, Math.PI * 2); g.fill();
  const body = g.createLinearGradient(0, 0, w, 0); body.addColorStop(0, m.pot[1]); body.addColorStop(0.3, m.pot[2]); body.addColorStop(0.55, m.pot[0]); body.addColorStop(1, m.pot[1]);
  g.fillStyle = body;
  g.beginPath();
  if (species === 'maple') { g.moveTo(2, 4); g.lineTo(w - 2, 4); g.lineTo(w - 10, h); g.lineTo(10, h); }
  else if (species === 'juniper') { g.moveTo(0, 4); g.lineTo(w, 4); g.quadraticCurveTo(w - 2, h * 0.8, w - 16, h); g.lineTo(16, h); g.quadraticCurveTo(2, h * 0.8, 0, 4); }
  else { g.moveTo(6, 4); g.lineTo(w - 6, 4); g.quadraticCurveTo(w + 2, h * 0.6, w - 22, h); g.lineTo(22, h); g.quadraticCurveTo(-2, h * 0.6, 6, 4); }
  g.closePath(); g.fill();
  // feet, rim band, soil
  g.fillStyle = m.pot[1]; g.fillRect(w * 0.14, h - 1, w * 0.1, 6); g.fillRect(w * 0.76, h - 1, w * 0.1, 6);
  g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(2, 4, w - 4, 2.5);
  g.fillStyle = m.pot[1]; g.beginPath(); g.ellipse(w / 2, 4, w / 2, 4, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#4a3a2a'; g.beginPath(); g.ellipse(w / 2, 4, w / 2 - 3, 2.6, 0, 0, Math.PI * 2); g.fill();
  for (let k = 0; k < 40; k++) { g.fillStyle = hash(k, 21) < 0.5 ? '#6a8a4a' : '#5a4a36'; g.beginPath(); g.arc(4 + hash(k, 22) * (w - 8), 3 + (hash(k, 23) - 0.5) * 3, 0.8 + hash(k, 24), 0, Math.PI * 2); g.fill(); } // moss
  if (species === 'sakura') { g.strokeStyle = 'rgba(160,140,120,0.35)'; g.lineWidth = 0.6; for (let k = 0; k < 30; k++) { const x = hash(k, 31) * w, y = 8 + hash(k, 32) * (h - 12); g.beginPath(); g.moveTo(x, y); g.lineTo(x + 4, y + 2); g.stroke(); } }
  return c;
}

/** The shape to grow into, washed in pale ink with a brushed edge. */
export function wash(m: Mood, pads: Pad[], k: number, r: number, W: number, H: number, ox: number, oy: number) {
  const { c, g } = canvas(W * r, H * r);
  g.scale(r, r);
  const P = (x: number, y: number): [number, number] => [ox + x * k, oy - y * k];
  // a soft wash, darker toward the middle like ink on damp paper
  for (const p of pads) {
    const [cx, cy] = P(p.x, p.y);
    for (let i = 0; i < 6; i++) {
      const f = 1 - i * 0.07;
      g.fillStyle = m.ink + (0.035 + i * 0.006) + ')'; g.beginPath(); g.ellipse(cx, cy, p.rx * k * f, p.ry * k * f, 0, 0, Math.PI * 2); g.fill();
    }
  }
  // a dry-brush outline around the union
  g.strokeStyle = m.ink + '0.38)'; g.lineCap = 'round';
  for (const p of pads) {
    const [cx, cy] = P(p.x, p.y);
    for (let a = 0; a < Math.PI * 2; a += 0.05) {
      const x = cx + Math.cos(a) * p.rx * k, y = cy + Math.sin(a) * p.ry * k;
      const ux = (x - ox) / k, uy = (oy - y) / k;
      if (pads.some((q) => q !== p && ((ux - q.x) / q.rx) ** 2 + ((uy - q.y) / q.ry) ** 2 < 0.97)) continue;
      if (hash(Math.round(a * 100), Math.round(p.x + p.y)) < 0.18) continue; // the brush skips
      const w = 0.7 + Math.sin(a * 7 + p.x) * 0.4 + hash(Math.round(a * 100), Math.round(p.x)) * 0.5;
      g.lineWidth = w; g.beginPath(); g.moveTo(x, y); g.lineTo(cx + Math.cos(a + 0.05) * p.rx * k, cy + Math.sin(a + 0.05) * p.ry * k); g.stroke();
    }
  }
  return c;
}

// ── leaves ──────────────────────────────────────────────────────────────
export type LeafKit = { tex: HTMLCanvasElement[]; shade: HTMLCanvasElement; size: number };
/** Small leaf sprites: juniper tufts, maple stars (green to scarlet), cherry blossom. */
export function leafKit(species: Species, autumn: boolean, blossom: boolean, r: number): LeafKit {
  const S = 16, make = (draw: (g: CanvasRenderingContext2D) => void) => { const { c, g } = canvas(S * r, S * r); g.scale(r, r); draw(g); return c; };
  const tex: HTMLCanvasElement[] = [];
  if (species === 'juniper') {
    for (const [a, b] of [['#2f5a36', '#5e8a52'], ['#365f3a', '#6f9a5a'], ['#2a4f32', '#4f7a46']]) tex.push(make((g) => {
      for (let k = 0; k < 7; k++) { const x = 8 + Math.cos(k * 2.4) * (k ? 3.2 : 0), y = 8 + Math.sin(k * 2.4) * (k ? 2.6 : 0); const gr = g.createRadialGradient(x - 1, y - 1.5, 0.5, x, y, 3.6); gr.addColorStop(0, b); gr.addColorStop(1, a); g.fillStyle = gr; g.beginPath(); g.arc(x, y, 3.4, 0, Math.PI * 2); g.fill(); }
    }));
  } else if (species === 'maple' || !blossom) {
    const cols = species === 'maple' && autumn ? [['#c0392b', '#e8743a'], ['#d4502a', '#f2a03a'], ['#a8282a', '#d85a3a']] : [['#4f8a3a', '#8cc05a'], ['#5a9442', '#a0cc66'], ['#467e36', '#7cb252']];
    for (const [a, b] of cols) tex.push(make((g) => {
      g.translate(8, 8);
      const gr = g.createRadialGradient(-1, -2, 0.5, 0, 0, 7); gr.addColorStop(0, b); gr.addColorStop(1, a); g.fillStyle = gr;
      g.beginPath();
      if (species === 'maple') for (let k = 0; k < 5; k++) { const t = -Math.PI / 2 + (k - 2) * 0.62; g.lineTo(Math.cos(t) * 7, Math.sin(t) * 7); g.lineTo(Math.cos(t + 0.31) * 2.6, Math.sin(t + 0.31) * 2.6); }
      else { g.ellipse(0, 0, 3.4, 6, 0.4, 0, Math.PI * 2); }
      g.closePath(); g.fill();
      g.strokeStyle = 'rgba(0,0,0,0.2)'; g.lineWidth = 0.5; g.beginPath(); g.moveTo(0, 2); g.lineTo(0, -5); g.stroke();
    }));
  } else {
    for (const [a, b] of [['#f4b8c8', '#fff0f4'], ['#eea2b6', '#ffe4ec'], ['#f7c6d2', '#ffffff']]) tex.push(make((g) => {
      g.translate(8, 8);
      for (let k = 0; k < 5; k++) { const t = (k / 5) * Math.PI * 2; g.save(); g.rotate(t); const gr = g.createLinearGradient(0, 0, 0, -6.5); gr.addColorStop(0, a); gr.addColorStop(1, b); g.fillStyle = gr; g.beginPath(); g.ellipse(0, -3.6, 2.4, 3.6, 0, 0, Math.PI * 2); g.fill(); g.restore(); }
      g.fillStyle = '#d0506e'; g.beginPath(); g.arc(0, 0, 1.2, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#f2d06a'; for (let k = 0; k < 5; k++) { g.beginPath(); g.arc(Math.cos(k * 1.26) * 1.8, Math.sin(k * 1.26) * 1.8, 0.4, 0, Math.PI * 2); g.fill(); }
    }));
  }
  const shade = make((g) => { const gr = g.createRadialGradient(8, 8, 0, 8, 8, 8); gr.addColorStop(0, 'rgba(20,30,15,0.35)'); gr.addColorStop(1, 'rgba(20,30,15,0)'); g.fillStyle = gr; g.fillRect(0, 0, 16, 16); });
  return { tex, shade, size: S };
}

/**
 * Draw the tree into g. View: canonical (x, y) → (ox + x·k, oy − y·k). `grow` (0..1) eases in the shoots
 * born this season; `hide` is a set of node ids not to draw (a branch that has just been clipped).
 */
export function drawTree(g: CanvasRenderingContext2D, t: Tree, m: Mood, kit: LeafKit, k: number, ox: number, oy: number, grow = 1, hide?: Set<number>) {
  const alive = t.nodes.filter((n) => n.alive && !(hide && hide.has(n.id)));
  const byId = new Map(alive.map((n) => [n.id, n] as const));
  const leaves = new Set(leafNodes(t).map((n) => n.id));
  // pipe model: a branch is as thick as the foliage it carries
  const load = new Map<number, number>();
  for (let i = alive.length - 1; i >= 0; i--) {
    const n = alive[i], own = (load.get(n.id) ?? 0) + (leaves.has(n.id) ? 1 : 0.15);
    load.set(n.id, own);
    load.set(n.parent, (load.get(n.parent) ?? 0) + own);
  }
  const ease = (n: Node) => (n.born === t.season ? grow : 1);
  const pos = (n: Node): [number, number] => {
    const p = byId.get(n.parent);
    if (!p || ease(n) >= 1) return [n.x, n.y];
    const [px, py] = pos(p), e = ease(n);
    return [px + (n.x - p.x) * e, py + (n.y - p.y) * e];
  };
  const S = (x: number, y: number): [number, number] => [ox + x * k, oy - y * k];
  const width = (n: Node) => Math.min(16, 0.9 + Math.sqrt(load.get(n.id) ?? 0) * 1.05) * k;
  // bark: tapered strokes, dark first, then a lit upper-left edge
  for (const pass of [0, 1, 2]) {
    for (const n of alive) {
      const p = byId.get(n.parent); if (!p) continue;
      const [ax, ay] = S(...pos(p)), [bx, by] = S(...pos(n));
      const w0 = width(n);
      g.lineCap = 'round';
      if (pass === 0) { g.strokeStyle = 'rgba(0,0,0,0.12)'; g.lineWidth = w0 + 2; g.beginPath(); g.moveTo(ax + 2, ay + 2); g.lineTo(bx + 2, by + 2); g.stroke(); }
      else if (pass === 1) { g.strokeStyle = n.born >= t.season - 1 && !n.fixed ? '#7a6a3e' : m.bark[1]; g.lineWidth = w0; g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke(); }
      else if (w0 > 2.5) { g.strokeStyle = m.bark[0]; g.lineWidth = w0 * 0.45; g.beginPath(); g.moveTo(ax - w0 * 0.22, ay - w0 * 0.1); g.lineTo(bx - w0 * 0.22, by - w0 * 0.1); g.stroke(); }
    }
  }
  // foliage: a shade under each cluster, then the leaves, lit from above
  const clusters = alive.filter((n) => leaves.has(n.id));
  const sz = kit.size * k * 0.62;
  for (const n of clusters) { const [x, y] = S(...pos(n)), e = ease(n); g.globalAlpha = e; g.drawImage(kit.shade, x - sz * 1.1, y - sz * 0.6, sz * 2.4, sz * 2.4); }
  for (const n of clusters) {
    const [x, y] = S(...pos(n)), e = ease(n);
    const cnt = 6;
    for (let j = 0; j < cnt; j++) {
      const h1 = hash(n.id, j), h2 = hash(n.id, j + 50), h3 = hash(n.id, j + 99);
      const dx = (h1 - 0.5) * 2 * 13 * k, dy = (h2 - 0.5) * 2 * 9 * k - 2 * k, s = sz * (0.75 + h3 * 0.5) * (0.4 + 0.6 * e);
      const tx = kit.tex[Math.floor(h3 * kit.tex.length)];
      g.globalAlpha = Math.min(1, e * 1.4);
      g.save(); g.translate(x + dx, y + dy); g.rotate((h1 - 0.5) * 1.6); g.drawImage(tx, -s / 2, -s / 2, s, s); g.restore();
    }
  }
  g.globalAlpha = 1;
}
