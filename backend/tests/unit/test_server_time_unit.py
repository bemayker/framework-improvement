"""Unit tests for the server time response schema (FEAT-1)."""

import re
from datetime import UTC, datetime, timedelta, timezone

import pytest
from pydantic import ValidationError

from app.schemas.server_time import UTC_OFFSET_SUFFIX, ServerTimeResponse

NOW_FORMAT = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{6})?\+00:00$")


def test_serialize_fixed_utc_instant_returns_exact_shape():
    """Happy path: the body is exactly now and timezone, with the +00:00 suffix."""
    response = ServerTimeResponse(
        now=datetime(2026, 10, 27, 19, 44, 51, 123456, tzinfo=UTC), timezone="UTC"
    )

    expected = {"now": "2026-10-27T19:44:51.123456+00:00", "timezone": "UTC"}
    assert response.model_dump(mode="json") == expected
    assert response.model_dump_json() == (
        '{"now":"2026-10-27T19:44:51.123456+00:00","timezone":"UTC"}'
    )


def test_serialize_uses_plus_zero_offset_never_z():
    """Criterion 2: the offset is spelled +00:00, matching the pinned constant."""
    response = ServerTimeResponse(
        now=datetime(2026, 10, 27, 19, 44, 51, 123456, tzinfo=UTC), timezone="UTC"
    )

    value = response.model_dump(mode="json")["now"]

    assert UTC_OFFSET_SUFFIX == "+00:00"
    assert value.endswith(UTC_OFFSET_SUFFIX)
    assert "Z" not in value
    assert NOW_FORMAT.match(value)


def test_serialize_non_utc_aware_input_is_converted_to_utc():
    """Edge case: a +02:00 input is shifted to UTC rather than echoed."""
    plus_two = timezone(timedelta(hours=2))
    response = ServerTimeResponse(
        now=datetime(2026, 10, 27, 21, 44, 51, 123456, tzinfo=plus_two), timezone="UTC"
    )

    assert response.model_dump(mode="json")["now"] == "2026-10-27T19:44:51.123456+00:00"


def test_serialize_zero_microseconds_still_ends_in_utc_offset():
    """Edge case: isoformat drops the fraction at .000000; the suffix must remain."""
    response = ServerTimeResponse(
        now=datetime(2026, 10, 27, 19, 44, 51, tzinfo=UTC), timezone="UTC"
    )

    value = response.model_dump(mode="json")["now"]

    assert value == "2026-10-27T19:44:51+00:00"
    assert NOW_FORMAT.match(value)


def test_construct_naive_datetime_raises_validation_error():
    """Error case: a naive datetime is rejected, so now is never naive."""
    with pytest.raises(ValidationError):
        ServerTimeResponse(now=datetime(2026, 10, 27, 19, 44, 51), timezone="UTC")


def test_construct_non_utc_timezone_literal_raises_validation_error():
    """Error case: only the literal UTC is accepted as the timezone."""
    with pytest.raises(ValidationError):
        ServerTimeResponse(
            now=datetime(2026, 10, 27, 19, 44, 51, tzinfo=UTC),
            timezone="Europe/Brussels",
        )
