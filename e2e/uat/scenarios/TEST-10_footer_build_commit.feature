Feature: TEST-10 Footer shows the build commit
  As a visitor of the Task Notes app
  I want the footer to show the short build commit next to the version
  So that I can tell exactly which build the backend is running

  Background:
    Given the Task Notes project infrastructure (frontend, backend, database) is set up per docker-compose.yml
    And the application is running at "http://localhost:5183"
    And the backend is running at "http://localhost:8010"

  Scenario: Footer shows the first 7 characters of the commit next to the version
    Given the backend runs with BUILD_COMMIT "3f9c2ab71d04e5a6b7c8d9e0f1a2b3c4d5e6f708"
    And "GET /api/version" returns the commit "3f9c2ab71d04"
    When I open "http://localhost:5183" in a browser
    Then the footer identified by "app-footer" reads "Task Notes v0.1.0 (3f9c2ab)"
    And the commit is wrapped in the element identified by "app-footer-commit"

  Scenario: Footer shows no commit when the backend is unreachable
    Given the backend is stopped
    When I open the landing page
    Then the footer reads exactly "Task Notes"
    And there is no "app-footer-commit" element
    And the footer shows no "undefined", "null", "unknown", parentheses or error text

  Scenario: Footer shows no commit while the version request is pending
    Given the request to "GET /api/version" has not answered yet
    When the landing page renders
    Then the footer reads "Task Notes" with no placeholder text
    And once the request completes the footer shows the version and the commit

  Scenario: Footer shows the version alone when the backend reports an unknown commit (edge case)
    Given BUILD_COMMIT is unset so "GET /api/version" returns the commit "unknown"
    When I open the landing page
    Then the footer reads "Task Notes v0.1.0"
    And there is no "app-footer-commit" element
    And the footer shows no "unknown", "undefined", "null" or parentheses

  Scenario: Component tests cover the success, pending and failure paths
    Given the frontend test suite
    When I run the AppFooter component tests
    Then the test "renders the first 7 characters of the commit next to the version" passes
    And the test "renders no commit while the request is pending" passes
    And the test "renders no commit when the backend is unreachable" passes
