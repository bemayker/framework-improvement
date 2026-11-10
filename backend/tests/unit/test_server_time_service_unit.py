"""Unit tests for the server-time service and schema (BUG-01)."""

from datetime import UTC, datetime, timedelta, timezone

import pytest
from pydantic import ValidationError

from app.schemas.server_time import ServerTimeResponse
from app.services import server_time_service
from app.services.server_time_service import get_current_utc_time


def test_get_current_utc_time_returns_aware_utc_datetime():
    result = get_current_utc_time()

    assert result.tzinfo is not None
    assert result.utcoffset() == timedelta(0)


def test_get_current_utc_time_is_computed_on_each_call(monkeypatch):
    ticks = iter([datetime(2026, 1, 1, tzinfo=UTC), datetime(2026, 1, 2, tzinfo=UTC)])

    class FakeDatetime:
        @staticmethod
        def now(tz):
            return next(ticks)

    monkeypatch.setattr(server_time_service, "datetime", FakeDatetime)

    assert get_current_utc_time() != get_current_utc_time()


def test_server_time_response_serializes_now_with_plus_zero_offset():
    body = ServerTimeResponse(now=datetime(2026, 1, 1, 12, 0, 0, tzinfo=UTC))

    dumped = body.model_dump(mode="json")

    assert dumped["now"] == "2026-01-01T12:00:00+00:00"
    assert dumped["timezone"] == "UTC"


def test_server_time_response_converts_non_utc_input_to_utc():
    plus_two = timezone(timedelta(hours=2))
    body = ServerTimeResponse(now=datetime(2026, 1, 1, 14, 0, 0, tzinfo=plus_two))

    assert body.model_dump(mode="json")["now"] == "2026-01-01T12:00:00+00:00"


def test_server_time_response_rejects_naive_datetime():
    with pytest.raises(ValidationError):
        ServerTimeResponse(now=datetime(2026, 1, 1, 12, 0, 0))
