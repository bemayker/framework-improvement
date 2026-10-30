Feature: TEST-08 Footer shows the app version
  As a visitor of the Task Notes app
  I want the footer to show the version the backend reports at runtime
  So that I can tell which build I am looking at

  Background:
    Given the Task Notes project infrastructure (frontend, backend, database) is set up per docker-compose.yml
    And the frontend is running at "http://localhost:5183"
    And the backend is running at "http://localhost:8010"

  Scenario: Footer renders the version string on the landing page
    Given the backend reports version "0.1.0" at "/api/version"
    When I open "http://localhost:5183/" in a browser
    Then the footer identified by "app-footer" reads "Task Notes v0.1.0"

  Scenario: The version comes from the backend at runtime, not from package.json
    Given the backend reports version "0.1.0" at "/api/version"
    And the frontend package declares version "0.0.0"
    When I open the landing page
    Then the browser requests "http://localhost:8010/api/version" and receives status 200
    And the footer shows "0.1.0"
    And the footer does not show "0.0.0"

  Scenario: The footer follows the backend when its version changes
    Given the backend has been rebuilt with version "0.1.1" and the frontend has not been rebuilt
    When I reload the landing page
    Then the footer reads "Task Notes v0.1.1"

  Scenario: Footer shows the app name alone while the version is loading
    Given the "/api/version" request is slowed down
    When I open the landing page
    Then until the request completes the footer reads exactly "Task Notes"
    And it contains no "v", "undefined", "null" or "loading" text
    And once the request completes the footer reads "Task Notes v0.1.0"

  Scenario: Footer shows the app name alone when the backend is unreachable (edge case)
    Given the backend is stopped
    When I open the landing page
    Then the "/api/version" request fails
    And the footer reads exactly "Task Notes"
    And it is not blank
    And it contains no "v", "undefined", "null" or "unknown" text and no trailing gap

  Scenario: Footer recovers once the backend is back
    Given the backend was stopped and has been started again
    When I reload the landing page
    Then the footer reads "Task Notes v0.1.0"

  Scenario: Component tests cover both the present and the absent path
    Given the frontend test suite
    When I run the AppFooter and version client tests
    Then 0 tests fail
    And the output lists a version-present, a loading and a failure test
