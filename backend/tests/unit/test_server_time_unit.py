"""Unit tests for the server time schema and handler (FEAT-1)."""

from datetime import UTC, datetime, timedelta, timezone

import pytest
from pydantic import ValidationError

from app.routers import server_time
from app.schemas.server_time import UTC_OFFSET_SUFFIX, ServerTimeResponse


def test_server_time_response_serialises_now_with_plus_zero_offset_suffix():
    """Happy path: `now` ends with exactly +00:00, never Z, and round-trips."""
    instant = datetime(2026, 11, 5, 1, 29, 16, 123456, tzinfo=UTC)

    body = ServerTimeResponse(now=instant).model_dump(mode="json")

    assert body["now"].endswith(UTC_OFFSET_SUFFIX)
    assert not body["now"].endswith("Z")
    assert body["now"] == "2026-11-05T01:29:16.123456+00:00"
    assert datetime.fromisoformat(body["now"]) == instant
    assert body["timezone"] == "UTC"


def test_server_time_response_keeps_fixed_shape_when_microseconds_are_zero():
    """Edge case: a zero fraction is still emitted, so the shape never varies."""
    instant = datetime(2026, 11, 5, 1, 29, 16, tzinfo=UTC)

    body = ServerTimeResponse(now=instant).model_dump(mode="json")

    assert body["now"] == "2026-11-05T01:29:16.000000+00:00"


def test_server_time_response_converts_non_utc_aware_datetime_to_utc():
    """Edge case: an aware datetime in another zone is converted to UTC."""
    instant = datetime(2026, 11, 5, 3, 0, 0, tzinfo=timezone(timedelta(hours=2)))

    body = ServerTimeResponse(now=instant).model_dump(mode="json")

    assert body["now"] == "2026-11-05T01:00:00.000000+00:00"


def test_server_time_response_rejects_naive_datetime():
    """Error case: a naive datetime can never be serialised."""
    with pytest.raises(ValidationError):
        ServerTimeResponse(now=datetime(2026, 11, 5, 1, 29, 16))


def test_server_time_response_rejects_timezone_other_than_utc():
    """Error case: `timezone` is the literal UTC."""
    with pytest.raises(ValidationError):
        ServerTimeResponse(now=datetime(2026, 11, 5, tzinfo=UTC), timezone="Europe/Brussels")


def test_get_server_time_reads_the_clock_on_every_call(monkeypatch):
    """Freshness: each handler call reads the clock again."""
    first = datetime(2026, 11, 5, 1, 29, 16, tzinfo=UTC)
    second = first + timedelta(seconds=1)
    instants = iter([first, second])
    monkeypatch.setattr(server_time, "utc_now", lambda: next(instants))

    first_response = server_time.get_server_time()
    second_response = server_time.get_server_time()

    assert first_response.now == first
    assert second_response.now == second
    assert first_response.now != second_response.now
