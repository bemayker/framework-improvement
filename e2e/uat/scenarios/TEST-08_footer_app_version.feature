Feature: TEST-08 Footer shows the app version from the backend
  As a visitor of the Task Notes app
  I want the footer to show the version the running backend reports
  So that I know which build I am talking to

  Background:
    Given the Task Notes project infrastructure (frontend, backend, database) is set up per docker-compose.yml
    And the application is running at "http://localhost:5183"
    And the backend is reachable at "http://localhost:8010"

  Scenario: Footer renders the backend version on the landing page (criterion 1)
    Given the backend answers GET /api/version with a version
    When I open "http://localhost:5183" in a browser
    Then the footer identified by "app-footer" reads "Task Notes v" followed by that version
    And the version is shown in the element identified by "app-version"

  Scenario: The version comes from the backend, not from the frontend package (criterion 2)
    Given the backend reports a version different from the "version" field of frontend/package.json
    When I open the landing page
    Then the footer shows the backend's version
    And the footer does not show the frontend package version

  Scenario: The footer shows only the app name when the backend is unreachable (criterion 3)
    Given the backend is stopped or the request to GET /api/version fails
    When I open the landing page
    Then the footer reads exactly "Task Notes"
    And no element identified by "app-version" is present
    And the footer does not contain "undefined", "null" or "unknown"
    And there is no trailing gap after "Task Notes"

  Scenario: The component tests cover both the present and the absent path (criterion 4)
    Given the frontend test suite
    When I run it
    Then the AppFooter test for the version being present passes
    And the AppFooter test for the version being absent passes

  Scenario: Before the request resolves the footer shows only the app name (criterion 5)
    Given the network is slow
    When the landing page loads
    Then the footer first reads "Task Notes" with no version and no placeholder text
    And once the response arrives the footer reads "Task Notes v" followed by the backend's version

  Scenario: The backend reports its unknown sentinel (edge case)
    Given the backend answers GET /api/version with the version "unknown"
    When I open the landing page
    Then the footer reads exactly "Task Notes"
    And the word "unknown" is not shown anywhere in the footer
