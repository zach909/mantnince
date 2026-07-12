"""Cloud connection endpoints.

Connecting a cloud provider records the user's *intent* to connect and returns
the connector's declared OAuth scopes. The live OAuth token exchange is left as
a marked TODO in each connector rather than faked, so nothing here accesses a
user's cloud data without a real, user-approved consent flow being wired up.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from server.core.database import get_db
from server.core.security import get_current_user
from server.models import CloudConnection, User
from server.schemas import CloudConnectRequest, CloudConnectResponse, CloudStatusResponse
from server.services.cloud_connectors import get_connector

router = APIRouter(prefix="/api/cloud", tags=["cloud"])


@router.post("/connect", response_model=CloudConnectResponse)
def connect(
    payload: CloudConnectRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CloudConnectResponse:
    connector = get_connector(payload.provider)
    if connector is None:
        raise HTTPException(status_code=400, detail=f"Unsupported provider: {payload.provider}")

    conn = db.scalar(
        select(CloudConnection).where(
            CloudConnection.user_id == user.id,
            CloudConnection.provider == payload.provider,
        )
    )
    if conn is None:
        conn = CloudConnection(user_id=user.id, provider=payload.provider)
        db.add(conn)

    # We record intent, not a live token. connected stays False until a real
    # OAuth exchange is implemented and completed.
    db.commit()

    return CloudConnectResponse(
        connected=False,
        provider=payload.provider,
        note=(
            f"To connect {connector.describe()['display_name']}, complete the OAuth "
            f"consent flow (scopes: {', '.join(connector.scopes)}). Token exchange "
            "is not yet implemented, so no cloud data is accessed."
        ),
    )


@router.get("/status", response_model=CloudStatusResponse)
def cloud_status(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CloudStatusResponse:
    conns = db.scalars(select(CloudConnection).where(CloudConnection.user_id == user.id)).all()
    by_provider = {c.provider: c for c in conns}

    providers: dict[str, dict] = {}
    for provider in ("google", "microsoft"):
        c = by_provider.get(provider)
        providers[provider] = {
            "connected": bool(c and c.connected),
            "last_sync": c.last_sync.isoformat() if c and c.last_sync else None,
        }
    return CloudStatusResponse(providers=providers)
