"""Integration tests for GET /api/ping (FEAT-10) and GET /api/ping/count (FEAT-11), full HTTP request/response cycle."""

from fastapi.testclient import TestClient

from app.main import create_app


def test_get_ping_returns_200_with_status_ok(client: TestClient):
    """Criterion 1: the endpoint answers 200 with exactly {"status": "ok"}."""
    response = client.get("/api/ping")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_get_ping_answers_when_database_url_is_unset(monkeypatch):
    """No database connection is needed; DATABASE_URL may be absent."""
    monkeypatch.delenv("DATABASE_URL", raising=False)

    app = create_app()
    with TestClient(app) as fresh_client:
        response = fresh_client.get("/api/ping")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_post_ping_returns_405_method_not_allowed(client: TestClient):
    """Only reachable error case: the endpoint is read-only."""
    response = client.post("/api/ping")

    assert response.status_code == 405


def test_two_pings_then_count_gives_two():
    """FEAT-11 criteria 1, 3 and 4: two pings then count is exactly 2."""
    with TestClient(create_app()) as fresh_client:
        fresh_client.get("/api/ping")
        fresh_client.get("/api/ping")
        response = fresh_client.get("/api/ping/count")

    assert response.status_code == 200
    assert response.json() == {"count": 2}


def test_count_is_zero_before_any_ping():
    with TestClient(create_app()) as fresh_client:
        response = fresh_client.get("/api/ping/count")

    assert response.status_code == 200
    assert response.json() == {"count": 0}


def test_count_requests_do_not_increment_the_count():
    with TestClient(create_app()) as fresh_client:
        first = fresh_client.get("/api/ping/count")
        second = fresh_client.get("/api/ping/count")

    assert first.json() == {"count": 0}
    assert second.json() == {"count": 0}


def test_post_ping_count_returns_405_method_not_allowed():
    with TestClient(create_app()) as fresh_client:
        response = fresh_client.post("/api/ping/count")

    assert response.status_code == 405
