Feature: TEST-08 Footer shows the app version
  As a visitor of the Task Notes app
  I want the footer to show the version of the backend I am talking to
  So that I can tell which build of the app I am looking at

  Background:
    Given the Task Notes stack (db, backend, frontend) is running per docker-compose.yml
    And the frontend is served at "http://localhost:5183"
    And the backend is served at "http://localhost:8010"

  Scenario: Footer renders the version string on the landing page (criterion 1)
    Given the backend reports version "0.1.0" at "GET /api/version"
    When I open "http://localhost:5183/" in a browser
    Then the footer identified by "app-footer" reads exactly "Task Notes v0.1.0"

  Scenario: The version comes from the backend at runtime, not from the frontend (criterion 2)
    Given the backend reports version "0.1.0" at "GET /api/version"
    And the "version" field of frontend/package.json reads "0.0.0"
    When I open "http://localhost:5183/" in a browser
    Then the footer shows "v0.1.0", the backend's value
    And the footer does not show "v0.0.0"
    And the browser made one request to "http://localhost:8010/api/version" that returned status 200
    And the source of AppFooter.tsx contains no version literal and no import of package.json

  Scenario: The footer renders without a version when it cannot be resolved (criterion 3)
    Given the backend is stopped
    When I open "http://localhost:5183/" in a browser
    Then the footer reads exactly "Task Notes"
    And the footer does not contain "v", "undefined", "null" or "unknown"
    And there is no trailing space or empty gap after "Task Notes"

  Scenario: The backend reports an unknown version (edge case)
    Given the backend answers "GET /api/version" with the version "unknown"
    When I open "http://localhost:5183/" in a browser
    Then the footer reads exactly "Task Notes"

  Scenario: A component test asserts both paths (criterion 4)
    Given the frontend test suite is available
    When I run the AppFooter component tests
    Then a test covers the version-present path
    And tests cover the version-absent paths for a pending, a rejected and an "unknown" result
    And 0 tests fail
