# Universal Backup System

A consent-based, cross-platform backup backend with **content-hash
deduplication**. This repository contains an honest v1 of the server: the parts
of the original concept that can actually be built safely and correctly.

## What this is

- A **FastAPI** backend with JWT auth, device registry, backup upload, cloud
  connection intent, and a mock earnings ledger.
- A **content-addressed deduplication engine**: every unique file body is stored
  once and reference-counted. Uploading a byte-for-byte duplicate stores nothing
  new and reports the storage saved. The data is always physically present.

## What this deliberately is **not**

The original specification described a few things that either can't work as
written or would put users at risk. Those were intentionally left out or
replaced:

- **No URL re-fetching "dedup".** Re-downloading files server-side from the URLs
  a user's browser visited fails on signed/authenticated links and would store
  users' auth tokens. Worse, keeping "only a URL reference" is not a backup — it
  vanishes when the link expires. We deduplicate by content hash instead, so the
  data is never lost and never stored twice.
- **No silent, total exfiltration** of messages / contacts / photos across
  devices. There is no OS-level API that hands a third party this data silently,
  and building something that tries is how software gets classified as spyware.
  Cloud access here is limited to real, user-approved OAuth scopes.
- **No background OS modification.** The system does not silently auto-update,
  scan, or "optimize" a user's operating system.
- **The ad/earnings system is a mock ledger.** No ad network, no real revenue,
  no cash-out. It exists only to hold the API shape for future work, and every
  response says so.

See [`docs/architecture.md`](docs/architecture.md) for the reasoning in detail.

## Quick start

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r server/requirements.txt
uvicorn server.main:app --reload
```

Then open http://127.0.0.1:8000/docs for the interactive API.

## Running tests

```bash
pip install -r server/requirements.txt
pytest
```

## API overview

| Endpoint | Purpose |
| --- | --- |
| `POST /api/auth/register` | Create an account |
| `POST /api/auth/token` | Obtain a JWT (OAuth2 password grant) |
| `POST /api/devices/register` | Register a device |
| `GET  /api/devices` | List the caller's devices |
| `POST /api/cloud/connect` | Record intent to connect a cloud provider |
| `GET  /api/cloud/status` | Cloud connection status |
| `POST /api/backup/upload` | Upload a file (deduplicated) |
| `GET  /api/backup/status` | Backup totals and storage saved |
| `POST /api/ads/record` | Record a mock ad view |
| `GET  /api/ads/earnings` | Mock earnings summary |

Full request/response detail lives in [`docs/api.md`](docs/api.md).
