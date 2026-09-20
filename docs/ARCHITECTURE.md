# Architecture

Red Herring is a static, no-build browser game: plain ES modules, [three.js](https://threejs.org) vendored under `vendor/`, and no runtime network dependency. Serve the folder with any static server.

The game grew out of a procedural 3D chess renderer, so the chess engine, the scene, and the detective layer are three fairly independent pieces.

```
index.html              markup for every screen and the HUD
src/
  main.js               wiring: builds the world, binds input, runs the loop, ends the case
  core/audio.js         synthesised sound effects + looping music track
  chess/                0x88 engine, negamax/alpha-beta AI, worker (search off the main thread)
  game/
    cases.js            story data: suspects, briefing, the 32-square evidence deck
    questions.js        the five final-theory questions and their supporting evidence
    solution.js         the case-solved narrative shown on the result screen
    evaluation.js       pure scoring: outcome, selection, reasoning, evidence audit
    evidence.js         board-side evidence state (dig level, basket, discard, star, placement)
    evidencePieces.js   piece layer: one pawn per square, upgraded on each Dig In
    board.js / pieces.js / materials.js / table.js / fx.js / badges.js   3D board rendering
    match.js            legacy chess match state (turns, clocks, repetition, PGN)
  scene/                renderer + quality tiers, lighting, post-processing, shared GLSL
  world/                sky dome, snow terrain, forest, snowfall, props
  ui/
    menu.js             screen stack, keyboard/mouse parity, persisted settings
    hud.js              timer, stars, basket bar, toasts
    case-report.js      end-of-case report
    ui.css              the visual system
tests/                  node:test suites for scoring and game-flow state
tools/                  dev-only piece renderer / exporter (not shipped)
assets/                 suspect portraits, evidence photos, chess piece renders
data/leakdata.xlsx      source spreadsheet the Story 1 deck was authored from
```

## Evidence model

Each square in `STORIES.s1.deck` is one piece of evidence:

| Field | Meaning |
| --- | --- |
| `real` | Whether the underlying fact is genuine (fabricated clues are `false`) |
| `redHerring` | Genuine but misleading — the trap the title refers to |
| `aboutSuspect` | Who the evidence truly concerns |
| `relevance` | `low` / `medium` / `high` |
| `connectsTo` | Squares this clue links to |
| `digLevels` | Progressively deeper detail revealed per **Dig In** |

Every **Dig In** upgrades the pawn (pawn → knight → bishop → king), so how deep you have looked is visible at a glance on the board. Deal order is scheduled so that no two neighbouring squares point at the same suspect.

## Scoring

`src/game/evaluation.js` is a set of pure functions; the renderer never computes its own totals.

- **Outcome** — how many of the five final-theory answers are correct.
- **Selection** — every decision (discard / basket / place / star) is checked against `real` and `aboutSuspect`. Precision and coverage are combined by harmonic mean, so a single lucky guess cannot earn half the score.
- **Reasoning** — a starred clue only counts as support if it is real, and (when placed) sits under the right suspect.
- **Evidence audit** — the full breakdown shown on the case report.

## Running the tests

```bash
npm test
```
