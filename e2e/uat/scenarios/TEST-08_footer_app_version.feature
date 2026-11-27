Feature: TEST-08 Footer shows the app version
  As a visitor of the Task Notes app
  I want the footer to show the version the backend is running
  So that I can tell which build I am looking at, even when frontend and backend differ

  Background:
    Given the Task Notes project infrastructure (frontend, backend, database) is set up per docker-compose.yml
    And the application is running at "http://localhost:5183"
    And the backend is running at "http://localhost:8010"

  Scenario: Footer renders the backend version on the landing page
    Given the backend reports its version at "GET /api/version"
    When I open "http://localhost:5183" in a browser
    Then the footer identified by "app-footer" reads "Task Notes v" followed by that version
    And the version is wrapped in the element identified by "app-footer-version"

  Scenario: Version comes from the backend at runtime, not from the frontend package
    Given "frontend/package.json" declares a version that differs from the backend's "[project].version"
    When I open the landing page
    Then the footer shows the backend's version
    And the frontend package version appears nowhere in the footer

  Scenario: Footer renders without a version when the backend is unreachable (edge case)
    Given the request to "GET /api/version" fails or is aborted
    When I open the landing page
    Then the footer reads exactly "Task Notes"
    And there is no "app-footer-version" element
    And the footer shows no "undefined", "null", "unknown" or trailing gap

  Scenario: Component tests cover both the present and the absent path
    Given the frontend test suite
    When I run the AppFooter and version client tests
    Then the test "renders the version the backend reports" passes
    And the test "renders the app name without a version when the backend is unreachable" passes

  Scenario: Footer shows only the app name while the version request is pending
    Given the request to "GET /api/version" has not answered yet
    When the landing page renders
    Then the footer reads "Task Notes" with no placeholder text
    And once the request completes the footer reads "Task Notes" followed by the backend version
