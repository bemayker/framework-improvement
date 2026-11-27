Feature: TEST-08 Footer shows the app version
  As anyone looking at a running Task Notes instance
  I want the footer to show the version reported by the backend
  So that I can tell which build I am on

  Background:
    Given the Task Notes stack (frontend, backend, database) is running per docker-compose.yml
    And the frontend is at "http://localhost:5183" and the backend at "http://localhost:8010"

  Scenario: Footer renders the backend's version on the landing page (criterion 1)
    Given the backend reports a version at "GET /api/version"
    When I open the landing page
    Then the footer reads "Task Notes v" followed by that version

  Scenario: The version comes from the backend, not from the frontend package (criterion 2)
    Given the backend reports 0.1.0 and frontend/package.json says 0.0.0
    When I open the landing page
    Then the footer shows 0.1.0
    And the browser requested "/api/version" and got 200 with {"version":"0.1.0"}
    And the footer component contains no version literal and no package.json import

  Scenario: Footer renders without a version when it cannot be resolved (criterion 3)
    Given the backend is stopped
    When I open the landing page
    Then the footer reads exactly "Task Notes"
    And it shows no "v", "undefined", "null", "unknown" or trailing blank space

  Scenario: Component tests cover both paths (criterion 4)
    Given the frontend test suite
    When I run the AppFooter tests
    Then the version-present and version-absent cases pass

  Scenario: Footer reads "Task Notes" while the version request is pending (criterion 5)
    Given the backend answers slowly
    When the landing page first renders
    Then the footer reads exactly "Task Notes" with no placeholder and is not blank
    And once the request completes the footer shows "Task Notes v" followed by the version

  Scenario: Backend answers with an unusable body (edge case)
    Given "GET /api/version" answers 200 with {"version": "unknown"}
    When I open the landing page
    Then the footer reads exactly "Task Notes"
