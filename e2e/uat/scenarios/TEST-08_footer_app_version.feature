Feature: TEST-08 Footer shows the app version
  As a visitor of the Task Notes app
  I want the footer to show the backend's version
  So that I can tell which build I am looking at

  Background:
    Given the Task Notes stack is running via docker compose
    And the backend declares version "0.1.0" and the frontend package declares "0.0.0"
    And the application is running at "http://localhost:5183"

  Scenario: Footer renders the version on the landing page
    When I open "http://localhost:5183/" in a browser
    Then the footer identified by "app-footer" reads "Task Notes v0.1.0"

  Scenario: The version comes from the backend at runtime
    When I open the landing page
    Then the browser requests "http://localhost:8010/api/version" and receives status 200
    And the footer shows "0.1.0"
    And the footer does not show the frontend's "0.0.0"

  Scenario: Footer renders without a version when the endpoint is unreachable (edge case)
    Given the request to "/api/version" is blocked
    When I open the landing page
    Then the footer reads exactly "Task Notes"
    And it shows no "v", "undefined", "null" or "unknown"

  Scenario: Component tests cover both the present and absent paths
    Given the frontend test suite
    When I run the AppFooter and version client tests
    Then 0 tests fail
    And "shows the backend version once /api/version resolves" passes
    And "shows only the app name when the version request fails" passes

  Scenario: Footer shows the app name alone while the version is loading (edge case)
    Given the "/api/version" response is slow
    When I open the landing page
    Then the footer reads "Task Notes" until the version arrives
    And then it reads "Task Notes v0.1.0"
