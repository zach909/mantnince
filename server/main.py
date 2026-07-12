"""Universal Backup System — FastAPI application entry point.

Run locally with:
    uvicorn server.main:app --reload
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI

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

app.include_router(auth.router)
app.include_router(devices.router)
app.include_router(cloud.router)
app.include_router(backup.router)
app.include_router(earnings.router)


@app.get("/health", tags=["meta"])
def health() -> dict:
    return {"status": "ok"}
