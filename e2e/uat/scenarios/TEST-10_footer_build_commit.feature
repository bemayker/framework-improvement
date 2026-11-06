Feature: TEST-10 Footer shows the build commit
  As a visitor of the Task Notes app
  I want the footer to show the short build commit next to the version
  So that I can tell exactly which build the backend is running

  Background:
    Given the Task Notes stack (frontend, backend, database) is running per docker-compose.yml
    And the frontend is served at "http://localhost:5183"
    And the backend is served at "http://localhost:8010"

  Scenario: Footer shows the 7-character commit next to the version (criterion 1)
    Given the backend was started with BUILD_COMMIT "abcdef1234567890abcdef1234567890abcdef12"
    And "GET /api/version" answers with version "0.1.0" and commit "abcdef123456"
    When I open the landing page
    Then the footer reads "Task Notes v0.1.0 (abcdef1)"
    And the commit shown has exactly 7 characters

  Scenario: Footer shows the version alone while the request is pending (criterion 2)
    Given the version request is slow
    When I look at the footer before the request completes
    Then the footer reads exactly "Task Notes"
    And it shows no "undefined" and no error text
    And once the request completes, the footer reads "Task Notes v0.1.0 (abcdef1)" or, without a build commit, "Task Notes v0.1.0"

  Scenario: Footer shows no commit when the request fails (criterion 2)
    Given the backend is stopped
    When I open the landing page
    Then the footer reads exactly "Task Notes"
    And it shows no "undefined", no "null", no error text and no empty parentheses

  Scenario: Component test covers the success, pending and failure paths (criterion 3)
    Given the frontend test suite
    When I run it
    Then the AppFooter tests for success, pending and failure pass

  Scenario: Backend has no build commit (edge case)
    Given the backend was started with BUILD_COMMIT unset or blank
    And "GET /api/version" answers with commit "unknown"
    When I open the landing page
    Then the footer reads exactly "Task Notes v0.1.0"
    And it does not show the word "unknown"
    And it shows no parentheses and no trailing space
