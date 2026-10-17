"""Unit tests for the GET /api/time handler (FEAT-1, BUG-01), with the clock stubbed."""

from datetime import datetime, timezone

from fastapi import Response

from app.routers import server_time
from app.schemas.server_time import ServerTimeResponse

FIRST_INSTANT = datetime(2026, 10, 17, 9, 15, 2, tzinfo=timezone.utc)
SECOND_INSTANT = datetime(2026, 10, 17, 9, 15, 3, tzinfo=timezone.utc)


class _StubDatetime:
    """Stands in for the `datetime` class: `now` yields queued instants."""

    def __init__(self, instants):
        self._instants = list(instants)
        self.requested_tzinfos = []

    def now(self, tz=None):
        self.requested_tzinfos.append(tz)
        return self._instants.pop(0)


def test_get_server_time_reads_the_clock_on_every_call(monkeypatch):
    """Criterion 2: two calls return two different `now` values."""
    stub = _StubDatetime([FIRST_INSTANT, SECOND_INSTANT])
    monkeypatch.setattr(server_time, "datetime", stub)

    first = server_time.get_server_time(Response())
    second = server_time.get_server_time(Response())

    assert first.now == FIRST_INSTANT
    assert second.now == SECOND_INSTANT
    assert first.now != second.now


def test_get_server_time_requests_utc_from_the_clock(monkeypatch):
    """Criterion 2: the clock is asked for an aware UTC instant."""
    stub = _StubDatetime([FIRST_INSTANT])
    monkeypatch.setattr(server_time, "datetime", stub)

    server_time.get_server_time(Response())

    assert stub.requested_tzinfos == [timezone.utc]


def test_get_server_time_returns_schema_not_a_dict(monkeypatch):
    """Criterion 3: the handler returns a ServerTimeResponse."""
    monkeypatch.setattr(server_time, "datetime", _StubDatetime([FIRST_INSTANT]))

    result = server_time.get_server_time(Response())

    assert isinstance(result, ServerTimeResponse)
    assert result.timezone == "UTC"


def test_get_server_time_sets_cache_control_no_store(monkeypatch):
    """BUG-01 criterion 1: the injected response carries `Cache-Control: no-store`."""
    monkeypatch.setattr(server_time, "datetime", _StubDatetime([FIRST_INSTANT]))
    response = Response()

    server_time.get_server_time(response)

    assert response.headers["Cache-Control"] == "no-store"
