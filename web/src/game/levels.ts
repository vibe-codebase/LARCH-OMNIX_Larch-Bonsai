import type { Pad, Spec, Species } from './sim';
import CUTS from './cuts.json';

/** `cuts`: the grower's cuts (year, node), found by tools/best.ts; replayed on the title screen and the cards. */
export type Level = Spec & { id: string; name: string; style: string; chapter: number; hint?: string; best: number; cuts: { season: number; id: number }[] };
export const CHAPTERS = [
  { name: 'Juniper', blurb: 'An evergreen that takes clipping well. Shape its first pads of foliage.' },
  { name: 'Maple', blurb: 'Quick-growing and eager to fork, and red as fire in the autumn.' },
  { name: 'Cherry', blurb: 'Slow to fill and quick to run long. Get it right, and it blossoms.' },
];

const E = (x: number, y: number, rx: number, ry: number): Pad => ({ x, y, rx, ry });
const SP: Record<Species, { fork: number; shoot: number; maxTips: number }> = {
  juniper: { fork: 0.55, shoot: 26, maxTips: 70 },
  maple: { fork: 0.6, shoot: 30, maxTips: 80 },
  sakura: { fork: 0.45, shoot: 32, maxTips: 70 },
};
type Draft = { id: string; name: string; style: string; seasons: number; pads: Pad[]; start: [number, number][][]; seed?: number; hint?: string };

const JUNIPER: Draft[] = [
  { id: 'j1', name: 'First Pad', style: 'Formal upright', seasons: 4, start: [[[0, 0], [0, 45], [2, 90], [0, 130]]], pads: [E(0, 175, 70, 45)],
    hint: 'Tap Grow to let a season pass. Swipe across a branch to clip it: a clipped shoot buds back into two.' },
  { id: 'j2', name: 'Two Tiers', style: 'Formal upright', seasons: 4, start: [[[0, 0], [0, 50], [0, 100], [0, 140]], [[0, 100], [-40, 110]]], pads: [E(5, 190, 62, 38), E(-70, 120, 50, 28)],
    hint: 'The faint lines show what will grow next season. Clip shoots that will leave the shape.' },
  { id: 'j3', name: 'Lean', style: 'Slanting', seasons: 5, start: [[[0, 0], [15, 45], [35, 90], [55, 130]]], pads: [E(80, 175, 72, 42), E(-30, 105, 45, 26)] },
  { id: 'j4', name: 'Three Pads', style: 'Informal upright', seasons: 5, start: [[[0, 0], [-12, 45], [8, 95], [-5, 140]], [[-12, 45], [-45, 70]], [[8, 95], [45, 110]]], pads: [E(-5, 205, 58, 36), E(65, 130, 50, 26), E(-75, 85, 48, 24)] },
  { id: 'j5', name: 'Dome', style: 'Broom', seasons: 5, start: [[[0, 0], [0, 60], [0, 100]], [[0, 60], [-30, 100]], [[0, 60], [30, 100]]], pads: [E(0, 148, 100, 28), E(0, 198, 50, 20)] },
  { id: 'j6', name: 'Windswept', style: 'Windswept', seasons: 5, start: [[[0, 0], [-10, 50], [5, 100], [30, 140]], [[5, 100], [45, 100]]], pads: [E(85, 158, 75, 24), E(68, 105, 50, 16)] },
  { id: 'j7', name: 'Twin Trunks', style: 'Twin trunk', seasons: 5, start: [[[0, 0], [-15, 60], [-25, 120]], [[0, 0], [20, 50], [35, 95]]], pads: [E(-35, 195, 60, 42), E(55, 145, 52, 32)] },
  { id: 'j8', name: 'Old Juniper', style: 'Informal upright', seasons: 6, start: [[[0, 0], [20, 40], [-10, 85], [15, 130], [0, 165]], [[20, 40], [55, 55]], [[-10, 85], [-50, 95]]], pads: [E(5, 230, 60, 36), E(-75, 145, 55, 28), E(80, 105, 52, 26)] },
];
const MAPLE: Draft[] = [
  { id: 'm1', name: 'Autumn', style: 'Broom', seasons: 4, start: [[[0, 0], [0, 55], [0, 100]], [[0, 55], [-25, 85]], [[0, 55], [25, 85]]], pads: [E(45, 160, 80, 30), E(-50, 112, 45, 20)],
    hint: 'Maple forks readily. Clip early to keep the shape tight.' },
  { id: 'm2', name: 'Wide Crown', style: 'Broom', seasons: 5, start: [[[0, 0], [0, 70], [0, 110]], [[0, 70], [-35, 100]], [[0, 70], [35, 100]]], pads: [E(0, 165, 125, 38)] },
  { id: 'm3', name: 'Stepped', style: 'Informal upright', seasons: 5, start: [[[0, 0], [10, 50], [-10, 100], [5, 140]], [[10, 50], [50, 65]], [[-10, 100], [-50, 115]]], pads: [E(5, 205, 62, 38), E(-80, 140, 50, 26), E(80, 95, 52, 26)] },
  { id: 'm4', name: 'Leaning Maple', style: 'Slanting', seasons: 5, start: [[[0, 0], [-20, 45], [-45, 90], [-65, 125]], [[-20, 45], [20, 70]]], pads: [E(-85, 175, 75, 45), E(45, 110, 50, 26)] },
  { id: 'm5', name: 'Clump', style: 'Clump', seasons: 5, start: [[[0, 0], [-25, 60], [-35, 110]], [[0, 0], [0, 70], [0, 125]], [[0, 0], [25, 55], [40, 100]]], pads: [E(0, 175, 115, 40), E(0, 230, 60, 24)] },
  { id: 'm6', name: 'Two Clouds', style: 'Twin trunk', seasons: 6, start: [[[0, 0], [-20, 60], [-40, 120]], [[0, 0], [25, 55], [45, 105]]], pads: [E(-55, 200, 62, 42), E(70, 150, 58, 36)] },
  { id: 'm7', name: 'Literati', style: 'Literati', seasons: 6, start: [[[0, 0], [15, 50], [-5, 105], [20, 160], [5, 210]]], pads: [E(35, 262, 58, 22), E(-45, 228, 36, 16)] },
  { id: 'm8', name: 'Fire Maple', style: 'Informal upright', seasons: 6, start: [[[0, 0], [-15, 50], [10, 100], [-5, 150]], [[-15, 50], [-55, 70]], [[10, 100], [55, 115]]], pads: [E(0, 220, 62, 32), E(-88, 128, 50, 22), E(88, 150, 50, 22)] },
];
const CHERRY: Draft[] = [
  { id: 'c1', name: 'Spring Light', style: 'Formal upright', seasons: 5, start: [[[0, 0], [0, 50], [0, 100], [0, 140]]], pads: [E(0, 200, 85, 55)],
    hint: 'The last season brings the blossom. Plan the shape before then.' },
  { id: 'c2', name: 'Petals', style: 'Broom', seasons: 5, start: [[[0, 0], [0, 60], [0, 100]], [[0, 60], [-30, 95]], [[0, 60], [30, 95]]], pads: [E(0, 175, 110, 58)] },
  { id: 'c3', name: 'Riverbank', style: 'Slanting', seasons: 6, start: [[[0, 0], [20, 40], [45, 80], [70, 115]], [[20, 40], [-15, 65]]], pads: [E(100, 165, 70, 42), E(-45, 115, 55, 28)] },
  { id: 'c4', name: 'Temple Gate', style: 'Twin trunk', seasons: 6, start: [[[0, 0], [-25, 60], [-45, 120]], [[0, 0], [25, 60], [45, 120]]], pads: [E(-60, 195, 58, 45), E(60, 195, 58, 45)] },
  { id: 'c5', name: 'Hillside', style: 'Windswept', seasons: 6, start: [[[0, 0], [-15, 50], [0, 100], [-25, 140]], [[0, 100], [-50, 110]]], pads: [E(-80, 175, 75, 32), E(-90, 120, 60, 22)] },
  { id: 'c6', name: 'Old Cherry', style: 'Informal upright', seasons: 6, start: [[[0, 0], [15, 45], [-10, 95], [10, 140]], [[15, 45], [55, 60]], [[-10, 95], [-55, 105]]], pads: [E(10, 205, 62, 32), E(-82, 140, 48, 20), E(88, 100, 48, 20)] },
  { id: 'c7', name: 'Moon Gazing', style: 'Literati', seasons: 7, start: [[[0, 0], [-15, 55], [10, 110], [-10, 165], [15, 215]]], pads: [E(-20, 270, 72, 32), E(60, 235, 40, 20)] },
  { id: 'c8', name: 'Hanami', style: 'Clump', seasons: 7, start: [[[0, 0], [-30, 55], [-45, 105]], [[0, 0], [0, 70], [5, 130]], [[0, 0], [30, 50], [50, 95]]], pads: [E(0, 210, 115, 40), E(-100, 135, 42, 20), E(100, 125, 42, 20)] },
];

