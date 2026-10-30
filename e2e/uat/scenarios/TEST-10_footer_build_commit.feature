Feature: TEST-10 Footer shows the build commit
  As a visitor of the Task Notes app
  I want the footer to show the short build commit next to the version
  So that I can tell exactly which build of the backend I am looking at

  Background:
    Given the Task Notes project infrastructure (frontend, backend, database) is set up per docker-compose.yml
    And the frontend is running at "http://localhost:5183"
    And the backend is running at "http://localhost:8010"

  Scenario: Footer shows the first 7 characters of the commit next to the version
    Given the backend was built with BUILD_COMMIT "abc1234def5678"
    And "/api/version" answers {"version":"0.1.0","commit":"abc1234def56"}
    When I open "http://localhost:5183/" in a browser
    Then the footer identified by "app-footer" reads "Task Notes v0.1.0 (abc1234)"
    And the element identified by "app-commit" reads exactly "abc1234"

  Scenario: Footer shows the backend's unknown commit verbatim
    Given the backend was built without BUILD_COMMIT
    And "/api/version" answers a commit of "unknown"
    When I open the landing page
    Then the footer reads "Task Notes v0.1.0 (unknown)"

  Scenario: Footer shows the app name alone while the request is pending
    Given the "/api/version" request is slowed down
    When I open the landing page
    Then until the request completes the footer reads exactly "Task Notes"
    And it contains no commit, no parentheses and no "undefined" text
    And once the request completes the footer reads "Task Notes v0.1.0 (abc1234)"

  Scenario: Footer shows the app name alone when the backend is unreachable
    Given the backend is stopped
    When I open the landing page
    Then the "/api/version" request fails
    And the footer reads exactly "Task Notes"
    And it contains no "undefined", "null" or "Error" text and no empty parentheses

  Scenario: Footer recovers once the backend is back
    Given the backend was stopped and has been started again
    When I reload the landing page
    Then the footer reads "Task Notes v0.1.0 (abc1234)"

  Scenario: Footer shows the version alone when the response carries no commit (edge case)
    Given the backend answers 200 with {"version":"9.9.9"} and no commit
    When I open the landing page
    Then the footer reads exactly "Task Notes v9.9.9"
    And no element identified by "app-commit" is present
    And the footer contains no parentheses

  Scenario: Component tests cover the success, pending and failure paths
    Given the frontend test suite
    When I run the AppFooter and version client tests
    Then 0 tests fail
    And the output lists a success, a pending, a failure and a version-without-commit test
