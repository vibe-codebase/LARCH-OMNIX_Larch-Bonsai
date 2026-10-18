import { LEVELS } from '../src/game/levels';
import { growWithGrower, plant, grow, trim, score, leafNodes } from '../src/game/sim';
import fs from 'node:fs';
const out: Record<string, number> = {}, dump: unknown[] = [], cuts: Record<string, [number, number][]> = {};
for (const l of LEVELS) {
  const g = growWithGrower(l);
  const raw = plant(l); for (let s = 0; s < l.seasons; s++) grow(l, raw); trim(l, raw);
  const rs = score(l, raw);
  out[l.id] = Math.round(g.score * 1000) / 1000;
  cuts[l.id] = g.cuts.map((c) => [c.season, c.id]);
  console.log(l.id.padEnd(3), 'grower', g.score.toFixed(3), 'untouched', rs.toFixed(3), 'ratio', (rs / g.score).toFixed(2), 'leaves', leafNodes(g.tree).length, 'cuts', g.cuts.length);
  if (process.argv[2]) dump.push({ pads: l.pads, grower: g.tree.nodes.filter((n) => n.alive), raw: raw.nodes.filter((n) => n.alive) });
}
console.log(JSON.stringify(out));
fs.writeFileSync(new URL('../src/game/cuts.json', import.meta.url), JSON.stringify(cuts) + '\n');
if (process.argv[2]) fs.writeFileSync(process.argv[2], JSON.stringify(dump));
