Feature: TEST-10 Footer shows the build commit
  As a visitor of the Task Notes app
  I want the footer to show the short build commit next to the version
  So that I can tell exactly which build I am looking at

  Background:
    Given the Task Notes stack (frontend, backend, database) is running per docker-compose.yml
    And the frontend is at "http://localhost:5183"
    And the backend is at "http://localhost:8010"

  Scenario: Footer shows the first 7 characters of the commit next to the version (criterion 1)
    Given the backend reports version "0.1.0" and commit "4f2a9c1e8b7d"
    When I open "http://localhost:5183"
    Then the footer identified by "app-footer" reads "Task Notes v0.1.0 (4f2a9c1)"
    And the element "app-footer-commit" is visible

  Scenario: Unreachable version endpoint shows no version and no commit (criterion 2)
    Given the backend is stopped so "/api/version" cannot be reached
    When I open "http://localhost:5183"
    Then the footer reads exactly "Task Notes"
    And the footer does not contain "undefined", "null", "unknown" or an error message
    And the page shows no error message

  Scenario: Component tests cover the success, pending and failure paths (criterion 3)
    Given the frontend test suite
    When I run the AppFooter tests
    Then they pass with 0 failed

  Scenario: A response without a commit shows the version alone (edge case)
    Given the backend reports version "2.0.0-e2e" and no commit
    When I open "http://localhost:5183"
    Then the footer reads "Task Notes v2.0.0-e2e"
    And the element "app-footer-commit" does not exist
    And the footer does not contain "undefined" or "()"
