Feature: TEST-08 Footer shows the app version
  As a visitor of the Task Notes app
  I want the footer to show the version reported by the backend
  So that I know which build I am talking to

  Background:
    Given the backend is running at "http://localhost:8010"
    And the frontend is running at "http://localhost:5183"

  Scenario: Footer renders the backend version on the landing page
    Given GET /api/version returns "0.1.0"
    When I open the landing page
    Then the footer reads "Task Notes v0.1.0"

  Scenario: The version comes from the backend at runtime, not the frontend package
    Given GET /api/version returns "0.1.0"
    And frontend/package.json declares version "0.0.0"
    When I open the landing page
    Then the footer shows "0.1.0"
    And the footer does not show "0.0.0"

  Scenario: Footer renders without a version when the version cannot be resolved
    Given GET /api/version is unreachable
    When I open the landing page
    Then the footer reads exactly "Task Notes"
    And the footer does not contain "undefined", "null" or "unknown"

  Scenario: Footer shows only the app name while the version request is pending
    Given GET /api/version has not answered yet
    When the landing page renders
    Then the footer reads "Task Notes"
    And once the request completes the footer reads "Task Notes v0.1.0"

  Scenario: Component test covers both the present and absent paths (edge case)
    Given the frontend test suite
    When I run the AppFooter component tests
    Then the version-present test passes
    And the version-absent test passes
