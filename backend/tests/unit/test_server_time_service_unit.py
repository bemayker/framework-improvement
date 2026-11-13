"""Unit tests for the server time service."""

from datetime import UTC, datetime, timedelta, timezone

import pytest

from app.services import server_time_service
from app.services.server_time_service import get_server_time, to_utc_iso


def test_to_utc_iso_returns_explicit_utc_offset():
    moment = datetime(2026, 11, 13, 8, 3, 14, 512345, tzinfo=UTC)

    assert to_utc_iso(moment) == "2026-11-13T08:03:14.512345+00:00"


def test_to_utc_iso_converts_non_utc_aware_datetime_to_utc():
    moment = datetime(2026, 11, 13, 10, 0, 0, tzinfo=timezone(timedelta(hours=2)))

    assert to_utc_iso(moment) == "2026-11-13T08:00:00+00:00"


def test_to_utc_iso_raises_value_error_for_naive_datetime():
    with pytest.raises(ValueError):
        to_utc_iso(datetime(2026, 11, 13, 8, 0, 0))


def test_get_server_time_returns_new_value_per_call(monkeypatch):
    moments = iter(
        [
            datetime(2026, 11, 13, 8, 0, 0, tzinfo=UTC),
            datetime(2026, 11, 13, 8, 0, 1, tzinfo=UTC),
        ]
    )

    class FakeDatetime:
        @staticmethod
        def now(tz):
            return next(moments)

    monkeypatch.setattr(server_time_service, "datetime", FakeDatetime)

    assert get_server_time() != get_server_time()
