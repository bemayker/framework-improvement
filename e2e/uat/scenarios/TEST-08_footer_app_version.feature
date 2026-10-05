Feature: TEST-08 Footer shows the app version
  As anyone looking at a running instance of the Task Notes app
  I want the footer to show the version reported by the backend at runtime
  So that I can tell which build I am looking at

  Background:
    Given the Task Notes stack is running per docker-compose.yml
    And the frontend is served at "http://localhost:5183"
    And the backend is served at "http://localhost:8010"

  Scenario: Criterion 1 - The footer renders the version on the landing page
    Given the backend answers "GET /api/version" with a "version" value
    When I open "http://localhost:5183/"
    Then the footer identified by "app-footer" reads "Task Notes v" followed by that version
    And the version is shown inside the element identified by "app-footer-version"
    And the footer shows nothing of any "commit" value

  Scenario: Criterion 2 - The version comes from the backend at runtime, not from the component
    Given the backend reports a version different from the "version" in frontend/package.json
    When I open "http://localhost:5183/"
    Then the footer shows the backend's version
    And the footer does not show the frontend package version
    And the browser made one request to "/api/version" whose "version" is the footer's value

  Scenario: Criterion 3 - An unresolvable version renders without it
    Given the backend is not reachable
    When I open "http://localhost:5183/"
    Then the footer reads "Task Notes · version unavailable"
    And the element identified by "app-footer-version" is absent
    And the footer text contains none of "undefined", "null" or "unknown"

  Scenario: Criterion 3 - The loading state shows the name alone
    Given the "/api/version" request is slowed down
    When I open "http://localhost:5183/"
    Then the footer first reads "Task Notes" alone, with no version and no separator
    And it then changes to "Task Notes v" followed by the backend's version

  Scenario: Edge case - The backend reports the sentinel version "unknown"
    Given the backend answers "GET /api/version" with the version "unknown"
    When I open "http://localhost:5183/"
    Then the footer reads "Task Notes · version unavailable"
    And the word "unknown" is not shown as a version

  Scenario: Criterion 4 - The component test covers both paths
    Given the frontend test suite
    When I run the AppFooter tests
    Then a test for the version-present path passes
    And tests for the version-absent paths (null result and rejected request) pass
