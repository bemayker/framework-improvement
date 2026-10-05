Feature: TEST-10 Footer shows the build commit
  As anyone looking at a running instance of the Task Notes app
  I want the footer to show the short build commit next to the version
  So that I can tell exactly which build I am looking at

  Background:
    Given the Task Notes stack is running per docker-compose.yml
    And the frontend is served at "http://localhost:5183"
    And the backend is served at "http://localhost:8010"

  Scenario: Criterion 1 - The footer shows the first 7 characters of the commit next to the version
    Given the backend answers "GET /api/version" with version "9.9.9" and commit "abc123def456"
    When I open "http://localhost:5183/"
    Then the footer identified by "app-footer" reads "Task Notes v9.9.9 · abc123d"
    And the element identified by "app-footer-commit" reads "abc123d"
    And the footer does not contain "abc123def456"

  Scenario: Criterion 2 - While the request is pending the footer shows the name alone
    Given the "/api/version" request is slowed down
    When I open "http://localhost:5183/"
    Then the footer first reads "Task Notes" alone, with no version, no commit and no separator
    And it then changes to "Task Notes v" followed by the version, " · " and the 7-character commit

  Scenario: Criterion 2 - When the request fails the footer shows no commit and no error
    Given the backend is not reachable
    When I open "http://localhost:5183/"
    Then the footer reads "Task Notes · version unavailable"
    And the element identified by "app-footer-commit" is absent
    And the footer text contains none of "undefined", "null" or "unknown"

  Scenario: Edge case - The backend reports the sentinel commit "unknown"
    Given the backend answers "GET /api/version" with version "9.9.9" and commit "unknown"
    When I open "http://localhost:5183/"
    Then the footer reads "Task Notes v9.9.9"
    And the element identified by "app-footer-commit" is absent
    And the footer shows no trailing "·" and no "unknown"

  Scenario: Criterion 3 - The component test covers success, pending and failure
    Given the frontend test suite
    When I run the AppFooter tests
    Then a success test showing the version and the 7-character commit passes
    And a success test with an unusable commit showing the version alone passes
    And a pending test showing "Task Notes" passes
    And failure tests (rejected request, unresolvable version) showing "Task Notes · version unavailable" pass
