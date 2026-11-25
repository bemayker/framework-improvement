Feature: TEST-08 Footer shows the backend app version
  As a visitor of the Task Notes app
  I want the footer to show the version the backend reports
  So that I know which build I am looking at, even when the frontend was built against an older backend

  Background:
    Given the Task Notes stack (frontend, backend, database) is running per docker-compose.yml
    And the frontend is served at "http://localhost:5183"
    And the backend is served at "http://localhost:8010"

  Scenario: Footer renders the backend version on the landing page
    Given the "version" in backend/pyproject.toml is read
    When I open "http://localhost:5183" in a browser
    Then the footer identified by "app-footer" reads "Task Notes v" followed by that version
    And the version is wrapped in the element identified by "app-footer-version"

  Scenario: Version comes from the backend at runtime, not from the frontend package
    Given the backend reports a version different from the "version" in frontend/package.json
    When I open the landing page
    Then the browser requests "http://localhost:8010/api/version" and receives status 200
    And the footer shows the backend's version
    And the footer does not show the version from frontend/package.json

  Scenario: Footer shows only the app name when the version cannot be resolved
    Given "http://localhost:8010/api/version" is unreachable
    When I open the landing page and the version request has failed
    Then the footer reads exactly "Task Notes"
    And the footer contains no "undefined", "null", "unknown" or trailing space
    And no element identified by "app-footer-version" is present

  Scenario: Footer shows only the app name while the version request is pending (edge case)
    Given "http://localhost:8010/api/version" answers slowly
    When I open the landing page before the version request completes
    Then the footer reads exactly "Task Notes" with no placeholder
    And once the request completes the footer gains " v" followed by the backend's version

  Scenario: Component tests assert both the version-present and version-absent paths
    Given the frontend test suite
    When I run the AppFooter component tests
    Then a test asserts the footer shows the backend's version
    And a test asserts the footer shows only "Task Notes" while the version is loading
    And a test asserts the footer shows only "Task Notes" when the version request fails

  Scenario: The version endpoint returns the backend's version
    Given the backend is running
    When I request GET "http://localhost:8010/api/version"
    Then I receive status 200
    And the body is a JSON object whose "version" equals the "version" in backend/pyproject.toml
