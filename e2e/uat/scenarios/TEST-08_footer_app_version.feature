Feature: TEST-08 Footer shows the app version served by the backend
  As a visitor of the Task Notes app
  I want the footer to show the version the running backend reports
  So that I know which build I am looking at, even if the frontend was rebuilt separately

  Background:
    Given the Task Notes project infrastructure (frontend, backend, database) is set up per docker-compose.yml
    And the application is running at "http://localhost:5183"

  Scenario: Footer shows the version the backend reports (criterion 1)
    Given the backend's GET /api/version returns {"version": "0.1.0"}
    When I open "http://localhost:5183" in a browser
    Then the footer reads "Task Notes v0.1.0"

  Scenario: The version comes from the backend, not the frontend package (criterion 2)
    Given the frontend package version is "0.0.0" and the backend's version is "0.1.0"
    When I open the landing page
    Then the footer shows "0.1.0"
    And the footer does not show "0.0.0"
    And the browser requested GET /api/version from the backend

  Scenario: Footer shows the app name alone when the version cannot be resolved (criterion 3, edge case)
    Given the backend is stopped
    When I open the landing page
    Then the page still renders and the footer reads exactly "Task Notes"
    And the footer does not contain "undefined", "null" or "unknown"
    And there is no trailing space or empty gap after the app name
    And no element identified by "app-version" is present in the footer

  Scenario: The component tests cover version present and version absent (criterion 4)
    Given the frontend test suite
    When I run the AppFooter tests
    Then they pass
    And they include a test for the resolved version and a test for the failed request

  Scenario: GET /api/version returns the backend's version (criterion 5)
    Given the backend is running
    When I request GET /api/version
    Then the response body is {"version": "0.1.0"}
