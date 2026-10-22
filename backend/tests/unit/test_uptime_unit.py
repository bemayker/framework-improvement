"""Unit tests for the uptime service, schema and declared contract (TEST-07)."""

from datetime import UTC, datetime, timedelta

import pytest
from pydantic import ValidationError

from app.main import create_app
from app.schemas.uptime import UptimeResponse
from app.services import uptime_service
from app.services.uptime_service import StartupMark, capture_startup, uptime_seconds


def test_capture_startup_returns_aware_utc_started_at():
    """Happy path: the wall-clock reading is timezone-aware UTC."""
    mark = capture_startup()

    assert mark.started_at.tzinfo is not None
    assert mark.started_at.utcoffset() == timedelta(0)


def test_capture_startup_records_monotonic_reading(monkeypatch):
    """The mark carries the monotonic clock reading at capture."""
    monkeypatch.setattr(uptime_service, "monotonic", lambda: 100.0)

    assert capture_startup().started_monotonic == 100.0


def test_uptime_seconds_returns_elapsed_monotonic_time(monkeypatch):
    """Happy path: elapsed time is the monotonic difference."""
    monkeypatch.setattr(uptime_service, "monotonic", lambda: 101.5)
    mark = StartupMark(started_at=datetime.now(UTC), started_monotonic=100.0)

    assert uptime_seconds(mark) == 1.5


def test_uptime_seconds_is_zero_at_the_startup_instant(monkeypatch):
    """Edge case: no time has passed."""
    monkeypatch.setattr(uptime_service, "monotonic", lambda: 100.0)
    mark = StartupMark(started_at=datetime.now(UTC), started_monotonic=100.0)

    assert uptime_seconds(mark) == 0.0


def test_uptime_seconds_ignores_wall_clock_changes(monkeypatch):
    """Edge case: a started_at in the future does not affect the duration."""
    monkeypatch.setattr(uptime_service, "monotonic", lambda: 102.0)
    mark = StartupMark(
        started_at=datetime.now(UTC) + timedelta(days=1), started_monotonic=100.0
    )

    assert uptime_seconds(mark) == 2.0


def test_uptime_response_serializes_started_at_as_utc_iso_8601():
    """Happy path: started_at dumps as ISO 8601 with a zero UTC offset."""
    response = UptimeResponse(
        uptime_seconds=1.0, started_at=datetime(2026, 10, 22, 16, 52, 51, tzinfo=UTC)
    )

    started_at = response.model_dump(mode="json")["started_at"]

    assert started_at == "2026-10-22T16:52:51Z"
    assert datetime.fromisoformat(started_at).utcoffset() == timedelta(0)


def test_uptime_response_with_negative_uptime_raises_validation_error():
    """Error case: uptime_seconds must be non-negative."""
    with pytest.raises(ValidationError):
        UptimeResponse(uptime_seconds=-0.1, started_at=datetime.now(UTC))


def test_uptime_response_with_naive_started_at_raises_validation_error():
    """Error case: started_at must carry an explicit offset."""
    with pytest.raises(ValidationError):
        UptimeResponse(uptime_seconds=1.0, started_at=datetime(2026, 10, 22, 16, 52))


def test_openapi_declares_uptime_response_fields():
    """The response is declared by the schema: types, date-time format, required."""
    schema = create_app().openapi()

    ref = schema["paths"]["/api/uptime"]["get"]["responses"]["200"]["content"][
        "application/json"
    ]["schema"]["$ref"]
    component = schema["components"]["schemas"][ref.rsplit("/", 1)[-1]]
    properties = component["properties"]

    assert properties["uptime_seconds"]["type"] == "number"
    assert properties["started_at"]["type"] == "string"
    assert properties["started_at"]["format"] == "date-time"
    assert set(component["required"]) == {"uptime_seconds", "started_at"}
