"""Integration test for FEAT-14: GET /api/verify510 over the real HTTP cycle."""

from fastapi.testclient import TestClient


def test_get_verify510_returns_200_with_status_ok(client: TestClient) -> None:
    response = client.get("/api/verify510")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
