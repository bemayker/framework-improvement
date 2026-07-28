"""Shared pytest fixtures for the backend test suite.

Session-scoped FastAPI TestClient fixture used by unit and integration tests.

A module-scoped real-database fixture and a migration runner are intentionally
not wired up yet: TEST-01 (the scaffold feature) creates no DB engine/session
code, so there is nothing for such a fixture to connect to. TEST-02 introduces
the DB connectivity layer and wires those fixtures in here at that point.
"""

import pytest
from fastapi.testclient import TestClient

from app.main import create_app


@pytest.fixture(scope="session")
def client() -> TestClient:
    """Session-scoped test client against the FastAPI app."""
    app = create_app()
    with TestClient(app) as test_client:
        yield test_client
