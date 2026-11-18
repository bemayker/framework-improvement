Feature: TEST-10 Footer shows the build commit
  As a visitor of the Task Notes app
  I want the footer to show the short build commit next to the version
  So that I can tell exactly which build of the app is running

  Background:
    Given the frontend is running at "http://localhost:5183"
    And the backend is running at "http://localhost:8010"

  Scenario: Footer shows the first 7 characters of the commit next to the version
    Given the backend was started with BUILD_COMMIT "0123456789abcdef0123456789abcdef01234567"
    And "GET http://localhost:8010/api/version" returns {"version":"0.1.0","commit":"0123456789ab"}
    When I open "http://localhost:5183" in a browser
    Then the footer reads exactly "Task Notes v0.1.0 (0123456)"
    And the commit shows 7 characters, not the 12 the backend sent

  Scenario: Footer shows only the app name while the version request is pending
    Given the backend was started with BUILD_COMMIT "0123456789abcdef0123456789abcdef01234567"
    And the network is throttled to "Slow 3G"
    When I reload "http://localhost:5183" and watch the footer before the version request completes
    Then the footer reads "Task Notes" with no version, no brackets and no "undefined"

  Scenario: Footer shows only the app name when the backend is unreachable
    Given the backend is stopped
    When I open "http://localhost:5183" in a browser
    Then the footer reads exactly "Task Notes"
    And the footer shows no "undefined", "null", "unknown" or error message

  Scenario: Footer shows the version alone when the backend reports an unknown commit (edge case)
    Given the backend was started with no BUILD_COMMIT set
    And "GET http://localhost:8010/api/version" returns {"version":"0.1.0","commit":"unknown"}
    When I open "http://localhost:5183" in a browser
    Then the footer reads exactly "Task Notes v0.1.0"
    And the footer shows no brackets and no "unknown"

  Scenario: The component tests cover the success, pending and failure paths
    When I run the AppFooter component tests
    Then the run passes
    And the tests "renders the short commit next to the version once the fetch resolves", "renders the app name without a version or commit while the fetch is pending" and "renders the app name without a version or commit when the backend is unreachable" are among them
