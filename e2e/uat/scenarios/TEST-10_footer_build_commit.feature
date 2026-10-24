Feature: TEST-10 Footer shows the build commit
  As a visitor of the Task Notes app
  I want the footer to show the short build commit next to the version
  So that I know exactly which build I am looking at

  Background:
    Given the Task Notes stack (frontend, backend, database) is running per docker-compose.yml
    And the frontend is at "http://localhost:5183" and the backend is at "http://localhost:8010"

  Scenario: Footer shows the first 7 characters of the commit next to the version (criterion 1)
    Given the backend reports version "0.1.0" and commit "9a6bfd7c3e1f" at "/api/version"
    When I open "http://localhost:5183/"
    Then the footer identified by "app-footer" reads exactly "Task Notes v0.1.0 (9a6bfd7)"

  Scenario: Footer shows the version alone while the request is pending or failed (criterion 2)
    Given the backend is stopped so "/api/version" is unreachable
    When I open the landing page
    Then the footer reads exactly "Task Notes"
    And the footer contains no "undefined", "null", "unknown" or error text
    And the rest of the page renders

  Scenario: Component tests cover success, pending and failure (criterion 3)
    Given the frontend test suite
    When I run the AppFooter and version client tests
    Then they report 0 failed
    And there is a success case, a pending case and a failure case

  Scenario: Backend reports an unresolved commit (edge case)
    Given the backend answers "/api/version" with version "0.1.0" and commit "unknown"
    When I open the landing page
    Then the footer reads exactly "Task Notes v0.1.0"
    And the footer shows no "unknown" and no empty parentheses
