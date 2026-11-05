"""Unit tests for the server time service and schema."""

from datetime import datetime, timedelta, timezone

import pytest
from pydantic import ValidationError

from app.schemas.server_time import ServerTimeResponse
from app.services import server_time_service


def test_get_current_utc_time_returns_aware_utc_datetime():
    """Happy path: the value is timezone-aware with a zero UTC offset."""
    value = server_time_service.get_current_utc_time()

    assert value.tzinfo is not None
    assert value.utcoffset() == timedelta(0)


def test_get_current_utc_time_is_evaluated_on_every_call(monkeypatch):
    """Edge case: two calls return two distinct instants (not frozen at import)."""
    instants = iter(
        [
            datetime(2026, 11, 5, 8, 0, 0, tzinfo=timezone.utc),
            datetime(2026, 11, 5, 8, 0, 1, tzinfo=timezone.utc),
        ]
    )

    class FakeDatetime:
        @staticmethod
        def now(tz):
            assert tz is timezone.utc
            return next(instants)

    monkeypatch.setattr(server_time_service, "datetime", FakeDatetime)

    first = server_time_service.get_current_utc_time()
    second = server_time_service.get_current_utc_time()

    assert first != second


def test_server_time_response_serialises_explicit_utc_offset():
    """Happy path: `now` is serialised with +00:00, not Z."""
    body = ServerTimeResponse(
        now=datetime(2026, 11, 5, 8, 40, 22, 123456, tzinfo=timezone.utc),
        timezone="UTC",
    ).model_dump(mode="json")

    assert body == {"now": "2026-11-05T08:40:22.123456+00:00", "timezone": "UTC"}


def test_server_time_response_rejects_non_utc_timezone():
    """Error case: only the literal "UTC" is accepted."""
    with pytest.raises(ValidationError):
        ServerTimeResponse(
            now=datetime(2026, 11, 5, tzinfo=timezone.utc), timezone="CET"
        )
