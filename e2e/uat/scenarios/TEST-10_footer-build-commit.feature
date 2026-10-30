Feature: TEST-10 Footer shows the build commit
  As a visitor of the Task Notes app
  I want the footer to show the short build commit next to the version
  So that I can tell exactly which build I am talking to

  Background:
    Given the Task Notes stack (frontend, backend, database) is running per docker-compose.yml
    And the frontend is at "http://localhost:5183" and the backend at "http://localhost:8010"

  Scenario: Footer shows the first 7 characters of the commit next to the version
    Given the backend runs with BUILD_COMMIT "3f9c2a1b7d4e5f60718293a4b5c6d7e8f9012345"
    And "GET /api/version" answers with commit "3f9c2a1b7d4e"
    When I open "http://localhost:5183/"
    Then the footer identified by "app-footer" reads "Task Notes v0.1.0 (3f9c2a1)"

  Scenario: Footer shows no commit while the request is pending or after it fails
    Given "GET /api/version" is slow, unreachable or answers an error
    When I open the landing page
    Then until the request resolves, and after it fails, the footer reads exactly "Task Notes"
    And it contains no "v", "undefined", "null", "(" or error text

  Scenario: Component test covers the success, pending and failure paths
    Given the frontend test suite
    When I run the AppFooter tests
    Then a test for the success path (version with commit) passes
    And a test for the pending path passes
    And a test for the failure path passes

  Scenario: Backend reports commit "unknown" (edge case)
    Given the backend runs without BUILD_COMMIT
    And "GET /api/version" answers with commit "unknown"
    When I open the landing page
    Then the footer reads "Task Notes v0.1.0"
    And it contains no "(unknown)" and no empty parentheses
