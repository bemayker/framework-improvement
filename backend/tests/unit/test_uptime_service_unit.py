"""Unit tests for the uptime service (backend/app/services/uptime_service.py).

Module-level service state is controlled with `monkeypatch.setattr` on the
service module, rather than a production-code test hook, so each test starts
from a known "nothing captured yet" state regardless of import order.
"""

import logging
from datetime import timedelta

from app.services import uptime_service


def _reset_uptime_state(monkeypatch):
    monkeypatch.setattr(uptime_service, "_started_at", None)
    monkeypatch.setattr(uptime_service, "_monotonic_start", None)


def test_get_uptime_returns_non_negative_seconds_and_recorded_started_at(monkeypatch):
    """Happy path: a recorded start yields a non-negative uptime_seconds and
    the started_at instant that was recorded.
    """
    _reset_uptime_state(monkeypatch)
    uptime_service.record_start()

    snapshot = uptime_service.get_uptime()

    assert snapshot.started_at == uptime_service._started_at
    assert snapshot.uptime_seconds >= 0.0


def test_record_start_is_idempotent_and_uptime_never_decreases(monkeypatch):
    """Edge case: a second record_start() call is a no-op (the second call
    returns the same recorded value), and two consecutive get_uptime() calls
    never decrease.
    """
    _reset_uptime_state(monkeypatch)
    uptime_service.record_start()
    first_started_at = uptime_service._started_at
    first_monotonic_start = uptime_service._monotonic_start

    uptime_service.record_start()

    assert uptime_service._started_at == first_started_at
    assert uptime_service._monotonic_start == first_monotonic_start

    first_snapshot = uptime_service.get_uptime()
    second_snapshot = uptime_service.get_uptime()

    assert second_snapshot.uptime_seconds >= first_snapshot.uptime_seconds


def test_get_uptime_with_nothing_recorded_captures_now_and_warns(monkeypatch, caplog):
    """Error case: with nothing recorded, get_uptime() still answers rather
    than raising, logs a warning naming the condition, and yields an aware
    UTC started_at.
    """
    _reset_uptime_state(monkeypatch)

    with caplog.at_level(logging.WARNING, logger=uptime_service.__name__):
        snapshot = uptime_service.get_uptime()

    assert snapshot.started_at.tzinfo is not None
    assert snapshot.started_at.utcoffset() == timedelta(0)
    assert snapshot.uptime_seconds >= 0.0
    assert any("no recorded start" in record.message for record in caplog.records)
