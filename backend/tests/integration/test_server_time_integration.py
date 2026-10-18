"""Integration tests for GET /api/time (FEAT-1). No database is involved."""

from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from app.main import create_app
from app.routers.server_time import get_utc_now


def test_get_time_returns_200_with_exactly_now_and_timezone(client: TestClient):
    response = client.get("/api/time")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"now", "timezone"}
    assert body["timezone"] == "UTC"


def test_get_time_now_parses_as_aware_datetime_with_zero_offset(client: TestClient):
    now = client.get("/api/time").json()["now"]

    parsed = datetime.fromisoformat(now)

    assert parsed.tzinfo is not None
    assert parsed.utcoffset() == timedelta(0)


def test_get_time_now_ends_with_plus_00_00_offset(client: TestClient):
    now = client.get("/api/time").json()["now"]

    assert now.endswith("+00:00")
    assert "Z" not in now


def test_get_time_now_lies_between_the_surrounding_real_clock_reads(client: TestClient):
    before = datetime.now(timezone.utc)

    now = datetime.fromisoformat(client.get("/api/time").json()["now"])

    after = datetime.now(timezone.utc)
    assert before <= now <= after


def test_get_time_second_consecutive_request_is_strictly_later(client: TestClient):
    first = datetime.fromisoformat(client.get("/api/time").json()["now"])
    second = datetime.fromisoformat(client.get("/api/time").json()["now"])

    assert second > first


def test_get_time_with_clock_override_one_second_apart_differs_by_one_second():
    app = create_app()
    instants = iter(
        [
            datetime(2026, 10, 18, 20, 41, 7, tzinfo=timezone.utc),
            datetime(2026, 10, 18, 20, 41, 8, tzinfo=timezone.utc),
        ]
    )
    app.dependency_overrides[get_utc_now] = lambda: next(instants)
    test_client = TestClient(app)

    first = datetime.fromisoformat(test_client.get("/api/time").json()["now"])
    second = datetime.fromisoformat(test_client.get("/api/time").json()["now"])

    assert second - first == timedelta(seconds=1)


def test_openapi_declares_server_time_response_with_date_time_now(client: TestClient):
    document = client.get("/openapi.json").json()

    operation = document["paths"]["/api/time"]["get"]
    schema_ref = operation["responses"]["200"]["content"]["application/json"]["schema"]["$ref"]
    schema = document["components"]["schemas"]["ServerTimeResponse"]

    assert schema_ref.endswith("/ServerTimeResponse")
    assert schema["properties"]["now"]["format"] == "date-time"


def test_post_time_returns_405(client: TestClient):
    response = client.post("/api/time")

    assert response.status_code == 405
