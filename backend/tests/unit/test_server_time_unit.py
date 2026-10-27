"""Unit tests for the ServerTimeResponse schema (BUG-01)."""

from datetime import UTC, datetime, timedelta, timezone
from unittest.mock import patch

import pytest
from pydantic import ValidationError

from app.schemas.server_time import ServerTimeResponse


def test_server_time_response_serialises_utc_value_with_explicit_offset():
    """Happy path: an aware UTC value serialises with +00:00."""
    response = ServerTimeResponse(now=datetime(2026, 10, 27, 21, 40, 12, 345678, tzinfo=UTC))

    assert response.model_dump(mode="json") == {
        "now": "2026-10-27T21:40:12.345678+00:00",
        "timezone": "UTC",
    }
    assert response.now.utcoffset() == timedelta(0)


def test_server_time_response_normalises_non_utc_value_to_utc():
    """Edge case: a +02:00 value is converted to the same instant in UTC."""
    plus_two = timezone(timedelta(hours=2))
    response = ServerTimeResponse(now=datetime(2026, 10, 27, 23, 0, tzinfo=plus_two))

    assert response.now == datetime(2026, 10, 27, 21, 0, tzinfo=UTC)
    assert response.now.utcoffset() == timedelta(0)


def test_server_time_response_rejects_naive_datetime():
    """Error case: a naive datetime is refused rather than assumed to be UTC."""
    with pytest.raises(ValidationError):
        ServerTimeResponse(now=datetime(2026, 10, 27, 21, 0))


def test_now_utc_reads_the_clock_on_every_call():
    """Freshness: two calls with two clock readings give two different values."""
    first = datetime(2026, 10, 27, 21, 0, 0, tzinfo=UTC)
    second = first + timedelta(seconds=1)

    with patch("app.schemas.server_time.datetime") as fake_datetime:
        fake_datetime.now.side_effect = [first, second]
        responses = [ServerTimeResponse.now_utc(), ServerTimeResponse.now_utc()]

    assert responses[0].now == first
    assert responses[1].now == second
    assert responses[0].now != responses[1].now
