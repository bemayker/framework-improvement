"""Unit tests for the uptime service (TEST-07)."""

import logging
import time
from datetime import UTC

from app.services import uptime_service
from app.services.uptime_service import StartMark, capture_start_mark, uptime_seconds

START = StartMark(started_at=capture_start_mark().started_at, started_monotonic=100.0)


def test_capture_start_mark_returns_utc_aware_started_at():
    mark = capture_start_mark()

    assert mark.started_at.utcoffset() is not None
    assert mark.started_at.tzinfo is UTC


def test_uptime_seconds_returns_elapsed_monotonic_seconds():
    assert uptime_seconds(START, now_monotonic=112.5) == 12.5


def test_uptime_seconds_returns_zero_at_start_instant():
    assert uptime_seconds(START, now_monotonic=100.0) == 0.0


def test_uptime_seconds_clamps_to_zero_when_now_precedes_start(caplog):
    with caplog.at_level(logging.WARNING, logger=uptime_service.logger.name):
        result = uptime_seconds(START, now_monotonic=99.0)

    assert result == 0.0
    assert "clamped" in caplog.text


def test_uptime_seconds_defaults_to_time_monotonic(monkeypatch):
    monkeypatch.setattr(time, "monotonic", lambda: 130.0)

    assert uptime_seconds(START) == 30.0
