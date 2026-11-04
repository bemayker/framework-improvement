"""Unit tests for the server time service (BUG-01)."""

from datetime import datetime, timedelta, timezone

from app.schemas.server_time import ServerTimeResponse
from app.services import server_time_service
from app.services.server_time_service import get_server_now


def test_get_server_now_returns_aware_utc_datetime():
    """Happy path: the value is timezone-aware with a zero UTC offset."""
    now = get_server_now()

    assert now.tzinfo is not None
    assert now.utcoffset() == timedelta(0)


def test_get_server_now_is_computed_fresh_on_each_call(monkeypatch):
    """Edge case: a clock that advances yields a different value per call."""
    ticks = iter(
        [
            datetime(2026, 11, 4, 0, 0, 0, tzinfo=timezone.utc),
            datetime(2026, 11, 4, 0, 0, 1, tzinfo=timezone.utc),
        ]
    )

    class FakeDatetime:
        @staticmethod
        def now(tz):
            return next(ticks)

    monkeypatch.setattr(server_time_service, "datetime", FakeDatetime)

    first = get_server_now()
    second = get_server_now()

    assert second > first


def test_server_time_response_serialises_explicit_utc_offset():
    """Error-prone case: the serialised `now` never lacks an offset."""
    body = ServerTimeResponse(now=get_server_now()).model_dump(mode="json")

    assert body["timezone"] == "UTC"
    assert body["now"].endswith("Z") or body["now"].endswith("+00:00")
