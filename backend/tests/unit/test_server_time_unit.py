"""Unit tests for the server time schema and handler (FEAT-1)."""

from datetime import datetime, timedelta, timezone

import pytest
from pydantic import ValidationError

from app.routers import server_time
from app.schemas.server_time import ServerTimeResponse


def test_serialised_utc_value_has_exact_shape():
    """Happy path: UTC value serialises to the exact ISO string and timezone."""
    moment = datetime(2026, 11, 4, 12, 34, 56, 789012, tzinfo=timezone.utc)

    body = ServerTimeResponse(now=moment).model_dump(mode="json")

    assert body == {"now": "2026-11-04T12:34:56.789012+00:00", "timezone": "UTC"}


def test_serialised_now_ends_with_offset_and_never_z():
    """The suffix is pinned to +00:00, not Z."""
    body = ServerTimeResponse(now=datetime.now(timezone.utc)).model_dump(mode="json")

    assert body["now"].endswith("+00:00")
    assert not body["now"].endswith("Z")


def test_non_utc_aware_value_is_converted_to_utc():
    """Edge case: a +02:00 value becomes the same instant in UTC."""
    moment = datetime(2026, 11, 4, 14, 0, 0, tzinfo=timezone(timedelta(hours=2)))

    body = ServerTimeResponse(now=moment).model_dump(mode="json")

    assert body["now"] == "2026-11-04T12:00:00+00:00"


def test_naive_datetime_is_rejected():
    """Error case: a naive datetime raises ValidationError."""
    with pytest.raises(ValidationError):
        ServerTimeResponse(now=datetime(2026, 11, 4, 12, 0, 0))


def test_handler_reads_clock_on_every_call(monkeypatch):
    """The clock is read per call, not cached."""
    first = datetime(2026, 1, 1, 0, 0, 0, tzinfo=timezone.utc)
    second = datetime(2026, 1, 1, 0, 0, 1, tzinfo=timezone.utc)
    instants = iter([first, second])
    monkeypatch.setattr(server_time, "current_utc_time", lambda: next(instants))

    assert server_time.get_server_time().now == first
    assert server_time.get_server_time().now == second
