"""Integration tests for /api/ping (FEAT-4). No database is needed."""

from fastapi.testclient import TestClient

METHOD_NOT_ALLOWED_BODY = {"detail": "Method Not Allowed"}


def test_get_ping_returns_200_with_exact_status_body(client: TestClient):
    response = client.get("/api/ping")

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("application/json")
    assert response.json() == {"status": "ok", "service": "backend"}


def test_post_ping_returns_405_with_exact_detail_body(client: TestClient):
    response = client.post("/api/ping")

    assert response.status_code == 405
    assert response.json() == METHOD_NOT_ALLOWED_BODY
    assert "GET" in response.headers["allow"]


def test_post_ping_with_json_body_still_returns_same_405(client: TestClient):
    response = client.post("/api/ping", json={"x": 1})

    assert response.status_code == 405
    assert response.json() == METHOD_NOT_ALLOWED_BODY
