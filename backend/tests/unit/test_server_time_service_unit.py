"""Unit tests for the server time service (BUG-01)."""

from datetime import UTC, datetime, timedelta, timezone

import pytest

from app.services.server_time_service import get_server_time


def test_get_server_time_returns_aware_utc_datetime():
    """Happy path: the default clock yields an aware datetime with offset 0."""
    result = get_server_time()

    assert result.utcoffset() == timedelta(0)


def test_get_server_time_returns_different_values_per_call():
    """Edge case: the time is computed per call, never cached."""
    ticks = iter(
        [
            datetime(2026, 11, 24, 10, 0, 0, tzinfo=UTC),
            datetime(2026, 11, 24, 10, 0, 1, tzinfo=UTC),
        ]
    )

    first = get_server_time(clock=lambda: next(ticks))
    second = get_server_time(clock=lambda: next(ticks))

    assert second - first == timedelta(seconds=1)


def test_get_server_time_converts_non_utc_clock_to_utc():
    """Edge case: an aware non-UTC value is converted to the same instant in UTC."""
    plus_two = timezone(timedelta(hours=2))
    local = datetime(2026, 11, 24, 12, 0, 0, tzinfo=plus_two)

    result = get_server_time(clock=lambda: local)

    assert result == local
    assert result.utcoffset() == timedelta(0)


def test_get_server_time_rejects_naive_clock_value():
    """Error case: a naive datetime raises instead of being serialised."""
    with pytest.raises(ValueError):
        get_server_time(clock=lambda: datetime(2026, 11, 24, 10, 0, 0))
