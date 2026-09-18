# Deben's Adventure — vertical-slice prototype

A small, original 3D platformer prototype in the spirit of the Astro series' design
principles (tiny expressive robot, huge diorama-scale world, exploration, rescue,
gadgets) — **not** a copy of any Astro game, character, level, or asset. No
PlayStation-specific IP is used anywhere in this project.

This is an isolated sub-project inside `mantnince`, independent of the backup
tool's build (own `package.json`, own dev server on port 3100). It shares nothing
with the extension/server/desktop app beyond living in the same repo.

## Run it

```bash
cd game
npm install
npm run dev      # http://localhost:3100
npm run build    # typecheck + production build
```

Controls: WASD/Arrows to move, Space to jump, Shift or E for the boost gadget.

## What this is

One tiny scene demonstrating the *shape* of a handful of the systems described
in the full build spec, working together and genuinely playable:

- **Character controller** — accelerated/damped movement (not instant
  start/stop), gravity, jump, a boost gadget, procedural squash/stretch and a
  color-shifting visor standing in for facial expression, all driven by a
  small explicit animation-state machine.
- **Camera** — a smoothed chase camera that follows the player.
- **One diorama-style level** — a short staircase of platforms, decorative
  props, and one deliberately oversized background object for the
  "tiny robot, huge world" scale beat.
- **Rescue/collection** — two collectible bots (one on the direct path, one
  gated behind a jump-and-boost combo move), a reactive HUD, and a toast on
  pickup.
- **One gadget** — a boost that adds to current velocity, so it does
  meaningfully more when combined with a jump than used alone (the
  "combine the ability with normal movement" progression idea from the spec,
  in miniature).
- **A failure state** — falling off the level respawns you at the start.
- **Audio feedback** — jump/land/collect/boost/fall cues, synthesized with
  the Web Audio API (no external sound assets).

## What this deliberately is not

The uploaded spec describes dozens of systems — enemies, bosses, a hub world,
a save system, VR and AR modes, a material/particle framework, mini-games, a
crane/prize machine, and more. Building all of that is a multi-year
production, not a single build. This prototype is a **foundation**, not the
finished spec. None of the following exist here yet:

- Enemies, combat, or bosses
- A hub world or level-select
- Save/persistence (progress resets on reload)
- VR or AR modes
- A real particle system (boost/landing use simple scale/color flashes
  instead)
- Additional gadget types, world biomes, mini-games, or a prize machine

## Known rough edges (first-pass tuning, not bugs)

- Platform collision is "landable top surface" only, authored as a flat list
  in `src/constants.ts` — there's no collision on platform sides, so walking
  into one from below just passes underneath it (you have to jump up onto
  it). This is a common, intentional simplification for a small prototype
  rather than a full physics engine.
- The exact jump distances/heights were tuned by direct position-tracing
  during development (see the `git log` for this file), not by hand-feel
  playtesting — they work, but would benefit from a human actually playing
  it and adjusting `MOVE_SPEED`/`JUMP_SPEED`/`BOOST_*` in `src/constants.ts`
  to taste.
- The chase camera has a fixed world-space offset rather than orbiting
  behind the player's facing — simpler and more predictable, but less
  cinematic than a full third-person rig.

## Project layout

```
game/
  src/
    App.tsx                 title screen → <Canvas>
    constants.ts             tunable movement values + authored level/collectible data
    utils.ts                 groundHeightAt(), lerpAngle()
    components/
      RobotController.tsx    the character controller (movement, jump, boost, anim)
      FollowCamera.tsx       chase camera
      Level.tsx               platforms, props, lighting, sky
      CollectibleBot.tsx      a rescuable NPC bot
      Hud.tsx                 DOM overlay (rescued count, boost cooldown, toasts)
    hooks/
      useKeyboard.ts          input, as refs (no per-keypress re-renders)
      useAudioCues.ts         synthesized SFX
    state/
      gameStore.ts             zustand: collected bots, toast, gadget cooldown
      playerTransform.ts       per-frame mutable singletons (position/facing/camera shake) —
                                deliberately outside React state; see the comment in the file
                                for why.
```
