"""Unit tests for the server-time service (FEAT-1, BUG-01)."""

from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock, patch

from app.services import server_time_service
from app.services.server_time_service import get_server_time


def test_get_server_time_returns_aware_utc_datetime():
    """Happy path: the result is timezone-aware with a zero UTC offset."""
    result = get_server_time()

    assert result.tzinfo is not None
    assert result.utcoffset() == timedelta(0)


def test_get_server_time_isoformat_has_explicit_utc_offset():
    """Edge case: the serialised form carries +00:00, never a naive timestamp."""
    assert get_server_time().isoformat().endswith("+00:00")


def test_get_server_time_is_computed_on_every_call():
    """Freshness: two calls return the clock's two successive values, not a cached one."""
    first = datetime(2026, 11, 1, 6, 0, 0, tzinfo=timezone.utc)
    second = datetime(2026, 11, 1, 6, 0, 1, tzinfo=timezone.utc)
    fake_datetime = MagicMock()
    fake_datetime.now.side_effect = [first, second]

    with patch.object(server_time_service, "datetime", fake_datetime):
        assert get_server_time() == first
        assert get_server_time() == second
