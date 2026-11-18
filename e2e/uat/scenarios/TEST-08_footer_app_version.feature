Feature: TEST-08 Footer shows the app version
  As a visitor of the Task Notes app
  I want the footer to show the version the backend is running
  So that I can tell which build I am looking at

  Background:
    Given the Task Notes stack (frontend, backend, database) is running per docker-compose.yml
    And the frontend is served at "http://localhost:5183"
    And the backend is served at "http://localhost:8010"

  Scenario: Footer renders the version string on the landing page
    Given the backend reports a version at "/api/version"
    When I open "http://localhost:5183" in a browser
    Then the footer identified by "app-footer" reads "Task Notes v" followed by that version

  Scenario: The version comes from the backend at runtime
    Given the backend reports the version "0.1.0" at "/api/version"
    When I open the landing page with the browser's network tab open
    Then a GET request to "/api/version" on the backend returns status 200
    And the footer shows the same version as that response
    And the footer component contains no package.json import and no typed version string

  Scenario: Footer renders without a version when it cannot be resolved
    Given the backend is stopped
    When I open "http://localhost:5183" in a browser
    Then the footer reads exactly "Task Notes"
    And the footer shows no "v", "undefined", "null" or "unknown"
    And there is no trailing space or empty gap

  Scenario: Footer component tests cover both the present and absent paths
    Given the frontend test suite
    When I run the AppFooter component tests
    Then the test "renders the version fetched from the backend" passes
    And the test "renders the app name alone when the version request fails" passes

  Scenario: The backend's version wins over the frontend bundle's version
    Given the frontend package.json declares version "0.0.0"
    And the backend reports version "0.1.0"
    When I open "http://localhost:5183" in a browser
    Then the footer reads "Task Notes v0.1.0"
    And the footer does not show "v0.0.0"

  Scenario: Footer reads the app name alone while the version request is pending
    Given the version request is slowed to 5000 ms
    When I open "http://localhost:5183" in a browser
    Then while the request is pending the footer reads exactly "Task Notes"
    And when the request completes the footer reads "Task Notes v0.1.0"
    And the page layout does not jump

  Scenario: Unreachable backend leaves the page usable (edge case)
    Given the request to "/api/version" is blocked or the backend is unreachable
    When the landing page loads
    Then the page still renders its heading "Task Notes"
    And the footer element is still present as a contentinfo landmark reading "Task Notes"
