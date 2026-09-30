# Backup Cloud — Android / iOS client

A real mobile client for Universal Backup Cloud: create an account or log in,
see your backup status, register the phone itself as a device, view cloud
connection status, and see the mock earnings ledger. It talks to the exact
same stdlib HTTP server (`server/`) the desktop Electron app and `game/` use —
no separate backend, no separate API.

This is an isolated sub-project (own `package.json`, own dev server on port
3200), wrapped as a native app with [Capacitor](https://capacitorjs.com/),
the same approach `game/` uses for its mobile builds.

## Run it in a browser first

```bash
cd mobile
npm install
npm run dev      # http://localhost:3200
npm run build    # typecheck + production build
```

You'll also need the server running somewhere reachable:

```bash
# in the repo root, in a separate terminal
python -m server.main   # binds 0.0.0.0:8000
```

On the login screen, set the API endpoint (default `http://10.0.2.2:8000`,
the Android emulator's alias for the host machine — override this to
`http://127.0.0.1:8000` when testing in a plain desktop browser, or your
computer's LAN IP for a real phone on the same network), then "Create
account" with any username/email/password (8+ characters), which registers
via `POST /api/auth/register` and logs in via `POST /api/auth/token` — same
endpoints the API docs describe, just driven from the app instead of curl.

## Android / iOS (Capacitor)

```bash
npm run build && npx cap sync

# Android — buildable and verifiable on Linux, no Mac required
cd android
echo "sdk.dir=$ANDROID_HOME" > local.properties   # your own Android SDK path; gitignored
./gradlew assembleDebug          # → app/build/outputs/apk/debug/app-debug.apk
adb install app/build/outputs/apk/debug/app-debug.apk

# iOS — requires Xcode on macOS; cannot be built or run from this repo's
# Linux dev environment. Open ios/App/App.xcworkspace in Xcode on a Mac and
# Run. Generated and type-checked here, but never actually compiled — the
# first Xcode build is the real first test of the iOS side.
```

`android/` and `ios/` are committed, generated native projects (same
convention as `game/`) — don't hand-edit Capacitor-managed files.

"Register this device" uses `@capacitor/device`, which returns **real**
device info both in the wrapped native app and in a plain browser (Capacitor
ships a web fallback backed by `navigator.userAgent`) — so it's not a mock
even when you're just testing in Chrome.

## What this deliberately doesn't do

- **No real cloud OAuth.** "Connect" calls the real `/api/cloud/connect`
  endpoint, which — by the server's own design (see the main `README.md`'s
  architecture notes) — always returns `connected: false` and a note
  explaining why: no real Google/Microsoft OAuth token exchange is
  implemented, so nothing about your actual cloud accounts is ever touched.
- **No backup upload UI.** You can see backup status and register devices,
  but actually uploading/backing up files from the phone (camera roll,
  documents, etc.) isn't built — that's a real, separate feature (native
  file/media picker integration, background upload) beyond a first mobile
  client.
- **No push notifications, no background sync.** The app only talks to the
  server while open, on demand (pull-to-refresh via the Refresh button).

## Project layout

```
mobile/
  src/
    App.tsx                title screen: log in / create account
    components/
      Dashboard.tsx          the main screen once logged in
    lib/
      backendClient.ts        auth + data fetching against server/ (own copy of the
                               same pattern game/src/lib/backendClient.ts uses —
                               independent sub-projects, no shared package)
      deviceInfo.ts            wraps @capacitor/device for "Register this device"
  android/, ios/            Capacitor-generated native projects (committed)
  capacitor.config.ts        app id / name / web dir for the native wrapper
```
