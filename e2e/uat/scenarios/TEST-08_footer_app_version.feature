Feature: TEST-08 Footer shows the app version
  As someone looking at a running Task Notes instance
  I want the footer to show the version the backend reports
  So that I can tell which build I am on

  Background:
    Given the Task Notes stack (frontend, backend, database) is running per docker-compose.yml
    And the frontend is at "http://localhost:5183" and the backend is at "http://localhost:8010"

  Scenario: Footer shows the version the backend reports (criterion 1)
    Given the backend answers "GET /api/version" with a version
    When I open "http://localhost:5183" in a browser
    Then the footer identified by "app-footer" reads "Task Notes v" followed by that version

  Scenario: The version comes from the backend at runtime, not from package.json (criterion 2)
    Given the backend reports "0.1.0" and frontend/package.json says "0.0.0"
    When I open the landing page
    Then the footer shows "0.1.0"
    And the browser made a "GET" request to "/api/version" that answered 200

  Scenario: Footer renders without a version when it cannot be resolved (criterion 3)
    Given the backend is stopped
    When I open the landing page
    Then the heading and note form still render
    And the footer reads exactly "Task Notes"
    And the footer contains no "v", "undefined", "null" or "unknown" and no trailing gap

  Scenario: A component test asserts both paths (criterion 4)
    Given the frontend tests
    When I run the AppFooter and version client tests
    Then they pass with 0 failed
    And they cover the version-present path and the version-absent paths

  Scenario: Before the version resolves the footer shows the app name alone (criterion 5)
    Given the version request has not resolved or is blocked
    When the page renders
    Then the footer reads exactly "Task Notes" with no version and no placeholder text

  Scenario: Unreachable backend leaves the footer as the app name (edge case)
    Given the request to "/api/version" is blocked in the browser
    When I reload the landing page
    Then the footer reads exactly "Task Notes"
    And unblocking the request and reloading shows "Task Notes v0.1.0" again
