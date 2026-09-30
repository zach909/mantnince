# Deben's Adventure — a playable, friendly tour of Universal Backup Cloud

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

Controls: WASD/Arrows to move, Space to jump, **F to attack bugs**, Shift or E
for the optimizer thruster gadget — or the on-screen joystick/buttons, which
work with touch *or* mouse (see `TouchControls.tsx`).

## Android / iOS (Capacitor)

The game is wrapped as a native app with [Capacitor](https://capacitorjs.com/),
which packages the same web build (`dist/`) into an installable Android/iOS
shell rather than being a separate codebase. `android/` and `ios/` are
committed, generated native projects — don't hand-edit their Capacitor-managed
files; change the web app and re-run `npx cap sync`.

```bash
npm run build && npx cap sync   # rebuild the web app, copy it into both native projects

# Android — buildable and verifiable on Linux, no Mac required
cd android
echo "sdk.dir=$ANDROID_HOME" > local.properties   # your own Android SDK path; gitignored
./gradlew assembleDebug          # → app/build/outputs/apk/debug/app-debug.apk
adb install app/build/outputs/apk/debug/app-debug.apk   # onto a device/emulator

# iOS — requires Xcode on macOS; cannot be built or run from this repo's
# Linux dev environment. Open ios/App/App.xcworkspace in Xcode on a Mac,
# select a simulator or device, and Run. This project was generated and
# type-checked here, but never actually compiled — treat the first Xcode
# build as the real first test of the iOS side.
```

Both platforms get the **same** TypeScript/React/Three.js code and the same
touch controls — Capacitor doesn't fork the app per platform, it's one web
build wrapped twice.

Live-server connections from the wrapped app work the same way as in-browser
(`server/core/http.py`'s CORS allow-list already includes Capacitor's default
WebView origins, `https://localhost` and `capacitor://localhost`), but
`127.0.0.1` inside the app refers to the *phone itself*, not your computer —
use your machine's LAN IP (server started with `--host 0.0.0.0`, which
`python -m server.main` already does) or the Android emulator's special
`10.0.2.2` alias for the host loopback.

By default it runs on **demo data** — no server required. To see your actual
backup data instead:

```bash
# in the repo root, in a separate terminal
python -m server.main
```

then on the title screen, "Connect to your live Backup Cloud" → paste the API
URL (default `http://127.0.0.1:8000`) and a bearer token (get one via
`POST /api/auth/register` then `POST /api/auth/token` — see the main
`README.md`'s API docs section). The server's CORS allow-list
(`server/core/http.py`) already includes the default `localhost:3100` dev
server origin.

## What each zone actually shows

Every panel reads real data (live, if connected; otherwise realistic demo
data) through `src/lib/backendClient.ts`, which calls the same HTTP endpoints
the Electron desktop app uses. A few zones are game-y centerpieces rather than
subsystem readouts — marked below.

| Zone | Real subsystem | Data source |
|---|---|---|
| **Dedup Reef** | Content-hash dedup (`server/services/dedup.py`) | `GET /api/backup/status` |
| **Cloud Docks** | Google/Microsoft connectors (`server/api/cloud.py`) | `GET /api/cloud/status` |
| **Device Rescue** (the two collectible bots) | Registered devices (`server/api/devices.py`) | `GET /api/devices` — rescuing one *is* the platforming payoff, not just a label |
| **Port Gate** | Whatever port the connected API is actually listening on | parsed from the saved connect config; a couple of other ports shown are explicitly labeled "illustrative," since a browser page can't genuinely scan a host |
| **Terminal** | Real, live game events | tails `state/activityLog.ts`, which every other system (rescues, bug defeats, infections, the boss fight) logs to as it actually happens — not scripted flavor text |
| **System Vitals** | What a *browser tab* can honestly see about its machine | `navigator.hardwareConcurrency` / `deviceMemory` / `connection` — deliberately not fake CPU/RAM/disk usage, since a browser genuinely can't read that (unlike the desktop app's Node-based System Health panel) |
| **Kernel Core** | *(centerpiece, no backend data)* | where the boss fight happens — see below |
| **Security Beacon** | The risky-site heuristic from the extension | `src/lib/siteRisk.ts`, a mirror of the real `assessSiteRisk()` in the extension's `src/lib/siteRisk.ts`, run live against sample URLs via an in-scene button |
| **Earnings Plaza** | The mock ad-earnings ledger | `GET /api/ads/earnings` — read-only; doesn't mint its own fake currency |

## The defense layer

On top of exploring, there's now a real combat/survival loop layered over the
same world:

- **Bugs** — small, deliberately cartoonish (googly-eyed, not scary) spiky
  creatures spawn from the map's edge on a timer and beeline for a random
  zone. Reach one before it gets there — **F** — and it's gone; let it
  through and it "infects" that zone, raising **corruption**.
