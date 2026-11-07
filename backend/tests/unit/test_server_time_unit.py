"""Unit tests for the server time schema and router handler (FEAT-1)."""

from datetime import UTC, datetime, timedelta, timezone

import pytest
from pydantic import ValidationError

from app.routers import server_time
from app.schemas.server_time import UTC_OFFSET_SUFFIX, ServerTimeResponse


def test_server_time_response_serialises_now_with_plus_zero_offset():
    """The offset is pinned to +00:00, never Z."""
    body = ServerTimeResponse(
        now=datetime(2026, 11, 7, 17, 0, 48, 123456, tzinfo=UTC)
    ).model_dump(mode="json")

    assert body["now"] == "2026-11-07T17:00:48.123456+00:00"
    assert body["now"].endswith(UTC_OFFSET_SUFFIX)
    assert not body["now"].endswith("Z")


def test_server_time_response_converts_non_utc_aware_value_to_utc():
    """Edge case: a +02:00 value serialises as the same instant in UTC."""
    plus_two = timezone(timedelta(hours=2))

    body = ServerTimeResponse(
        now=datetime(2026, 11, 7, 19, 0, 0, tzinfo=plus_two)
    ).model_dump(mode="json")

    assert body["now"] == "2026-11-07T17:00:00+00:00"


def test_server_time_response_rejects_naive_datetime():
    """Error case: a datetime with no offset is refused."""
    with pytest.raises(ValidationError):
        ServerTimeResponse(now=datetime(2026, 11, 7, 17, 0, 0))


def test_server_time_response_shape_has_now_and_timezone_utc():
    """The body has exactly `now` and `timezone`, and timezone is UTC."""
    body = ServerTimeResponse(now=datetime.now(UTC)).model_dump(mode="json")

    assert set(body) == {"now", "timezone"}
    assert body["timezone"] == "UTC"


def test_get_server_time_reads_the_clock_on_every_call(monkeypatch):
    """Freshness: each handler call reads the clock, in UTC."""
    requested_zones = []
    ticks = iter(
        [
            datetime(2026, 11, 7, 17, 0, 0, tzinfo=UTC),
            datetime(2026, 11, 7, 17, 0, 1, tzinfo=UTC),
        ]
    )

    class StubDatetime:
        @staticmethod
        def now(tz):
            requested_zones.append(tz)
            return next(ticks)

    monkeypatch.setattr(server_time, "datetime", StubDatetime)

    first = server_time.get_server_time()
    second = server_time.get_server_time()

    assert first.now != second.now
    assert requested_zones == [UTC, UTC]
