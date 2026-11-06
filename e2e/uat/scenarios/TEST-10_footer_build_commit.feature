Feature: TEST-10 Footer shows the build commit
  As a visitor of the Task Notes app
  I want the footer to show the short build commit next to the version
  So that I can tell exactly which build I am looking at

  Background:
    Given the Task Notes stack (frontend, backend, database) is running per docker-compose.yml
    And the frontend is at "http://localhost:5183" and the backend at "http://localhost:8010"

  Scenario: Footer shows the first 7 characters of the commit next to the version (criterion 1)
    Given GET /api/version reports version "0.1.0" and commit "0123456789ab"
    When I open "http://localhost:5183"
    Then the footer identified by "app-footer" reads "Task Notes v0.1.0 (0123456)"
    And the element identified by "app-footer-commit" is visible

  Scenario: Footer shows the version alone when the backend has no commit (criterion 2, edge case)
    Given GET /api/version reports version "0.1.0" and commit "unknown"
    When I open "http://localhost:5183"
    Then the footer reads "Task Notes v0.1.0"
    And no element identified by "app-footer-commit" is rendered
    And the footer does not contain "undefined", "null" or "unknown"

  Scenario: Pending and failed requests show no version and no commit (criterion 2)
    Given GET /api/version has not answered yet
    When the landing page renders
    Then the footer reads "Task Notes" with no commit and no error text
    And when the request fails or is blocked the footer still reads "Task Notes"
    And the footer does not contain "undefined"

  Scenario: Component tests cover success, pending and failure (criterion 3)
    Given the frontend test suite
    When I run the AppFooter and version client tests
    Then they pass with 0 failed
    And one test asserts "Task Notes v9.9.9 (abc1234)"
    And one pending test and one failure test assert "Task Notes" only
