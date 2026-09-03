"""Unit tests for the uptime service (backend/app/services/uptime_service.py)."""

import dataclasses
from datetime import timedelta, timezone

import pytest

from app.services import uptime_service

# Both module constants are stubbed rather than only the clock, so the
# arithmetic is exact: `monotonic()` returns seconds since boot, and adding a
# delta to a value that large and subtracting it again is not exact in double
# precision, which would make an `== 12.5` assertion flaky rather than wrong.
REFERENCE_MONOTONIC = 100.0


@pytest.fixture
def frozen_reference(monkeypatch):
    """Pin the service's import-time monotonic reference to a small value."""
    monkeypatch.setattr(
        uptime_service, "_STARTED_MONOTONIC", REFERENCE_MONOTONIC
    )


def test_get_uptime_reports_the_monotonic_elapsed_seconds(
    frozen_reference, monkeypatch
):
    """Happy path: 12.5 seconds past the reference reports 12.5 seconds."""
    monkeypatch.setattr(
        uptime_service, "monotonic", lambda: REFERENCE_MONOTONIC + 12.5
    )

    report = uptime_service.get_uptime()

    assert report.uptime_seconds == 12.5
    assert report.started_at is uptime_service.STARTED_AT


def test_get_uptime_at_the_reference_reports_zero(frozen_reference, monkeypatch):
    """Boundary edge case: the non-negative floor is exactly zero, not below."""
    monkeypatch.setattr(
        uptime_service, "monotonic", lambda: REFERENCE_MONOTONIC
    )

    assert uptime_service.get_uptime().uptime_seconds == 0.0


def test_get_uptime_grows_with_the_clock_while_started_at_holds(
    frozen_reference, monkeypatch
):
    """Criteria 2 and 3: elapsed time advances, the captured start does not.

    The deterministic form of the integration tier's "call it twice a second
    apart": one second on the clock is exactly one second of uptime, and both
    reports carry the very same STARTED_AT object rather than a fresh reading.
    """
    monkeypatch.setattr(
        uptime_service, "monotonic", lambda: REFERENCE_MONOTONIC + 5.0
    )
    first = uptime_service.get_uptime()
    monkeypatch.setattr(
        uptime_service, "monotonic", lambda: REFERENCE_MONOTONIC + 6.0
    )
    second = uptime_service.get_uptime()

    assert second.uptime_seconds - first.uptime_seconds == 1.0
    assert first.started_at is second.started_at is uptime_service.STARTED_AT


def test_started_at_is_captured_in_utc():
    """Criterion 3 at the source: the captured wall clock is UTC, not local."""
    assert uptime_service.STARTED_AT.tzinfo is timezone.utc
    assert uptime_service.STARTED_AT.utcoffset() == timedelta(0)


def test_uptime_report_is_immutable():
    """Error case: the report is frozen, so a caller cannot rewrite a reading."""
    report = uptime_service.get_uptime()

    with pytest.raises(dataclasses.FrozenInstanceError):
        report.uptime_seconds = 0.0
