Feature: TEST-08 Footer shows the app version
  As a visitor of the Task Notes app
  I want the landing page footer to show the version the backend reports
  So that I can tell which build I am looking at

  Background:
    Given the Task Notes project infrastructure (frontend, backend, database) is set up per docker-compose.yml
    And the frontend is running at "http://localhost:5183"
    And the backend is running at "http://localhost:8010"

  Scenario: Footer renders the version on the landing page (criterion 1)
    Given the backend reports a version at "/api/version"
    When I open "http://localhost:5183" in a browser
    Then the footer identified by "app-footer" reads "Task Notes v" followed by that version

  Scenario: The version comes from the backend at runtime (criterion 2)
    Given the backend reports "0.1.0" and frontend/package.json says "0.0.0"
    When I open the landing page
    Then the footer reads "Task Notes v0.1.0"
    And the browser made a GET request to "/api/version" on the backend
    And the footer does not read "v0.0.0"

  Scenario: Unresolvable version renders the app name alone (criterion 3)
    Given requests to "/api/version" are blocked
    When I open the landing page
    Then the footer reads exactly "Task Notes"
    And the footer does not contain "undefined", "null", "unknown" or a dangling "v"

  Scenario: Component tests assert both the present and the absent path (criterion 4)
    Given the frontend unit tests
    When I run the AppFooter component tests
    Then the test "renders the version returned by the backend, not the frontend package version" passes
    And the test "renders without a version when the version request fails" passes

  Scenario: Loading state shows the app name alone (criterion 5)
    Given the "/api/version" request has not resolved yet
    When the footer renders
    Then the footer reads exactly "Task Notes" with no placeholder, spinner or "unknown"
    And once the request resolves the footer reads "Task Notes v0.1.0"

  Scenario: Backend unreachable leaves the footer intact (edge case)
    Given the backend is not reachable from the browser
    When I open the landing page
    Then the footer is still present at the bottom of the page
    And it reads exactly "Task Notes"
    And the rest of the landing page is unaffected
