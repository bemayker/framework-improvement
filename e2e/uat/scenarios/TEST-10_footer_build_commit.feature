Feature: TEST-10 Footer shows the build commit
  As a visitor of the Task Notes app
  I want the footer to show the short build commit next to the version
  So that I can tell exactly which build is running

  Background:
    Given the Task Notes stack (database, backend, frontend) is running per docker-compose.yml
    And the application is available at "http://localhost:5183"
    And the backend reports version "0.1.0" at "GET /api/version"

  Scenario: Footer shows the first 7 characters of the commit next to the version (criterion 1)
    Given the backend runs with BUILD_COMMIT "0123456789abcdef0123456789abcdef01234567"
    And "GET /api/version" answers version "0.1.0" and commit "0123456789ab"
    When I open the landing page
    Then the footer identified by "app-footer" reads "Task Notes v0.1.0 (0123456)"
    And the element identified by "app-footer-commit" reads " (0123456)"
    And the browser requests "GET /api/version" from the backend once

  Scenario: Footer shows the app name alone while the request is pending (criterion 2)
    Given the backend runs with BUILD_COMMIT "0123456789abcdef0123456789abcdef01234567"
    And the "/api/version" request is slow to answer
    When I open the landing page
    Then until the request completes the footer reads exactly "Task Notes"
    And the footer does not contain "undefined", "null" or an error text
    And when the request completes the footer reads "Task Notes v0.1.0 (0123456)"

  Scenario: Footer shows the app name alone when the request fails (criterion 2)
    Given the backend is stopped
    When I open the landing page
    Then the footer reads exactly "Task Notes"
    And the footer does not contain "undefined", "null" or an error text
    And no element identified by "app-footer-commit" exists

  Scenario: Footer shows the version alone when the commit is unknown (criterion 2, edge case)
    Given the backend runs without BUILD_COMMIT
    And "GET /api/version" answers version "0.1.0" and commit "unknown"
    When I open the landing page
    Then the footer reads exactly "Task Notes v0.1.0"
    And the footer does not contain "unknown" or parentheses
    And no element identified by "app-footer-commit" exists

  Scenario: Component tests cover the success, pending and failure paths (criterion 3)
    When I run the AppFooter component tests
    Then they pass with 0 failed
    And one test shows "Task Notes v0.1.0 (abc1234)" when the client resolves a version and commit
    And one test shows exactly "Task Notes" while the client promise never settles
    And one test shows exactly "Task Notes" with no commit element when the client rejects
