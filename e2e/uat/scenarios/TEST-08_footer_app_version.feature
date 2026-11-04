Feature: TEST-08 Footer shows the app version
  As a visitor of the Task Notes app
  I want the footer to show the version reported by the backend I am talking to
  So that I can tell which build is running

  Background:
    Given the Task Notes stack (database, backend, frontend) is running per docker-compose.yml
    And the application is available at "http://localhost:5183"
    And the backend reports version "0.1.0" at "GET /api/version"
    And the frontend package declares version "0.0.0"

  Scenario: Footer renders the version on the landing page (criterion 1)
    When I open the landing page
    Then the footer identified by "app-footer" reads "Task Notes v0.1.0"

  Scenario: Version comes from the backend at runtime, not from the frontend package (criterion 2)
    When I open the landing page
    Then the browser requests "GET /api/version" from the backend once
    And the footer shows the version the backend returned, "0.1.0"
    And the footer does not show the frontend package version "0.0.0"

  Scenario: Footer renders without a version when it cannot be resolved (criterion 3)
    Given the backend is stopped
    When I open the landing page
    Then the footer reads exactly "Task Notes"
    And the footer does not contain "v", "undefined", "null" or "unknown"
    And no element identified by "app-footer-version" exists

  Scenario: Footer shows the app name alone while the version is loading (criterion 3)
    Given the "/api/version" request is slow to answer
    When I open the landing page
    Then until the request completes the footer reads exactly "Task Notes"
    And when the request completes the footer reads "Task Notes v0.1.0"

  Scenario: Component tests cover both the present and the absent version (criterion 4)
    When I run the AppFooter component tests
    Then they pass with 0 failed
    And one test shows "Task Notes v" followed by the version when the client resolves a version
    And other tests show exactly "Task Notes" when the client rejects or resolves no version

  Scenario: Backend reports an unresolved version (edge case)
    Given the backend answers "GET /api/version" with the version "unknown"
    When I open the landing page
    Then the footer reads exactly "Task Notes"
    And the footer does not contain "unknown"
