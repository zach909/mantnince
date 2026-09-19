"""Mock earnings / ad-view ledger.

This is a stand-in for a future ad-funding integration. There is no real ad
network, no real revenue, and no cash-out: views are recorded to a local ledger
with a fixed nominal rate so the API shape exists for later development. The
``note`` fields make the mock nature explicit to any client.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from server.core.http import ApiError, Request
from server.core.security import get_current_user
from server.schemas import parse_ad_record_request

# Nominal, non-redeemable rate used purely for the mock ledger.
_MOCK_RATE_PER_VIEW = 0.15


def _require_user(request: Request):
    user = get_current_user(request.headers, request.db, request.settings)
    if user is None:
        raise ApiError(401, "Could not validate credentials", {"WWW-Authenticate": "Bearer"})
    return user


def record(request: Request):
    user = _require_user(request)
    payload = parse_ad_record_request(request.json())

    earnings = _MOCK_RATE_PER_VIEW if payload.duration_seconds > 0 else 0.0
    request.db.execute(
        """
        INSERT INTO ad_views (id, user_id, ad_id, duration_seconds, was_clicked, earnings, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            str(uuid.uuid4()),
            user["id"],
            payload.ad_id,
            payload.duration_seconds,
            int(payload.was_clicked),
            earnings,
            datetime.now(timezone.utc).isoformat(),
        ),
    )
    request.db.commit()

    total_row = request.db.execute(
        "SELECT COALESCE(SUM(earnings), 0) AS total FROM ad_views WHERE user_id = ?",
        (user["id"],),
    ).fetchone()
    return 200, {"earnings": earnings, "total_earnings": round(total_row["total"], 2)}


def earnings_summary(request: Request):
    user = _require_user(request)
    rows = request.db.execute(
        "SELECT earnings FROM ad_views WHERE user_id = ?",
        (user["id"],),
    ).fetchall()

    total = sum(r["earnings"] for r in rows)
    return 200, {
        "total": round(total, 2),
        "ads_watched": len(rows),
        "note": "Mock ledger — earnings are nominal and not redeemable for cash or storage.",
    }


ROUTES = {
    ("POST", "/api/ads/record"): record,
    ("GET", "/api/ads/earnings"): earnings_summary,
}
