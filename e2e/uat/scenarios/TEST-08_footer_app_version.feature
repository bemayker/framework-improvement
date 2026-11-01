Feature: TEST-08 Footer shows the app version
  As a visitor of the Task Notes app
  I want the footer to show the version reported by the backend
  So that I know which build I am looking at

  Background:
    Given the Task Notes stack (frontend, backend, database) is running per docker-compose.yml
    And the frontend is at "http://localhost:5183" and the backend is at "http://localhost:8010"

  Scenario: Footer renders the backend version (criterion 1)
    Given the backend reports version "0.1.0" at GET /api/version
    When I open the landing page
    Then the footer identified by "app-footer" reads "Task Notes v0.1.0"

  Scenario: The version is the backend's, fetched at runtime (criterion 2)
    Given the backend reports version "9.9.9" at GET /api/version
    And the frontend's own package version is "0.0.0"
    When I open the landing page
    Then the footer reads "Task Notes v9.9.9"
    And the footer does not contain "0.0.0"

  Scenario: Unresolved version leaves exactly the app name (criterion 3)
    Given the request to GET /api/version is still pending
    When I look at the footer
    Then the footer reads exactly "Task Notes"
    And it shows no "undefined", "null", "unknown" or "loading" text

  Scenario: Unreachable backend leaves exactly the app name (edge case)
    Given GET /api/version is unreachable
    When I open the landing page
    Then the footer is visible and reads exactly "Task Notes"
    And it shows no "undefined", "null" or "unknown" text

  Scenario: Component tests cover both paths (criterion 4)
    Given the frontend test suite
    When AppFooter.test.tsx runs
    Then 0 tests fail
    And it includes a version-present case and the version-absent cases

  Scenario: The endpoint returns the backend version (criterion 5)
    Given the backend is running
    When I GET /api/version
    Then I receive 200 with {"version": "0.1.0"}
