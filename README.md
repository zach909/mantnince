# Universal Backup System

A fully automatic, cross-platform backup system with content-addressed deduplication.

## 🏗️ Core Features

1. **Content-Hash Deduplication** - Files are stored once per unique SHA-256 hash, saving 90%+ storage on duplicates
2. **Cross-Platform Support** - Works with iPhone, Android, Windows, Mac, Linux, Chrome OS
3. **Cloud Integration** - Connect Google Drive, Microsoft OneDrive (OAuth-based, consent-required)
4. **Browser Extension** - Automatic capture of downloads with deduplication tracking
5. **Mock Ad Funding System** - Ledger for tracking potential ad revenue (non-redeemable mock)

## 📁 Project Structure

```
universal-backup-system/
├── server/                      # Stdlib-only backend (zero pip dependencies)
│   ├── main.py                 # HTTP server entry (http.server.ThreadingHTTPServer)
│   ├── api/
│   │   ├── auth.py            # Authentication endpoints
│   │   ├── cloud.py           # Cloud sync endpoints
│   │   ├── backup.py          # Backup endpoints
│   │   ├── devices.py         # Device management
│   │   └── earnings.py        # Ad earnings (mock)
│   ├── core/
│   │   ├── http.py            # Router, CORS, JSON/form/multipart parsing
│   │   ├── database.py        # sqlite3 access (no ORM)
│   │   ├── security.py        # PBKDF2 password hashing + hand-rolled JWT
│   │   └── config.py          # Configuration
│   └── services/
│       ├── cloud_connectors/  # Cloud-specific connectors
│       │   ├── google.py
│       │   └── microsoft.py
│       └── dedup.py           # Core deduplication logic
│
├── src/                         # Browser Extension (TypeScript, no npm runtime deps)
│   ├── App.ts                  # Popup UI (vanilla DOM, no framework)
│   ├── background.ts           # Download capture & stats (chrome.storage.local only)
│   └── content.ts              # Content script
│
├── tests/                       # unittest-based test suite (stdlib only)
└── docs/                        # API documentation
```

## 🚀 Quick Start

### Backend Server

The backend has zero third-party dependencies — everything is Python standard
library, so there is nothing to `pip install`.

```bash
# Run the server (stdlib-only, Python 3.11+)
python -m server.main
```

The server listens on http://0.0.0.0:8000. Run the test suite with:

```bash
python -m unittest discover -s tests -v
```

### Frontend Extension

```bash
git clone https://github.com/zach909/mantnince.git
cd mantnince
# Install dependencies
npm install

# Development mode
npm run dev

# Build for production
npm run build
```

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/token` | Get JWT token (OAuth2 password grant) |

### Devices
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/devices/register` | Register a device |
| GET | `/api/devices` | List user's devices |

### Cloud
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/cloud/connect` | Connect cloud provider (records intent) |
| GET | `/api/cloud/status` | Get cloud connection status |

### Backup
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/backup/upload` | Upload file with deduplication |
| GET | `/api/backup/status` | Get backup statistics |

### Earnings (Mock)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ads/record` | Record ad view |
| GET | `/api/ads/earnings` | Get earnings summary |

## 🔧 Example Usage

### Register and Login
```bash
# Register
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","email":"alice@example.com","password":"securepass123"}'

# Get token
curl -X POST http://localhost:8000/api/auth/token \
  -d "username=alice&password=securepass123"
```

### Upload File with Deduplication
```bash
TOKEN="your-jwt-token"

# First upload (stores file)
curl -X POST http://localhost:8000/api/backup/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@myfile.pdf"

# Second upload (deduplicated - no storage used)
curl -X POST http://localhost:8000/api/backup/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@myfile.pdf"
```

### Check Backup Status
```bash
curl http://localhost:8000/api/backup/status \
  -H "Authorization: Bearer $TOKEN"
```

## 🔐 Security Notes

- Passwords are hashed with PBKDF2-HMAC-SHA256 (260k iterations, random salt, stdlib `hashlib` only)
- All non-auth endpoints require valid JWT authentication
- Data is scoped per-user (users can only access their own data)
- OAuth tokens for cloud providers are NOT stored until real integration is implemented
- `secret_key` must be overridden in production via environment variable

## 🧪 Running Tests

```bash
cd /workspace
python -m pytest tests/ -v
```

All 13 tests should pass, covering:
- Authentication (register, login, duplicate rejection)
- Backup deduplication (identical vs different content)
- Cloud connection intent recording
- Earnings ledger (mock)
- Device registration and scoping

## 📝 Architecture

### Deduplication Model

The system uses **content-addressed storage**:

1. **Blob** - One row per unique file body, keyed by SHA-256 hash
   - `ref_count` tracks how many logical files reference this blob
   - Physical storage at `storage/<sha256>`

2. **BackupItem** - One row per logical backed-up file
   - Points to a `Blob` via `blob_hash` foreign key
   - `was_deduplicated` indicates if the blob already existed

When uploading:
1. Hash the bytes (SHA-256)
2. If blob exists: increment `ref_count`, store nothing new
3. If new blob: write bytes, create blob record
4. Always create backup item record

### Why Not URL-Based Deduplication?

The original spec proposed capturing download URLs and re-fetching server-side. This was replaced with content-hash dedup because:

- **URL Expiry**: Most download URLs are signed/session-bound (401/403 on re-fetch)
- **Data Loss Risk**: Keeping only URLs means losing data when URLs expire
- **Privacy Concerns**: Shipping full download history to servers is surveillance

Content-hash dedup provides the same storage savings without these problems.

## ⚠️ Deliberate Non-Goals

- ❌ No silent cross-device exfiltration of messages, contacts, or photos
- ❌ No background modification or "optimization" of user's OS
- ❌ No real ad network or payouts (earnings ledger is explicit mock)
- ❌ No cloud data access without genuine user-approved OAuth consent

## 📄 License

MIT
