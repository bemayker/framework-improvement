Feature: TEST-08 Footer shows the app version
  As a visitor of the Task Notes app
  I want the footer to show the version the backend reports
  So that I can tell which build I am looking at

  Background:
    Given the Task Notes project infrastructure (frontend, backend, database) is set up per docker-compose.yml
    And the application is running at "http://localhost:5183"

  Scenario: Footer renders the version on the landing page
    Given the backend is running and reports version "0.1.0" at "/api/version"
    When I open "http://localhost:5183" in a browser
    Then the footer identified by "app-footer" reads "Task Notes v0.1.0"

  Scenario: Footer version comes from the backend, not from the frontend package
    Given the backend reports version "0.1.0"
    And the "version" field of frontend/package.json is "0.0.0"
    When I open the landing page
    Then the footer shows "0.1.0"
    And the footer does not show "0.0.0"
    And the browser made a GET request to "/api/version" that answered 200

  Scenario: Footer shows only the app name when the version cannot be resolved
    Given the backend is stopped
    When I open the landing page
    Then the footer reads exactly "Task Notes"
    And the footer does not contain "v", "undefined", "null" or "unknown"
    And there is no trailing gap after the name

  Scenario: Footer shows only the app name while the version is loading (edge case)
    Given the network is throttled so that "/api/version" answers slowly
    When I open the landing page
    Then until the request completes the footer reads "Task Notes" with no placeholder text
    And once it completes the footer reads "Task Notes v0.1.0"

  Scenario: Component tests cover both the present and the absent version
    Given the frontend test suite
    When I run the AppFooter tests
    Then they pass
    And one test covers a version being present and another covers it being absent
