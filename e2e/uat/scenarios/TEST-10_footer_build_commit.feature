Feature: TEST-10 Footer shows the build commit
  As a visitor of the Task Notes app
  I want the landing page footer to show the short build commit next to the version
  So that I can tell exactly which build I am looking at

  Background:
    Given the Task Notes project infrastructure (frontend, backend, database) is set up per docker-compose.yml
    And the frontend is running at "http://localhost:5183"
    And the backend is running at "http://localhost:8010"

  Scenario: Footer shows the first 7 characters of the commit next to the version (criterion 1)
    Given the backend reports version "0.1.0" and commit "0123456789ab" at "/api/version"
    When I open "http://localhost:5183" in a browser
    Then the footer identified by "app-footer" reads exactly "Task Notes v0.1.0 (0123456)"

  Scenario: Pending or failed version request shows no commit, undefined or error (criterion 2)
    Given requests to "/api/version" are blocked
    When I open the landing page
    Then the footer reads exactly "Task Notes"
    And the footer does not contain "undefined", "null", "unknown" or an error message

  Scenario: Pending request shows the app name alone until it resolves (criterion 2)
    Given the "/api/version" request has not resolved yet
    When the footer renders
    Then the footer reads exactly "Task Notes"
    And once the request resolves the footer reads "Task Notes v0.1.0 (0123456)"

  Scenario: Component tests cover the success, pending and failure paths (criterion 3)
    Given the frontend unit tests
    When I run the AppFooter component tests
    Then the test "shows the first 7 characters of the backend commit next to the version" passes
    And the test "shows only the app name while the version request is pending" passes
    And the test "renders without a version when the version request fails" passes

  Scenario: Unknown commit shows the version alone (edge case)
    Given the backend reports version "0.1.0" and commit "unknown" at "/api/version"
    When I open the landing page
    Then the footer reads exactly "Task Notes v0.1.0"
    And the footer does not contain "(unknown)"
