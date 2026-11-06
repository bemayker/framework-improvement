Feature: TEST-08 Footer shows the app version from the backend
  As a visitor of the Task Notes app
  I want the footer to show the version the backend reports at runtime
  So that I can tell which build I am looking at, even when the frontend and backend were built at different times

  Background:
    Given the Task Notes stack (frontend, backend, database) is running per docker-compose.yml
    And the frontend is at "http://localhost:5183" and the backend at "http://localhost:8010"

  Scenario: Footer renders the version on the landing page (criterion 1)
    Given the backend answers GET /api/version with a version
    When I open "http://localhost:5183"
    Then the footer identified by "app-footer" reads "Task Notes v" followed by that version

  Scenario: Footer version comes from the backend, not the frontend bundle (criteria 2 and 5)
    Given GET /api/version reports "0.1.0"
    And the "version" field of frontend/package.json is "0.0.0"
    When I open "http://localhost:5183"
    Then the browser made one request to GET /api/version
    And the footer reads "Task Notes v0.1.0"
    And the footer does not show "0.0.0"

  Scenario: Footer renders without a version when it cannot be resolved (criterion 3)
    Given the backend is stopped
    When I open "http://localhost:5183"
    Then the landing page still renders its heading and note form
    And the footer reads exactly "Task Notes"
    And the footer does not contain "undefined", "null", "unknown" or a trailing "v"

  Scenario: Component tests cover both the present and the absent path (criterion 4)
    Given the frontend test suite
    When I run the AppFooter and version client tests
    Then they pass with 0 failed
    And one test asserts "Task Notes v9.9.9" and another asserts the text "Task Notes" only

  Scenario: Loading and failure states both show the app name only (criterion 6)
    Given GET /api/version has not answered yet
    When the landing page renders
    Then the footer reads "Task Notes" with no placeholder text
    And when the request fails or is blocked the footer still reads "Task Notes"
    And when the request completes the version appears after "Task Notes" in place

  Scenario: Backend unreachable leaves the footer without a version (edge case)
    Given the request to GET /api/version is aborted before it answers
    When I open "http://localhost:5183"
    Then the footer is visible and reads "Task Notes"
    And no version segment is rendered
