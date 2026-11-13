Feature: TEST-10 Footer shows the build commit next to the version
  As a visitor of the Task Notes app
  I want the footer to show the short build commit next to the version
  So that I can tell exactly which build I am looking at

  Background:
    Given the Task Notes stack is running
    And the backend is reachable at "http://localhost:8010"
    And the frontend is served at "http://localhost:5183"

  Scenario: Footer shows the first 7 characters of the commit next to the version
    Given the backend reports commit "a1b2c3d4e5f6" and version "0.1.0"
    When I open "http://localhost:5183/" in a browser
    Then the footer identified by "app-footer" reads exactly "Task Notes v0.1.0 (a1b2c3d)"
    And "4e5f6" does not appear in the footer

  Scenario: Footer shows the name alone while the version request is pending
    Given the network is throttled so "/api/version" is slow
    When the landing page first renders
    Then the footer reads "Task Notes" alone with no commit, no parentheses and no "undefined"
    And when the request finishes the footer changes to "Task Notes v0.1.0 (a1b2c3d)" without a reload

  Scenario: Footer shows the name alone when the version request fails
    Given requests to "*/api/version" are blocked
    When I open "http://localhost:5183/" in a browser
    Then the footer reads exactly "Task Notes"
    And it shows no "undefined", no error text and no parentheses

  Scenario: Component tests cover the success, pending and failure paths
    When I run the frontend component tests for the footer
    Then the test "renders the first 7 characters of the commit next to the version" passes
    And the test "renders the app name without a version while the version request is pending" passes
    And the test "renders the app name without a version when the version request fails" passes

  Scenario: Backend built without a commit shows the version alone (edge case)
    Given the backend answers "/api/version" with {"version":"0.1.0","commit":"unknown"}
    When I open "http://localhost:5183/" in a browser
    Then the footer reads exactly "Task Notes v0.1.0"
    And "unknown" and empty parentheses are not shown
