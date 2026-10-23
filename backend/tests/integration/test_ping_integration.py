"""Integration test for GET /api/ping (FEAT-7), full HTTP request/response cycle."""

from fastapi.testclient import TestClient


def test_get_ping_returns_200_with_pong_true(client: TestClient):
    """Criteria 1 and 2: the endpoint answers 200 with the boolean body {"pong": true}.

    Exact equality also proves `pong` is a JSON boolean and not the string "true".
    """
    response = client.get("/api/ping")

    assert response.status_code == 200
    assert response.json() == {"pong": True}
