Feature: TEST-08 Footer shows the app version
  As a visitor of the Task Notes app
  I want the footer to show the version reported by the backend
  So that I can tell which build I am looking at, even when the frontend and backend were built at different times

  Background:
    Given the Task Notes stack (frontend, backend, database) is running per docker-compose.yml
    And the frontend is reachable at "http://localhost:5183"
    And the backend is reachable at "http://localhost:8010"

  Scenario: Footer renders the version string on the landing page (criterion 1)
    Given the backend reports a version at "GET /api/version"
    When I open the landing page
    Then the footer identified by "app-footer" reads "Task Notes v" followed by that version

  Scenario: The version comes from the backend at runtime, not from the frontend package (criterion 2)
    Given the backend reports version "0.1.0" from backend/pyproject.toml
    And the "version" field of frontend/package.json is "0.0.0"
    When I open the landing page
    Then the browser requests "GET /api/version" on the backend
    And the footer reads "Task Notes v0.1.0"
    And the footer does not read "Task Notes v0.0.0"

  Scenario: An unresolvable version renders the footer without it (criterion 3)
    Given the version endpoint is unreachable
    When I open the landing page
    Then the footer reads exactly "Task Notes"
    And the footer shows no "undefined", "null" or "unknown"
    And there is no trailing gap after the app name

  Scenario: A frontend unit test covers both the present and the absent version (criterion 4)
    Given the frontend unit suite
    When I run the AppFooter tests
    Then a test for the version-present path passes
    And a test for the version-absent path passes
    And the run reports 0 failed

  Scenario: Loading and failure states both show only the app name (criterion 5)
    Given the version request has not answered yet
    When the footer renders
    Then the footer reads exactly "Task Notes"
    And once the request fails or the backend answers "unknown", the footer still reads exactly "Task Notes"
    And the footer never reads "unknown"

  Scenario: Backend down, then back up (edge case)
    Given the backend container has been stopped
    When I open the landing page
    Then the footer reads exactly "Task Notes"
    And the rest of the landing page still renders
    When the backend container is started again and I reload the landing page
    Then the footer reads "Task Notes v" followed by the backend version again
