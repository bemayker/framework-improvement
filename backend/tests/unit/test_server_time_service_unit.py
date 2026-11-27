"""Unit tests for the server-time service (FEAT-1, BUG-01)."""

from datetime import datetime, timezone

from app.services import server_time_service
from app.services.server_time_service import get_server_time


def test_get_server_time_returns_utc_timezone_and_aware_now():
    """Happy path: timezone is UTC and `now` parses to an aware, zero-offset value."""
    result = get_server_time()

    parsed = datetime.fromisoformat(result.now)
    assert result.timezone == "UTC"
    assert parsed.utcoffset() is not None
    assert parsed.utcoffset().total_seconds() == 0
    assert result.now.endswith("+00:00")


def test_get_server_time_returns_fresh_value_per_call(monkeypatch):
    """Criterion 3: two calls with two clock values give two different `now`."""
    clock_values = iter(
        [
            datetime(2026, 11, 27, 18, 30, 0, tzinfo=timezone.utc),
            datetime(2026, 11, 27, 18, 30, 1, tzinfo=timezone.utc),
        ]
    )
    monkeypatch.setattr(server_time_service, "_utc_now", lambda: next(clock_values))

    first = get_server_time()
    second = get_server_time()

    assert first.now == "2026-11-27T18:30:00+00:00"
    assert second.now == "2026-11-27T18:30:01+00:00"
    assert first.now != second.now


def test_get_server_time_keeps_explicit_offset_at_midnight_boundary(monkeypatch):
    """Edge case: a midnight value still carries the +00:00 offset."""
    midnight = datetime(2026, 12, 1, 0, 0, 0, tzinfo=timezone.utc)
    monkeypatch.setattr(server_time_service, "_utc_now", lambda: midnight)

    result = get_server_time()

    assert result.now == "2026-12-01T00:00:00+00:00"
