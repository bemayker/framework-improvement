"""Unit tests for ServerTimeResponse (FEAT-1)."""

from datetime import datetime, timedelta, timezone

import pytest
from pydantic import ValidationError

from app.schemas.server_time import ServerTimeResponse


def test_server_time_response_serialises_exact_shape_with_plus_zero_offset():
    """Happy path: full string ends in +00:00, two keys, timezone is UTC."""
    instant = datetime(2026, 10, 17, 9, 15, 2, 123456, tzinfo=timezone.utc)

    body = ServerTimeResponse(now=instant).model_dump(mode="json")

    assert body == {"now": "2026-10-17T09:15:02.123456+00:00", "timezone": "UTC"}


def test_server_time_response_normalises_other_offset_to_utc():
    """Edge case: a +02:00 input is the same instant, spelled in UTC."""
    local = datetime(2026, 10, 17, 11, 15, 2, tzinfo=timezone(timedelta(hours=2)))

    body = ServerTimeResponse(now=local).model_dump(mode="json")

    assert body["now"] == "2026-10-17T09:15:02+00:00"


def test_server_time_response_rejects_naive_datetime():
    """Error case: a naive datetime is never accepted."""
    with pytest.raises(ValidationError):
        ServerTimeResponse(now=datetime(2026, 10, 17, 9, 15, 2))


def test_server_time_response_rejects_timezone_other_than_utc():
    """Error case: the timezone field is pinned to UTC."""
    instant = datetime(2026, 10, 17, 9, 15, 2, tzinfo=timezone.utc)

    with pytest.raises(ValidationError):
        ServerTimeResponse(now=instant, timezone="CET")
