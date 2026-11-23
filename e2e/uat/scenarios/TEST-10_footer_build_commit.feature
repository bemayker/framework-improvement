Feature: TEST-10 Footer shows the build commit
  As a visitor of the Task Notes app
  I want the footer to show the short build commit next to the version
  So that I can tell exactly which build I am looking at

  Background:
    Given the Task Notes backend is running at "http://localhost:8010"
    And the frontend is running at "http://localhost:5183"

  Scenario: Footer shows the first 7 characters of the commit next to the version
    Given "GET /api/version" answers with the commit "abcdef123456" and a version
    When I open "http://localhost:5183" in a browser
    Then the footer identified by "app-footer" reads "Task Notes v" followed by that version and " (abcdef1)"
    And the element identified by "app-footer-commit" has the text "(abcdef1)"

  Scenario: Footer shows the name alone when the version request fails
    Given "GET /api/version" is unreachable
    When I open the landing page
    Then the footer reads "Task Notes" with no version and no commit
    And the footer does not contain "undefined", "null", "unknown" or an error text
    And the element identified by "app-footer-commit" is not present

  Scenario: Footer shows the name alone while the version request is pending
    Given "GET /api/version" answers slowly
    When the landing page first renders
    Then the footer reads "Task Notes" with no commit until the response arrives
    And at no moment does the footer contain "undefined", "null" or "unknown"

  Scenario: Footer shows the version alone when the backend reports the unknown commit (edge case)
    Given "GET /api/version" answers with a version and the commit "unknown"
    When I open the landing page
    Then the footer reads "Task Notes v" followed by that version
    And the element identified by "app-footer-commit" is not present
    And the footer does not contain "unknown" or a parenthesis

  Scenario: Footer component tests cover the success, pending and failure paths
    Given the frontend test suite
    When I run the AppFooter component tests
    Then the test for the commit being shown next to the version passes
    And the test for the version request being pending passes
    And the test for the version request failing passes
