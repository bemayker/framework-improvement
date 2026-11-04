"""Unit tests for the uptime service (TEST-07)."""

from datetime import timedelta

from app.services import uptime_service
from app.services.uptime_service import STARTED_AT, STARTED_MONOTONIC, elapsed_seconds, get_uptime


def test_elapsed_seconds_returns_difference_between_readings():
    """Happy path: the difference of the two readings."""
    assert elapsed_seconds(100.0, 142.5) == 42.5


def test_elapsed_seconds_returns_zero_for_equal_readings():
    """Edge case: no time elapsed."""
    assert elapsed_seconds(100.0, 100.0) == 0.0


def test_elapsed_seconds_clamps_earlier_now_to_zero():
    """Error case: a reading before the start never yields a negative value."""
    assert elapsed_seconds(100.0, 90.0) == 0.0


def test_get_uptime_increases_with_the_monotonic_clock(monkeypatch):
    """Uptime follows the monotonic clock and grows between calls."""
    readings = iter([STARTED_MONOTONIC + 5.0, STARTED_MONOTONIC + 6.0])
    monkeypatch.setattr(uptime_service.time, "monotonic", lambda: next(readings))

    first = get_uptime()
    second = get_uptime()

    assert first.uptime_seconds == 5.0
    assert second.uptime_seconds == 6.0


def test_get_uptime_returns_the_same_utc_started_at_every_call():
    """started_at is captured once and is UTC."""
    first = get_uptime()
    second = get_uptime()

    assert first.started_at is STARTED_AT
    assert second.started_at == STARTED_AT
    assert STARTED_AT.utcoffset() == timedelta(0)
