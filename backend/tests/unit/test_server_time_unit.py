"""Unit tests for the server time schema and router function (FEAT-1)."""

from datetime import datetime, timedelta, timezone

import pytest
from fastapi import Response
from pydantic import ValidationError

from app.routers import server_time
from app.schemas.server_time import ServerTimeResponse


def test_schema_serialises_utc_now_to_exactly_two_keys():
    response = ServerTimeResponse(
        now=datetime(2026, 10, 13, 8, 0, 0, tzinfo=timezone.utc), timezone="UTC"
    )

    assert response.model_dump(mode="json") == {
        "now": "2026-10-13T08:00:00Z",
        "timezone": "UTC",
    }


def test_schema_now_ends_with_z_and_not_plus_zero_offset():
    response = ServerTimeResponse(
        now=datetime(2026, 10, 13, 8, 0, 0, tzinfo=timezone.utc), timezone="UTC"
    )

    serialised = response.model_dump(mode="json")["now"]

    assert serialised.endswith("Z")
    assert "+00:00" not in serialised


def test_schema_normalises_a_non_utc_offset_to_the_utc_instant():
    plus_two = timezone(timedelta(hours=2))

    response = ServerTimeResponse(
        now=datetime(2026, 10, 13, 10, 0, 0, tzinfo=plus_two), timezone="UTC"
    )

    assert response.model_dump(mode="json")["now"] == "2026-10-13T08:00:00Z"


def test_schema_rejects_a_naive_now():
    with pytest.raises(ValidationError):
        ServerTimeResponse(now=datetime(2026, 10, 13, 8, 0, 0), timezone="UTC")


def test_schema_rejects_a_timezone_other_than_utc():
    with pytest.raises(ValidationError):
        ServerTimeResponse(
            now=datetime(2026, 10, 13, 8, 0, 0, tzinfo=timezone.utc),
            timezone="CET",
        )


def test_get_server_time_reads_the_clock_on_every_call(monkeypatch):
    instants = iter(
        [
            datetime(2026, 10, 13, 8, 0, 0, tzinfo=timezone.utc),
            datetime(2026, 10, 13, 8, 0, 1, tzinfo=timezone.utc),
        ]
    )

    class FakeDatetime:
        @staticmethod
        def now(tz):
            assert tz is timezone.utc
            return next(instants)

    monkeypatch.setattr(server_time, "datetime", FakeDatetime)

    first = server_time.get_server_time(Response())
    second = server_time.get_server_time(Response())

    assert first.now == datetime(2026, 10, 13, 8, 0, 0, tzinfo=timezone.utc)
    assert second.now == datetime(2026, 10, 13, 8, 0, 1, tzinfo=timezone.utc)
