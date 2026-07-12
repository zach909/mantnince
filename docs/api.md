# API Reference

Base URL (local): `http://127.0.0.1:8000`

All endpoints except `/api/auth/*` and `/health` require a bearer token:

```
Authorization: Bearer <token>
```

Interactive docs are always available at `/docs` (Swagger) and `/redoc`.

---

## Auth

### `POST /api/auth/register`
```json
{"username": "alice", "email": "alice@example.com", "password": "at-least-8-chars"}
```
→ `201` `{"user_id": "uuid", "message": "User registered"}`
Returns `409` if the username or email is taken.

### `POST /api/auth/token`
OAuth2 password grant (form-encoded, not JSON). `username` may be the username
or email.
```
username=alice&password=at-least-8-chars
```
→ `200` `{"token": "jwt", "user_id": "uuid", "token_type": "bearer"}`

---

## Devices

### `POST /api/devices/register`
```json
{"device_info": {"name": "My Laptop", "type": "linux", "platform": "Linux", "os_version": "6.8"}}
```
→ `201` `{"device_id": "uuid", "message": "Device registered"}`

### `GET /api/devices`
→ `200` `{"devices": [{"id": "uuid", "name": "My Laptop", "type": "linux", "status": "online"}]}`

---

## Cloud

### `POST /api/cloud/connect`
```json
{"provider": "google"}
```
→ `200` `{"connected": false, "provider": "google", "note": "..."}`
`connected` stays `false` until a real OAuth token exchange is implemented and
completed. Unknown providers return `400`.

### `GET /api/cloud/status`
→ `200`
```json
{"providers": {"google": {"connected": false, "last_sync": null},
               "microsoft": {"connected": false, "last_sync": null}}}
```

---

## Backup

### `POST /api/backup/upload`
`multipart/form-data`:
- `file` (required) — the file to back up
- `device_id` (optional) — owning device

→ `200`
```json
{"item_id": "uuid", "blob_hash": "sha256", "was_deduplicated": false, "storage_saved_bytes": 0}
```
When the uploaded bytes already exist, `was_deduplicated` is `true` and
`storage_saved_bytes` equals the file size.

### `GET /api/backup/status`
→ `200`
```json
{"total_backups": 2, "total_size_gb": 0.0, "storage_saved_gb": 0.0, "last_backup": "ISO8601"}
```

---

## Earnings (mock)

> No real ad network or payouts. Values are nominal and non-redeemable.

### `POST /api/ads/record`
```json
{"ad_id": "ad-1", "duration_seconds": 30, "was_clicked": false}
```
→ `200` `{"earnings": 0.15, "total_earnings": 0.15}`

### `GET /api/ads/earnings`
→ `200` `{"total": 0.15, "ads_watched": 1, "note": "Mock ledger — ..."}`
