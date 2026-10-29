"""Unit tests for the server time schema (backend/app/schemas/server_time.py)."""

from datetime import UTC, datetime, timedelta, timezone

import pytest
from pydantic import ValidationError

from app.schemas import server_time
from app.schemas.server_time import ServerTimeResponse


def test_serialises_now_with_explicit_plus_zero_offset():
    """Happy path: the offset is +00:00, never Z."""
    moment = datetime(2026, 10, 29, 19, 36, 2, 123456, tzinfo=UTC)

    body = ServerTimeResponse(now=moment).model_dump(mode="json")

    assert body == {"now": "2026-10-29T19:36:02.123456+00:00", "timezone": "UTC"}


def test_rejects_naive_datetime():
    """Error case: a naive datetime is refused."""
    with pytest.raises(ValidationError):
        ServerTimeResponse(now=datetime(2026, 10, 29, 19, 36, 2))


def test_normalises_non_utc_aware_datetime_to_utc():
    """Edge case: a +02:00 input is converted to the same instant in UTC."""
    local = datetime(2026, 10, 29, 21, 36, 2, tzinfo=timezone(timedelta(hours=2)))

    response = ServerTimeResponse(now=local)

    assert response.now.utcoffset() == timedelta(0)
    assert response.model_dump(mode="json")["now"] == "2026-10-29T19:36:02+00:00"


def test_now_utc_reads_the_clock_on_each_call(monkeypatch):
    """Edge case: the clock is read per call, not frozen at import."""
    moments = iter(
        [
            datetime(2026, 10, 29, 19, 0, 0, tzinfo=UTC),
            datetime(2026, 10, 29, 19, 0, 1, tzinfo=UTC),
        ]
    )
    monkeypatch.setattr(server_time, "_utc_now", lambda: next(moments))

    first = ServerTimeResponse.now_utc()
    second = ServerTimeResponse.now_utc()

    assert first.now != second.now
