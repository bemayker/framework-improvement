Feature: TEST-10 Footer shows the build commit
  As a visitor of the Task Notes app
  I want the footer to show the short build commit next to the version
  So that I know exactly which build I am looking at

  Background:
    Given the Task Notes stack (frontend, backend, database) is running per docker-compose.yml
    And the frontend is at "http://localhost:5183" and the backend is at "http://localhost:8010"

  Scenario: Footer shows the 7-character commit next to the version (criterion 1)
    Given the backend runs with BUILD_COMMIT "0123456789abcdef0123456789abcdef01234567"
    And GET /api/version reports version "0.1.0" and commit "0123456789ab"
    When I open the landing page
    Then the footer identified by "app-footer" reads "Task Notes v0.1.0 (0123456)"
    And the element identified by "app-commit" reads "(0123456)"

  Scenario: Pending request shows no version and no commit (criterion 2)
    Given the request to GET /api/version is still pending
    When I look at the footer
    Then the footer reads exactly "Task Notes"
    And it shows no "undefined", "null", "unknown" or error text

  Scenario: Unreachable backend shows no version and no commit (criterion 2)
    Given GET /api/version is unreachable
    When I open the landing page
    Then the footer is visible and reads exactly "Task Notes"
    And it shows no "undefined", "null", "unknown" or error text

  Scenario: Unknown commit shows the version alone (edge case)
    Given BUILD_COMMIT is unset so GET /api/version reports commit "unknown"
    When I open the landing page
    Then the footer reads "Task Notes v0.1.0"
    And the element identified by "app-commit" is not present
    And the footer does not contain "unknown"

  Scenario: Component tests cover success, pending and failure paths (criterion 3)
    Given the frontend test suite
    When AppFooter.test.tsx runs
    Then 0 tests fail
    And it includes a success case with the commit, a pending case and a failure case
