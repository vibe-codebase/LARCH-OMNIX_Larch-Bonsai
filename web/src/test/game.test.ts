import { describe, expect, it } from 'vitest';
import { CHAPTERS, LEVELS, levelIndex, starsFor } from '../game/levels';
import { clip, grow, growWithGrower, plan, plant, replay, score, trim } from '../game/sim';
import { freshSave, isUnlocked, parseSave, recordResult, totalStars } from '../state/save';

describe('levels', () => {
  it('has 24 trees in three chapters of eight, with unique ids', () => {
    expect(LEVELS).toHaveLength(24);
    expect(new Set(LEVELS.map((l) => l.id)).size).toBe(24);
    CHAPTERS.forEach((_, c) => expect(LEVELS.filter((l) => l.chapter === c)).toHaveLength(8));
    expect(levelIndex('c8')).toBe(23);
  });
  for (const l of LEVELS) {
    it(`${l.id} ${l.name}: the grower's recorded cuts reach the recorded best, and clipping matters`, () => {
      expect(Math.abs(score(l, replay(l, l.cuts)) - l.best)).toBeLessThan(0.002);
      expect(l.best).toBeGreaterThan(0.55);
      // left untouched and only trimmed at the end, the tree falls short of two stars
      const raw = plant(l); for (let s = 0; s < l.seasons; s++) grow(l, raw); trim(l, raw);
      expect(score(l, raw)).toBeLessThan(l.best * 0.8);
    });
  }
  it('the grower still finds its recorded cuts', () => {
    for (const l of LEVELS.slice(0, 3)) expect(growWithGrower(l).cuts).toEqual(l.cuts);
  }, 60000);
  it('stars measure the shape against the best', () => {
    expect(starsFor(0.8, 0.8)).toBe(3); expect(starsFor(0.74, 0.8)).toBe(3); expect(starsFor(0.7, 0.8)).toBe(2);
    expect(starsFor(0.5, 0.8)).toBe(1); expect(starsFor(0.4, 0.8)).toBe(0);
  });
});

describe('the tree', () => {
  const l = LEVELS[3];
  it('grows exactly what the preview shows', () => {
    const t = plant(l); grow(l, t);
    const p = plan(l, t), before = t.nodes.length;
    grow(l, t);
    expect(t.nodes.length - before).toBe(p.length * 2); // each shoot is two internodes
  });
  it('is the same tree every time', () => {
    const a = plant(l), b = plant(l);
    for (let s = 0; s < 3; s++) { grow(l, a); grow(l, b); }
    expect(a.nodes.map((n) => [n.x, n.y])).toEqual(b.nodes.map((n) => [n.x, n.y]));
  });
  it('a clipped shoot buds back into two', () => {
    const t = plant(l); grow(l, t);
    const tip = t.nodes.find((n) => n.tip && !n.fixed)!, stub = t.nodes.find((n) => n.id === tip.parent)!;
    clip(t, tip.id);
    expect(tip.alive).toBe(false); expect(stub.clipped).toBe(true);
    expect(plan(l, t).filter((s) => s.from.id === stub.id)).toHaveLength(2);
  });
  it('the starting trunk cannot be clipped, and nothing grows into the soil', () => {
    const t = plant(l);
    expect(clip(t, 1)).toBe(0);
    for (let s = 0; s < l.seasons; s++) grow(l, t);
    for (const n of t.nodes) expect(n.y).toBeGreaterThanOrEqual(0);
  });
  it('the finishing trim keeps every branch that reaches into the shape', () => {
    const t = plant(l); for (let s = 0; s < l.seasons; s++) grow(l, t);
    const before = score(l, t); trim(l, t);
    expect(score(l, t)).toBeGreaterThanOrEqual(before);
  });
});

describe('save', () => {
  it('survives junk and keeps only known trees', () => {
    expect(parseSave('nope')).toEqual(freshSave());
    const s = parseSave(JSON.stringify({ v: 1, stars: { j1: 3, zz: 2 }, best: { j1: 0.7, j2: 2 }, seenHints: ['j1', 5], settings: { sfx: -1 } }));
    expect(s.stars).toEqual({ j1: 3 }); expect(s.best).toEqual({ j1: 0.7 }); expect(s.seenHints).toEqual(['j1']); expect(s.settings.sfx).toBe(0);
  });
  it('records the best stars and shape, and unlocks in order', () => {
    let s = freshSave();
    s = recordResult(s, 'j1', 2, 0.71234); s = recordResult(s, 'j1', 1, 0.5);
    expect(s.stars.j1).toBe(2); expect(s.best.j1).toBe(0.712); expect(isUnlocked(s, 1)).toBe(true); expect(totalStars(s)).toBe(2);
  });
});
