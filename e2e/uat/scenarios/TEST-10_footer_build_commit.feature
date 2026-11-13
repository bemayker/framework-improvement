Feature: TEST-10 Footer shows the build commit
  As a visitor of the Task Notes app
  I want the footer to show the short build commit next to the version
  So that I can tell exactly which build I am looking at

  Background:
    Given the Task Notes stack is running via docker compose
    And the backend declares version "0.1.0"
    And the application is running at "http://localhost:5183"

  Scenario: Footer shows the first 7 characters of the commit next to the version
    Given the backend was built with BUILD_COMMIT "62be9fd76e4beeb5ec93d5fd3e9da1a35242d049"
    And "http://localhost:8010/api/version" returns {"version":"0.1.0","commit":"62be9fd76e4b"}
    When I open the landing page
    Then the footer identified by "app-footer" reads exactly "Task Notes v0.1.0 (62be9fd)"

  Scenario: Footer shows the app name alone while the version request is pending (edge case)
    Given the "/api/version" response is slow
    When I open the landing page
    Then the footer reads exactly "Task Notes" until the response arrives
    And then it reads "Task Notes v0.1.0 (62be9fd)"

  Scenario: Footer shows the app name alone when the version request fails (edge case)
    Given the request to "/api/version" is blocked
    When I open the landing page
    Then the footer reads exactly "Task Notes"
    And it shows no "undefined", "null", "unknown", "()" or error text

  Scenario: Footer shows the version alone when the backend has no commit (edge case)
    Given the backend was built without BUILD_COMMIT
    And "http://localhost:8010/api/version" returns {"version":"0.1.0","commit":"unknown"}
    When I open the landing page
    Then the footer reads exactly "Task Notes v0.1.0"
    And it shows no "unknown" and no empty parentheses

  Scenario: Component tests cover the success, pending and failure paths
    Given the frontend test suite
    When I run the AppFooter and version client tests
    Then 0 tests fail
    And "shows the version and the first 7 characters of the commit once /api/version resolves" passes
    And "shows only the app name while the version request is pending" passes
    And "shows only the app name when the version request fails" passes
