Feature: TEST-08 Footer shows the app version
  As anyone looking at a running instance of Task Notes
  I want the footer to show the version the backend reports
  So that I can tell which build I am on

  Background:
    Given the stack is running via "docker compose up --build"
    And the frontend is served at "http://localhost:5183"
    And the backend is served at "http://localhost:8010"

  Scenario: AC1 - Footer shows the backend version on the landing page
    Given "GET http://localhost:8010/api/version" returns a JSON body with a "version" field
    When I open "http://localhost:5183"
    Then the element "app-footer" reads "Task Notes v" followed by that version
    And the element "app-version" contains exactly that version

  Scenario: AC2 - The version comes from the backend at runtime, not from the frontend bundle
    Given frontend/package.json says version "0.0.0"
    And backend/pyproject.toml says version "0.1.0"
    When I open "http://localhost:5183"
    Then the footer shows "0.1.0"
    And the footer does not show "0.0.0"
    And the browser made a "GET /api/version" request that returned status 200

  Scenario: AC3 - Footer renders without a version when the request fails (edge case)
    Given requests to "/api/version" are blocked or the backend is stopped
    When I reload "http://localhost:5183"
    Then the element "app-footer" reads exactly "Task Notes"
    And no element "app-version" exists
    And the footer shows none of "undefined", "null", "unknown" or a dangling " v"

  Scenario: Loading state - Footer shows only the app name while the version is pending (edge case)
    Given network throttling makes the "/api/version" request slow
    When I reload "http://localhost:5183"
    Then while the request is pending the element "app-footer" reads exactly "Task Notes" with no placeholder
    And once the request completes the footer reads "Task Notes v" followed by the version

  Scenario: AC4 - Component tests cover both the version-present and version-absent paths
    Given the frontend test suite
    When I run "npm --prefix frontend test"
    Then the AppFooter tests for the version-present, loading and version-absent cases all pass
