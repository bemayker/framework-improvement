Feature: TEST-08 Footer shows the app version
  As a visitor of the Task Notes app
  I want the footer to show the version of the backend I am talking to
  So that I can tell which build of the app is running

  Background:
    Given the backend is running at "http://localhost:8010"
    And the frontend is running at "http://localhost:5183"
    And "backend/pyproject.toml" declares version "0.1.0" under [project]

  Scenario: Footer shows the backend version on the landing page
    When I open "http://localhost:5183" in a browser
    And I scroll to the bottom of the page
    Then the footer reads "Task Notes v0.1.0"

  Scenario: The version comes from the backend at runtime, not from the frontend package
    Given "frontend/package.json" declares version "0.0.0"
    When I open "http://localhost:5183" in a browser
    Then the browser requests "GET http://localhost:8010/api/version" and receives status 200
    And the footer reads "Task Notes v0.1.0"
    And the footer does not read "Task Notes v0.0.0"

  Scenario: Footer renders without a version when the backend is unreachable
    Given the backend is stopped
    When I open "http://localhost:5183" in a browser
    Then the footer reads exactly "Task Notes"
    And the footer shows no "v", "undefined", "null" or "unknown"
    And the footer has no trailing space or gap after "Task Notes"
    And the page shows no error message

  Scenario: The component tests cover both the present and absent version paths
    When I run the AppFooter component tests
    Then the run passes
    And the tests "renders the backend version once the fetch resolves" and "renders the app name without a version when the backend is unreachable" are among them

  Scenario: Footer shows only the app name while the version request is pending
    Given the network is throttled to "Slow 3G"
    When I reload "http://localhost:5183" and watch the footer before the version request completes
    Then the footer reads "Task Notes" with no placeholder, no "loading" text and no gap
    And once the request completes the footer reads "Task Notes v0.1.0"

  Scenario: Footer renders without a version when the backend reports the unknown sentinel (edge case)
    Given the backend answers "GET /api/version" with {"version": "unknown"}
    When I open "http://localhost:5183" in a browser
    Then the footer reads exactly "Task Notes"
    And the footer does not show "unknown"
