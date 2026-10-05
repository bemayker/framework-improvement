"""Unit tests for the uptime schema and handler (TEST-07)."""

import json
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

import pytest
from pydantic import ValidationError

from app.routers.uptime import get_uptime
from app.schemas.uptime import UptimeResponse
from app.services import uptime_service
from app.services.uptime_service import ProcessStart


def test_uptime_response_dump_has_exactly_two_keys_and_utc_offset():
    started = datetime(2026, 10, 5, 9, 14, 2, 118734, tzinfo=timezone.utc)

    body = json.loads(UptimeResponse(uptime_seconds=1.5, started_at=started).model_dump_json())

    assert set(body) == {"uptime_seconds", "started_at"}
    assert body["uptime_seconds"] == 1.5
    assert body["started_at"] == "2026-10-05T09:14:02.118734+00:00"


def test_uptime_response_converts_non_utc_input_to_utc():
    plus_two = timezone(timedelta(hours=2))
    started = datetime(2026, 10, 5, 11, 0, 0, tzinfo=plus_two)

    body = json.loads(UptimeResponse(uptime_seconds=0, started_at=started).model_dump_json())

    assert body["started_at"] == "2026-10-05T09:00:00+00:00"


def test_uptime_response_rejects_naive_started_at():
    with pytest.raises(ValidationError):
        UptimeResponse(uptime_seconds=1.0, started_at=datetime(2026, 10, 5, 9, 0, 0))


def test_uptime_response_rejects_negative_uptime():
    with pytest.raises(ValidationError):
        UptimeResponse(
            uptime_seconds=-0.1,
            started_at=datetime(2026, 10, 5, tzinfo=timezone.utc),
        )


def test_get_uptime_returns_the_captured_started_at(monkeypatch):
    started = datetime(2026, 10, 5, 9, 14, 2, tzinfo=timezone.utc)
    monkeypatch.setattr(uptime_service.time, "monotonic", lambda: 12.0)
    request = SimpleNamespace(
        app=SimpleNamespace(
            state=SimpleNamespace(process_start=ProcessStart(started, 10.0))
        )
    )

    result = get_uptime(request)

    assert isinstance(result, UptimeResponse)
    assert result.started_at == started
    assert result.uptime_seconds == 2.0
