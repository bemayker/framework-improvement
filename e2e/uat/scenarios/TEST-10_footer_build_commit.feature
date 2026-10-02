Feature: TEST-10 Footer shows the build commit
  As anyone looking at a running instance of Task Notes
  I want the footer to show the short build commit beside the version
  So that I can tell exactly which build I am on

  Background:
    Given the stack is running via "docker compose up --build"
    And the frontend is served at "http://localhost:5183"
    And the backend is served at "http://localhost:8010"

  Scenario: AC1 - Footer shows the first 7 commit characters next to the version
    Given the backend was started with BUILD_COMMIT "abcdef1234567890"
    And "GET http://localhost:8010/api/version" returns "commit" "abcdef1234567890"
    When I open "http://localhost:5183"
    Then the element "app-version" contains exactly "0.1.0"
    And the element "app-commit" contains exactly "abcdef1"
    And the element "app-footer" reads "Task Notes v0.1.0 (abcdef1)"

  Scenario: AC2 - Footer shows no commit, undefined or error while the request is pending or has failed (edge case)
    Given network throttling makes the "/api/version" request slow, or requests to it are blocked
    When I reload "http://localhost:5183"
    Then the element "app-footer" reads exactly "Task Notes"
    And no element "app-commit" exists
    And the footer shows none of "undefined", "null", "unknown" or an error message

  Scenario: Unknown commit - Footer shows the version alone (edge case)
    Given the backend was started without BUILD_COMMIT
    And "GET http://localhost:8010/api/version" returns "commit" "unknown"
    When I open "http://localhost:5183"
    Then the element "app-footer" reads "Task Notes v0.1.0"
    And no element "app-commit" exists
    And the footer does not show "unknown" or empty parentheses

  Scenario: AC3 - Component tests cover the success, pending and failure paths
    Given the frontend test suite
    When I run "npm --prefix frontend test"
    Then the AppFooter tests for the success, pending and failure cases all pass
