"""Integration tests for GET /api/time (FEAT-1). Needs no database."""

from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient

from app.main import create_app
from app.routers.server_time import utc_now
from app.schemas.server_time import UTC_OFFSET_SUFFIX


def test_get_time_returns_200_with_now_and_utc_timezone(client: TestClient):
    response = client.get("/api/time")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"now", "timezone"}
    assert body["timezone"] == "UTC"
    assert datetime.fromisoformat(body["now"]).utcoffset() == timedelta(0)


def test_get_time_now_ends_with_plus_zero_offset(client: TestClient):
    now = client.get("/api/time").json()["now"]

    assert now.endswith(UTC_OFFSET_SUFFIX)
    assert now.endswith("+00:00")
    assert "Z" not in now


def test_get_time_now_is_computed_per_request():
    instants = iter(
        [datetime(2026, 1, 1, 0, 0, 0, tzinfo=UTC), datetime(2026, 1, 1, 0, 0, 1, tzinfo=UTC)]
    )
    app = create_app()
    app.dependency_overrides[utc_now] = lambda: next(instants)
    with TestClient(app) as test_client:
        first = test_client.get("/api/time").json()["now"]
        second = test_client.get("/api/time").json()["now"]

    assert first != second
    assert datetime.fromisoformat(second) - datetime.fromisoformat(first) == timedelta(seconds=1)


def test_get_time_two_real_calls_return_different_instants(client: TestClient):
    first = datetime.fromisoformat(client.get("/api/time").json()["now"])
    second = datetime.fromisoformat(client.get("/api/time").json()["now"])

    assert second > first


def test_get_time_openapi_references_server_time_response(client: TestClient):
    spec = client.get("/openapi.json").json()

    schema = spec["paths"]["/api/time"]["get"]["responses"]["200"]["content"]["application/json"]["schema"]
    assert schema["$ref"].endswith("/ServerTimeResponse")
    assert "ServerTimeResponse" in spec["components"]["schemas"]


def test_post_time_returns_405_method_not_allowed(client: TestClient):
    assert client.post("/api/time").status_code == 405
