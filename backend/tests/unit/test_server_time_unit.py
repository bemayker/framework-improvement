"""Unit tests for the server-time schema (BUG-01)."""

from datetime import UTC, datetime, timedelta, timezone

import pytest
from pydantic import ValidationError

from app.schemas import server_time
from app.schemas.server_time import ServerTimeResponse


def test_schema_normalises_aware_value_to_utc():
    plus_two = timezone(timedelta(hours=2))

    model = ServerTimeResponse(now=datetime(2026, 10, 29, 12, 0, tzinfo=plus_two))

    assert model.now == datetime(2026, 10, 29, 10, 0, tzinfo=UTC)
    assert model.now.utcoffset() == timedelta(0)


def test_schema_rejects_naive_datetime():
    with pytest.raises(ValidationError):
        ServerTimeResponse(now=datetime(2026, 10, 29, 12, 0))


def test_schema_serialises_now_with_plus_zero_offset():
    model = ServerTimeResponse(now=datetime(2026, 10, 29, 12, 0, tzinfo=UTC))

    dumped = model.model_dump(mode="json")

    assert dumped == {"now": "2026-10-29T12:00:00+00:00", "timezone": "UTC"}


def test_now_utc_reads_the_clock_on_each_call(monkeypatch):
    ticks = iter(
        [
            datetime(2026, 10, 29, 12, 0, 0, tzinfo=UTC),
            datetime(2026, 10, 29, 12, 0, 1, tzinfo=UTC),
        ]
    )
    monkeypatch.setattr(server_time, "_utc_now", lambda: next(ticks))

    first = ServerTimeResponse.now_utc()
    second = ServerTimeResponse.now_utc()

    assert first.now != second.now
