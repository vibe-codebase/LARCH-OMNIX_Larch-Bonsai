// Store icon, adaptive-icon layers and splash: a shaped tree in its pot, on paper in window light.
import * as A from '../src/game/art';
import { LEVELS } from '../src/game/levels';
import { replay } from '../src/game/sim';

function tree(g: CanvasRenderingContext2D, id: string, cx: number, rootY: number, k: number, r = 3) {
  const l = LEVELS.find((x) => x.id === id)!, m = A.MOODS[l.chapter], t = replay(l, l.cuts);
  A.drawTree(g, t, m, A.leafKit(l.species, true, true, r * k), k, cx, rootY);
  const p = A.pot(m, l.species, 150 * k + 40 * k / 2, r); g.drawImage(p, cx - p.width / r / 2, rootY - 3 * k, p.width / r, p.height / r);
}
function paper(g: CanvasRenderingContext2D, W: number, H: number, chapter: number, standY: number) { g.drawImage(A.room(A.MOODS[chapter], W / 2, H / 2, 2, standY / 2), 0, 0, W, H); }
export function icon() {
  const { c, g } = A.canvas(1024, 1024);
  paper(g, 1024, 1024, 0, 900);
  tree(g, 'j8', 512, 800, 2.45);
  g.fillStyle = '#b8442c'; g.save(); g.translate(880, 140); g.rotate(-0.06); g.fillRect(-46, -46, 92, 92); g.restore();
  return c;
}
export function adaptive() { const { c, g } = A.canvas(1024, 1024); tree(g, 'j8', 512, 740, 1.7); return c; }
export function adaptiveBg() { const { c, g } = A.canvas(1024, 1024); paper(g, 1024, 1024, 0, 820); return c; }
export function splash() {
  const W = 1284, H = 2778, { c, g } = A.canvas(W, H);
  paper(g, W, H, 1, 2050);
  tree(g, 'm8', W / 2, 1880, 3.2);
  g.textAlign = 'center'; g.font = '900 220px "Zen Old Mincho", serif'; g.fillStyle = '#2b2620'; g.fillText('Bonsai', W / 2, 520);
  g.font = '700 58px "Zen Kaku Gothic New", sans-serif'; g.fillStyle = '#4f7a42'; try { g.letterSpacing = '34px'; } catch { /* */ } g.fillText('LARCH', W / 2 + 17, 300); try { g.letterSpacing = '0px'; } catch { /* */ }
  g.fillStyle = '#b8442c'; g.save(); g.translate(W / 2, 640); g.rotate(-0.07); g.fillRect(-48, -48, 96, 96); g.restore();
  return c;
}
/** The Play Store feature graphic: a maple in autumn on the shoji wall, and the name with its seal. */
export function feature() {
  const W = 1024, H = 500, { c, g } = A.canvas(W, H);
  paper(g, W, H, 1, 430);
  tree(g, 'm8', 742, 418, 1.32);
  // a soft fade so the words sit on clean paper
  const fade = g.createLinearGradient(0, 0, 560, 0); fade.addColorStop(0, 'rgba(246,240,228,0.92)'); fade.addColorStop(0.75, 'rgba(246,240,228,0.55)'); fade.addColorStop(1, 'rgba(246,240,228,0)');
  g.fillStyle = fade; g.fillRect(0, 0, 560, 428);
  g.fillStyle = '#b8442c'; g.save(); g.translate(98, 120); g.rotate(-0.06); g.fillRect(-20, -20, 40, 40); g.restore();
  g.textAlign = 'left'; g.fillStyle = '#2b2620'; g.font = '900 104px "Zen Old Mincho", serif'; g.fillText('Bonsai', 72, 252);
  g.font = '700 21px "Zen Kaku Gothic New", sans-serif'; g.fillStyle = '#4f7a42'; try { g.letterSpacing = '12px'; } catch { /* */ } g.fillText('LARCH', 136, 128); try { g.letterSpacing = '0px'; } catch { /* */ }
  g.font = '500 30px "Zen Kaku Gothic New", sans-serif'; g.fillStyle = '#4a3f34'; g.fillText('Shape a tree, year by year.', 76, 306);
  g.fillStyle = '#b8442c'; g.fillRect(78, 336, 56, 2);
  g.font = '700 15px "Zen Kaku Gothic New", sans-serif'; g.fillStyle = '#6a5c4c';
  const spaced = (t: string, x: number, y: number) => { let cx = x; for (const ch of t) { g.fillText(ch, cx, y); cx += g.measureText(ch).width + 2.2; } };
  spaced('24 CLASSICAL TREES  ·  CLIP, WAIT, AND WATCH IT GROW', 78, 372);
  return c;
}
(window as unknown as { brand: unknown }).brand = { icon, adaptive, adaptiveBg, splash, feature };
