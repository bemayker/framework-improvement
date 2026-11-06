"""Unit tests for the server time service."""

from datetime import datetime, timedelta, timezone
from unittest.mock import patch

from app.services import server_time_service
from app.services.server_time_service import get_current_utc_time


def test_get_current_utc_time_returns_aware_datetime():
    """Happy path: the value carries timezone information."""
    result = get_current_utc_time()

    assert isinstance(result, datetime)
    assert result.tzinfo is not None


def test_get_current_utc_time_has_zero_utc_offset():
    """Edge case: the offset is exactly UTC, never a local zone."""
    result = get_current_utc_time()

    assert result.utcoffset() == timedelta(0)


def test_get_current_utc_time_is_computed_per_call():
    """Error/robustness case: two calls return the clock's respective values.

    Guards against the value being cached at module level.
    """
    first = datetime(2026, 11, 6, 22, 0, 0, tzinfo=timezone.utc)
    second = datetime(2026, 11, 6, 22, 0, 1, tzinfo=timezone.utc)

    with patch.object(server_time_service, "datetime") as fake_datetime:
        fake_datetime.now.side_effect = [first, second]
        results = [get_current_utc_time(), get_current_utc_time()]

    assert results == [first, second]
