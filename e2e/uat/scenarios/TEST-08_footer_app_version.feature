Feature: TEST-08 Footer shows the app version
  As a visitor of the Task Notes app
  I want the footer to show the version the backend reports
  So that I can tell which build I am looking at

  Background:
    Given the Task Notes stack (frontend, backend, database) is running per docker-compose.yml
    And the frontend is served at "http://localhost:5183"
    And the backend's "GET /api/version" is served at "http://localhost:8010"

  Scenario: Footer renders the version on the landing page
    Given "backend/pyproject.toml" declares version "0.1.0"
    When I open "http://localhost:5183" in a browser
    Then the footer identified by "app-footer" reads exactly "Task Notes v0.1.0"

  Scenario: Version comes from the backend at runtime, not from the frontend package
    Given "frontend/package.json" declares version "0.0.0"
    And "backend/pyproject.toml" declares version "0.1.0"
    When I open the landing page
    Then the browser requests "GET /api/version" and it answers with status 200
    And the footer shows the backend's version "0.1.0"
    And the footer does not show "v0.0.0"

  Scenario: Footer shows the app name alone when the version cannot be resolved
    Given the backend is unreachable
    When I open the landing page
    Then the footer reads exactly "Task Notes"
    And it does not contain "undefined", "null", "unknown" or a dangling "v"
    And there is no empty gap after the name

  Scenario: Component test covers both the version-present and version-absent paths
    Given the frontend test suite
    When I run the AppFooter component tests
    Then a case asserts "Task Notes v0.1.0" when the version resolves
    And cases assert "Task Notes" alone for a rejected request, "unknown" and an empty version

  Scenario: Footer shows the app name alone before the version request settles
    Given the version request has not answered yet
    When the landing page first renders
    Then the footer reads exactly "Task Notes"
    And it shows no placeholder text and no spinner
    And once the request completes the footer changes to "Task Notes v0.1.0" without a reload

  Scenario: Backend stopped and restarted (edge case)
    Given the backend is stopped and the footer reads "Task Notes"
    When I start the backend again and reload the page
    Then the footer reads "Task Notes v0.1.0" again
