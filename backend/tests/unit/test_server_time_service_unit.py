"""Unit tests for the server time service (BUG-01)."""

from datetime import UTC, datetime, timedelta, timezone

import pytest

from app.services import server_time_service
from app.services.server_time_service import get_server_time, to_utc_iso


def test_to_utc_iso_formats_utc_moment_with_explicit_offset():
    moment = datetime(2026, 11, 13, 15, 42, 23, 123456, tzinfo=UTC)

    assert to_utc_iso(moment) == "2026-11-13T15:42:23.123456+00:00"


def test_to_utc_iso_converts_non_utc_moment_to_utc():
    moment = datetime(2026, 11, 13, 17, 0, 0, tzinfo=timezone(timedelta(hours=2)))

    assert to_utc_iso(moment) == "2026-11-13T15:00:00+00:00"


def test_to_utc_iso_rejects_naive_datetime():
    with pytest.raises(ValueError):
        to_utc_iso(datetime(2026, 11, 13, 15, 0, 0))


def test_get_server_time_differs_between_calls_with_patched_clock(monkeypatch):
    moments = iter(
        [
            datetime(2026, 11, 13, 15, 42, 23, tzinfo=UTC),
            datetime(2026, 11, 13, 15, 42, 24, tzinfo=UTC),
        ]
    )

    class FakeDatetime:
        @staticmethod
        def now(tz):
            return next(moments)

    monkeypatch.setattr(server_time_service, "datetime", FakeDatetime)

    first = get_server_time()
    second = get_server_time()

    assert first == "2026-11-13T15:42:23+00:00"
    assert second == "2026-11-13T15:42:24+00:00"
    assert first != second
