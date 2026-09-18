"""Universal Backup System — FastAPI application entry point.

Run locally with:
    uvicorn server.main:app --reload
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from server.api import auth, backup, cloud, devices, earnings
from server.core.database import init_db


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="Universal Backup System",
    version="0.1.0",
    summary="Consent-based cross-platform backup with content-hash deduplication.",
    lifespan=lifespan,
)

# The Electron desktop app calls this API from its main process, which isn't
# subject to CORS. The game/ prototype calls it directly from a browser tab
# (its own origin, localhost:3100 in dev), which is — so browser clients need
# an explicit allow-list. Kept to local dev origins; add a real deployed
# origin here if/when this API is ever hosted somewhere other than a
# developer's own machine.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3100",
        "http://127.0.0.1:3100",
    ],
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(auth.router)
app.include_router(devices.router)
app.include_router(cloud.router)
app.include_router(backup.router)
app.include_router(earnings.router)


@app.get("/health", tags=["meta"])
def health() -> dict:
    return {"status": "ok"}
