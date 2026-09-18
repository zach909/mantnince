# Deben's Adventure — a playable tour of Universal Backup Cloud

A small 3D platformer, in the spirit of how Astro's Playroom turns the PS5's own
hardware into an explorable world — except this one turns *this repo's* backup
system into one. Original character, original tiny diorama world; **not** a
copy of any Astro game, character, level, or asset, and no PlayStation-specific
IP anywhere in this project.

This is an isolated sub-project inside `mantnince` (own `package.json`, own dev
server on port 3100). It doesn't share a build with the extension/desktop app,
but it *does* talk to the same backend (`server/`) they do — see below.

## Run it

```bash
cd game
npm install
npm run dev      # http://localhost:3100
npm run build    # typecheck + production build
```

Controls: WASD/Arrows to move, Space to jump, Shift or E for the optimizer
thruster gadget.

By default it runs on **demo data** — no server required. To see your actual
backup data instead:

```bash
# in the repo root, in a separate terminal
uvicorn server.main:app --reload
```

then on the title screen, "Connect to your live Backup Cloud" → paste the API
URL (default `http://127.0.0.1:8000`) and a bearer token (get one via
`POST /api/auth/register` then `POST /api/auth/token` — see the main
`README.md`'s API docs section, or `http://127.0.0.1:8000/docs`). The server
needs `server/main.py`'s CORS allow-list to include your game's origin — it
already does for the default `localhost:3100` dev server.

## What each zone actually shows

This isn't flavor text over fake numbers — every panel reads real data (live,
if connected; otherwise realistic demo data) through `src/lib/backendClient.ts`,
which calls the exact same FastAPI endpoints the Electron desktop app uses.

| Zone | Real subsystem | Data source |
|---|---|---|
| **Dedup Reef** | Content-hash dedup (`server/services/dedup.py`) | `GET /api/backup/status` |
| **Cloud Docks** | Google/Microsoft connectors (`server/api/cloud.py`) | `GET /api/cloud/status` |
| **Device Rescue** (the two collectible bots) | Registered devices (`server/api/devices.py`) | `GET /api/devices` — rescuing one *is* the platforming payoff, not just a label |
| **System Vitals** | What a *browser tab* can honestly see about its machine | `navigator.hardwareConcurrency` / `deviceMemory` / `connection` — deliberately not fake CPU/RAM/disk usage, since a browser genuinely can't read that (unlike the desktop app's Node-based System Health panel) |
| **Security Beacon** | The risky-site heuristic from the extension | `src/lib/siteRisk.ts`, a mirror of the real `assessSiteRisk()` in the extension's `src/lib/siteRisk.ts`, run live against sample URLs via an in-scene button |
| **Earnings Plaza** | The mock ad-earnings ledger | `GET /api/ads/earnings` — read-only; this zone doesn't mint its own fake currency |

The **optimizer thruster** gadget (the boost) is a thematic nod to the
desktop app's read-only system-update check and manual restart action, not a
literal reimplementation of it — it's still just a movement ability.

## What this deliberately is not

The full 45-section build spec you can find referenced in this project's
history describes dozens of generic-platformer systems — enemies, bosses, a
hub world, save/persistence, VR/AR modes, a material/particle framework,
mini-games, a prize machine. None of that is here, and it isn't the point of
*this* version: this prototype is specifically about making the backup app's
real features explorable and fun, not about being a complete platformer engine.

- No enemies, combat, or bosses
- No save/persistence (progress resets on reload; the *backend* data is real,
  but your in-game rescue progress isn't saved anywhere)
- No VR/AR modes, particle system, or additional gadgets
- The "connect to live data" flow only *reads* your backup account — it never
  writes, uploads, or modifies anything

## Known rough edges (first-pass tuning, not bugs)

- Platform collision is "landable top surface" only (`src/constants.ts`) —
  no side collision, so walking into a platform from below just passes
  underneath it.
- Movement/jump constants were tuned by direct position-tracing during
  development, not hand-feel playtesting — they work, but a human playing it
  and adjusting `MOVE_SPEED`/`JUMP_SPEED`/`BOOST_*` to taste would help.
- The chase camera has a fixed world-space offset rather than orbiting behind
  the player's facing.
- If your live backup account only has one or two devices, the rescue puzzle
  pads the remainder with a generic "Spare Bot" so the two-collectible slot
  layout always has exactly as many targets as it was jump-distance-tuned for.
- The zone info panels are DOM elements projected into 3D space (`@react-three/drei`'s
  `<Html>`), not in-world geometry — cheaper and more reliable than 3D text
  rendering, but they don't get occluded by scenery you walk behind.

## Project layout

```
game/
  src/
    App.tsx                    title screen (+ connect panel) → <Canvas>
    constants.ts                tunable movement values + authored level layout
    utils.ts                    groundHeightAt(), lerpAngle()
    lib/
      backendClient.ts           fetches real data from server/, or returns demo data
      browserVitals.ts           honest browser-visible machine signals
      siteRisk.ts                 mirrors the extension's risky-site heuristic
    components/
      RobotController.tsx        character controller (movement, jump, boost, anim)
      FollowCamera.tsx           chase camera
      Level.tsx                   platforms, props, lighting, sky, zone placement
      CollectibleBot.tsx          a rescuable NPC bot (device-driven identity)
      Hud.tsx                     DOM overlay (rescued count, optimizer cooldown, toasts)
      zones/
        Kiosk.tsx                  shared info-panel/pedestal building block
        DedupReef.tsx, CloudDocks.tsx, SystemVitals.tsx,
        SecurityBeacon.tsx, EarningsPlaza.tsx
    hooks/
      useKeyboard.ts              input, as refs (no per-keypress re-renders)
      useAudioCues.ts             synthesized SFX
    state/
      gameStore.ts                 zustand: collected bots, toast, gadget cooldown
      backendStore.ts              zustand: loaded backend data + connect/demo actions
      playerTransform.ts           per-frame mutable singletons (position/facing/camera
                                    shake) — deliberately outside React state; see the
                                    comment in the file for why.
```
