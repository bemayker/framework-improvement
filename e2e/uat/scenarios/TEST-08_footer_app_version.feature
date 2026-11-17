Feature: TEST-08 Footer shows the app version
  As a visitor of the Task Notes app
  I want the footer to show the version the backend reports
  So that I can tell which build I am looking at

  Background:
    Given the backend is running at "http://localhost:8010"
    And the frontend is running at "http://localhost:5183"

  Scenario: Footer renders the backend version on the landing page
    Given the "version" under [project] in backend/pyproject.toml is noted
    When I open "http://localhost:5183/"
    Then the footer identified by "app-footer" reads "Task Notes v" followed by that version

  Scenario: Version comes from the backend at runtime
    Given the backend reports version "9.9.9" at GET /api/version
    When I open the landing page
    Then the footer reads "Task Notes v9.9.9"
    And the footer does not show the version from frontend/package.json

  Scenario: Unresolved version renders without it
    Given GET /api/version is unreachable or reports no usable version
    When I open the landing page
    Then the footer reads exactly "Task Notes"
    And it shows no "undefined", "null", "unknown" or trailing gap

  Scenario: Component test covers both paths
    Given the frontend test suite
    When I run the AppFooter tests
    Then the version-present and version-absent tests pass

  Scenario: Loading state shows no version
    Given GET /api/version has not answered yet
    When the landing page renders
    Then the footer reads exactly "Task Notes" with no placeholder
    And once the request resolves the footer reads "Task Notes v" followed by the backend version

  Scenario: Backend unreachable leaves the footer in place (edge case)
    Given the backend is stopped
    When I open the landing page
    Then the footer is still visible and reads exactly "Task Notes"
