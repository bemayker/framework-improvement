Feature: TEST-10 Footer shows the build commit
  As a visitor of the Task Notes app
  I want the footer to show the short build commit next to the version
  So that I can tell exactly which build I am looking at

  Background:
    Given the Task Notes stack (frontend, backend, database) is running per docker-compose.yml
    And the frontend is reachable at "http://localhost:5183"
    And the backend is reachable at "http://localhost:8010"

  Scenario: Footer shows the 7-character commit next to the version (criterion 1)
    Given the backend answers "GET /api/version" with a version and a commit of at least 7 characters
    When I open "http://localhost:5183"
    Then the footer identified by "app-footer" reads "Task Notes v" followed by that version, a space, and the first 7 characters of that commit in parentheses
    And the footer does not show the commit's remaining characters

  Scenario: Pending request shows the app name without commit or error (criterion 2)
    Given the response of "GET /api/version" is still pending
    When I open "http://localhost:5183"
    Then the footer reads exactly "Task Notes"
    And the footer text contains no "undefined", "null", "unknown", "()" or error text

  Scenario: Failed request shows the app name without commit or error (criterion 2)
    Given requests to "/api/version" fail
    When I open "http://localhost:5183"
    Then the page still loads
    And the footer is visible and reads exactly "Task Notes"
    And the footer text contains no "undefined", "null", "unknown", "()" or error text

  Scenario: Component test covers success, pending and failure paths (criterion 3)
    Given the frontend test suite
    When I run the AppFooter and version client tests
    Then the success case with a commit passes
    And the success case without a commit passes
    And the pending case passes
    And the failure cases (rejected, null) pass

  Scenario: Backend reports no commit (edge case)
    Given the backend answers "GET /api/version" with a version and the commit "unknown"
    When I open "http://localhost:5183"
    Then the footer reads "Task Notes v" followed by that version, and nothing else
    And the footer text contains no parentheses, no "unknown" and no trailing space
