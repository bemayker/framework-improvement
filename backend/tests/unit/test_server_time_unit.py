"""Unit tests for the server time schema and clock (FEAT-1)."""

from datetime import UTC, datetime, timedelta, timezone

import pytest
from pydantic import ValidationError

from app.routers.server_time import utc_now
from app.schemas.server_time import UTC_OFFSET_SUFFIX, ServerTimeResponse


def test_dump_aware_utc_value_has_exact_keys_and_timezone():
    model = ServerTimeResponse(now=datetime(2026, 10, 24, 5, 0, 0, tzinfo=UTC), timezone="UTC")

    dumped = model.model_dump(mode="json")

    assert set(dumped) == {"now", "timezone"}
    assert dumped["timezone"] == "UTC"


def test_dump_utc_value_ends_with_pinned_suffix_not_z():
    model = ServerTimeResponse(now=datetime(2026, 10, 24, 5, 0, 0, tzinfo=UTC), timezone="UTC")

    now = model.model_dump(mode="json")["now"]

    assert UTC_OFFSET_SUFFIX == "+00:00"
    assert now.endswith("+00:00")
    assert not now.endswith("Z")


def test_construct_naive_datetime_raises_validation_error():
    with pytest.raises(ValidationError):
        ServerTimeResponse(now=datetime(2026, 10, 24, 5, 0, 0), timezone="UTC")


def test_dump_non_utc_value_is_converted_to_same_instant_in_utc():
    plus_two = timezone(timedelta(hours=2))
    model = ServerTimeResponse(now=datetime(2026, 10, 24, 7, 0, 0, tzinfo=plus_two), timezone="UTC")

    assert model.model_dump(mode="json")["now"] == "2026-10-24T05:00:00+00:00"


def test_construct_non_utc_timezone_literal_raises_validation_error():
    with pytest.raises(ValidationError):
        ServerTimeResponse(now=datetime(2026, 10, 24, 5, 0, 0, tzinfo=UTC), timezone="Europe/Brussels")


def test_utc_now_returns_aware_utc_value():
    value = utc_now()

    assert value.tzinfo is not None
    assert value.utcoffset() == timedelta(0)


def test_utc_now_is_non_decreasing_between_calls():
    first = utc_now()
    second = utc_now()

    assert second >= first
