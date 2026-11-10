Feature: TEST-10 Footer shows the build commit
  As a visitor of the Task Notes app
  I want the footer to show the short build commit next to the version
  So that I can tell exactly which build I am looking at

  Background:
    Given the Task Notes stack (db, backend, frontend) is running per docker-compose.yml
    And the frontend is at "http://localhost:5183" and the backend at "http://localhost:8010"

  Scenario: Footer shows the 7-character commit next to the version (criterion 1)
    Given the backend runs with BUILD_COMMIT "0123456789abcdef0123"
    And "GET /api/version" answers with commit "0123456789ab"
    When I open "http://localhost:5183/" in a browser
    Then the footer identified by "app-footer" reads exactly "Task Notes v0.1.0 (0123456)"

  Scenario: Pending or failed request shows no version and no commit (criterion 2)
    Given the version request is slow or the backend is stopped
    When I open the landing page
    Then the footer reads exactly "Task Notes"
    And the footer shows no "undefined", "null", "unknown" or error text
    And the footer shows no empty parentheses

  Scenario: Unknown commit shows the version alone (criterion 2, edge case)
    Given the backend runs without BUILD_COMMIT
    And "GET /api/version" answers with commit "unknown"
    When I open the landing page
    Then the footer reads exactly "Task Notes v0.1.0"
    And the footer shows no "(unknown)" and no empty parentheses

  Scenario: Component tests cover success, pending and failure (criterion 3)
    Given the frontend test suite
    When I run the AppFooter and version client tests
    Then the run reports 0 failed
    And there is a success case, a pending case and a failure case
