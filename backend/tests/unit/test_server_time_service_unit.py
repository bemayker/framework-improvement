"""Unit tests for the server time service and schema (BUG-01)."""

from datetime import UTC, datetime, timedelta, timezone

import pytest
from pydantic import ValidationError

from app.schemas.server_time import ServerTimeResponse
from app.services import server_time_service
from app.services.server_time_service import get_current_utc_time


def test_get_current_utc_time_returns_aware_utc_datetime():
    """Happy path: the value is timezone-aware with a zero UTC offset."""
    value = get_current_utc_time()

    assert value.utcoffset() == timedelta(0)


def test_get_current_utc_time_is_computed_per_call(monkeypatch):
    """Edge case: two calls with an advancing clock differ (no module-level caching)."""
    first = datetime(2026, 11, 10, 1, 0, 0, tzinfo=UTC)
    ticks = iter([first, first + timedelta(seconds=1)])

    class FakeDatetime:
        @staticmethod
        def now(tz):
            return next(ticks)

    monkeypatch.setattr(server_time_service, "datetime", FakeDatetime)

    assert get_current_utc_time() != get_current_utc_time()


def test_server_time_response_serializes_now_with_explicit_offset():
    """Happy path: a non-UTC aware value is emitted as UTC with `+00:00`, not `Z`."""
    value = datetime(2026, 11, 10, 3, 0, 0, tzinfo=timezone(timedelta(hours=2)))

    body = ServerTimeResponse(now=value).model_dump(mode="json")

    assert body == {"now": "2026-11-10T01:00:00+00:00", "timezone": "UTC"}


def test_server_time_response_rejects_naive_datetime():
    """Error case: a naive datetime is rejected rather than assumed to be UTC."""
    with pytest.raises(ValidationError):
        ServerTimeResponse(now=datetime(2026, 11, 10, 1, 0, 0))
