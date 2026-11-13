"""Unit tests for the uptime response schema (TEST-07)."""

import json
from datetime import UTC, datetime, timedelta, timezone

import pytest
from pydantic import BaseModel, ValidationError

from app.schemas.uptime import UptimeResponse


def test_uptime_response_is_a_pydantic_model_in_app_schemas():
    assert issubclass(UptimeResponse, BaseModel)
    assert UptimeResponse.__module__ == "app.schemas.uptime"


def test_uptime_response_serialises_started_at_with_explicit_utc_offset():
    started_at = datetime(2026, 11, 13, 14, 1, 50, 123456, tzinfo=UTC)

    body = json.loads(UptimeResponse(uptime_seconds=1.5, started_at=started_at).model_dump_json())

    assert body == {"uptime_seconds": 1.5, "started_at": "2026-11-13T14:01:50.123456+00:00"}


def test_uptime_response_normalises_non_utc_offset_to_utc():
    started_at = datetime(2026, 11, 13, 15, 0, 0, tzinfo=timezone(timedelta(hours=1)))

    body = json.loads(UptimeResponse(uptime_seconds=0, started_at=started_at).model_dump_json())

    assert body["started_at"] == "2026-11-13T14:00:00+00:00"


def test_uptime_response_rejects_negative_uptime_seconds():
    with pytest.raises(ValidationError):
        UptimeResponse(uptime_seconds=-0.1, started_at=datetime.now(UTC))


def test_uptime_response_rejects_naive_started_at():
    with pytest.raises(ValidationError):
        UptimeResponse(uptime_seconds=1.0, started_at=datetime(2026, 11, 13, 14, 0, 0))
