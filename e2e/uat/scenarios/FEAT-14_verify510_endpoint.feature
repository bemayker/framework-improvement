Feature: FEAT-14 Verify510 endpoint
  As an operator of the Task Notes app
  I want GET /api/verify510 to answer with a fixed ok status
  So that the verify cycle can confirm the backend serves the route

  Background:
    Given the Task Notes backend runs from docker-compose.yml
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: GET /api/verify510 answers 200 with status ok
    Given the backend is running
    When a client sends a GET request to "/api/verify510"
    Then the response status code is 200
    And the response content type is "application/json"
    And the response body is exactly {"status": "ok"}
    And the response body carries no other field

  Scenario: One pytest test covers the endpoint and passes
    Given the backend test suite on this branch
    When the file "backend/tests/integration/test_verify510_integration.py" is run with pytest
    Then exactly one test is collected, "test_get_verify510_returns_200_with_status_ok"
    And the run reports 0 failed
    And the test asserts both the 200 status and the exact body {"status": "ok"}

  Scenario: A POST to /api/verify510 answers 405 (edge case)
    Given the backend is running
    When a client sends a POST request to "/api/verify510"
    Then the response status code is 405
