Feature: TEST-10 Footer shows the build commit
  As a visitor of the Task Notes app
  I want the footer to show the short build commit next to the version
  So that I can tell exactly which build I am looking at

  Background:
    Given the Task Notes project infrastructure (frontend, backend, database) is set up per docker-compose.yml
    And the application is running at "http://localhost:5183"

  Scenario: Footer shows the first 7 characters of the commit next to the version
    Given the backend reports commit "0123456789ab" at "/api/version"
    When I open "http://localhost:5183" in a browser
    Then the footer identified by "app-footer" reads "Task Notes v0.1.0 (0123456)"
    And the element identified by "app-footer-commit" reads " (0123456)"

  Scenario: Footer shows the version alone when the request fails
    Given the backend is stopped
    When I open the landing page
    Then the footer reads exactly "Task Notes"
    And the footer does not contain "undefined", "null", "unknown" or an error text

  Scenario: Footer shows no commit while the request is pending
    Given the network is throttled so that "/api/version" answers slowly
    When I open the landing page
    Then until the request completes the footer reads "Task Notes" with no placeholder text
    And once it completes the footer reads "Task Notes v0.1.0 (0123456)"

  Scenario: Footer shows the version alone when the commit is unknown (edge case)
    Given the backend reports commit "unknown" at "/api/version"
    When I open the landing page
    Then the footer reads "Task Notes v0.1.0"
    And the footer contains no parentheses and no "unknown"

  Scenario: Component tests cover success, pending and failure
    Given the frontend test suite
    When I run the AppFooter tests
    Then they pass
    And one test covers the success path, one the pending path and one the failure path
