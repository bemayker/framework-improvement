"""Unit tests for the server time service (BUG-01)."""

import time
from datetime import timedelta

from app.services.server_time_service import SERVER_TIMEZONE, get_current_utc_time


def test_get_current_utc_time_is_timezone_aware_utc():
    """Happy path: the value is aware and its offset is zero."""
    value = get_current_utc_time()

    assert value.tzinfo is not None
    assert value.utcoffset() == timedelta(0)


def test_get_current_utc_time_isoformat_has_explicit_offset():
    """Edge case: serialisation carries the explicit +00:00 offset."""
    assert get_current_utc_time().isoformat().endswith("+00:00")


def test_get_current_utc_time_returns_fresh_value_per_call():
    """Edge case: two calls apart in time differ, so nothing is cached."""
    first = get_current_utc_time()
    time.sleep(0.01)
    second = get_current_utc_time()

    assert second > first


def test_server_timezone_constant_is_utc():
    """The advertised timezone label matches the clock the service uses."""
    assert SERVER_TIMEZONE == "UTC"
