"""Unit tests for the server time schema and router handler (FEAT-1)."""

from datetime import UTC, datetime, timedelta, timezone

import pytest
from pydantic import ValidationError

from app.routers import server_time
from app.schemas.server_time import ServerTimeResponse


def test_serialize_utc_value_ends_with_plus_00_00_not_z():
    """Criterion 2: an aware UTC value serializes with exactly `+00:00`."""
    response = ServerTimeResponse(now=datetime(2026, 1, 1, 12, 0, 0, tzinfo=UTC))

    now = response.model_dump(mode="json")["now"]

    assert now == "2026-01-01T12:00:00+00:00"
    assert now.endswith("+00:00")
    assert not now.endswith("Z")


def test_serialize_non_utc_aware_value_converts_to_utc():
    """Edge case: a +02:00 value is converted to UTC before serializing."""
    plus_two = timezone(timedelta(hours=2))
    response = ServerTimeResponse(now=datetime(2026, 1, 1, 14, 0, 0, tzinfo=plus_two))

    assert response.model_dump(mode="json")["now"] == "2026-01-01T12:00:00+00:00"


def test_naive_datetime_is_rejected():
    """Error case: a naive datetime never validates."""
    with pytest.raises(ValidationError):
        ServerTimeResponse(now=datetime(2026, 1, 1, 12, 0, 0))


def test_timezone_defaults_to_utc():
    """Happy path: `timezone` is UTC without being supplied."""
    response = ServerTimeResponse(now=datetime(2026, 1, 1, tzinfo=UTC))

    assert response.timezone == "UTC"


def test_timezone_rejects_other_values():
    """Error case: `timezone` only accepts the literal UTC."""
    with pytest.raises(ValidationError):
        ServerTimeResponse(now=datetime(2026, 1, 1, tzinfo=UTC), timezone="CET")


def test_get_server_time_reads_clock_on_every_call(monkeypatch):
    """Criterion 2: two calls with a one-second-apart clock return different values."""
    instants = iter(
        [
            datetime(2026, 1, 1, 0, 0, 0, tzinfo=UTC),
            datetime(2026, 1, 1, 0, 0, 1, tzinfo=UTC),
        ]
    )
    monkeypatch.setattr(server_time, "current_utc_time", lambda: next(instants))

    first = server_time.get_server_time()
    second = server_time.get_server_time()

    assert first.now != second.now
    assert second.now - first.now == timedelta(seconds=1)


def test_current_utc_time_returns_aware_utc_datetime():
    """Happy path: the real clock seam returns an aware UTC instant."""
    value = server_time.current_utc_time()

    assert value.utcoffset() == timedelta(0)
