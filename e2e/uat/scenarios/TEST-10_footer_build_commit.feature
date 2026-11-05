Feature: TEST-10 Footer shows the build commit
  As anyone looking at a running Task Notes instance
  I want the footer to show the short build commit next to the version
  So that I can tell exactly which build I am on

  Background:
    Given the Task Notes frontend is running at "http://localhost:5183"
    And the backend is running at "http://localhost:8010"

  Scenario: Footer shows the 7-character commit next to the version (criterion 1)
    Given the backend reports version "0.1.0" and commit "abc1234def56"
    When I open the landing page "http://localhost:5183/"
    Then the footer identified by "app-footer" reads "Task Notes v0.1.0 (abc1234)"

  Scenario: Footer shows the version alone while the request is pending or fails (criterion 2)
    Given the version endpoint is unreachable
    When I open the landing page
    Then the footer reads exactly "Task Notes"
    And it does not show "undefined", "null", "unknown", an error message or "()"

  Scenario: Footer shows the version alone when the commit is unknown (criterion 2, edge case)
    Given the backend reports version "0.1.0" and commit "unknown"
    When I open the landing page
    Then the footer reads exactly "Task Notes v0.1.0"
    And it shows no parentheses and no "unknown"

  Scenario: Component tests cover the success, pending and failure paths (criterion 3)
    Given the frontend test suite
    When I run the AppFooter component tests
    Then the success test passes
    And the pending test passes
    And the failure test passes