/** The best the grower reached on each tree (tools/best.ts); stars are measured against it. */
export const BEST: Record<string, number> = {j1: 0.838, j2: 0.716, j3: 0.811, j4: 0.742, j5: 0.799, j6: 0.652, j7: 0.815, j8: 0.752, m1: 0.71, m2: 0.811, m3: 0.734, m4: 0.786, m5: 0.875, m6: 0.808, m7: 0.627, m8: 0.68, c1: 0.784, c2: 0.871, c3: 0.839, c4: 0.808, c5: 0.773, c6: 0.64, c7: 0.796, c8: 0.736};
const fin = (d: Draft[], chapter: number, species: Species): Level[] =>
  d.map((x, k) => ({ ...SP[species], ...x, species, chapter, seed: x.seed ?? 11 + chapter * 37 + k * 13, best: BEST[x.id] ?? 0.6, cuts: ((CUTS as Record<string, number[][]>)[x.id] ?? []).map(([season, id]) => ({ season, id })) }));
export const LEVELS: Level[] = [...fin(JUNIPER, 0, 'juniper'), ...fin(MAPLE, 1, 'maple'), ...fin(CHERRY, 2, 'sakura')];
export const levelIndex = (id: string) => LEVELS.findIndex((l) => l.id === id);
/** Stars: how closely the foliage fills the shape, against the best the grower found. */
export const starsFor = (score: number, best: number) => (score >= best * 0.92 ? 3 : score >= best * 0.78 ? 2 : score >= best * 0.6 ? 1 : 0);
