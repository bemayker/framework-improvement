Feature: TEST-08 Footer shows the app version from the backend
  As a visitor of the Task Notes app
  I want the footer to show the version reported by the running backend
  So that I know which build I am talking to

  Background:
    Given the Task Notes stack (frontend, backend, database) is running per docker-compose.yml
    And the frontend is served at "http://localhost:5183"
    And the backend answers "GET http://localhost:8010/api/version" with its "[project].version" from backend/pyproject.toml

  Scenario: Criterion 1 - Footer renders the version on the landing page
    Given the backend version is "0.1.0"
    When I open "http://localhost:5183/"
    Then the footer identified by "app-footer" reads "Task Notes v0.1.0"

  Scenario: Criterion 2 - Version comes from the backend at runtime, not the frontend package
    Given the frontend package version is "0.0.0" and the backend version is "0.1.0"
    When I open "http://localhost:5183/" with the browser network tab open
    Then a request to "/api/version" on the backend returns status 200
    And the footer reads "Task Notes v0.1.0"
    And the footer never shows "v0.0.0"

  Scenario: Criterion 3 - Unresolvable version renders the name only
    Given the backend container is stopped
    When I open "http://localhost:5183/"
    Then the footer reads exactly "Task Notes"
    And it contains no "v" prefix, no "undefined", no "null", no "unknown" and no trailing gap

  Scenario: Criterion 3 edge case - Backend reports the unknown sentinel
    Given the backend answers "/api/version" with {"version": "unknown"}
    When I open "http://localhost:5183/"
    Then the footer reads exactly "Task Notes"

  Scenario: Criterion 4 - Component tests cover both paths
    Given the frontend test suite
    When I run the AppFooter tests
    Then the test "renders the version returned by /api/version, not the frontend package version" passes
    And the test "renders the app name only when /api/version is unreachable" passes
    And 0 tests fail

  Scenario: Criterion 5 - Loading state shows the name only
    Given the request to "/api/version" is slow or blocked
    When I open "http://localhost:5183/"
    Then while the request is pending the footer reads "Task Notes" with no placeholder text
    And once the request completes the footer reads "Task Notes v0.1.0"
