Feature: FEAT-8 GET /api/version returns a JSON version
  GET /api/version answers with a JSON body whose "version" member is "1.0".
  The existing "commit" member stays in the body (assumption A1 of the plan).
  There is no new UI; scenarios are HTTP requests against the running backend,
  plus the footer that already shows the endpoint's version.

  Background:
    Given the backend is running and reachable at "http://localhost:8010"

  # Criterion 1
  Scenario: The endpoint answers 200 with the version "1.0"
    When a client sends GET "/api/version"
    Then the status is 200
    And the "content-type" header is "application/json"
    And the JSON member "version" is "1.0"

  # Criterion 1, footer consumer
  Scenario: The page footer shows the version "1.0"
    Given the frontend is running and reachable at "http://localhost:5183"
    When a visitor opens "/"
    Then the element with data-testid "app-footer" contains "Task Notes v1.0"

  # Criterion 1, edge case
  Scenario: A POST to the endpoint is not allowed
    When a client sends POST "/api/version"
    Then the status is 405

  # Criterion 2
  Scenario: The version integration tests pass
    When the tests in "tests/integration/test_version_integration.py" are run with "uv run --directory backend pytest -q"
    Then the run reports 0 failed
    And "test_get_version_returns_200_with_version_1_0" is among the tests collected
