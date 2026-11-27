Feature: TEST-10 Footer shows the build commit
  As anyone looking at a running Task Notes instance
  I want the footer to show the short build commit next to the version
  So that I can tell exactly which build of the API I am talking to

  Background:
    Given the Task Notes project infrastructure (frontend, backend, database) is set up per docker-compose.yml
    And the frontend is running at "http://localhost:5183"
    And the backend is running at "http://localhost:8010"

  Scenario: Footer shows the first 7 characters of the commit next to the version (criterion 1)
    Given the backend reports version "1.2.3" and commit "abcdef1234567890" from GET "/api/version"
    When I open "http://localhost:5183" in a browser
    Then the footer identified by "app-footer" reads "Task Notes v1.2.3 (abcdef1)"
    And the element identified by "app-footer-commit" contains "abcdef1"

  Scenario: Footer shows no commit while the request is pending or after it fails (criterion 2)
    Given GET "/api/version" is pending or fails
    When I open the landing page
    Then the footer reads exactly "Task Notes"
    And the footer contains no "undefined", "null", "unknown" or error text
    And no element identified by "app-footer-commit" is present

  Scenario: Footer shows the version alone when the commit is not usable (criterion 2, edge case)
    Given the backend reports version "1.2.3" and commit "unknown" from GET "/api/version"
    When I open the landing page
    Then the footer reads "Task Notes v1.2.3"
    And the footer contains no parentheses
    And no element identified by "app-footer-commit" is present

  Scenario: Success, pending and failure paths are covered by component tests (criterion 3)
    Given the frontend unit suite
    When I run the AppFooter component tests
    Then a test asserting the commit is shown next to the version passes
    And a test asserting the footer is exactly "Task Notes" while loading passes
    And a test asserting the footer is exactly "Task Notes" when the request fails passes
