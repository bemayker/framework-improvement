Feature: TEST-08 Footer shows the app version
  As a visitor of the Task Notes app
  I want the footer to show the version reported by the backend
  So that I know which build of the API I am talking to

  Background:
    Given the Task Notes stack (db, backend, frontend) is running per docker-compose.yml
    And the frontend is at "http://localhost:5183" and the backend at "http://localhost:8010"

  Scenario: Footer renders the backend version on the landing page (criterion 1)
    Given the backend answers "GET /api/version" with a version
    When I open "http://localhost:5183/"
    Then the footer identified by "app-footer" reads "Task Notes v" followed by that version

  Scenario: The version comes from the backend at runtime, not from package.json (criterion 2)
    Given the backend reports a version different from the "version" field of frontend/package.json
    When I open the landing page
    Then the footer shows the backend's version
    And the frontend package version appears nowhere in the footer

  Scenario: An unresolvable version renders without it (criterion 3)
    Given the version endpoint cannot be resolved
    When I open the landing page
    Then the footer reads exactly "Task Notes"
    And it does not contain "undefined", "null" or "unknown"
    And there is no trailing gap after "Task Notes"

  Scenario: Component tests cover both paths (criterion 4)
    Given the frontend unit tests
    When I run them
    Then the AppFooter test for the version present passes
    And the AppFooter test for the version absent passes

  Scenario: Loading state shows only the app name (criterion 5)
    Given the version request has not answered yet
    When the landing page renders
    Then the footer reads exactly "Task Notes"

  Scenario: Backend unreachable (edge case)
    Given the backend is stopped or requests to "/api/version" are blocked
    When I open the landing page
    Then the page still renders
    And the footer reads exactly "Task Notes" with no "app-version" element
    And when the backend is available again and I reload, the footer shows "Task Notes v" and the version
