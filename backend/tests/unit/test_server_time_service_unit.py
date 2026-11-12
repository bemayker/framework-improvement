"""Unit tests for the server time service (BUG-01)."""

from datetime import datetime, timedelta, timezone

import pytest

from app.services.server_time_service import current_utc_time_iso


def test_current_utc_time_iso_returns_aware_utc_string():
    """Happy path: the result parses to an aware UTC datetime, +00:00 offset."""
    fixed = datetime(2026, 11, 13, 9, 41, 7, 512334, tzinfo=timezone.utc)

    result = current_utc_time_iso(lambda: fixed)

    assert result.endswith("+00:00")
    assert datetime.fromisoformat(result) == fixed


def test_current_utc_time_iso_converts_non_utc_clock_to_utc():
    """Edge case: a +02:00 clock value is converted, not passed through."""
    plus_two = timezone(timedelta(hours=2))
    local = datetime(2026, 11, 13, 11, 0, 0, tzinfo=plus_two)

    result = current_utc_time_iso(lambda: local)

    assert result == "2026-11-13T09:00:00+00:00"


def test_current_utc_time_iso_differs_between_calls():
    """Per-call freshness: two clock values give two strings, nothing cached."""
    first = datetime(2026, 11, 13, 9, 0, 0, tzinfo=timezone.utc)
    second = first + timedelta(seconds=1)
    readings = iter([first, second])

    results = [current_utc_time_iso(lambda: next(readings)) for _ in range(2)]

    assert results[0] != results[1]


def test_current_utc_time_iso_rejects_naive_datetime():
    """Error case: a naive datetime raises ValueError."""
    naive = datetime(2026, 11, 13, 9, 0, 0)

    with pytest.raises(ValueError):
        current_utc_time_iso(lambda: naive)
