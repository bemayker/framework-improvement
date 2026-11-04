Feature: TEST-08 Footer shows the app version
  As a visitor of the Task Notes app
  I want the footer to show the version the backend reports
  So that I can tell which build I am looking at

  Background:
    Given the Task Notes stack (frontend, backend, database) is running per docker-compose.yml
    And the frontend is served at "http://localhost:5183"
    And the backend is served at "http://localhost:8010"

  Scenario: Footer renders the version string on the landing page (criterion 1)
    Given the backend answers "GET /api/version" with a version such as "0.1.0"
    When I open "http://localhost:5183/"
    Then the footer identified by "app-footer" reads "Task Notes v0.1.0"
    And the version shown matches the value returned by "/api/version"

  Scenario: The version comes from the backend at runtime, not from the frontend package (criterion 2)
    Given the backend reports version "0.1.0"
    And frontend/package.json declares a different version "0.0.0"
    When I open "http://localhost:5183/"
    Then the footer shows "v0.1.0" and not "v0.0.0"
    And the browser made one request to "/api/version" that returned status 200
    And the footer component source contains no version literal and no import of package.json

  Scenario: Footer renders without a version when it cannot be resolved (criterion 3)
    Given the backend is stopped so "/api/version" does not answer
    When I open "http://localhost:5183/"
    Then the footer reads exactly "Task Notes"
    And it does not show "undefined", "null", "unknown" or an empty gap

  Scenario: Component tests cover both the present and the absent paths (criterion 4)
    Given the frontend test suite
    When I run the AppFooter and version client tests
    Then the test where the version resolves passes
    And the test where the version is absent passes

  Scenario: Footer recovers once the backend is back (edge case)
    Given the backend was stopped and the footer read "Task Notes"
    When I start the backend again and reload the landing page
    Then the footer reads "Task Notes v0.1.0" again
