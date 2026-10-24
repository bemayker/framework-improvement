Feature: TEST-10 Footer shows the build commit
  As a visitor of the Task Notes app
  I want the footer to show the short build commit next to the version
  So that I can tell exactly which build I am looking at

  Background:
    Given the Task Notes stack (frontend, backend, database) is running per docker-compose.yml
    And the frontend is at "http://localhost:5183" and the backend at "http://localhost:8010"

  Scenario: Footer shows the first 7 characters of the commit next to the version (criterion 1)
    Given the backend runs with BUILD_COMMIT "0123456789abcdef"
    And the backend answers "GET /api/version" with {"version": "0.1.0", "commit": "0123456789ab"}
    When I open "http://localhost:5183/"
    Then the footer identified by "app-footer" reads "Task Notes v0.1.0 (0123456)"
    And the element identified by "app-footer-commit" reads "(0123456)"

  Scenario: Footer shows the version alone when the backend has no usable commit (criterion 2, edge case)
    Given the backend runs with no BUILD_COMMIT
    And the backend answers "GET /api/version" with {"version": "0.1.0", "commit": "unknown"}
    When I open "http://localhost:5183/"
    Then the footer reads exactly "Task Notes v0.1.0"
    And no element identified by "app-footer-commit" is present
    And the footer contains none of "undefined", "null" or "unknown"

  Scenario: Footer shows no error when the request fails (criterion 2)
    Given the backend is stopped
    When I open "http://localhost:5183/"
    Then the footer reads exactly "Task Notes"
    And the footer contains none of "undefined", "null", "unknown" or an error message
    And no element identified by "app-footer-version" is present
    And no element identified by "app-footer-commit" is present
    And the heading and note form still render

  Scenario: Footer shows no version or commit while the request is pending (criterion 2)
    Given the network is throttled to "Slow 3G"
    When I open "http://localhost:5183/" before "GET /api/version" completes
    Then the footer reads exactly "Task Notes"
    And once the request completes the footer reads "Task Notes v0.1.0"

  Scenario: Component tests cover the success, pending and failure paths (criterion 3)
    Given the frontend test suite
    When I run the AppFooter component tests
    Then a success-with-commit test passes
    And a success-without-commit test passes
    And a pending test passes
    And a failure test passes
    And 0 tests fail
