Feature: TEST-08 Footer shows the app version
  As a visitor of the Task Notes app
  I want the footer to show the version the backend reports
  So that I know which build of the API I am talking to

  Background:
    Given the Task Notes stack (frontend, backend, database) is running per docker-compose.yml
    And the frontend is reachable at "http://localhost:5183"
    And the backend answers "http://localhost:8010/api/version"

  Scenario: Footer renders the version on the landing page
    Given the backend version in backend/pyproject.toml is "0.1.0"
    When I open "http://localhost:5183/" in a browser
    Then the footer identified by "app-footer" reads exactly "Task Notes v0.1.0"

  Scenario: Version comes from the backend at runtime, not from the frontend package
    Given the backend version is "0.1.0" and the frontend package version is "0.0.0"
    When I open the landing page
    Then the browser requests "GET http://localhost:8010/api/version" and receives status 200
    And the footer shows "v0.1.0"
    And the footer does not show "v0.0.0"

  Scenario: Backend rebuilt with a new version is reflected without rebuilding the frontend
    Given only the backend is rebuilt with the version "0.1.1"
    When I reload the landing page
    Then the footer reads "Task Notes v0.1.1"

  Scenario: Footer renders without a version when the version cannot be resolved
    Given the backend version endpoint is unreachable
    When I open the landing page
    Then the footer reads exactly "Task Notes"
    And the footer does not contain "undefined", "null" or "unknown"
    And there is no element identified by "app-footer-version"
    And the rest of the page still renders

  Scenario: Footer shows the app name alone while the version request is pending (edge case)
    Given the version request is slow
    When I open the landing page
    Then until the request completes the footer reads exactly "Task Notes"
    And once the request completes " v0.1.0" appears after the name

  Scenario: A component test asserts both paths
    Given the frontend unit suite
    When I run the AppFooter and version client tests
    Then "renders the version returned by the backend" passes
    And "renders the app name alone when the version request fails" passes
    And 0 tests fail
