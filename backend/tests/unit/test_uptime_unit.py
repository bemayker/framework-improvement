"""Unit tests for the TEST-07 uptime handler and its response schema.

The handler is called directly as a function (no HTTP): the full request cycle
is the integration tier's job. Elapsed time is proved deterministically here by
substituting the router module's `time` for a fake clock and its captured
`STARTED_AT_MONOTONIC` for a known reading, rather than by sleeping.
"""

from datetime import datetime, timedelta, timezone

import pytest
from pydantic import ValidationError

from app.routers import uptime as uptime_module
from app.routers.uptime import get_uptime
from app.schemas.uptime import UptimeResponse

KNOWN_UTC_MOMENT = datetime(2026, 9, 14, 9, 51, 3, tzinfo=timezone.utc)
KNOWN_START_MONOTONIC = 100.0


class FixedClock:
    """Stand-in for `time` whose `monotonic()` returns a fixed reading.

    Only `monotonic` is needed: the handler calls nothing else on the name it
    imported, and a fake that answers more than the code under test uses would
    assert nothing extra.
    """

    def __init__(self, reading: float):
        self._reading = reading

    def monotonic(self) -> float:
        return self._reading


class AdvancingClock:
    """Stand-in for `time` whose `monotonic()` advances one second per call."""

    def __init__(self, start: float):
        self._next = start

    def monotonic(self) -> float:
        current = self._next
        self._next = current + 1.0
        return current


@pytest.fixture
def known_start(monkeypatch):
    """Pin the captured monotonic start so elapsed time is deterministic."""
    monkeypatch.setattr(uptime_module, "STARTED_AT_MONOTONIC", KNOWN_START_MONOTONIC)


def test_get_uptime_returns_the_elapsed_monotonic_seconds(monkeypatch, known_start):
    """Happy path: 5.5 s on the fake clock is reported as 5.5 seconds."""
    monkeypatch.setattr(
        uptime_module, "time", FixedClock(KNOWN_START_MONOTONIC + 5.5)
    )

    response = get_uptime()

    assert isinstance(response, UptimeResponse)
    assert response.uptime_seconds == 5.5
    # Identity, not equality: pydantic passes an already-aware datetime through
    # `AwareDatetime` unchanged (verified in this build), so `is` proves the
    # handler hands over the captured constant rather than an equal value it
    # recomputed. That is criterion 3's "captured once" in its sharpest form.
    assert response.started_at is uptime_module.STARTED_AT


def test_get_uptime_returns_zero_when_no_time_has_elapsed(monkeypatch, known_start):
    """Edge case: the lower bound is inclusive, so zero elapsed is valid."""
    monkeypatch.setattr(uptime_module, "time", FixedClock(KNOWN_START_MONOTONIC))

    response = get_uptime()

    assert response.uptime_seconds == 0.0


def test_get_uptime_increases_while_started_at_stays_fixed(monkeypatch, known_start):
    """Criteria 2 and 3: uptime grows per call, the start timestamp does not."""
    monkeypatch.setattr(
        uptime_module, "time", AdvancingClock(KNOWN_START_MONOTONIC + 1.0)
    )

    first = get_uptime()
    second = get_uptime()

    assert second.uptime_seconds > first.uptime_seconds
    assert second.started_at == first.started_at


def test_started_at_is_captured_once_as_an_aware_utc_datetime():
    """Criterion 3: the module constant is aware and carries a zero offset."""
    assert uptime_module.STARTED_AT.tzinfo is not None
    assert uptime_module.STARTED_AT.utcoffset() == timedelta(0)


def test_uptime_response_rejects_a_negative_uptime():
    """Error case: a negative elapsed time never reaches the wire."""
    with pytest.raises(ValidationError):
        UptimeResponse(uptime_seconds=-1.0, started_at=KNOWN_UTC_MOMENT)


def test_uptime_response_rejects_a_naive_started_at():
    """Error case: a datetime with no zone never reaches the wire."""
    with pytest.raises(ValidationError):
        UptimeResponse(uptime_seconds=1.0, started_at=datetime(2026, 1, 1))


def test_uptime_response_serialises_started_at_with_an_explicit_utc_offset():
    """Criterion 3: the serialised value carries `+00:00`, never the `Z` alias."""
    serialised = UptimeResponse(
        uptime_seconds=1.0, started_at=KNOWN_UTC_MOMENT
    ).model_dump(mode="json")["started_at"]

    assert serialised == "2026-09-14T09:51:03+00:00"
    assert serialised.endswith("+00:00")
    assert not serialised.endswith("Z")


def test_uptime_response_converts_a_non_utc_offset_to_utc():
    """Edge case: an aware value in another zone is written converted to UTC."""
    same_instant_in_cest = KNOWN_UTC_MOMENT.astimezone(timezone(timedelta(hours=2)))

    serialised = UptimeResponse(
        uptime_seconds=1.0, started_at=same_instant_in_cest
    ).model_dump(mode="json")["started_at"]

    assert serialised == "2026-09-14T09:51:03+00:00"
