"""Unit tests for the server time service (FEAT-1); the clock is stubbed."""

from datetime import UTC, datetime, timedelta

from app.services import server_time_service


class _StubClock:
    """Stands in for the `datetime` class; records calls to `now`."""

    def __init__(self, instants):
        self._instants = list(instants)
        self.tz_args = []

    def now(self, tz=None):
        self.tz_args.append(tz)
        return self._instants[len(self.tz_args) - 1]


def test_get_current_utc_time_returns_aware_utc_datetime():
    """Happy path: the value is timezone-aware with a zero UTC offset."""
    result = server_time_service.get_current_utc_time()

    assert result.tzinfo is not None
    assert result.utcoffset() == timedelta(0)


def test_get_current_utc_time_reads_the_clock_on_every_call(monkeypatch):
    """Edge case: two calls read the clock twice, so nothing is cached."""
    first = datetime(2026, 11, 9, 12, 0, 0, tzinfo=UTC)
    second = first + timedelta(seconds=1)
    stub = _StubClock([first, second])
    monkeypatch.setattr(server_time_service, "datetime", stub)

    results = [
        server_time_service.get_current_utc_time(),
        server_time_service.get_current_utc_time(),
    ]

    assert results == [first, second]
    assert results[0] != results[1]
    assert len(stub.tz_args) == 2


def test_get_current_utc_time_requests_utc_from_the_clock(monkeypatch):
    """Error-guarding case: UTC is always passed, so a naive value cannot arise."""
    stub = _StubClock([datetime(2026, 11, 9, 12, 0, 0, tzinfo=UTC)])
    monkeypatch.setattr(server_time_service, "datetime", stub)

    server_time_service.get_current_utc_time()

    assert stub.tz_args == [UTC]
