Feature: TEST-10 Footer shows the build commit
  As a visitor of the Task Notes app
  I want the footer to show the short build commit next to the version
  So that I know exactly which build I am talking to

  Background:
    Given the backend is running at "http://localhost:8010"
    And the frontend is running at "http://localhost:5183"

  Scenario: Footer shows the first 7 characters of the commit next to the version
    Given the backend runs with BUILD_COMMIT "3f9c2a7b1d4e8f60a5b2c9d1e7f3a4b6c8d0e2f1"
    And GET /api/version returns version "0.1.0" and commit "3f9c2a7b1d4e"
    When I open the landing page
    Then the footer reads "Task Notes v0.1.0 (3f9c2a7)"

  Scenario: Footer shows no commit while the version request is pending or when it fails
    Given GET /api/version is blocked or has not answered yet
    When I open the landing page
    Then the footer reads exactly "Task Notes"
    And the footer does not contain "undefined", "null" or "error"

  Scenario: Component test covers the success, pending and failure paths
    Given the frontend test suite
    When I run the AppFooter component tests
    Then the success test passes
    And the pending test passes
    And the failure test passes

  Scenario: Footer shows the version alone when the backend reports an unknown commit (edge case)
    Given BUILD_COMMIT is unset so GET /api/version returns commit "unknown"
    When I open the landing page
    Then the footer reads exactly "Task Notes v0.1.0"
    And the footer does not contain "unknown", "undefined" or "()"
