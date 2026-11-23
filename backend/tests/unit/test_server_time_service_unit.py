"""Unit tests for the server time service (BUG-01)."""

from datetime import datetime, timedelta, timezone
from unittest.mock import patch

from app.services import server_time_service
from app.services.server_time_service import SERVER_TIMEZONE, get_server_time


def test_get_server_time_returns_utc_aware_datetime():
    """Happy path: the value is timezone-aware with a zero UTC offset."""
    result = get_server_time()

    assert result.tzinfo is not None
    assert result.utcoffset() == timedelta(0)


def test_get_server_time_returns_fresh_value_per_call():
    """Edge case: each call reads the clock again, nothing is memoised."""
    first = datetime(2026, 11, 23, 20, 14, 21, tzinfo=timezone.utc)
    second = first + timedelta(seconds=1)

    with patch.object(server_time_service, "datetime") as fake_datetime:
        fake_datetime.now.side_effect = [first, second]
        results = [get_server_time(), get_server_time()]

    assert results == [first, second]


def test_server_timezone_constant_is_utc():
    """The advertised timezone label matches the zone the time is computed in."""
    assert SERVER_TIMEZONE == "UTC"
