Feature: TEST-10 Footer shows the build commit
  As a visitor of the Task Notes app
  I want the footer to show the short build commit next to the version
  So that I can tell exactly which build I am looking at

  Background:
    Given the Task Notes stack (frontend, backend, database) is running per docker-compose.yml
    And the frontend is served at "http://localhost:5183"
    And the backend is served at "http://localhost:8010"

  Scenario: Footer shows the 7-character commit next to the version (criterion 1)
    Given the backend was started with BUILD_COMMIT "0515c74d9e2f1a3b"
    And "GET /api/version" answers version "0.1.0" and commit "0515c74d9e2f"
    When I open "http://localhost:5183/"
    Then the footer identified by "app-footer" reads "Task Notes v0.1.0 (0515c74)"
    And the commit is shown in the element identified by "app-footer-commit"

  Scenario: Pending or failed request shows the version alone, never undefined or an error (criterion 2)
    Given the version request is slow or the backend is stopped so "/api/version" does not answer
    When I open "http://localhost:5183/"
    Then the footer reads exactly "Task Notes"
    And it does not show "undefined", "null", "unknown" or an error message
    And no element identified by "app-footer-commit" is present

  Scenario: Component tests cover the success, pending and failure paths (criterion 3)
    Given the frontend test suite
    When I run the AppFooter, version client and LandingPage tests
    Then the test where the client resolves a version and commit passes
    And the test where the client never settles passes
    And the test where the client rejects passes
    And the run reports 0 failed

  Scenario: Commit is unavailable so the version shows alone (edge case)
    Given the backend was started without BUILD_COMMIT
    And "GET /api/version" answers version "0.1.0" and commit "unknown"
    When I open "http://localhost:5183/"
    Then the footer reads exactly "Task Notes v0.1.0"
    And no element identified by "app-footer-commit" is present
    And the footer does not show "unknown" or empty parentheses
