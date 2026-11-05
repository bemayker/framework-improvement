Feature: TEST-08 Footer shows the app version
  As anyone looking at a running Task Notes instance
  I want the footer to show the version the backend reports
  So that I can tell which build I am on

  Background:
    Given the Task Notes frontend is running at "http://localhost:5183"
    And the backend is running at "http://localhost:8010"

  Scenario: Footer renders the version on the landing page (criterion 1)
    Given the backend's "/api/version" endpoint reports a version
    When I open the landing page "http://localhost:5183/"
    Then the footer identified by "app-footer" reads "Task Notes v" followed by that version

  Scenario: Footer shows the backend's version at runtime, not package.json's (criterion 2)
    Given the backend reports a version different from the "version" in frontend/package.json
    When I open the landing page
    Then the footer shows the backend's version
    And the browser requested "http://localhost:8010/api/version" to obtain it

  Scenario: Footer renders without a version when it cannot be resolved (criterion 3, edge case)
    Given the version endpoint is unreachable
    When I open the landing page
    Then the footer reads exactly "Task Notes"
    And it does not show "undefined", "null", "unknown" or a trailing gap
    And the rest of the page still renders

  Scenario: Component tests cover both the present and absent paths (criterion 4)
    Given the frontend test suite
    When I run the AppFooter component tests
    Then the version-present test passes
    And the version-absent tests pass
