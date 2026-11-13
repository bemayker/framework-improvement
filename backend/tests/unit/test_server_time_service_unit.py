"""Unit tests for the server time service (BUG-01)."""

import time
from datetime import timedelta

from app.services.server_time_service import get_current_utc_time


def test_get_current_utc_time_returns_aware_datetime() -> None:
    assert get_current_utc_time().tzinfo is not None


def test_get_current_utc_time_has_zero_utc_offset() -> None:
    assert get_current_utc_time().utcoffset() == timedelta(0)


def test_get_current_utc_time_returns_fresh_value_per_call() -> None:
    first = get_current_utc_time()
    time.sleep(0.01)
    second = get_current_utc_time()
    assert second > first
