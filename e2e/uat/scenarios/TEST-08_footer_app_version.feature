Feature: TEST-08 Footer shows the app version
  As a visitor of the Task Notes app
  I want the footer to show the version the backend reports
  So that I can tell which build I am looking at

  Background:
    Given the stack is running with the frontend at "http://localhost:5183" and the backend at "http://localhost:8010"

  Scenario: Footer renders the version on the landing page (criterion 1)
    Given the backend is running
    When I open "http://localhost:5183/" in a browser
    Then the footer identified by "app-footer" shows "Task Notes v" followed by the backend's version

  Scenario: The version comes from the backend at runtime, not from package.json (criterion 2)
    Given the backend reports version "0.1.0" at "/api/version"
    And "frontend/package.json" declares version "0.0.0"
    When I open the landing page
    Then the footer shows "v0.1.0"
    And the footer does not show "v0.0.0"

  Scenario: Footer renders the name only when the version cannot be resolved (criterion 3)
    Given the backend is stopped
    When I open the landing page
    Then the footer reads exactly "Task Notes"
    And it shows no "undefined", "null", "unknown" or trailing gap

  Scenario: Footer shows the name only while the version is loading (criterion 3)
    Given the request to "/api/version" has not yet been answered
    When I look at the footer
    Then it reads "Task Notes" with no version and no placeholder text

  Scenario: Component tests cover both the present and absent paths (criterion 4)
    Given the frontend test suite
    When I run the AppFooter and version client tests
    Then they pass with 0 failed
    And they assert a resolved version, a pending fetch, a rejected fetch and a null result
