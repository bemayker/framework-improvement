Feature: TEST-10 Footer shows the build commit
  As a visitor of the Task Notes app
  I want the footer to show the short build commit next to the version
  So that I know exactly which build I am talking to

  Background:
    Given the Task Notes stack (frontend, backend, database) is running per docker-compose.yml
    And the frontend is served at "http://localhost:5183"
    And the backend answers "GET http://localhost:8010/api/version" with its version and build commit

  Scenario: Criterion 1 - Footer shows the first 7 characters of the commit next to the version
    Given the backend reports version "0.1.0" and commit "0123456789ab"
    When I open "http://localhost:5183/"
    Then the footer identified by "app-footer" reads "Task Notes v0.1.0 (0123456)"
    And the element identified by "app-footer-commit" reads "0123456"

  Scenario: Criterion 2 - Pending request shows the name only
    Given the request to "/api/version" is slow
    When I open "http://localhost:5183/"
    Then while the request is pending the footer reads "Task Notes"
    And it contains no "undefined", no "null" and no error text
    And once the request completes the footer reads "Task Notes v0.1.0 (0123456)"

  Scenario: Criterion 2 - Failed request shows the name only
    Given the request to "/api/version" is blocked
    When I open "http://localhost:5183/"
    Then the footer reads exactly "Task Notes"
    And it contains no "undefined" and no error text

  Scenario: Criterion 2 edge case - Unknown commit sentinel shows the version alone
    Given the backend answers "/api/version" with {"version": "0.1.0", "commit": "unknown"}
    When I open "http://localhost:5183/"
    Then the footer reads exactly "Task Notes v0.1.0"
    And it contains no parentheses and no "unknown"

  Scenario: Criterion 3 - Component tests cover success, pending and failure
    Given the frontend test suite
    When I run the AppFooter tests
    Then the test "renders the first 7 characters of the commit next to the version" passes
    And the test "never renders undefined or an error while the version is loading" passes
    And the test "never renders undefined or an error when /api/version fails" passes
    And 0 tests fail
