import { useEffect, useRef } from 'react';
import { canvas, drawTree, leafKit, MOODS, pot, wash } from '../game/art';
import type { Level } from '../game/levels';
import { plant, replay } from '../game/sim';

const cache = new Map<string, HTMLCanvasElement>();
const queue: (() => void)[] = [];
let busy = false;
function pump() { if (busy) return; const job = queue.shift(); if (!job) return; busy = true; window.setTimeout(() => { try { job(); } finally { busy = false; pump(); } }, 16); }

/** The tree on its stand: grown into its shape once finished, a young plant against the wash before. */
function paintCard(level: Level, grown: boolean, w: number, h: number, dpr: number) {
  const m = MOODS[level.chapter], { c, g } = canvas(w * dpr, h * dpr);
  g.scale(dpr, dpr);
  g.save(); g.beginPath(); g.roundRect(0, 0, w, h, 9); g.clip();
  const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, m.wall[0]); bg.addColorStop(1, m.wall[1]); g.fillStyle = bg; g.fillRect(0, 0, w, h);
  const k = Math.min(w / 340, (h * 0.78) / 320), ox = w / 2, oy = h * 0.82;
  g.drawImage(wash(m, level.pads, k, 2, w, h, ox, oy), 0, 0, w, h);
  g.fillStyle = m.stand[0]; g.fillRect(0, oy + 10, w, h - oy - 10);
  const t = grown ? replay(level, level.cuts) : plant(level);
  drawTree(g, t, m, leafKit(level.species, grown, grown, 2), k, ox, oy);
  const p = pot(m, level.species, 150 * k + 14, 2); g.drawImage(p, ox - p.width / 4, oy - 1, p.width / 2, p.height / 2);
  g.restore();
  return c;
}

export function Postcard({ level, grown, locked, width }: { level: Level; grown: boolean; locked: boolean; width: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const height = Math.round(width * 1.15);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1), key = `${level.id}|${grown}|${locked}|${width}|${dpr}`;
    let live = true;
    const show = (src: HTMLCanvasElement) => { if (!live) return; el.width = src.width; el.height = src.height; el.getContext('2d')!.drawImage(src, 0, 0); };
    const hit = cache.get(key);
    if (hit) show(hit); else { queue.push(() => { if (!live) return; const src = paintCard(level, grown && !locked, width, height, dpr); cache.set(key, src); show(src); }); pump(); }
    return () => { live = false; };
  }, [level, grown, locked, width, height]);
  return <canvas ref={ref} className="postcard" style={{ width, height }} aria-hidden />;
}
