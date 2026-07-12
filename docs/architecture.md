# Architecture

## Components

```
server/
  main.py                     FastAPI app + router wiring
  core/
    config.py                 Env-driven settings
    database.py               SQLAlchemy engine / session / Base
    security.py               bcrypt hashing + JWT
  models.py                   ORM models
  schemas.py                  Pydantic request/response models
  api/
    auth.py                   register + token
    devices.py                device registry
    cloud.py                  cloud connection intent + status
    backup.py                 upload (dedup) + status
    earnings.py               mock ad ledger
  services/
    dedup.py                  content-addressed storage engine
    cloud_connectors/         per-provider OAuth metadata (Google, Microsoft)
tests/                        pytest suite
```

## Deduplication model

Deduplication is **content-addressed** and reference-counted:

- `Blob` — one row per unique file body, keyed by SHA-256, with a `ref_count`
  and an on-disk `storage_path`. The bytes live under `storage/<sha256>`.
- `BackupItem` — one row per logical backed-up file (name, device, size)
  pointing at a `Blob`. `was_deduplicated` records whether the body already
  existed at upload time.

Uploading a file:

1. Hash the bytes (SHA-256).
2. If a matching `Blob` exists, increment its `ref_count` and store nothing on
   disk. `was_deduplicated = True`, and the item's size counts as storage saved.
3. Otherwise write the bytes once and create the `Blob` with `ref_count = 1`.

`storage_saved` for a user is the sum of `BackupItem.size` where
`was_deduplicated` is true — real bytes that were never stored a second time,
while the data itself is always physically retained.

### Why not the original "URL reference" approach?

The original spec proposed capturing every download URL, re-fetching it
server-side, and — when the re-fetch matched — keeping only the URL instead of
the file. This was dropped because:

- Most real download URLs are signed / session-bound. A server re-fetch usually
  gets `401/403`, and any token embedded in the URL ends up stored on the
  server.
- "Keep only the URL" is not a backup. When the URL expires the data is gone,
  which defeats the entire purpose of a backup system.
- Capturing a user's full download history and shipping it to a server is a
  surveillance pattern.

Content-hash dedup captures the same storage win without any of these problems.

## Cloud connectors

Each connector (`services/cloud_connectors/`) declares only the real, read-only
OAuth scopes its provider offers (Google Drive, Microsoft OneDrive). The live
token exchange is a marked `NotImplementedError` rather than a fake success, so
no cloud data is ever accessed without a genuine, user-approved consent flow
being implemented and completed. Apple is omitted: iCloud has no comparable
third-party OAuth data-access flow.

## Security notes

- Passwords are hashed with bcrypt over a SHA-256 pre-hash (so long passwords
  stay fully significant past bcrypt's 72-byte limit).
- All non-auth endpoints require a valid JWT and are scoped to the caller's own
  data.
- `secret_key` and OAuth client secrets come from the environment; the built-in
  defaults are for local development only and must be overridden in production.

## Deliberate non-goals

- No silent cross-device exfiltration of messages, contacts, or photos.
- No background modification, scanning, or "optimization" of the user's OS.
- No real ad network or payouts — the earnings ledger is an explicit mock.
