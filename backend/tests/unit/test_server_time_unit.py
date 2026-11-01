"""Unit tests for the server time schema and handler (FEAT-1)."""

from datetime import datetime, timedelta, timezone

import pytest
from pydantic import ValidationError

from app.routers import server_time
from app.schemas.server_time import UTC_OFFSET_SUFFIX, TimeResponse


def test_serialize_time_response_has_exactly_now_and_timezone_keys():
    payload = TimeResponse(now=datetime(2026, 1, 2, 3, 4, 5, 6, tzinfo=timezone.utc)).model_dump(
        mode="json"
    )

    assert set(payload) == {"now", "timezone"}
    assert payload["timezone"] == "UTC"


def test_serialize_utc_input_returns_exact_plus_zero_offset_string():
    payload = TimeResponse(now=datetime(2026, 1, 2, 3, 4, 5, 6, tzinfo=timezone.utc)).model_dump(
        mode="json"
    )

    assert payload["now"] == "2026-01-02T03:04:05.000006+00:00"
    assert payload["now"].endswith(UTC_OFFSET_SUFFIX)
    assert not payload["now"].endswith("Z")


def test_serialize_non_utc_aware_input_converts_to_utc():
    plus_two = timezone(timedelta(hours=2))

    payload = TimeResponse(now=datetime(2026, 1, 2, 5, 4, 5, 0, tzinfo=plus_two)).model_dump(
        mode="json"
    )

    assert payload["now"] == "2026-01-02T03:04:05.000000+00:00"


def test_build_time_response_with_naive_datetime_raises_validation_error():
    with pytest.raises(ValidationError):
        TimeResponse(now=datetime(2026, 1, 2, 3, 4, 5))


def test_get_server_time_reads_clock_on_every_call(monkeypatch):
    instants = iter(
        [
            datetime(2026, 1, 2, 3, 4, 5, tzinfo=timezone.utc),
            datetime(2026, 1, 2, 3, 4, 6, tzinfo=timezone.utc),
        ]
    )
    monkeypatch.setattr(server_time, "current_utc_time", lambda: next(instants))

    first = server_time.get_server_time()
    second = server_time.get_server_time()

    assert first.now == datetime(2026, 1, 2, 3, 4, 5, tzinfo=timezone.utc)
    assert second.now == datetime(2026, 1, 2, 3, 4, 6, tzinfo=timezone.utc)


def test_current_utc_time_returns_aware_utc_datetime():
    value = server_time.current_utc_time()

    assert value.utcoffset() == timedelta(0)
