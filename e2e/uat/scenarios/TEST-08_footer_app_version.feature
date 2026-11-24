Feature: TEST-08 Footer shows the app version
  As anyone looking at a running Task Notes instance
  I want the footer to show the version the backend reports
  So that I can tell which build I am on, even when the frontend was built against another backend

  Background:
    Given the Task Notes stack (frontend, backend, database) is running per docker-compose.yml
    And the frontend is served at "http://localhost:5183"
    And the backend is served at "http://localhost:8010"

  Scenario: Footer renders the backend version on the landing page (criterion 1)
    Given backend/pyproject.toml declares version "0.1.0"
    When I open "http://localhost:5183/" in a browser
    Then the footer identified by "app-footer" reads "Task Notes v0.1.0"
    And the element identified by "app-version" reads "v0.1.0"

  Scenario: The version comes from the backend at runtime, not from the frontend (criterion 2)
    Given frontend/package.json declares version "0.0.0"
    And backend/pyproject.toml declares version "0.1.0"
    When I open "http://localhost:5183/" in a browser
    Then the footer shows "v0.1.0"
    And the footer does not show "v0.0.0"
    And the browser made one request to "http://localhost:8010/api/version"

  Scenario: Footer shows only the app name while the version is pending (criterion 3)
    Given the browser's network is throttled to "Slow 3G"
    When I open "http://localhost:5183/" in a browser
    Then until the "/api/version" request completes the footer reads exactly "Task Notes"
    And the footer never shows "undefined", "null", "unknown" or an empty gap
    And once the request completes the footer reads "Task Notes v0.1.0"

  Scenario: Footer shows only the app name when the backend is unreachable (edge case)
    Given the backend service is stopped
    When I open "http://localhost:5183/" in a browser
    Then the footer reads exactly "Task Notes"
    And no element identified by "app-version" is present
    And the rest of the landing page still renders

  Scenario: Footer passes its component tests for both paths (criterion 4)
    Given the frontend test suite
    When I run the AppFooter and version client tests
    Then they pass
    And the tests include a version-present case and a version-absent case
