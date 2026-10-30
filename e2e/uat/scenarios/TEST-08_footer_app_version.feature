Feature: TEST-08 Footer shows the app version
  As a visitor of the Task Notes app
  I want the footer to show the version the running backend reports
  So that I can tell which build I am talking to

  Background:
    Given the Task Notes stack (frontend, backend, database) is running per docker-compose.yml
    And the frontend is at "http://localhost:5183" and the backend at "http://localhost:8010"

  Scenario: Footer renders the backend version on the landing page
    Given the backend answers "GET /api/version" with the version from backend/pyproject.toml
    When I open "http://localhost:5183/"
    Then the footer identified by "app-footer" reads "Task Notes v" followed by that version

  Scenario: Version comes from the backend at runtime, not from the frontend package
    Given frontend/package.json declares a different version than backend/pyproject.toml
    When I open the landing page
    Then the footer shows the backend's version
    And it does not show the frontend package version
    And the browser made a "GET /api/version" request that returned 200

  Scenario: Footer renders without a version when it cannot be resolved
    Given "GET /api/version" is unreachable or answers an error
    When I open the landing page
    Then the footer reads exactly "Task Notes"
    And it contains no "v", "undefined", "null" or "unknown"
    And there is no trailing gap

  Scenario: Component tests cover both the present and absent paths
    Given the frontend test suite
    When I run the AppFooter tests
    Then a test for the version-present path passes
    And a test for the version-absent path passes

  Scenario: Backend stopped while the page is open (edge case)
    Given the backend container is stopped
    When I open the landing page and wait up to 5 seconds
    Then the footer reads exactly "Task Notes"
    And the rest of the page, including the footer landmark, is still rendered
