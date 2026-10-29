"""Unit tests for the server time schema and router (FEAT-1)."""

import json
from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.main import create_app
from app.routers.server_time import utc_now
from app.schemas.server_time import ServerTimeResponse

FIXED_UTC = datetime(2026, 10, 29, 16, 53, 8, 123456, tzinfo=timezone.utc)


def test_serialisation_of_utc_value_ends_with_plus_zero_offset_not_z():
    """Happy path: the exact suffix is +00:00 in both dump modes."""
    response = ServerTimeResponse(now=FIXED_UTC, timezone="UTC")

    dumped = response.model_dump(mode="json")
    from_json = json.loads(response.model_dump_json())

    assert set(dumped) == {"now", "timezone"}
    assert dumped["now"] == "2026-10-29T16:53:08.123456+00:00"
    assert from_json["now"].endswith("+00:00")
    assert not from_json["now"].endswith("Z")
    assert dumped["timezone"] == "UTC"


def test_serialisation_of_non_utc_value_is_normalised_to_utc():
    """Edge case: a +02:00 instant is converted to the same instant in UTC."""
    plus_two = timezone(timedelta(hours=2))
    response = ServerTimeResponse(
        now=datetime(2026, 10, 29, 18, 53, 8, tzinfo=plus_two), timezone="UTC"
    )

    assert response.model_dump(mode="json")["now"] == "2026-10-29T16:53:08+00:00"


def test_naive_datetime_is_rejected():
    """Error case: a naive datetime fails validation."""
    with pytest.raises(ValidationError):
        ServerTimeResponse(now=datetime(2026, 10, 29, 16, 53, 8), timezone="UTC")


def test_non_utc_timezone_label_is_rejected():
    """Error case: the timezone label is pinned to UTC."""
    with pytest.raises(ValidationError):
        ServerTimeResponse(now=FIXED_UTC, timezone="CET")


def test_utc_now_returns_aware_utc_value():
    assert utc_now().utcoffset() == timedelta(0)


def test_handler_evaluates_clock_per_request():
    """Freshness: two requests with two injected instants return two values."""
    first = datetime(2026, 10, 29, 10, 0, 0, tzinfo=timezone.utc)
    second = datetime(2026, 10, 29, 10, 0, 1, tzinfo=timezone.utc)
    instants = iter([first, second])
    app = create_app()
    app.dependency_overrides[utc_now] = lambda: next(instants)
    client = TestClient(app)

    body_one = client.get("/api/time").json()
    body_two = client.get("/api/time").json()

    assert body_one == {"now": "2026-10-29T10:00:00+00:00", "timezone": "UTC"}
    assert body_two == {"now": "2026-10-29T10:00:01+00:00", "timezone": "UTC"}
