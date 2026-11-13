"""Unit tests for the server-time service (BUG-01)."""

from datetime import UTC, datetime, timedelta, timezone

import pytest

from app.services import server_time_service
from app.services.server_time_service import get_server_time, to_utc_iso


def test_to_utc_iso_uses_explicit_plus_zero_offset():
    """Happy path: a UTC input is rendered with an explicit +00:00 offset."""
    result = to_utc_iso(datetime(2026, 11, 13, 9, 12, 34, 567890, tzinfo=UTC))

    assert result == "2026-11-13T09:12:34.567890+00:00"


def test_to_utc_iso_converts_non_utc_aware_input_to_utc():
    """Edge case: an aware non-UTC input is converted, not just relabelled."""
    plus_two = timezone(timedelta(hours=2))

    result = to_utc_iso(datetime(2026, 11, 13, 11, 0, 0, tzinfo=plus_two))

    assert result == "2026-11-13T09:00:00+00:00"


def test_to_utc_iso_raises_value_error_on_naive_input():
    """Error case: a naive datetime is ambiguous and is rejected."""
    with pytest.raises(ValueError):
        to_utc_iso(datetime(2026, 11, 13, 9, 0, 0))


def test_get_server_time_differs_between_calls_with_patched_clock(monkeypatch):
    """Edge case: the time is computed per call, never cached."""
    moments = iter(
        [
            datetime(2026, 11, 13, 9, 0, 0, tzinfo=UTC),
            datetime(2026, 11, 13, 9, 0, 1, tzinfo=UTC),
        ]
    )

    class FakeDatetime:
        @staticmethod
        def now(tz):
            return next(moments)

    monkeypatch.setattr(server_time_service, "datetime", FakeDatetime)

    assert get_server_time() != get_server_time()
