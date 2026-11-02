Feature: TEST-10 Footer shows the build commit
  As a visitor of the Task Notes app
  I want the footer to show the short build commit next to the version
  So that I can tell exactly which build of the backend I am looking at

  Background:
    Given the Task Notes stack (db, backend, frontend) is running per docker-compose.yml
    And the frontend is served at "http://localhost:5183"
    And the backend is served at "http://localhost:8010"

  Scenario: Footer shows the first 7 characters of the commit next to the version (criterion 1)
    Given the backend runs with BUILD_COMMIT "abc1234def5678"
    And "GET /api/version" returns version "0.1.0" and commit "abc1234def56"
    When I open "http://localhost:5183/" in a browser
    Then the footer identified by "app-footer" reads exactly "Task Notes v0.1.0 (abc1234)"
    And the element identified by "app-footer-commit" reads "(abc1234)"

  Scenario: Footer shows the version alone when the request fails (criterion 2)
    Given the backend is stopped
    When I open "http://localhost:5183/" in a browser
    Then the footer reads exactly "Task Notes"
    And the footer does not contain "undefined", "null", "unknown", "()" or an error message

  Scenario: Footer shows the version alone while the request is pending (criterion 2)
    Given the backend answers "GET /api/version" only after a long delay
    When I open "http://localhost:5183/" in a browser
    Then until the response arrives the footer reads exactly "Task Notes"
    And the footer does not contain "undefined", "null", "()" or an error message

  Scenario: The backend reports the commit "unknown" (edge case)
    Given the backend runs without BUILD_COMMIT
    And "GET /api/version" returns version "0.1.0" and commit "unknown"
    When I open "http://localhost:5183/" in a browser
    Then the footer reads exactly "Task Notes v0.1.0"
    And the element identified by "app-footer-commit" is absent
    And the footer does not contain "unknown"

  Scenario: A component test covers the success, pending and failure paths (criterion 3)
    Given the frontend test suite is available
    When I run the AppFooter component tests
    Then a test covers the success path with a commit
    And a test covers the pending path
    And a test covers the failure path
    And 0 tests fail
