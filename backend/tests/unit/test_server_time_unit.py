"""Unit tests for the server time schema and router (FEAT-1)."""

from datetime import UTC, datetime, timedelta, timezone

import pytest
from pydantic import ValidationError

from app.routers import server_time as server_time_module
from app.schemas.server_time import ServerTimeResponse


def test_server_time_response_serialises_now_with_plus_00_00_suffix():
    """The wire format ends in +00:00 and never uses Z."""
    response = ServerTimeResponse(now=datetime(2026, 11, 25, 3, 14, 15, 926535, tzinfo=UTC))

    dumped = response.model_dump(mode="json")

    assert dumped == {"now": "2026-11-25T03:14:15.926535+00:00", "timezone": "UTC"}
    assert dumped["now"].endswith("+00:00")
    assert "Z" not in dumped["now"]


def test_server_time_response_rejects_naive_datetime():
    """A naive datetime is refused at construction."""
    with pytest.raises(ValidationError):
        ServerTimeResponse(now=datetime(2026, 11, 25, 3, 14, 15))


def test_server_time_response_converts_non_utc_offset_to_utc():
    """An aware non-UTC value is converted, so the output is always UTC."""
    plus_two = timezone(timedelta(hours=2))

    dumped = ServerTimeResponse(
        now=datetime(2026, 11, 25, 5, 0, 0, tzinfo=plus_two)
    ).model_dump(mode="json")

    assert dumped["now"] == "2026-11-25T03:00:00+00:00"


def test_get_server_time_reads_clock_on_every_call(monkeypatch):
    """The clock is read inside the handler, so two calls give two instants."""
    instants = iter(
        [
            datetime(2026, 11, 25, 3, 0, 0, tzinfo=UTC),
            datetime(2026, 11, 25, 3, 0, 1, tzinfo=UTC),
        ]
    )

    class StubDatetime:
        """Stand-in for the router module's datetime class."""

        @staticmethod
        def now(tz=None):
            """Return the next scripted instant."""
            return next(instants)

    monkeypatch.setattr(server_time_module, "datetime", StubDatetime)

    first = server_time_module.get_server_time()
    second = server_time_module.get_server_time()

    assert first.now != second.now
    assert second.now - first.now == timedelta(seconds=1)


def test_get_server_time_returns_server_time_response():
    """The handler returns the schema, not a bare dict."""
    result = server_time_module.get_server_time()

    assert isinstance(result, ServerTimeResponse)
    assert result.timezone == "UTC"
