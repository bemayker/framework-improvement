"""Unit tests for the uptime service (TEST-07), with a fake monotonic clock."""

from datetime import timedelta, timezone

import pytest

from app.services import uptime_service


def test_get_uptime_returns_non_negative_seconds_when_no_time_elapsed(monkeypatch):
    """Edge case: a clock reading equal to the start gives exactly zero."""
    monkeypatch.setattr(uptime_service, "monotonic", lambda: uptime_service.STARTED_MONOTONIC)

    assert uptime_service.get_uptime().uptime_seconds == 0.0


def test_get_uptime_increases_by_elapsed_monotonic_seconds(monkeypatch):
    """Happy path: uptime is the monotonic delta since startup."""
    monkeypatch.setattr(uptime_service, "STARTED_MONOTONIC", 100.0)
    readings = iter([101.5, 102.5])
    monkeypatch.setattr(uptime_service, "monotonic", lambda: next(readings))

    first = uptime_service.get_uptime().uptime_seconds
    second = uptime_service.get_uptime().uptime_seconds

    assert first == pytest.approx(1.5)
    assert second - first == pytest.approx(1.0)


def test_get_uptime_reports_the_same_started_at_on_repeated_calls():
    """Capture-once: repeated calls return the identical startup instant."""
    first = uptime_service.get_uptime()
    second = uptime_service.get_uptime()

    assert first.started_at is second.started_at
    assert first.started_at == uptime_service.STARTED_AT


def test_started_at_is_timezone_aware_utc():
    """Error guard: a naive or non-UTC startup timestamp would break the wire format."""
    assert uptime_service.STARTED_AT.utcoffset() == timedelta(0)
    assert uptime_service.STARTED_AT.tzinfo == timezone.utc
