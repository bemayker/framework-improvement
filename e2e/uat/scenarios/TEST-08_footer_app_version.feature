Feature: TEST-08 Footer shows the app version
  As a visitor of the Task Notes app
  I want the footer to show the version the running backend reports
  So that I can tell which build I am looking at

  Background:
    Given the Task Notes stack (frontend, backend, database) is running per docker-compose.yml
    And the frontend is reachable at "http://localhost:5183"
    And the backend is reachable at "http://localhost:8010"

  Scenario: Footer renders the version string on the landing page (criterion 1)
    Given the backend answers "GET /api/version" with its version
    When I open "http://localhost:5183"
    Then the footer identified by "app-footer" reads "Task Notes v" followed by that version

  Scenario: Footer shows the backend's version, not the frontend package's (criterion 2)
    Given the backend reports a version that differs from "version" in frontend/package.json
    When I open "http://localhost:5183"
    Then the footer shows the backend's version
    And the footer does not show the frontend package's version
    And the browser made at least one "GET /api/version" request to the backend, each with status 200 and the backend's version

  Scenario: Footer omits an unresolved version (criterion 3)
    Given the backend is stopped
    When I open "http://localhost:5183"
    Then the footer reads exactly "Task Notes"
    And the footer text contains no "undefined", "null" or "unknown"
    And there is no trailing space or "v" after the app name

  Scenario: Component test covers both paths (criterion 4)
    Given the frontend test suite
    When I run the AppFooter and version client tests
    Then the version present case passes
    And the version absent cases (loading, rejected, null) pass

  Scenario: The endpoint returns the backend's version (criterion 5)
    Given the backend is running
    When I request "GET http://localhost:8010/api/version"
    Then I receive the "version" from backend/pyproject.toml
    And that is the value the footer shows

  Scenario: Backend is unreachable on page load (edge case)
    Given requests to "/api/version" fail
    When I open "http://localhost:5183"
    Then the page still loads
    And the footer is visible and reads exactly "Task Notes"
