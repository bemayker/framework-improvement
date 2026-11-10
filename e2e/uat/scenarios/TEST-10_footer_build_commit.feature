Feature: TEST-10 Footer shows the build commit
  As a visitor of the Task Notes app
  I want the footer to show the short build commit next to the version
  So that I know exactly which build I am running against

  Background:
    Given the Task Notes stack (frontend, backend, database) is running
    And the frontend is served at "http://localhost:5183"
    And the backend is served at "http://localhost:8010"

  Scenario: Footer shows the 7-character commit next to the version (criterion 1)
    Given the backend runs with BUILD_COMMIT "0123456789abcdef"
    And GET /api/version answers {"version": "0.1.0", "commit": "0123456789ab"}
    When I open the landing page
    Then the footer identified by "app-footer" reads exactly "Task Notes v0.1.0 (0123456)"
    And the element identified by "app-footer-commit" reads " (0123456)"

  Scenario: Pending request shows no commit and no error (criterion 2)
    Given the version request has not answered yet
    When the landing page renders
    Then the footer reads exactly "Task Notes"
    And it does not contain "undefined", "null" or an error message

  Scenario: Failed request shows no commit and no error (criterion 2)
    Given the version request is blocked
    When I open the landing page
    Then the footer reads exactly "Task Notes"
    And it does not contain "undefined", "null", "unknown" or an error message

  Scenario: Component test covers success, pending and failure (criterion 3)
    Given the frontend test suite
    When I run AppFooter.test.tsx and version.test.ts
    Then 0 tests fail
    And a test asserts "Task Notes v9.9.9 (0123456)" for a resolved version and commit
    And a test asserts exactly "Task Notes" for the pending path
    And a test asserts exactly "Task Notes" for the failure path

  Scenario: Backend reports the unknown commit (edge case)
    Given the backend runs with BUILD_COMMIT unset
    And GET /api/version answers {"version": "0.1.0", "commit": "unknown"}
    When I open the landing page
    Then the footer reads exactly "Task Notes v0.1.0"
    And the word "unknown" is not shown
    And no element identified by "app-footer-commit" is present
