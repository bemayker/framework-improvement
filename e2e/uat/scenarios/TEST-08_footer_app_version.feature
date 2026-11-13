Feature: TEST-08 Footer shows the app version reported by the backend
  As a visitor of the Task Notes app
  I want the footer to show the version the running backend reports
  So that I can tell which build I am looking at

  Background:
    Given the Task Notes stack is running
    And the backend is reachable at "http://localhost:8010"
    And the frontend is served at "http://localhost:5183"

  Scenario: Footer renders the version string on the landing page
    When I open "http://localhost:5183/" in a browser
    Then the footer identified by "app-footer" reads exactly "Task Notes v0.1.0"

  Scenario: The version comes from the backend's GET /api/version
    Given the browser's network panel is open
    When I open "http://localhost:5183/" in a browser
    Then one "GET http://localhost:8010/api/version" request returns status 200
    And its response body is {"version":"0.1.0"}
    And the footer shows the same version as that response body
    And the component source contains neither "0.1.0" nor "package.json"

  Scenario: Footer renders without a version when the version cannot be resolved
    Given requests to "*/api/version" are blocked
    When I open "http://localhost:5183/" in a browser
    Then the footer reads exactly "Task Notes"
    And it shows no "v", "undefined", "null", "unknown" or trailing space

  Scenario: Component tests cover both the present and the absent path
    When I run the frontend component tests for the footer
    Then the test "renders the version the backend reports" passes
    And the test "renders the app name without a version when the version request fails" passes

  Scenario: The backend's version wins over the frontend bundle's own version
    Given frontend/package.json declares version "0.0.0"
    And backend/pyproject.toml declares version "0.1.0"
    When I open "http://localhost:5183/" in a browser
    Then the footer reads "Task Notes v0.1.0"
    And "0.0.0" appears nowhere on the page

  Scenario: Footer shows the name alone while the version request is pending
    Given the network is throttled so "/api/version" is slow
    When the landing page first renders
    Then the footer reads "Task Notes" alone with no placeholder
    And when the request finishes the footer changes to "Task Notes v0.1.0" without a reload

  Scenario: Backend reports its unknown sentinel (edge case)
    Given the backend answers "/api/version" with {"version":"unknown"}
    When I open "http://localhost:5183/" in a browser
    Then the footer reads exactly "Task Notes"
    And the word "unknown" is not shown
