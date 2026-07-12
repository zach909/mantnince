"""Mock earnings / ad-view ledger.

This is a stand-in for a future ad-funding integration. There is no real ad
network, no real revenue, and no cash-out: views are recorded to a local ledger
with a fixed nominal rate so the API shape exists for later development. The
``note`` fields make the mock nature explicit to any client.
"""

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from server.core.database import get_db
from server.core.security import get_current_user
from server.models import AdView, User
from server.schemas import AdRecordRequest, AdRecordResponse, EarningsResponse

router = APIRouter(prefix="/api/ads", tags=["earnings"])

# Nominal, non-redeemable rate used purely for the mock ledger.
_MOCK_RATE_PER_VIEW = 0.15


@router.post("/record", response_model=AdRecordResponse)
def record(
    payload: AdRecordRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AdRecordResponse:
    earnings = _MOCK_RATE_PER_VIEW if payload.duration_seconds > 0 else 0.0
    view = AdView(
        user_id=user.id,
        ad_id=payload.ad_id,
        duration_seconds=payload.duration_seconds,
        was_clicked=payload.was_clicked,
        earnings=earnings,
    )
    db.add(view)
    db.commit()

    total = db.scalars(select(AdView.earnings).where(AdView.user_id == user.id)).all()
    return AdRecordResponse(earnings=earnings, total_earnings=round(sum(total), 2))


@router.get("/earnings", response_model=EarningsResponse)
def earnings(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> EarningsResponse:
    views = db.scalars(select(AdView).where(AdView.user_id == user.id)).all()
    return EarningsResponse(
        total=round(sum(v.earnings for v in views), 2),
        ads_watched=len(views),
        note="Mock ledger — earnings are nominal and not redeemable for cash or storage.",
    )
