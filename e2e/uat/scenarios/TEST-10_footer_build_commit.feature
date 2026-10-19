Feature: TEST-10 Footer shows the build commit next to the version
  As a visitor of the Task Notes app
  I want the footer to show the short build commit next to the version
  So that I can tell exactly which build I am looking at

  Background:
    Given the Task Notes stack (frontend, backend, database) is running per docker-compose.yml
    And the frontend is served at "http://localhost:5183"
    And the backend is served at "http://localhost:8010"

  Scenario: Footer shows the first 7 characters of the commit next to the version (criterion 1)
    Given the backend reports version "0.1.0" and commit "abc1234def56" from GET "/api/version"
    When I open "http://localhost:5183" in a browser
    Then the footer identified by "app-footer" reads "Task Notes v0.1.0 (abc1234)"
    And the element identified by "app-footer-commit" shows " (abc1234)"
    And it shows 7 characters of the commit, not the 12 the backend returns

  Scenario: Footer shows the version alone when the commit is unknown (criterion 2, edge case)
    Given the backend reports version "0.1.0" and commit "unknown" from GET "/api/version"
    When I open "http://localhost:5183" in a browser
    Then the footer identified by "app-footer" reads "Task Notes v0.1.0"
    And no element identified by "app-footer-commit" exists
    And the footer does not contain "unknown", "undefined", "null" or "()"

  Scenario: Footer shows no commit while the request is pending (criterion 2, pending)
    Given the network is throttled so the version request is slow
    When I open "http://localhost:5183" in a browser
    Then until the request completes the footer text is exactly "Task Notes"
    And once the request completes the footer shows the version after "Task Notes"

  Scenario: Footer shows no commit and no error when the request fails (criterion 2, failure)
    Given the backend is unreachable
    When I open "http://localhost:5183" in a browser
    Then the footer text is exactly "Task Notes"
    And no element identified by "app-footer-commit" exists
    And the footer does not contain "unknown", "undefined" or "null"

  Scenario: Component tests cover the success, pending and failure paths (criterion 3)
    Given the frontend test suite
    When I run the Vitest tests in "frontend/src/components/AppFooter.test.tsx" and "frontend/src/api/version.test.ts"
    Then the run reports 0 failed
    And one test asserts the footer shows the version and the short commit when the client resolves both
    And one test asserts the footer reads exactly "Task Notes" while the client request is pending
    And other tests assert the footer reads exactly "Task Notes" when the client rejects or resolves null
