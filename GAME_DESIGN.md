# Larch Bonsai: design notes

## The idea
Bonsai is shaped by cutting. A shoot that is cut back sends out new shoots from the buds behind the cut, so the grower trades length for density, year after year, until the foliage sits in clean pads. The game turns that one horticultural fact into a puzzle about time: what you cut now decides what can grow next year.

## Growth
- **Determinism:** each year the tree grows the same way every time. Every choice comes from a hash of the node and the year.
- **Shoots:** a growing tip puts out a shoot of two internodes, a little shorter than the last and bending toward the light, and sometimes forks.
- **Side buds:** buds along the previous two years' wood break into side shoots, alternating sides.
- **Clipping:** a clipped branch's stub buds back into two shoots, spread to either side.
- **Vigour:** the tree can feed only so many shoots a year. Stubs and tips come first, higher before lower, so a dense crown starves the lower branches unless it is cut back.
- **The preview:** next year's growth is drawn faintly, and it is exactly what will grow.

## Scoring
Leaves sit on the last three years' wood and on every growing point. The shape is a union of ellipses, and the score is the overlap of foliage and shape over their union, on a 4-unit grid.

## The grower
Each year, after the growth, the grower tries every possible cut. It keeps the one that most improves how the tree would look if it were left to grow out and then trimmed, up to six cuts a year. Its score is each tree's best. Its cuts are recorded, replayed on the title screen and the level cards, and checked by the tests.

## Stars
- Three for 92% of the grower's best, two for 78%, one for 60%.
- A tree left uncut and only trimmed at the end scores under 80% on every level, so two stars always takes some shaping.
- With real taps, the grower's cuts reach three stars on every tree tested.
