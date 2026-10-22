Feature: TEST-10 Footer shows the build commit
  As a visitor of the Task Notes app
  I want the footer to show the short build commit next to the version
  So that I can tell exactly which build I am looking at

  Background:
    Given the stack is running with the frontend at "http://localhost:5183" and the backend at "http://localhost:8010"

  Scenario: Footer shows the first 7 characters of the commit next to the version (criterion 1)
    Given the backend reports version "0.1.0" and commit "0123456789ab" at "/api/version"
    When I open "http://localhost:5183/" in a browser
    Then the footer identified by "app-footer" reads "Task Notes v0.1.0 (0123456)"
    And the element identified by "app-commit" reads "(0123456)"

  Scenario: Footer shows the name only while the version request is pending (criterion 2)
    Given the request to "/api/version" has not yet been answered
    When I look at the footer
    Then it reads exactly "Task Notes"
    And it shows no version, no commit, no "undefined" and no error text

  Scenario: Footer shows the name only when the version request fails (criterion 2)
    Given the backend is stopped
    When I open the landing page
    Then the footer reads exactly "Task Notes"
    And it shows no "undefined", "null" or error text

  Scenario: Footer shows the version alone when the commit is unknown (criterion 2, edge case)
    Given the backend runs without BUILD_COMMIT and reports commit "unknown"
    When I open the landing page
    Then the footer reads "Task Notes v0.1.0"
    And there is no element identified by "app-commit"
    And the footer shows no "unknown" and no "undefined"

  Scenario: Component tests cover the success, pending and failure paths (criterion 3)
    Given the frontend test suite
    When I run the AppFooter and version client tests
    Then they pass with 0 failed
    And they assert a successful commit, a pending fetch, a rejected fetch and an unusable commit
