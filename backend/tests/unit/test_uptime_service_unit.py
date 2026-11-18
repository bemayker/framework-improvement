"""Unit tests for the uptime service, schema and router (TEST-07)."""

from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

from app.routers import uptime as uptime_router_module
from app.schemas.uptime import UptimeResponse
from app.services import uptime_service


def _fake_clock(monkeypatch, reading: float) -> None:
    """Replace the service's `time` reference so its monotonic clock is fixed."""
    monkeypatch.setattr(
        uptime_service, "time", SimpleNamespace(monotonic=lambda: reading)
    )


def test_get_uptime_returns_elapsed_monotonic_seconds(monkeypatch):
    """Happy path: uptime is the monotonic delta rounded to milliseconds."""
    _fake_clock(monkeypatch, uptime_service.PROCESS_STARTED_MONOTONIC + 12.34567)

    report = uptime_service.get_uptime()

    assert report.uptime_seconds == 12.346


def test_get_uptime_returns_non_negative_uptime_at_zero_elapsed(monkeypatch):
    """Edge case: at the moment of capture, uptime is exactly zero."""
    _fake_clock(monkeypatch, uptime_service.PROCESS_STARTED_MONOTONIC)

    report = uptime_service.get_uptime()

    assert report.uptime_seconds == 0.0


def test_get_uptime_clamps_to_zero_when_clock_reads_before_start(monkeypatch):
    """Error case: a reading behind the captured start never goes negative."""
    _fake_clock(monkeypatch, uptime_service.PROCESS_STARTED_MONOTONIC - 5.0)

    report = uptime_service.get_uptime()

    assert report.uptime_seconds == 0.0


def test_get_uptime_returns_the_process_start_captured_at_import(monkeypatch):
    """The start time is the import-time constant, unchanged across calls."""
    _fake_clock(monkeypatch, uptime_service.PROCESS_STARTED_MONOTONIC + 1.0)

    first = uptime_service.get_uptime()
    second = uptime_service.get_uptime()

    assert first.started_at is uptime_service.PROCESS_STARTED_AT
    assert second.started_at is uptime_service.PROCESS_STARTED_AT
    assert first.started_at.utcoffset() == timedelta(0)


def test_uptime_response_serialises_started_at_with_utc_offset():
    """A non-UTC aware datetime is converted and rendered with +00:00, not Z."""
    local = datetime(
        2026, 11, 18, 10, 15, 2, 481233, tzinfo=timezone(timedelta(hours=1))
    )

    body = UptimeResponse(uptime_seconds=1.5, started_at=local).model_dump(mode="json")

    assert body["started_at"] == "2026-11-18T09:15:02.481233+00:00"
    assert body["uptime_seconds"] == 1.5


def test_uptime_router_declares_uptime_response_model():
    """Criterion 4: the route's response model is the schema class."""
    route = next(
        r for r in uptime_router_module.router.routes if r.path == "/api/uptime"
    )

    assert route.response_model is UptimeResponse
