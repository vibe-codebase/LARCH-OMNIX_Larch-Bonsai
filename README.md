# Larch Bonsai

By **LARCH OMNIX** · package `com.larchomnix.larchbonsai` · Expo owner `884-888`.

A puzzle game for Android about shaping a tree over the years.

**How it plays.**
- A young tree stands in its pot. Its intended shape is washed in pale ink on the paper wall behind it.
- Tap **Grow a year** and every growing tip puts out a new shoot, bending toward the light, while buds along last year's wood break into side shoots.
- Swipe across a branch, or tap it, to clip it. The next year the stub buds back into two shoots. That is how a grower turns long, leggy growth into dense pads of foliage, and it is the whole puzzle.
- Faint lines show exactly what will grow next year, so every cut can be planned. Undo takes back a cut.
- After the last year, give the tree a final trim and show it. The meter shows how well the foliage fills the shape.

**Content.**
- 24 trees in three chapters, each a classical style (formal and informal upright, slanting, broom, windswept, twin trunk, clump, literati):
  - **Juniper:** evergreen tufts.
  - **Maple:** forks readily and turns scarlet in its last year.
  - **Cherry:** runs long and blossoms when it is done.
- **Stars are small trees:** they measure the shape against the best a built-in grower found, which tries every cut each year. Every tree's best is replayed in the tests, and leaving a tree alone always falls short of two stars.

**Look and sound.**
- Visuals:
  - A shoji wall in window light and a wooden stand, with pots in unglazed clay, blue glaze or cream.
  - Bark that thickens with the weight of foliage each branch carries, and leaves drawn as juniper tufts, maple stars or cherry blossom.
  - Clipped branches tumble away, and petals or leaves drift down at the end.
- Sound:
  - A bamboo flute and a koto, with a shishi-odoshi knocking by the fountain, wind in the maples, or a bush warbler.
  - The crisp snip of the shears.
  - A rising pluck as each year unfurls.

## Structure

| Path | What it is |
| --- | --- |
| `web/src/game/sim.ts` | The tree: deterministic growth, side buds, clipping and back-budding, the finishing trim, the shape score, and the grower |
| `web/src/game/levels.ts` | The 24 trees, their shapes and their best scores |
| `web/src/game/cuts.json` | The grower's cuts for each tree, replayed on the title screen and the cards |
| `web/tools/best.ts` | Runs the grower on every tree and records its cuts and best score |
| `src/native/` | Expo WebView shell |

```bash
npm install && npm run web:install
npm run web:test     # 34 tests
npm run build:game && npm run validate:assets && npm run android
```

## Release builds

The Android release is configured for Google Play: target and compile SDK 36, R8 minification and resource shrinking, a non-debuggable release build, no Internet permission, and the game served offline from the app's own assets. Builds run on EAS; `eas.json` has two profiles:

```bash
npm install -g eas-cli && eas login
eas init                     # once: links this folder to your Expo project
npm run eas:apk              # preview profile: a signed APK for testing on devices
npm run eas:aab              # production profile: an AAB for Google Play (versionCode auto-increments)
```
