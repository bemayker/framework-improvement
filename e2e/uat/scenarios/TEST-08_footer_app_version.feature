Feature: TEST-08 Footer shows the app version
  As a visitor of the Task Notes app
  I want the footer to show the version the backend reports
  So that I know which build I am talking to, even when the frontend and backend were deployed separately

  Background:
    Given the Task Notes stack (db, backend, frontend) is running per docker-compose.yml
    And the frontend is served at "http://localhost:5183"
    And the backend is served at "http://localhost:8010"

  Scenario: Footer renders the backend version on the landing page
    Given "GET /api/version" answers {"version": "0.1.0"}, the version in backend/pyproject.toml
    When I open "http://localhost:5183"
    Then the footer identified by "app-footer" reads "Task Notes v0.1.0"

  Scenario: Footer follows the backend, not the frontend bundle
    Given the frontend package.json declares version "0.0.0"
    And the backend reports version "9.9.9-partial" without the frontend being rebuilt
    When I open "http://localhost:5183"
    Then the footer reads "Task Notes v9.9.9-partial"
    And the footer does not contain "v0.0.0"

  Scenario: Footer renders without a version when it cannot be resolved
    Given the backend is unreachable, or reports the "unknown" sentinel
    When I open "http://localhost:5183"
    Then the footer reads exactly "Task Notes"
    And the footer shows no "v", "undefined", "null", "unknown" or trailing gap

  Scenario: Component tests cover both the present and the absent version
    Given the frontend unit suite
    When I run the AppFooter and version client tests
    Then the version-present test and the version-absent test both pass

  Scenario: Footer shows the app name alone while the version request is pending
    Given the version request has not answered yet
    When the landing page renders
    Then the footer reads "Task Notes" with no "v" and no placeholder text
    And once the request resolves the footer reads "Task Notes v0.1.0"

  Scenario: Unreachable backend leaves the rest of the page usable (edge case)
    Given the backend container is stopped
    When I open "http://localhost:5183"
    Then the footer reads exactly "Task Notes"
    And the heading identified by "landing-title" is still shown
