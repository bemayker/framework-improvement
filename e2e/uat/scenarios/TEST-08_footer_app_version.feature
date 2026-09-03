Feature: TEST-08 Footer shows the app version reported by the backend
  As a visitor or operator of the Task Notes app
  I want the footer to show the version the backend itself reports
  So that I know which API the page is actually talking to, even after a partial deploy

  Background:
    Given the Task Notes project infrastructure (frontend, backend, database) is running per docker-compose.yml
    And the application is served at "http://localhost:5183"
    And the backend answers "GET /api/version" with its own version, read from backend/pyproject.toml

  Scenario: Footer renders the version string on the landing page
    Given the app is running
    When I open the landing page
    Then the footer identified by "app-footer" reads "Task Notes v" followed by a version number
    And the version number is shown in the element identified by "app-footer-version"

  Scenario: The version comes from the backend, never from a value typed into the frontend
    Given the backend declares a version that differs from the one in frontend/package.json
    When I read the footer on the landing page
    Then the version shown is the one "GET /api/version" reports
    And no version string is written in any non-test file under frontend/src

  Scenario: Footer renders without a version when the version cannot be resolved
    Given the backend cannot answer "GET /api/version"
    When I open the landing page
    Then the footer identified by "app-footer" reads exactly "Task Notes · version unavailable"
    And the message is shown in the element identified by "app-footer-version-unavailable"
    And no element identified by "app-footer-version" is present
    And the footer contains no "undefined", no "null" and no dangling "v"

  Scenario: A component test covers both the version-present and the version-absent path
    Given the component test file frontend/src/components/AppFooter.test.tsx
    When the frontend test suite is run
    Then a case in which the backend reports a version passes
    And a case in which the backend call fails passes

  Scenario: Footer shows only the app name before the version request answers (edge case)
    Given "GET /api/version" has been issued but has not answered yet
    When the landing page renders
    Then the footer identified by "app-footer" reads exactly "Task Notes"
    And neither "app-footer-version" nor "app-footer-version-unavailable" is present

  Scenario: Frontend and backend versions differ (edge case)
    Given frontend/package.json declares version "0.0.0"
    And the backend reports version "0.1.0"
    When I read the footer on the landing page
    Then it reads "Task Notes v0.1.0"
    And it never reads "Task Notes v0.0.0"