- **System Integrity** (100% − corruption) is shown in the HUD. Past 25% the
  screen starts to flicker; past 50% a scanline layer and more frequent
  glitches kick in; past 75% a pulsing red vignette; and — the "having
  trouble playing" part of the ask — past 55% corruption, **movement input
  itself gets progressively noisier** (`RobotController.tsx`'s `JITTER_START`),
  not just the visuals.
- **100% corruption crashes the system**: a friendly "Oops! System crashed."
  screen with a **Reboot** button, which clears bugs/corruption/wave and lets
  you keep playing — not a hard game-ending state.
- **The boss**: every `BOSS_WAVE_THRESHOLD` waves, a "Kernel Corruptor" (12 HP)
  appears at Kernel Core and roams there, slowly draining integrity on its
  own until fought down. Defeating it grants a large integrity restore.
- Wave difficulty escalates over time (`WAVE_INTERVAL_MS`): more bugs, spawning
  faster, up to a cap.

All of this is deliberately tuned to be *survivable indefinitely if you keep
up*, not a hard fail state you're rushed toward — see `constants.ts`'s
combat-tuning block for the exact numbers if you want to rebalance it.

## What was asked for but isn't here yet

You also asked for a **"play as the virus" mode** — an inverted game where
you're the attacker instead of the defender. That's a genuinely different
game (different goal, different controls, different win condition), not a
tweak to this one, so it isn't included in this pass. The defense-side combat
loop above (bugs, corruption, the boss) is the foundation such a mode could
build on, sharing the same bug/corruption systems from the other side.

Also still not here, same as before: a hub world, save/persistence beyond the
backend's own real data, VR/AR modes, a real particle system (glitches/hits
use scale/color flashes, not particle emitters), and additional gadget types.
The "connect to live data" flow still only *reads* your backup account.

## Known rough edges (first-pass tuning, not bugs)

- Platform collision is "landable top surface" only (`src/constants.ts`) —
  no side collision, so walking into a platform from below just passes
  underneath it.
- Bugs move across the ground plane only (toward the 8 ground-level zones);
  they don't climb the rescue-puzzle staircase, so the two mechanics stay
  spatially separate — fight on the ground, platform up top.
- Movement/jump/combat constants were tuned by direct position-tracing and
  scripted store calls during development, not hand-feel playtesting — they
  work, but a human playing it and adjusting the tuning constants would help,
  especially the wave/boss pacing.
- The chase camera has a fixed world-space offset rather than orbiting behind
  the player's facing. **Any world prop must stay at or in front of the
  spawn point's z** (not behind it) — the camera trails the player, so
  anything further back renders in extreme close-up right in front of the
  lens. (This bit a real layout bug during development — Earnings Plaza used
  to sit behind spawn and dominated the whole view until it was moved.)
- If your live backup account only has one or two devices, the rescue puzzle
  pads the remainder with a generic "Spare Bot" so the two-collectible slot
  layout always has exactly as many targets as it was jump-distance-tuned for.
- The zone info panels are DOM elements projected into 3D space
  (`@react-three/drei`'s `<Html>`), not in-world geometry.

## Project layout

```
game/
  src/
    App.tsx                    title screen (+ connect panel) → <Canvas>
    constants.ts                tunable movement/combat values + authored level layout
    utils.ts                    groundHeightAt(), lerpAngle()
    lib/
      backendClient.ts           fetches real data from server/, or returns demo data
      browserVitals.ts           honest browser-visible machine signals
      siteRisk.ts                 mirrors the extension's risky-site heuristic
      createStore.ts              hand-rolled zustand-alike (useSyncExternalStore) — no
                                   third-party state library, per this repo's zero-deps policy
    components/
      RobotController.tsx        character controller (movement, jump, boost, attack, anim)
      FollowCamera.tsx           chase camera
      Level.tsx                   platforms, props, lighting, sky, zone placement
      CollectibleBot.tsx          a rescuable NPC bot (device-driven identity)
      Bug.tsx / BugField.tsx      the spiky enemies + the list that renders live ones
      WaveDirector.tsx             invisible spawn/wave/boss-trigger logic (no visual)
      GlitchOverlay.tsx            escalating corruption effects + the crash/reboot screen
      Hud.tsx                     DOM overlay (rescued count, integrity, wave, boss HP, toasts)
      TouchControls.tsx            on-screen joystick + buttons (touch or mouse) — essential
                                    on a phone, harmless in a browser
      zones/
        Kiosk.tsx                  shared info-panel/pedestal building block
        DedupReef.tsx, CloudDocks.tsx, PortGate.tsx, Terminal.tsx,
        SystemVitals.tsx, KernelCore.tsx, SecurityBeacon.tsx, EarningsPlaza.tsx
    hooks/
      useKeyboard.ts              wires keydown/up into state/inputState.ts's singleton
      useAudioCues.ts             synthesized SFX
    state/
      gameStore.ts                 rescue progress, toast, gadget cooldown
      bugStore.ts                  bug roster, wave, corruption, crashed/boss state
      bugRegistry.ts               live bug *positions*, outside React state (attack hit-testing)
      activityLog.ts               the real event log the Terminal zone tails
      backendStore.ts              loaded backend data + connect/demo actions
      inputState.ts                 shared input singleton — keyboard AND touch controls both
                                    write into this one object, so RobotController doesn't
                                    care which input source is active
      playerTransform.ts           per-frame mutable singletons (position/facing/camera
                                    shake) — deliberately outside React state; see the
                                    comment in the file for why.
  android/, ios/                   Capacitor-generated native projects (committed) — see
                                    "Android / iOS (Capacitor)" above; don't hand-edit
                                    Capacitor-managed files, change the web app and `cap sync`
  capacitor.config.ts               app id / name / web dir for the native wrapper
```
