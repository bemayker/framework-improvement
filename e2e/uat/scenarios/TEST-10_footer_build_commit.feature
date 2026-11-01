Feature: TEST-10 Footer shows the build commit
  As a visitor of the Task Notes app
  I want the footer to show the short build commit next to the version
  So that I know exactly which build I am looking at

  Background:
    Given the Task Notes stack (frontend, backend, database) is running per docker-compose.yml
    And the frontend is served at "http://localhost:5183"
    And the backend is served at "http://localhost:8010"

  Scenario: Footer shows the 7-character commit next to the version (criterion 1)
    Given the backend reports version "0.1.0" and commit "0123456789ab"
    When I open the landing page
    Then the footer identified by "app-footer" reads "Task Notes v0.1.0 (0123456)"
    And the element identified by "app-footer-commit" reads "(0123456)"

  Scenario: Footer shows the version alone when the backend reports no build commit (criterion 2, edge case)
    Given the backend reports version "0.1.0" and commit "unknown"
    When I open the landing page
    Then the footer reads exactly "Task Notes v0.1.0"
    And the footer shows no commit element
    And the footer contains none of the words "unknown", "undefined", "null" or "error"
    And the footer contains no parentheses

  Scenario: Footer shows no commit and no error when the request fails (criterion 2)
    Given the backend is unreachable
    When I open the landing page
    Then the footer reads exactly "Task Notes"
    And the footer shows no commit element
    And the footer contains none of the words "unknown", "undefined", "null" or "error"

  Scenario: Component tests cover the success, pending and failure paths (criterion 3)
    Given the frontend test suite
    When I run "npm --prefix frontend test"
    Then the AppFooter tests for success, pending and failure pass
    And the summary reports 0 failed
