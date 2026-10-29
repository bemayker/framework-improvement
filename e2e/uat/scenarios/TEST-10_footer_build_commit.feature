Feature: TEST-10 Footer shows the build commit
  As anyone looking at a running Task Notes instance
  I want the footer to show the short build commit next to the version
  So that I can tell exactly which build I am on

  Background:
    Given the stack is running with docker compose
    And the frontend is served at "http://localhost:5183"
    And the backend is served at "http://localhost:8010"

  Scenario: Footer shows the first 7 commit characters next to the version (criterion 1)
    Given the backend reports version "0.1.0" and commit "3761feee7215"
    When I open "http://localhost:5183/"
    Then the element identified by "app-footer" reads "Task Notes v0.1.0 (3761fee)"
    And the element identified by "app-footer-version" reads "v0.1.0"
    And the element identified by "app-footer-commit" reads "(3761fee)"

  Scenario: Footer shows the version alone while the request is pending (criterion 2)
    Given the response of "/api/version" is slow
    When I open "http://localhost:5183/" before the response arrives
    Then the footer reads "Task Notes"
    And the footer contains none of "undefined", "null", "unknown", "()"
    And once the response arrives the footer reads "Task Notes v0.1.0 (3761fee)"

  Scenario: Footer shows the version alone when the request fails (criterion 2)
    Given the request to "/api/version" is blocked
    When I open "http://localhost:5183/"
    Then the footer reads exactly "Task Notes"
    And no element identified by "app-footer-commit" is present
    And the footer contains none of "undefined", "null", "unknown", "error"

  Scenario: Footer omits the commit when the backend reports unknown (criterion 1, edge case)
    Given the backend reports version "0.1.0" and commit "unknown"
    When I open "http://localhost:5183/"
    Then the footer reads exactly "Task Notes v0.1.0"
    And no element identified by "app-footer-commit" is present
    And the footer does not contain "(unknown)"

  Scenario: Component tests cover success, pending and failure (criterion 3)
    Given the frontend test suite
    When I run the tests in "src/components/AppFooter.test.tsx"
    Then the run reports 0 failed
    And the AppFooter tests include a success case, a pending case and a failure case
