Feature: TEST-10 Footer shows the build commit
  As a visitor of the Task Notes app
  I want the footer to show the short build commit next to the version
  So that I know exactly which build I am looking at

  Background:
    Given the Task Notes stack (frontend, backend, database) is running per docker-compose.yml
    And the frontend is served at "http://localhost:5183"
    And the backend is served at "http://localhost:8010"

  Scenario: Footer shows the first 7 characters of the commit next to the version
    Given the backend reports the commit "0123456789ab" at "http://localhost:8010/api/version"
    When I open "http://localhost:5183" in a browser
    Then the footer identified by "app-footer" reads "Task Notes v0.1.0 (0123456)"
    And the commit is wrapped in the element identified by "app-footer-commit"
    And the commit shows exactly 7 characters after the version

  Scenario: Footer shows only the app name while the version request is pending
    Given "http://localhost:8010/api/version" answers slowly
    When I open the landing page before the version request completes
    Then the footer reads exactly "Task Notes" with no placeholder
    And no element identified by "app-footer-commit" is present
    And once the request completes the footer gains " v0.1.0 (0123456)"

  Scenario: Footer shows only the app name when the version request fails
    Given "http://localhost:8010/api/version" is unreachable
    When I open the landing page and the version request has failed
    Then the footer reads exactly "Task Notes"
    And the footer contains no "undefined", "null", "unknown" or error text
    And no element identified by "app-footer-commit" is present

  Scenario: Footer shows the version alone when the backend reports the unknown commit (edge case)
    Given the backend reports the commit "unknown" at "http://localhost:8010/api/version"
    When I open the landing page
    Then the footer reads exactly "Task Notes v0.1.0"
    And the footer contains no "(unknown)", no "()" and no "undefined"
    And no element identified by "app-footer-commit" is present

  Scenario: Component tests cover the success, pending and failure paths
    Given the frontend test suite
    When I run the AppFooter component tests
    Then a test asserts the footer shows the version and the first 7 characters of the commit
    And a test asserts the footer shows only "Task Notes" while the version is loading
    And a test asserts the footer shows only "Task Notes" when the version request fails
