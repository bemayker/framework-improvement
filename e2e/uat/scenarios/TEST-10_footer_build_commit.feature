Feature: TEST-10 Footer shows the build commit
  As a visitor of the Task Notes app
  I want the footer to show the short build commit next to the version
  So that I know exactly which build of the backend I am talking to

  Background:
    Given the Task Notes stack (frontend, backend, database) is running per docker-compose.yml
    And the frontend is reachable at "http://localhost:5183"
    And the backend is reachable at "http://localhost:8010"

  Scenario: Footer shows the first 7 characters of the commit next to the version
    Given the backend was built with BUILD_COMMIT "a1b2c3d4e5f60718293a4b5c6d7e8f9012345678"
    And "http://localhost:8010/api/version" answers with the version "0.1.0" and the commit "a1b2c3d4e5f6"
    When I open "http://localhost:5183"
    Then the footer identified by "app-footer" reads exactly "Task Notes v0.1.0 (a1b2c3d)"
    And the footer shows 7 commit characters, not the 12 the endpoint returns

  Scenario: Footer shows the app name alone while the version request is pending
    Given the backend was built with BUILD_COMMIT "a1b2c3d4e5f60718293a4b5c6d7e8f9012345678"
    And the network is throttled so "/api/version" stays pending
    When I open "http://localhost:5183"
    Then the footer reads exactly "Task Notes" until the response arrives
    And the footer shows no "undefined", "null", "unknown" or error text
    And once the response arrives the footer reads "Task Notes v0.1.0 (a1b2c3d)"

  Scenario: Footer shows the app name alone when the version request fails
    Given the request to "/api/version" is blocked
    When I open "http://localhost:5183"
    Then the footer identified by "app-footer" is still visible
    And the footer reads exactly "Task Notes"
    And the footer shows no "undefined", "null", "unknown" or error text
    And no error is shown elsewhere on the page

  Scenario: Footer shows the version alone when the commit is unknown (edge case)
    Given the backend was built without BUILD_COMMIT
    And "http://localhost:8010/api/version" answers with the commit "unknown"
    When I open "http://localhost:5183"
    Then the footer reads exactly "Task Notes v0.1.0"
    And the footer shows no "(unknown)" and no empty parentheses

  Scenario: Component tests cover the success, pending and failure paths
    Given the frontend test suite
    When I run the AppFooter and version client tests
    Then they pass with 0 failed
    And one test shows "Task Notes v9.9.9 (a1b2c3d)" when the client resolves a version and a commit
    And other tests show only "Task Notes" when the client stays pending or rejects
