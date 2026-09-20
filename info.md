# Frostfall Gambit — 3D chess in a snowbound forest

**Language.** Write every user-facing string in the language the user asked in.
The shipped copy is English; if the request arrives in another language,
translate the menus, HUD labels, ledger headings, toasts and result lines. The
side names (Ivory / Obsidian) are flavour, not chess notation — translate them
too. Move notation itself (`e4`, `Nf6`, `O-O`) is international and stays.

## Before loading anything, ask

Use the ask-user tool once, with these questions:

1. **Do you want this as a full-stack app?** Right now the game runs entirely in
   the browser — nothing is saved beyond the settings this device remembers. A
   full-stack version would add a server and a database, so finished games,
   player records and a ladder survive a refresh and can be shared by link.
2. **Which side and what strength?** Ivory or Obsidian, and how hard the
   opponent should push back (novice / club / expert / master).
3. **What should the clearing look like?** The default is winter dusk with
   aurora. Other seasons or times of day are a palette change, not a rebuild.
4. **Whose duel is this?** Side names, the title on the front screen and the
   name in the ledger can all carry a club, a tournament or two people.

If the user answers nothing, load the default files and open the game as-is.

## What this is

A complete chess game — rules, opponent, clocks, notation — rendered in
three.js as a stone board resting in a forest clearing while it snows.

```
index.html            markup for the menu screens and the head-up display
info.md               this file
src/
  main.js             wiring: builds the world, binds pointer and keys, runs the loop
  core/
    audio.js          every sound synthesised on the spot — no audio assets
  chess/
    engine.js         0x88 board, move generation, castling, en passant,
                      promotion, check/mate/stalemate, FEN, SAN
    ai.js             negamax + alpha-beta, quiescence, killers, history,
                      tapered piece-square evaluation, four strength levels
    worker.js         runs the search off the main thread
  game/
    match.js          turn state, clocks, capture tally, repetition, undo, PGN
    board.js          board mesh, square shader, per-square highlight texture
    pieces.js         procedural geometry for all six pieces
    materials.js      ivory and obsidian shader recipes
    table.js          the piece set: spawning, move animation, captures
    fx.js             recycled point bursts for snow kick and capture flurries
    badges.js         optional floating piece markers
  scene/
    stage.js          renderer, camera presets, quality tiers, frame loop
    lighting.js       low sun, sky bounce, lantern pair, board downlight
    post.js           bloom, tone mapping, cold grade, vignette, grain
    glsl.js           shared noise functions injected into several materials
  world/
    sky.js            dome shader: dusk gradient, cloud deck, aurora, stars
    ground.js         displaced snow with drifts and view-dependent glitter
    forest.js         instanced conifers with snow caps and wind sway
    snowfall.js       GPU snowfall that wraps around the camera
    props.js          lanterns, boulders, fallen timber
  ui/
    menu.js           screen stack, keyboard/mouse parity, persisted settings
    hud.js            clocks, turn line, evaluation rail, ledger, toasts
    ui.css            the whole visual system
vendor/               three.js build, the addons used, and two font files
```

Open `index.html` from any static server. There is no build step and no
network dependency.

Optional: You can use image and video generation tools if it suits user's query.

## Turning it into something else

The chess engine and the scene are independent. Either half can be replaced.

- **A different board game** — `chess/engine.js` is the only file that knows
  the rules. `game/board.js` draws an 8×8 grid from world coordinates; change
  the grid size there and in `squareToWorld`. Draughts, shogi and go boards all
  fit the same rig.
- **A different setting** — the season lives in six numbers: the sun direction
  and colour in `scene/lighting.js`, the three sky colours in `world/sky.js`,
  the fog in `scene/stage.js`, and the snow palette in `world/ground.js`.
  Desert dusk, a rain-lit courtyard and a lantern-lit temple are all recolours
  of the same shaders.
- **A study or puzzle tool** — `match.js` starts from `fromFen()`; hand it any
  FEN to open on a position instead of the opening. The ledger and the
  evaluation rail already report what the engine thinks.
- **Two humans, one screen** — `match.js` calls the worker only when the side to
  move is not `state.human`. Remove that branch for hotseat play.
- **A spectator board** — drive `match.play()` from a feed and never enable
  pointer selection; the animation, capture effects and ledger all still run.

Titles, side names, the strength labels and every hint string live in
`index.html` and the two `ui/` files. Nothing is baked into a texture except
the board's own coordinates, which are drawn on a canvas in `game/board.js`.

## The technique, in short

Read the files for detail; this is the shape of it.

**Everything is procedural.** No meshes, no textures, no audio files are
loaded. The pieces are lathe profiles written in a small turning language
(`at` / `line` / `quad` / `arc`) and merged into one geometry each; the knight
adds an extruded side profile whose thickness is tapered per vertex so it reads
as a carved head rather than a plank. The board's coordinates are painted onto
a canvas and flipped, because the texture's v axis runs against the canvas.

**Materials are stock three.js materials with GLSL grafted in.** Every surface
in the scene is a `MeshStandardMaterial` or `MeshPhysicalMaterial` patched
through `onBeforeCompile`, so it keeps real shadows, fog and lighting while
gaining its own look: bone grain and rim translucency on ivory, conchoidal
fracture on obsidian, ice-over-slate veining on the squares, wind-carved drifts
on the snow, snow caps wherever a world normal faces up. The shared noise
functions live in `scene/glsl.js` and are injected into `#include <common>`.

**Highlights ride an 8×8 data texture.** Selection, legal squares, captures and
the last move are four channels of a 64-texel `DataTexture` the board shader
samples per fragment — no extra meshes, no per-square objects, and rings and
discs are drawn analytically from the fragment's position inside its square.

**Snow is two GPU systems.** Falling flakes are one `Points` buffer whose
vertex shader wraps the field around the camera, so the fall is endless from a
fixed particle count; ground glitter is a hashed cell lattice in the ground's
fragment shader where a flake only fires when its randomised facet lines up
with the sun and its blink phase is open.

**The opponent thinks in a worker.** Search is iterative-deepening negamax with
alpha-beta, late-move reduction, quiescence, killer moves and a history table,
scored by a tapered midgame/endgame piece-square evaluation. Weaker levels
sample from near-best moves so repeat games diverge. The main thread never
blocks; the turn line shows the opponent thinking instead. The search answers
an opening move in about twenty milliseconds, which reads as the opponent
moving on top of you, so `match.js` holds each reply for a per-level pause
before it lands — that table is the first thing to adjust if the pace feels
wrong.

**The interface is monochrome and never dims the scene.** There is no accent
colour and no scrim: contrast comes from opacity steps of white plus a tight
per-glyph shadow (`--halo`), so the clearing stays at full brightness behind
the type. On the board itself, only the two hints that carry meaning are
coloured — pale blue for a legal square, coral for a capture or a check.

**Quality is measured, not guessed.** Pixel density starts high and shadows
start on; a hundred frames are timed, and only if the median frame is slow does
the stage step down a tier and say so in a toast.
